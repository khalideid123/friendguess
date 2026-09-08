import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
const supabasePublishableKey = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";

const browserSessionStorage = {
  getItem(key) {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(key);
  },
  setItem(key, value) {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(key, value);
  },
  removeItem(key) {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: browserSessionStorage,
    storageKey: "friendguess-player-session-v2",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
