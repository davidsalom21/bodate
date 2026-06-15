import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = "https://gnnqshlejvlweaomamcy.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_amPlLaLPtyXkVkaGRanCpg_hCF4dw65";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
