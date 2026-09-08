"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function PresenceManager() {
  useEffect(() => {
    function handleLeaveClick(event) {
      const button = event.target?.closest?.("button");
      if (!button || button.textContent?.trim() !== "Leave room") return;

      const roomId = window.sessionStorage.getItem("friendguess-active-room-id");
      const playerId = window.sessionStorage.getItem("friendguess-player-id");
      const playerSecret = window.sessionStorage.getItem("friendguess-player-secret");

      if (!roomId || !playerId || !playerSecret) return;

      supabase.rpc("leave_room", {
        p_room_id: roomId,
        p_user_id: playerId,
        p_player_secret: playerSecret,
      });
    }

    document.addEventListener("click", handleLeaveClick, true);
    return () => document.removeEventListener("click", handleLeaveClick, true);
  }, []);

  return null;
}
