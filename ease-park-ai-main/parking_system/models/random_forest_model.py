"""
Random Forest model for parking occupancy prediction.
 
Dataset: UCI Machine Learning Repository — Parking Birmingham (ID=482)
Citation: Stolfi, D. (2017). Parking Birmingham [Dataset].
          UCI ML Repository. https://doi.org/10.24432/C51K5Z
License:  Creative Commons Attribution 4.0 International (CC BY 4.0)
 
═══════════════════════════════════════════════════════════════════
LEAKAGE PREVENTION — CRITICAL DESIGN DECISION
═══════════════════════════════════════════════════════════════════
The previous version included `occupancy`, `occupancy_rate`,
`slots_remaining`, and `available_ratio` as features. These are all
direct transformations of `Occupancy`, which is also the source of
the target label `is_high_occupancy = (Occupancy/Capacity >= 0.75)`.
Using them as features gives the model the answer before it predicts,
producing a fraudulent 100% accuracy.
 
Correct approach: features must only use information known BEFORE
the occupancy reading is taken — i.e. time context and car park
identity/capacity. The model then predicts whether this car park
will be highly occupied at this time of day.
 
═══════════════════════════════════════════════════════════════════
UCI DATASET COLUMNS  →  FEATURE_COLS (leak-free mapping)
═══════════════════════════════════════════════════════════════════
  SystemCodeNumber  → car_park_id_enc   (label-encoded park ID)
  Capacity          → capacity_log      (log-scaled park size)
  LastUpdated       → hour_of_day, minute_of_hour, day_of_week,
                       is_weekend, month, week_of_year,
                       minutes_since_open, is_peak_hour,
                       is_morning, is_afternoon, hour_sq
  [Occupancy]       → *** EXCLUDED — used only for target label ***
 
TARGET_COL: is_high_occupancy  (1 if Occupancy/Capacity >= 0.75)
═══════════════════════════════════════════════════════════════════
"""
 
import logging
from pathlib import Path
 
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
 
logger = logging.getLogger(__name__)
 
DEFAULT_MODEL_PATH = (
    Path(__file__).resolve().parent.parent.parent / "models" / "rf_slot_predictor.joblib"
)
DEFAULT_ENCODER_PATH = (
    Path(__file__).resolve().parent.parent.parent / "models" / "label_encoders.joblib"
)
 
# ── Leak-free feature columns ─────────────────────────────────────────────────
# All features derivable from time + park identity/size ONLY.
# Occupancy is intentionally absent — it is the source of the target label.
FEATURE_COLS = [
    "car_park_id_enc",      # Label-encoded SystemCodeNumber
    "capacity_log",         # log(1 + Capacity)  — park size without scale bias
    "hour_of_day",          # 8–16 (operating hours)
    "minute_of_hour",       # 0 or 30 (readings every 30 min)
    "day_of_week",          # 0=Monday … 6=Sunday
    "is_weekend",           # 1 if Saturday/Sunday
    "month",                # 10, 11, 12  (Oct–Dec dataset)
    "week_of_year",         # ISO week number
    "minutes_since_open",   # Minutes elapsed since 08:00 opening
    "is_peak_hour",         # 1 if hour in {8,9,12,13}
    "is_morning",           # 1 if hour < 11
    "is_afternoon",         # 1 if hour >= 13
    "hour_sq",              # hour² — captures non-linear time curve
]
 
TARGET_COL = "is_high_occupancy"  # 1 = >=75% full,  0 = <75% (available)
 
 
# ── Feature engineering ───────────────────────────────────────────────────────
 
