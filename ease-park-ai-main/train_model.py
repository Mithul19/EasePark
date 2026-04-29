"""
train_model.py — Parking Occupancy Prediction (Random Forest)
 
Dataset: UCI Machine Learning Repository — Parking Birmingham (ID=482)
Source:  https://archive.ics.uci.edu/dataset/482/parking+birmingham
Cite:    Stolfi, D. (2017). Parking Birmingham [Dataset].
         UCI ML Repository. https://doi.org/10.24432/C51K5Z
License: Creative Commons Attribution 4.0 International (CC BY 4.0)
 
═══════════════════════════════════════════════════════════════════════
PROBLEM STATEMENT
═══════════════════════════════════════════════════════════════════════
The previous model achieved 100% accuracy — a clear sign of data
leakage. `occupancy_rate`, `occupancy`, `slots_remaining`, and
`available_ratio` were all used as features, but the target label
`is_high_occupancy` is defined as `Occupancy / Capacity >= 0.75`.
Feeding the answer to a model is not prediction — it is lookup.
 
═══════════════════════════════════════════════════════════════════════
CORRECTED DESIGN — ZERO LEAKAGE
═══════════════════════════════════════════════════════════════════════
Features (13 total — all derivable BEFORE seeing occupancy):
  • car_park_id_enc      — which car park
  • capacity_log         — how big is it (log-scaled)
  • hour_of_day          — time of day
  • minute_of_hour       — within the hour
  • day_of_week          — Mon=0 … Sun=6
  • is_weekend           — binary weekend flag
  • month                — Oct/Nov/Dec
  • week_of_year         — ISO week number
  • minutes_since_open   — elapsed minutes since 08:00
  • is_peak_hour         — lunchtime / morning rush
  • is_morning           — before 11am
  • is_afternoon         — after 1pm
  • hour_sq              — non-linear time curvature
 
Target: is_high_occupancy  (1 if Occupancy/Capacity >= 0.75)
 
`Occupancy` is used ONLY to create the label, then discarded.
 
═══════════════════════════════════════════════════════════════════════
ANTI-OVERFIT HYPERPARAMETERS
═══════════════════════════════════════════════════════════════════════
  max_depth=6          — shallow trees, controlled bias-variance
  min_samples_split=40 — no split unless node has 40+ samples
  min_samples_leaf=20  — leaf must represent 20+ data points
  max_samples=0.7      — each tree trained on 70% of rows (bagging)
  max_features='sqrt'  — each split tests sqrt(13)≈3-4 features
 
Expected output: test accuracy 75–85%, train-test gap < 5%.
═══════════════════════════════════════════════════════════════════════
"""
 
import logging
import sys
from pathlib import Path
 
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder
 
# ── Project root on path ──────────────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))
 
from parking_system.models.random_forest_model import (
    DEFAULT_ENCODER_PATH,
    DEFAULT_MODEL_PATH,
    FEATURE_COLS,
    TARGET_COL,
    RandomForestSlotPredictor,
    _prepare_features,
)
 
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s]: %(message)s",
)
logger = logging.getLogger(__name__)
 
 
# ══════════════════════════════════════════════════════════════════════════════
# 1. DATASET LOADER
# ══════════════════════════════════════════════════════════════════════════════
 
