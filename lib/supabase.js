import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
const supabasePublishableKey = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";

const client = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const baseRpc = client.rpc.bind(client);

client.rpc = async (functionName, args = {}, options) => {
  if (functionName === "submit_guess") {
    const { data, error } = await client.functions.invoke("assess-guess", {
      body: {
        roomId: args.p_room_id,
        roundId: args.p_round_id,
        playerId: args.p_user_id,
        playerSecret: args.p_player_secret,
        guess: args.p_guess,
      },
    });

    if (data?.error && !error) {
      return { data: null, error: { message: data.error } };
    }

    return { data, error };
  }

  if (functionName === "lock_answer") {
    const hint =
      typeof window !== "undefined" && typeof window.__friendguessHint === "string"
        ? window.__friendguessHint.trim().slice(0, 100)
        : "";

    const result = await baseRpc(
      functionName,
      {
        ...args,
        p_hint: hint,
      },
      options
    );

    if (!result.error && typeof window !== "undefined") {
      window.__friendguessHint = "";
    }

    return result;
  }

  const result = await baseRpc(functionName, args, options);

  if (functionName === "get_room_state" && result?.data) {
    const round = result.data.currentRound;

    result.data = {
      ...result.data,
      currentRound:
        round?.hint && round.status !== "waiting"
          ? {
              ...round,
              question: `${round.question}  💡 Hint: ${round.hint}`,
            }
          : round,
      guesses: Array.isArray(result.data.guesses)
        ? result.data.guesses.map((guess) => ({
            ...guess,
            guess:
              guess.is_close && !guess.is_correct
                ? `${guess.guess}  🔥 CLOSE!`
                : guess.guess,
          }))
        : [],
    };
  }

  return result;
};

export const supabase = client;
