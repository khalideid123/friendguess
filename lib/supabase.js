import { createClient } from "@supabase/supabase-js";

// Publishable project configuration only. No service-role key belongs here.
export const SUPABASE_URL = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
export const SUPABASE_KEY = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export async function submitSecureGuess(args) {
  // The optional service enriches close-guess feedback. The same secure RPC
  // remains the fallback, and neither path sends the answer to this client.
  try {
    const { data, error } = await supabase.functions.invoke("assess-guess", {
      body: {
        roomId: args.p_room_id,
        roundId: args.p_round_id,
        playerId: args.p_user_id,
        playerSecret: args.p_player_secret,
        guess: args.p_guess,
      },
    });
    if (!error && !data?.error) return { data, error: null };
  } catch {
    /* The core game still works without the optional service. */
  }
  return supabase.rpc("submit_guess", args);
}
