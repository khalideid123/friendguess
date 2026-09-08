"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

const SUPABASE_URL = "https://cbgimbwkkzhqmimsiyxz.supabase.co";
const SUPABASE_KEY = "sb_publishable_JyHoj4uz1eUYOucII_qKqw_UXnIF9bJ";

function getActivePlayer() {
  return {
    roomId: window.sessionStorage.getItem("friendguess-active-room-id"),
    playerId: window.sessionStorage.getItem("friendguess-player-id"),
    playerSecret: window.sessionStorage.getItem("friendguess-player-secret"),
  };
}

export default function PresenceManager() {
  useEffect(() => {
    function handleLeaveClick(event) {
      const button = event.target?.closest?.("button");
      if (!button || button.textContent?.trim() !== "Leave room") return;

      const { roomId, playerId, playerSecret } = getActivePlayer();
      if (!roomId || !playerId || !playerSecret) return;

      supabase.rpc("leave_room", {
        p_room_id: roomId,
        p_user_id: playerId,
        p_player_secret: playerSecret,
      });
    }

    function leaveOnTabExit(event) {
      // If the browser is only putting this page into its back/forward cache,
      // keep the player in the room because they may return immediately.
      if (event?.persisted) return;

      const { roomId, playerId, playerSecret } = getActivePlayer();
      if (!roomId || !playerId || !playerSecret) return;

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
        // The server-side stale-player cleanup remains the fallback if a
        // browser terminates before it can send this final request.
      });
    }

    document.addEventListener("click", handleLeaveClick, true);
    window.addEventListener("pagehide", leaveOnTabExit);

    return () => {
      document.removeEventListener("click", handleLeaveClick, true);
      window.removeEventListener("pagehide", leaveOnTabExit);
    };
  }, []);

  return null;
}
