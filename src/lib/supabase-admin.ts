// Minimal supabase admin client for server‑actions
// Re‑exports the privileged Supabase client defined in src/server/db.
// This allows imports like "@/lib/supabase-admin" to resolve without
// pulling in the full server‑side implementation.

// NOTE: This file re‑exports the privileged Supabase client for **server‑only** usage.
// Do NOT import this module from client‑side code, otherwise import‑protection will trigger.
import { supabase } from '@/server/db';

export const supabaseAdmin = supabase;