def _prepare_features(
    df: pd.DataFrame,
    encoders: dict | None = None,
) -> tuple[pd.DataFrame, dict]:
    """
    Transform a raw UCI Parking Birmingham DataFrame into FEATURE_COLS.
 
    Only time-based and car-park-identity features are used.
    `Occupancy` is NEVER read inside this function.
 
    Args:
        df:       DataFrame with at minimum: SystemCodeNumber, Capacity,
                  LastUpdated (columns may be raw UCI names or pre-parsed).
        encoders: Fitted LabelEncoder dict (pass during inference; omit to fit).
 
    Returns:
        (X[FEATURE_COLS], encoders_dict)
    """
    df = df.copy()
    encoders = encoders or {}
 
    # ── Normalise column names ────────────────────────────────────────────
    col_map: dict[str, str] = {}
    for col in df.columns:
        lc = col.lower().strip()
        if lc == "systemcodenumber":
            col_map[col] = "SystemCodeNumber"
        elif lc == "capacity":
            col_map[col] = "Capacity"
        elif lc == "lastupdated":
            col_map[col] = "LastUpdated"
    if col_map:
        df.rename(columns=col_map, inplace=True)
 
    # ── Parse timestamp ───────────────────────────────────────────────────
    if "LastUpdated" in df.columns:
        df["LastUpdated"] = pd.to_datetime(df["LastUpdated"], errors="coerce")
        df["hour_of_day"]    = df["LastUpdated"].dt.hour.fillna(12).astype(int)
        df["minute_of_hour"] = df["LastUpdated"].dt.minute.fillna(0).astype(int)
        df["day_of_week"]    = df["LastUpdated"].dt.dayofweek.fillna(0).astype(int)
        df["month"]          = df["LastUpdated"].dt.month.fillna(10).astype(int)
        df["week_of_year"]   = (
            df["LastUpdated"].dt.isocalendar().week.fillna(40).astype(int)
        )
    else:
        # Inference path: caller must supply pre-parsed time columns
        for col, default in [
            ("hour_of_day", 12), ("minute_of_hour", 0), ("day_of_week", 0),
            ("month", 10), ("week_of_year", 40),
        ]:
            df.setdefault(col, default)
 
    # ── Time-derived features (no leakage) ───────────────────────────────
    df["is_weekend"]         = (df["day_of_week"] >= 5).astype(int)
    df["minutes_since_open"] = ((df["hour_of_day"] - 8) * 60 + df["minute_of_hour"]).clip(lower=0)
    df["is_peak_hour"]       = df["hour_of_day"].isin([8, 9, 12, 13]).astype(int)
    df["is_morning"]         = (df["hour_of_day"] < 11).astype(int)
    df["is_afternoon"]       = (df["hour_of_day"] >= 13).astype(int)
    df["hour_sq"]            = df["hour_of_day"] ** 2
 
    # ── Capacity feature ──────────────────────────────────────────────────
    cap_src = "Capacity" if "Capacity" in df.columns else "capacity"
    df["capacity_log"] = np.log1p(
        pd.to_numeric(df.get(cap_src, 300), errors="coerce").fillna(300)
    )
 
    # ── Car park ID encoding ──────────────────────────────────────────────
    id_col = "SystemCodeNumber" if "SystemCodeNumber" in df.columns else "car_park_id"
    if id_col not in df.columns:
        df[id_col] = "UNKNOWN"
    df[id_col] = df[id_col].astype(str)
 
    if encoders.get(id_col) is not None:
        le: LabelEncoder = encoders[id_col]
        known = set(le.classes_)
        df[id_col] = df[id_col].apply(lambda x: x if x in known else le.classes_[0])
        df["car_park_id_enc"] = le.transform(df[id_col])
    else:
        le = LabelEncoder()
        df["car_park_id_enc"] = le.fit_transform(df[id_col])
        encoders[id_col] = le
 
    return df[FEATURE_COLS], encoders
 
 
# ── Model ─────────────────────────────────────────────────────────────────────
 
