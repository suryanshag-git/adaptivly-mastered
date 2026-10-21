// Minimal supabase admin client for server‑actions
// Re‑exports the privileged Supabase client defined in src/server/db.
// This allows imports like "@/lib/supabase-admin" to resolve without
// pulling in the full server‑side implementation.

import { supabase } from '@/server/db';

export const supabaseAdmin = supabase;
