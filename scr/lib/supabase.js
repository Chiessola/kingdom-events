import { createClient } from "@supabase/supabase-js";

// ── CONNEXION À TON PROJET SUPABASE ─────────────────────────────────────────
// Ces valeurs viennent de ton tableau de bord Supabase
// (Project Settings → API)

const SUPABASE_URL = "https://vbezhnsuhxfxtndacruq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_p8-Ev568M3wOsfndPlvNEA_Hb2YmxAm";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
