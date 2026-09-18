"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  supabase,
  SUPABASE_KEY,
  SUPABASE_URL,
  submitSecureGuess,
} from "./supabase";

const PENDING = "friendguess-pending-leave";
function credentials(session) {
  return {
    p_room_id: session.roomId,
    p_user_id: session.playerId,
    p_player_secret: session.playerSecret,
  };
}
function makeIdentity() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return {
    playerId: crypto.randomUUID(),
    playerSecret: Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join(""),
  };
}
function writeSession(key, value) {
  try {
    value == null
      ? sessionStorage.removeItem(key)
      : sessionStorage.setItem(key, value);
  } catch {}
}
function savePending(s) {
  if (s?.roomId) writeSession(PENDING, JSON.stringify(s));
}
function forget() {
  writeSession("friendguess-active-room-id", null);
  writeSession(PENDING, null);
}

export function useRoom() {
  const [identity, setIdentity] = useState(null),
    [session, setSession] = useState(null),
    [state, setState] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [connection, setConnection] = useState("");
  const identityRef = useRef(null),
    active = useRef(null),
    alive = useRef(false),
    inFlight = useRef(false),
    actionBusy = useRef(false),
    timeoutRound = useRef("");
  useEffect(() => {
    alive.current = true;
    if (!identityRef.current) identityRef.current = makeIdentity();
    setIdentity(identityRef.current);
    let pending;
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING));
    } catch {}
    if (pending?.roomId && pending.playerSecret)
      supabase.rpc("leave_room", credentials(pending)).then(({ error }) => {
        if (!error) writeSession(PENDING, null);
      });
    function exit(e) {
      if (e?.persisted) return;
      const s = active.current;
      if (!s) return;
      savePending(s);
      fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_room`, {
        method: "POST",
        keepalive: true,
        headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(credentials(s)),
      }).catch(() => {});
    }
    window.addEventListener("pagehide", exit);
    return () => {
      alive.current = false;
      window.removeEventListener("pagehide", exit);
    };
  }, []);
  const clear = useCallback((message) => {
    active.current = null;
    setSession(null);
    setState(null);
    forget();
    setConnection("");
    if (message) setError(message);
  }, []);
  const refresh = useCallback(async () => {
    const s = active.current;
    if (!s || inFlight.current) return;
    inFlight.current = true;
    try {
      const { data, error: err } = await supabase.rpc(
        "get_room_state",
        credentials(s),
      );
      if (!alive.current || active.current?.roomId !== s.roomId) return;
      if (err) {
        if (
          /Player session is not valid|Room not found|Invalid player/.test(
            err.message,
          )
        ) {
          clear(
            "You're no longer in that room. The host may have removed you, or the room has closed.",
          );
          return;
        }
        setConnection("Connection interrupted. Reconnecting…");
        return;
      }
      setConnection("");
      setState(data);
      const r = data?.currentRound;
      if (
        r?.status === "guessing" &&
        new Date(r.ends_at).getTime() <= Date.now() &&
        timeoutRound.current !== r.id
      ) {
        timeoutRound.current = r.id;
        const result = await supabase.rpc("finish_round_timeout", {
          p_round_id: r.id,
          p_user_id: s.playerId,
          p_player_secret: s.playerSecret,
        });
        if (result.error) timeoutRound.current = "";
      }
    } catch {
      if (alive.current) setConnection("Connection interrupted. Reconnecting…");
    } finally {
      inFlight.current = false;
    }
  }, [clear]);
  useEffect(() => {
    if (!session) return;
    let cancelled = false,
      timer;
    async function poll() {
      await refresh();
      if (!cancelled) timer = setTimeout(poll, document.hidden ? 4000 : 750);
    }
    poll();
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [session, refresh]);
  async function action(name, args, custom) {
    if (actionBusy.current)
      return { error: { message: "Please wait for the current action." } };
    actionBusy.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await (custom ? custom(args) : supabase.rpc(name, args));
      if (result.error) throw result.error;
      await refresh();
      return result;
    } catch (e) {
      if (alive.current)
        setError(e.message || "Couldn't connect. Please try again.");
      return { error: e };
    } finally {
      actionBusy.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function enter(kind, nickname, roundsTotal, code) {
    if (!identity) return;
    const args = {
      p_nickname: nickname.trim(),
      p_user_id: identity.playerId,
      p_player_secret: identity.playerSecret,
      ...(kind === "create"
        ? { p_rounds_total: roundsTotal }
        : { p_code: code }),
    };
    const result = await action(
      kind === "create" ? "create_room" : "join_room",
      args,
    );
    const row = result?.data?.[0];
    if (row?.room_id) {
      const s = { ...identity, roomId: row.room_id };
      active.current = s;
      setSession(s);
      setState(null);
      writeSession("friendguess-active-room-id", s.roomId);
      writeSession("friendguess-player-id", s.playerId);
      writeSession("friendguess-player-secret", s.playerSecret);
      try {
        localStorage.setItem("friendguess-nickname", nickname.trim());
      } catch {}
    }
    return result;
  }
  function roomAction(name, extra = {}) {
    if (!active.current)
      return Promise.resolve({ error: { message: "No active room" } });
    return action(name, { ...credentials(active.current), ...extra });
  }
  function roundAction(name, extra = {}) {
    if (!active.current || !state?.currentRound)
      return Promise.resolve({ error: { message: "No active round" } });
    return action(name, {
      p_round_id: state.currentRound.id,
      p_user_id: active.current.playerId,
      p_player_secret: active.current.playerSecret,
      ...extra,
    });
  }
  async function leave() {
    const s = active.current;
    if (!s) {
      clear();
      return true;
    }
    savePending(s);
    const result = await action("leave_room", credentials(s));
    if (!result.error) {
      clear();
      return true;
    }
    return false;
  }
  function guess(text) {
    if (!active.current || !state?.currentRound)
      return Promise.resolve({ error: { message: "No active round" } });
    return action(
      "submit_guess",
      {
        ...credentials(active.current),
        p_round_id: state.currentRound.id,
        p_guess: text,
      },
      submitSecureGuess,
    );
  }
  function kick(target) {
    if (!active.current) return;
    return action("kick_player", {
      p_room_id: active.current.roomId,
      p_host_user_id: active.current.playerId,
      p_host_player_secret: active.current.playerSecret,
      p_target_user_id: target,
    });
  }
  return {
    identity,
    session,
    state,
    busy,
    error,
    connection,
    enter,
    roomAction,
    roundAction,
    guess,
    kick,
    leave,
    refresh,
    setError,
  };
}