def load_uci_parking_birmingham() -> pd.DataFrame:
    """
    Load UCI Parking Birmingham (ID=482) via ucimlrepo, with a direct
    ZIP download as fallback.
 
    Returns a raw DataFrame with columns:
        SystemCodeNumber, Capacity, Occupancy, LastUpdated
    """
    # ── Primary: ucimlrepo ────────────────────────────────────────────────
    try:
        from ucimlrepo import fetch_ucirepo
        logger.info("Fetching UCI Parking Birmingham (ID=482) via ucimlrepo …")
        dataset = fetch_ucirepo(id=482)
        X = dataset.data.features.copy()
        if hasattr(dataset.data, "targets") and dataset.data.targets is not None:
            df = pd.concat([X, dataset.data.targets.copy()], axis=1)
        else:
            df = X
        logger.info("Loaded via ucimlrepo: %d rows | cols=%s", len(df), list(df.columns))
        return df
    except Exception as exc:
        logger.warning("ucimlrepo unavailable (%s). Trying direct download …", exc)
 
    # ── Fallback: direct archive download ─────────────────────────────────
    import io
    import urllib.request
    import zipfile
 
    url = "https://archive.ics.uci.edu/static/public/482/parking+birmingham.zip"
    logger.info("Downloading: %s", url)
    with urllib.request.urlopen(url, timeout=60) as resp:
        raw = resp.read()
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        csv_name = [n for n in z.namelist() if n.endswith(".csv")][0]
        with z.open(csv_name) as f:
            df = pd.read_csv(f)
    logger.info("Loaded via direct download: %d rows | cols=%s", len(df), list(df.columns))
    return df
 
 
# ══════════════════════════════════════════════════════════════════════════════
# 2. FEATURE ENGINEERING + TARGET CREATION
# ══════════════════════════════════════════════════════════════════════════════
 
