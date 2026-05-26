const API_URL = "http://localhost:3000";

// Persistent user ID — generated once per browser, stored in localStorage.
// The backend should use this to UPSERT (keep best score per userId) instead
// of inserting a new row on every play. It also needs to return `userId` in
// GET /api/ranking so the client can disambiguate players with the same name.
const UID_KEY = "tuenti-breakout-uid";
export const USER_ID: string = (() => {
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(UID_KEY, id);
  }
  return id;
})();

export interface ScoreEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  date: string;
  userId?: string; // returned by BE for client-side name disambiguation
}

export interface SubmitScorePayload {
  name: string;
  score: number;
  level: number;
  bricksBroken: number;
  powerUpsCaught: number;
}

export async function submitScore(
  payload: SubmitScorePayload,
): Promise<{ rank: number }> {
  if (!API_URL) return { rank: 0 };
  const res = await fetch(`${API_URL}/api/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // userId included so the BE can UPSERT instead of INSERT
    body: JSON.stringify({ ...payload, userId: USER_ID }),
  });
  if (!res.ok) throw new Error(`submitScore error: ${res.status}`);
  return res.json() as Promise<{ rank: number }>;
}

export async function fetchRanking(limit = 10): Promise<ScoreEntry[]> {
  if (!API_URL) return [];
  const res = await fetch(`${API_URL}/api/ranking?limit=${limit}`);
  if (!res.ok) throw new Error(`fetchRanking error: ${res.status}`);
  return res.json() as Promise<ScoreEntry[]>;
}
