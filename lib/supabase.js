import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
const supabasePublishableKey = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
