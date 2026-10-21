import { createServerAction } from '@/lib/server-actions';
import { supabaseAdmin } from '@/lib/supabase-admin';
// Using the native global fetch (Node 18+). No external dependency required.

// ---------------------------------------------------------------------------
// Helper: compute live telemetry for a given user from Supabase submissions
// ---------------------------------------------------------------------------
async function getUserTelemetry(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('submissions')
    .select('verdict,runtime,difficulty')
    .eq('user_id', userId);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  if (!data || data.length === 0) {
    return {
      past_accuracy: 0,
      avg_runtime_ms: 0,
      current_difficulty: 0,
    };
  }

  // Exclude the most recent submission when computing past statistics
  const past = data.slice(0, -1);
  const correct = past.filter((s) => s.verdict === 'Accepted').length;
  const past_accuracy = past.length ? correct / past.length : 0;

  const totalRuntime = past.reduce((sum, s) => sum + Number(s.runtime) * 1000, 0);
  const avg_runtime_ms = past.length ? totalRuntime / past.length : 0;

  const last = data[data.length - 1];
  const diffMap: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
  const current_difficulty = diffMap[last.difficulty] ?? 0;

  return { past_accuracy, avg_runtime_ms, current_difficulty };
}

// ---------------------------------------------------------------------------
// Server action: getAdaptiveRecommendation
// ---------------------------------------------------------------------------
export const getAdaptiveRecommendation = createServerAction(
  async (userId: string) => {
    // 1️⃣ Gather telemetry from Supabase
    const telemetry = await getUserTelemetry(userId);

    // 2️⃣ Call the FastAPI gateway (assumes it runs locally on port 8000)
    const res = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(telemetry),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`ML service error (${res.status}): ${txt}`);
    }

    const { recommended_difficulty } = (await res.json()) as {
      recommended_difficulty: number;
    };

    // 3️⃣ Pass the tier to Gemini for a personalized tutoring message.
    // The downstream Gemini integration will receive this payload.
    return { tier: recommended_difficulty };
  }
);