def engineer_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean the raw UCI dataset and create the binary target label.
 
    Steps
    ─────
    1. Normalise column names (ucimlrepo may lowercase them)
    2. Coerce Capacity / Occupancy to int; parse LastUpdated to datetime
    3. Clip Occupancy to [0, Capacity]
    4. Create TARGET_COL: 1 if Occupancy/Capacity >= 0.75 else 0
    5. Drop Occupancy so it cannot leak into _prepare_features
 
    Returns:
        DataFrame ready to pass into RandomForestSlotPredictor.fit()
    """
    df = raw_df.copy()
    df.columns = df.columns.str.strip()
 
    # Normalise column names
    renames: dict[str, str] = {}
    for col in df.columns:
        lc = col.lower()
        if lc == "systemcodenumber":
            renames[col] = "SystemCodeNumber"
        elif lc == "capacity":
            renames[col] = "Capacity"
        elif lc == "occupancy":
            renames[col] = "Occupancy"
        elif lc == "lastupdated":
            renames[col] = "LastUpdated"
    df.rename(columns=renames, inplace=True)
 
    # Coerce types
    df["Capacity"]    = pd.to_numeric(df["Capacity"],  errors="coerce").fillna(300).astype(int)
    df["Occupancy"]   = pd.to_numeric(df["Occupancy"], errors="coerce").fillna(0).astype(int)
    df["LastUpdated"] = pd.to_datetime(df["LastUpdated"], errors="coerce")
 
    # Drop unparseable rows
    df = df.dropna(subset=["LastUpdated"]).copy()
    df = df[df["Capacity"] > 0].copy()
 
    # Clip impossible readings
    df["Occupancy"] = df["Occupancy"].clip(lower=0, upper=df["Capacity"])
 
    # ── Create target label from Occupancy ────────────────────────────────
    occ_rate = df["Occupancy"] / df["Capacity"]
    df[TARGET_COL] = (occ_rate >= 0.75).astype(int)
 
    n_pos = int(df[TARGET_COL].sum())
    n_neg = len(df) - n_pos
    logger.info(
        "Target: High Occupancy (1)=%d (%.1f%%)  |  Available (0)=%d (%.1f%%)",
        n_pos, n_pos / len(df) * 100,
        n_neg, n_neg / len(df) * 100,
    )
 
    # ── DROP Occupancy — leakage prevention ───────────────────────────────
    # From this point forward the model sees ONLY: SystemCodeNumber, Capacity,
    # LastUpdated, and is_high_occupancy. It must not see the raw count.
    df.drop(columns=["Occupancy"], inplace=True)
 
    return df
 
 
# ══════════════════════════════════════════════════════════════════════════════
# 3. MAIN
# ══════════════════════════════════════════════════════════════════════════════
 
def main() -> None:
    bar = "=" * 68
 
    logger.info(bar)
    logger.info("  Parking Occupancy Prediction — UCI Parking Birmingham")
    logger.info(bar)
 
    # ── Step 1: Load real UCI dataset ─────────────────────────────────────
    raw_df = load_uci_parking_birmingham()
    logger.info("Raw shape: %s | cols: %s", raw_df.shape, list(raw_df.columns))
 
    # ── Step 2: Clean + create target (Occupancy dropped after labelling) ─
    df = engineer_features(raw_df)
    logger.info("After engineering: %d rows | cols: %s", len(df), list(df.columns))
 
    # ── Step 3: Verify zero leakage ───────────────────────────────────────
    assert "Occupancy" not in df.columns, "LEAKAGE: Occupancy must be dropped before training"
    assert "occupancy_rate" not in df.columns, "LEAKAGE: occupancy_rate must not be a feature"
    assert "available_ratio" not in df.columns, "LEAKAGE: available_ratio must not be a feature"
    logger.info("Leakage check PASSED — Occupancy and derivatives are absent from features.")
 
    # ── Step 4: Prepare feature matrix (sanity preview) ───────────────────
    X_preview, _ = _prepare_features(df)
    logger.info("Feature matrix sample (first 3 rows):\n%s", X_preview.head(3).to_string())
    logger.info("Features used (%d): %s", len(FEATURE_COLS), FEATURE_COLS)
 
    # ── Step 5: Train/test split (80/20, stratified) ──────────────────────
    X_full, enc_full = _prepare_features(df)
    y_full = df[TARGET_COL].values
 
    X_train, X_test, y_train, y_test = train_test_split(
        X_full, y_full,
        test_size=0.20,
        random_state=42,
        stratify=y_full,
    )
    logger.info(
        "Split → Train: %d rows | Test: %d rows (80/20 stratified)",
        len(X_train), len(X_test),
    )
 
    # ── Step 6: Train model ───────────────────────────────────────────────
    from sklearn.ensemble import RandomForestClassifier
 
    logger.info(
        "Training RandomForestClassifier "
        "(n_estimators=150, max_depth=6, min_samples_leaf=20, max_samples=0.7) …"
    )
 
    rf = RandomForestClassifier(
        n_estimators=150,       # enough trees for stable predictions
        max_depth=6,            # shallow — prevents memorisation
        min_samples_split=40,   # node must have 40+ samples to split
        min_samples_leaf=20,    # every leaf represents 20+ observations
        max_features="sqrt",    # sqrt(13)≈3 features per split → diversity
        max_samples=0.70,       # each tree trains on 70% of rows (bagging)
        class_weight="balanced",# compensates for class imbalance
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)
 
    # ── Step 7: Accuracy ──────────────────────────────────────────────────
    train_acc = rf.score(X_train, y_train)
    test_acc  = rf.score(X_test,  y_test)
    y_pred    = rf.predict(X_test)
 
    # 5-fold stratified cross-validation (on train set only — no test leakage)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf, X_train, y_train, cv=cv, scoring="accuracy", n_jobs=-1)
 
    overfit_gap = train_acc - test_acc
 
    # ── Step 8: Print results ─────────────────────────────────────────────
    print("\n" + bar)
    print(f"  Dataset  : UCI Parking Birmingham (ucimlrepo ID=482)")
    print(f"  Records  : {len(df):,}  |  Features : {len(FEATURE_COLS)}")
    print(f"  Split    : 80% train / 20% test (stratified)")
    print(f"  Target   : {TARGET_COL}  (1 = Occupancy/Capacity >= 0.75)")
    print("-" * 68)
    print(f"  Training Accuracy  : {train_acc * 100:.2f}%")
    print(f"  Testing  Accuracy  : {test_acc  * 100:.2f}%    ← primary metric")
    print(f"  CV Accuracy (5-fold): {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")
    print(f"  Overfit Gap        : {overfit_gap * 100:.2f}%  (train − test)")
 
    if test_acc > 0.90:
        print("  ⚠ WARNING: Accuracy > 90% — check for data leakage!")
    elif test_acc >= 0.70:
        status = "EXCELLENT" if test_acc >= 0.85 else "GOOD"
        print(f"  Status   : {status}  (realistic 70–85% range, no leakage)")
    else:
        print("  ⚠ WARNING: Accuracy < 70% — consider tuning hyperparameters.")
 
    print("=" * 68)
 
    # Classification report
    print("\nClassification Report (on held-out 20% test set):")
    print(
        classification_report(
            y_test, y_pred,
            target_names=["Available (< 75%)", "High Occupancy (>= 75%)"],
            digits=3,
        )
    )
 
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix:")
    print(f"  Predicted →     Available    High-Occ")
    print(f"  Actual Available  : TN={cm[0,0]:>6}   FP={cm[0,1]:>6}")
    print(f"  Actual High-Occ   : FN={cm[1,0]:>6}   TP={cm[1,1]:>6}")
 
    # Feature importances
    imp = pd.Series(rf.feature_importances_, index=FEATURE_COLS).sort_values(ascending=False)
    print("\nTop-5 Feature Importances (most predictive, leak-free):")
    for feat, val in imp.head(5).items():
        bar_len = int(val * 40)
        print(f"  {feat:<25} {val:.4f}  {'█' * bar_len}")
 
    # Cross-validation per fold
    print(f"\nCross-Validation (5-fold, on training set only):")
    for i, s in enumerate(cv_scores, 1):
        print(f"  Fold {i}: {s * 100:.2f}%")
    print(f"  Mean : {cv_scores.mean() * 100:.2f}%  Std: {cv_scores.std() * 100:.2f}%")
 
    # ── Step 9: Model explanation ─────────────────────────────────────────
    print("\n" + "─" * 68)
    print("MODEL INTERPRETATION")
    print("─" * 68)
    print(f"""
  Task:
    Predict whether a car park will be highly occupied (>=75% full)
    given only the time of day and the car park identity — without
    ever seeing the raw occupancy count.
 
    This model uses ONLY: time (hour, day, week, month) and park
    identity/size. It learns that certain parks at certain times tend
    to be full — a harder, realistic prediction task.
 
  Key predictors:
    • minutes_since_open / hour_of_day / hour_sq
        — Occupancy follows a daily arc: rises through morning,
          peaks mid-day, drops in afternoon.
    • capacity_log
        — Smaller parks fill faster and more predictably.
    • car_park_id_enc
        — Each park has a characteristic base occupancy level.
 
  Anti-overfitting measures:
    • max_depth=6            (shallow trees)
    • min_samples_leaf=20    (no micro-leaf memorisation)
    • max_samples=0.7        (row-level bagging per tree)
    • 5-fold cross-validation confirms stable CV≈{cv_scores.mean()*100:.1f}%
 
  Train-test gap: {overfit_gap*100:.2f}%  (< 5% = no meaningful overfitting)
""")
 
    # ── Step 10: Save model using project wrapper ─────────────────────────
    predictor = RandomForestSlotPredictor(n_estimators=150, max_depth=6)
    predictor.model      = rf
    predictor.encoders   = enc_full
    predictor._is_fitted = True
    predictor.train_accuracy_ = train_acc
    predictor.test_accuracy_  = test_acc
    predictor.cv_mean_        = float(cv_scores.mean())
    predictor.cv_std_         = float(cv_scores.std())
 
    DEFAULT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    predictor.save_model(DEFAULT_MODEL_PATH, DEFAULT_ENCODER_PATH)
 
    print(
        "Dataset citation:\n"
        "  Stolfi, D. (2017). Parking Birmingham [Dataset].\n"
        "  UCI Machine Learning Repository. https://doi.org/10.24432/C51K5Z\n"
        "  License: Creative Commons Attribution 4.0 International (CC BY 4.0)\n"
    )
 
 
if __name__ == "__main__":
    main()
 