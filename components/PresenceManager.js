"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
const SUPABASE_KEY = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";
const PENDING_LEAVE_KEY = "friendguess-pending-leave";

function getActivePlayer() {
  return {
    roomId: window.sessionStorage.getItem("friendguess-active-room-id"),
    playerId: window.sessionStorage.getItem("friendguess-player-id"),
    playerSecret: window.sessionStorage.getItem("friendguess-player-secret"),
  };
}

function rememberPendingLeave({ roomId, playerId, playerSecret }) {
  if (!roomId || !playerId || !playerSecret) return;
  window.sessionStorage.setItem(
    PENDING_LEAVE_KEY,
    JSON.stringify({ roomId, playerId, playerSecret })
  );
}

export default function PresenceManager() {
  useEffect(() => {
    let cancelled = false;

    async function finishPendingLeave() {
      const raw = window.sessionStorage.getItem(PENDING_LEAVE_KEY);
      if (!raw) return;

      let pending;
      try {
        pending = JSON.parse(raw);
      } catch {
        window.sessionStorage.removeItem(PENDING_LEAVE_KEY);
        return;
      }

      const { roomId, playerId, playerSecret } = pending || {};
      if (!roomId || !playerId || !playerSecret) {
        window.sessionStorage.removeItem(PENDING_LEAVE_KEY);
        return;
      }

      // A reload/new navigation may interrupt the pagehide request before the
      // browser sends it. Finish the removal as soon as this page loads again.
      await supabase.rpc("leave_room", {
        p_room_id: roomId,
        p_user_id: playerId,
        p_player_secret: playerSecret,
      });

      if (!cancelled) {
        window.sessionStorage.removeItem(PENDING_LEAVE_KEY);
        window.sessionStorage.removeItem("friendguess-active-room-id");
      }
    }

    finishPendingLeave();

    function handleLeaveClick(event) {
      const button = event.target?.closest?.("button");
      if (!button || button.textContent?.trim() !== "Leave room") return;

      const active = getActivePlayer();
      const { roomId, playerId, playerSecret } = active;
      if (!roomId || !playerId || !playerSecret) return;

      rememberPendingLeave(active);
      window.sessionStorage.removeItem("friendguess-active-room-id");

      supabase.rpc("leave_room", {
        p_room_id: roomId,
        p_user_id: playerId,
        p_player_secret: playerSecret,
      }).finally(() => {
        window.sessionStorage.removeItem(PENDING_LEAVE_KEY);
      });
    }

    function leaveOnTabExit(event) {
      // If the browser is only putting this page into its back/forward cache,
      // keep the player in the room because they may return immediately.
      if (event?.persisted) return;

      const active = getActivePlayer();
      const { roomId, playerId, playerSecret } = active;
      if (!roomId || !playerId || !playerSecret) return;

      // Keep a durable-in-this-tab marker. On a reload, the new page finishes
      // the leave request even if this final keepalive request was interrupted.
      rememberPendingLeave(active);
      window.sessionStorage.removeItem("friendguess-active-room-id");

      fetch(`${SUPABASE_URL}/rest/v1/rpc/leave_room`, {
        method: "POST",
        keepalive: true,
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          p_room_id: roomId,
          p_user_id: playerId,
          p_player_secret: playerSecret,
        }),
      }).catch(() => {
        // Reload recovery above and server-side stale-player cleanup are the
        // fallbacks if the browser terminates before this request completes.
      });
    }

    document.addEventListener("click", handleLeaveClick, true);
    window.addEventListener("pagehide", leaveOnTabExit);

    return () => {
      cancelled = true;
      document.removeEventListener("click", handleLeaveClick, true);
      window.removeEventListener("pagehide", leaveOnTabExit);
    };
  }, []);

  return null;
}
