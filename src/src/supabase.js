import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://gnnqshlejvlweaomamcy.supabase.co";
const SUPABASE_ANON_KEY = "PEGA_AQUI_TU_sb_publishable_...";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