class RandomForestSlotPredictor:
    """
    Random Forest classifier for parking occupancy prediction.
 
    Trained on UCI Parking Birmingham. Predicts whether a car park will
    be at high occupancy (>=75% full) given only the time and park identity.
    Designed for realistic 70–85% accuracy with no data leakage.
 
    Hyperparameters chosen to prevent overfitting:
        max_depth=6          — shallow trees, low variance
        min_samples_split=40 — requires many samples before any split
        min_samples_leaf=20  — leaf nodes need 20+ samples
        max_samples=0.7      — each tree uses 70% of training data
        max_features='sqrt'  — each split considers sqrt(n_features) features
    """
 
    def __init__(
        self,
        n_estimators: int = 150,
        max_depth: int = 6,
        random_state: int = 42,
    ) -> None:
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model: RandomForestClassifier | None = None
        self.encoders: dict = {}
        self._is_fitted = False
        # These are set during fit() for the training report
        self.train_accuracy_: float = 0.0
        self.test_accuracy_: float = 0.0
        self.cv_mean_: float = 0.0
        self.cv_std_: float = 0.0
 
    # ── Training ──────────────────────────────────────────────────────────
 
    def fit(self, df: pd.DataFrame) -> "RandomForestSlotPredictor":
        """
        Train the model with an 80/20 train-test split and 5-fold CV.
 
        The DataFrame must contain:
            SystemCodeNumber, Capacity, LastUpdated, is_high_occupancy
        `Occupancy` must NOT be passed as a feature (it creates the target).
 
        Args:
            df: Engineered DataFrame with TARGET_COL already present.
 
        Returns:
            self (for chaining)
        """
        X, encoders = _prepare_features(df)
        self.encoders = encoders
        y = df[TARGET_COL].values
 
        # ── 80/20 stratified split ────────────────────────────────────────
        X_train, X_test, y_train, y_test = train_test_split(
            X, y,
            test_size=0.2,
            random_state=self.random_state,
            stratify=y,           # preserve class balance in both splits
        )
 
        # ── Constrained RF to prevent overfitting ─────────────────────────
        self.model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            min_samples_split=40,   # require 40 samples to split a node
            min_samples_leaf=20,    # each leaf must have >=20 samples
            max_features="sqrt",    # sqrt(13) ≈ 3-4 features per split
            max_samples=0.7,        # row-level bagging: 70% of rows per tree
            class_weight="balanced",
            random_state=self.random_state,
            n_jobs=-1,
        )
        self.model.fit(X_train, y_train)
 
        # ── Evaluation ────────────────────────────────────────────────────
        self.train_accuracy_ = self.model.score(X_train, y_train)
        self.test_accuracy_  = self.model.score(X_test, y_test)
 
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=self.random_state)
        cv_scores = cross_val_score(
            self.model, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1
        )
        self.cv_mean_ = float(cv_scores.mean())
        self.cv_std_  = float(cv_scores.std())
 
        overfit_gap = self.train_accuracy_ - self.test_accuracy_
 
        logger.info(
            "RF trained | train=%.2f%%  test=%.2f%%  CV=%.2f%%±%.2f%%  gap=%.2f%%",
            self.train_accuracy_ * 100,
            self.test_accuracy_ * 100,
            self.cv_mean_ * 100,
            self.cv_std_ * 100,
            overfit_gap * 100,
        )
 
        if self.test_accuracy_ > 0.90:
            logger.error(
                "Test accuracy %.1f%% > 90%% — likely data leakage. "
                "Check that Occupancy/occupancy_rate are not in FEATURE_COLS.",
                self.test_accuracy_ * 100,
            )
        elif self.test_accuracy_ < 0.70:
            logger.warning(
                "Test accuracy %.1f%% below 70%%. Consider increasing max_depth.",
                self.test_accuracy_ * 100,
            )
        else:
            logger.info("Accuracy %.2f%% is in the realistic 70–85%% target range.",
                        self.test_accuracy_ * 100)
 
        if overfit_gap > 0.10:
            logger.warning(
                "Train-test gap %.2f%% suggests overfitting. "
                "Reduce max_depth or increase min_samples_leaf.",
                overfit_gap * 100,
            )
 
        self._is_fitted = True
        return self
 
    # ── Inference ─────────────────────────────────────────────────────────
 
    def predict_proba_single(self, row: dict) -> float:
        """Return P(high_occupancy=1) for one observation (time + park context)."""
        if not self._is_fitted or self.model is None:
            raise RuntimeError("Model not fitted. Call fit() or load_model() first.")
        df = pd.DataFrame([row])
        X, _ = _prepare_features(df, self.encoders)
        proba = self.model.predict_proba(X)[0]
        return float(proba[1]) if len(proba) > 1 else float(proba[0])
 
    def recommend_best_park(self, candidates: list[dict]) -> tuple[str, float]:
        """
        Given a list of car park contexts, return the one predicted to be
        least occupied (lowest P(high_occupancy)).
 
        Args:
            candidates: List of dicts with keys:
                SystemCodeNumber, Capacity, LastUpdated
                (do NOT include Occupancy).
 
        Returns:
            (park_id, confidence)  where confidence = P(available)
        """
        if not candidates:
            raise ValueError("No candidate parks provided.")
        df = pd.DataFrame(candidates)
        X, _ = _prepare_features(df, self.encoders)
        probas = self.model.predict_proba(X)[:, 1]
        best_idx = int(np.argmin(probas))
        park_id = candidates[best_idx].get("SystemCodeNumber", str(best_idx))
        return park_id, float(1.0 - probas[best_idx])
 
    # ── Persistence ───────────────────────────────────────────────────────
 
    def save_model(
        self,
        model_path: Path | str | None = None,
        encoder_path: Path | str | None = None,
    ) -> None:
        model_path   = Path(model_path or DEFAULT_MODEL_PATH)
        encoder_path = Path(encoder_path or DEFAULT_ENCODER_PATH)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self.model, model_path)
        joblib.dump(self.encoders, encoder_path)
        logger.info("Model saved   → %s", model_path)
        logger.info("Encoders saved → %s", encoder_path)
 
    def load_model(
        self,
        model_path: Path | str | None = None,
        encoder_path: Path | str | None = None,
    ) -> None:
        model_path   = Path(model_path or DEFAULT_MODEL_PATH)
        encoder_path = Path(encoder_path or DEFAULT_ENCODER_PATH)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model file not found: {model_path}. Run train_model.py first."
            )
        self.model    = joblib.load(model_path)
        self.encoders = joblib.load(encoder_path)
        self._is_fitted = True
        logger.info("Model loaded ← %s", model_path)
 