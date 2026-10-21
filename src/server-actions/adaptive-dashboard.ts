// src/server-actions/adaptive-dashboard.ts
// Client‑side stub that runs entirely on the server via a server action.
// All server‑only imports are performed **inside** the handler to avoid
// import‑protection in the client bundle.

import { createServerAction } from '@/lib/server-actions';

// Server action: getAdaptiveRecommendation
export const getAdaptiveRecommendation = createServerAction(async (userId: string) => {
  // Import the privileged Supabase client only on the server.
  const { supabase } = await import('@/server/db');

  // ---------------------------------------------------------------------
  // Helper: compute live telemetry for a given user from Supabase submissions
  // ---------------------------------------------------------------------
  const { data, error } = await supabase
    .from('submissions')
    .select('verdict,runtime,difficulty')
    .eq('user_id', userId);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  if (!data || data.length === 0) {
    return { tier: 1 } as const; // default tier if no data
  }

  // Exclude the most recent submission when computing past statistics
  const past = data.slice(0, -1);
  const correct = past.filter((s: any) => s.verdict === 'Accepted').length;
  const past_accuracy = past.length ? correct / past.length : 0;

  const totalRuntime = past.reduce((sum: number, s: any) => sum + Number(s.runtime) * 1000, 0);
  const avg_runtime_ms = past.length ? totalRuntime / past.length : 0;

  const last = data[data.length - 1];
  const diffMap: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
  const current_difficulty = diffMap[last.difficulty] ?? 0;

  const telemetry = { past_accuracy, avg_runtime_ms, current_difficulty };

  // ---------------------------------------------------------------------
  // Call the FastAPI gateway (assumes it runs locally on port 8000)
  // ---------------------------------------------------------------------
  const res = await fetch('http://localhost:8000/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(telemetry),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`ML service error (${res.status}): ${txt}`);
  }

  const { recommended_difficulty } = (await res.json()) as { recommended_difficulty: number };

  // Return result for downstream Gemini integration.
  return { tier: recommended_difficulty } as const;
});

// Alias to keep existing imports working.
export const getAdaptiveRecommendations = getAdaptiveRecommendation;
