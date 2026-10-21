// src/server-actions/adaptive-dashboard.server.ts
// Pure server‑only implementation — called only from createServerFn handlers.
// This file uses dynamic imports so @/server/db is never bundled client-side.

// Helper: compute live telemetry for a given user from Supabase submissions
async function getUserTelemetry(userId: string) {
  const { supabase } = await import('@/server/db');
  const { data, error } = await supabase
    .from('submissions')
    .select('status,runtime_ms,problems(difficulty)')
    .eq('user_id', userId);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  if (!data || data.length === 0) {
    return { past_accuracy: 0, avg_runtime_ms: 0, current_difficulty: 0 };
  }

  const past = data.slice(0, -1);
  const correct = past.filter((s: any) => s.status === 'Accepted').length;
  const past_accuracy = past.length ? correct / past.length : 0;
  const totalRuntime = past.reduce((sum: number, s: any) => sum + Number(s.runtime_ms ?? 0), 0);
  const avg_runtime_ms = past.length ? totalRuntime / past.length : 0;
  const last = data[data.length - 1];
  const diffMap: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
  const diff = (last as any)?.problems?.difficulty ?? 'Easy';
  const current_difficulty = diffMap[diff] ?? 0;

  return { past_accuracy, avg_runtime_ms, current_difficulty };
}

export async function getAdaptiveRecommendationImpl(userId: string) {
  const telemetry = await getUserTelemetry(userId);

  // Gracefully fall back if the ML service is not running
  let tier = 0;
  try {
    const res = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = (await res.json()) as { recommended_difficulty: number };
      tier = json.recommended_difficulty;
    }
  } catch {
    // ML service unavailable — derive tier from accuracy heuristic
    tier = telemetry.past_accuracy >= 0.8 ? 2 : telemetry.past_accuracy >= 0.5 ? 1 : 0;
  }

  return { tier };
}
