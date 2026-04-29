// localStorage-based user & session store

export interface UserAccount {
  user_id: string;
  name: string;
  age: number;
  date_of_birth: string;
  registered_member_name: string;
  vehicle_number: string;
  license_plate: string;
  car_length: number;
  car_width: number;
  vehicle_type: "SUV" | "Sedan" | "Hatchback" | "Truck" | "Motorcycle" | "Van";
  email: string;
  password: string;
  created_at: string;
}

export interface ParkingSession {
  session_id: string;
  user_id: string;
  selected_floor: number;
  parking_slot: string;
  entry_time: string;
  exit_time: string | null;
  captured_image_path: string;
  status: "active" | "completed";
}

export interface FloorLayout {
  floor: number;
  label: string;
  rows: number;
  cols: number;
}

export const FLOORS: FloorLayout[] = [
  { floor: 1, label: "Ground Floor", rows: 5, cols: 8 },
  { floor: 2, label: "Floor 1", rows: 5, cols: 8 },
  { floor: 3, label: "Floor 2", rows: 4, cols: 8 },
  { floor: 4, label: "Floor 3 (Rooftop)", rows: 3, cols: 8 },
];

const USERS_KEY = "pv_users";
const SESSIONS_KEY = "pv_sessions";
const CURRENT_USER_KEY = "pv_current_user";
const IMAGES_KEY = "pv_images";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

function extractBase64Payload(data: string): string {
  const marker = ";base64,";
  const idx = data.indexOf(marker);
  return idx >= 0 ? data.slice(idx + marker.length) : data;
}

function inferContentType(data: string): string {
  if (data.startsWith("data:")) {
    const semi = data.indexOf(";");
    if (semi > 5) {
      return data.slice(5, semi);
    }
  }
  return "image/jpeg";
}

function toDataUrl(base64: string, contentType = "image/jpeg"): string {
  return `data:${contentType};base64,${base64}`;
}

// ── Users ──────────────────────────────────────────
export function getUsers(): UserAccount[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(data: Omit<UserAccount, "user_id" | "created_at">): UserAccount {
  const users = getUsers();
  if (users.find((u) => u.email === data.email)) {
    throw new Error("Email already registered");
  }
  const user: UserAccount = {
    ...data,
    user_id: `USR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  return user;
}

export function loginUser(email: string, password: string): UserAccount {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password");
  localStorage.setItem(CURRENT_USER_KEY, user.user_id);
  return user;
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function getCurrentUser(): UserAccount | null {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  return getUsers().find((u) => u.user_id === id) || null;
}

// ── Sessions ──────────────────────────────────────────
export function getSessions(): ParkingSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions: ParkingSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function getUserSessions(userId: string): ParkingSession[] {
  return getSessions().filter((s) => s.user_id === userId);
}

export function getActiveSessions(): ParkingSession[] {
  return getSessions().filter((s) => s.status === "active");
}

export function getOccupiedSlots(floor: number): string[] {
  return getActiveSessions()
    .filter((s) => s.selected_floor === floor)
    .map((s) => s.parking_slot);
}

export function createSession(
  userId: string,
  floor: number,
  slot: string,
  imagePath: string
): ParkingSession {
  const sessions = getSessions();
  const session: ParkingSession = {
    session_id: `SES-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    selected_floor: floor,
    parking_slot: slot,
    entry_time: new Date().toISOString(),
    exit_time: null,
    captured_image_path: imagePath,
    status: "active",
  };
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function endSession(sessionId: string): ParkingSession | null {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.session_id === sessionId);
  if (idx === -1) return null;
  sessions[idx].exit_time = new Date().toISOString();
  sessions[idx].status = "completed";
  saveSessions(sessions);
  return sessions[idx];
}

// ── Images (base64 in localStorage) ──────────────────
export async function saveImage(userId: string, sessionId: string, base64: string): Promise<string> {
  const images: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || "{}");
  const path = `captured_images/user_${userId}/session_${sessionId}.jpg`;

  // Keep a local cache for offline/quick retrieval.
  images[path] = base64;
  localStorage.setItem(IMAGES_KEY, JSON.stringify(images));

  const payload = extractBase64Payload(base64);
  const contentType = inferContentType(base64);

  try {
    await fetch(`${API_BASE_URL}/blob/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blob_name: path,
        content_base64: payload,
        content_type: contentType,
      }),
    });
  } catch {
    // Fallback is already persisted in localStorage.
  }

  return path;
}

export async function getImage(path: string): Promise<string | null> {
  const images: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || "{}");
  if (images[path]) return images[path];

  try {
    const url = `${API_BASE_URL}/blob/download/${encodeURIComponent(path)}`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json() as { content_base64?: string; content_type?: string };
    if (!data.content_base64) return null;

    const reconstructed = toDataUrl(data.content_base64, data.content_type || "image/jpeg");
    images[path] = reconstructed;
    localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
    return reconstructed;
  } catch {
    return null;
  }
}

// ── Find available slot on a floor ──────────────────
export function findAvailableSlot(floor: number): string | null {
  const layout = FLOORS.find((f) => f.floor === floor);
  if (!layout) return null;
  const occupied = new Set(getOccupiedSlots(floor));
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const slotId = `F${floor}-${String.fromCharCode(65 + r)}${c + 1}`;
      if (!occupied.has(slotId)) return slotId;
    }
  }
  return null;
}
