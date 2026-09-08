"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function KickManager() {
  useEffect(() => {
    let cancelled = false;
    let busy = false;

    const kickedMessage = window.sessionStorage.getItem("friendguess-kicked-message");
    if (kickedMessage) {
      window.sessionStorage.removeItem("friendguess-kicked-message");
      window.setTimeout(() => window.alert(kickedMessage), 150);
    }

    function removeKickButtons() {
      document.querySelectorAll(".fg-kick-button").forEach((button) => button.remove());
    }

    function exitKickedPlayer() {
      window.sessionStorage.removeItem("friendguess-active-room-id");
      window.sessionStorage.setItem(
        "friendguess-kicked-message",
        "You were kicked from the room."
      );
      window.location.href = `${window.location.origin}${window.location.pathname}`;
    }

    async function syncKickControls() {
      if (cancelled || busy) return;

      const roomId = window.sessionStorage.getItem("friendguess-active-room-id");
      const playerId = window.sessionStorage.getItem("friendguess-player-id");
      const playerSecret = window.sessionStorage.getItem("friendguess-player-secret");

      if (!roomId || !playerId || !playerSecret) {
        removeKickButtons();
        return;
      }

      busy = true;
      const { data, error } = await supabase.rpc("get_room_state", {
        p_room_id: roomId,
        p_user_id: playerId,
        p_player_secret: playerSecret,
      });
      busy = false;

      if (cancelled) return;

      if (error) {
        const message = error?.message || "";
        if (message.includes("Player session is not valid") || message.includes("Room not found")) {
          exitKickedPlayer();
        }
        return;
      }

      const room = data?.room;
      const players = Array.isArray(data?.players) ? data.players : [];
      const meStillInRoom = players.some((player) => player.user_id === playerId);

      if (!meStillInRoom) {
        exitKickedPlayer();
        return;
      }

      if (!room || room.host_user_id !== playerId) {
        removeKickButtons();
        return;
      }

      const cards = document.querySelectorAll(".player-tile:not(.empty), .score-player, .score-row");

      cards.forEach((card) => {
        const nameNode = card.querySelector("strong");
        const nickname = nameNode?.textContent?.trim();
        if (!nickname) return;

        const target = players.find((player) => player.nickname === nickname);
        const existing = card.querySelector(".fg-kick-button");

        if (!target || target.user_id === playerId) {
          existing?.remove();
          return;
        }

        if (existing) {
          existing.dataset.targetUserId = target.user_id;
          existing.dataset.targetNickname = target.nickname;
          return;
        }

        const button = document.createElement("button");
        button.type = "button";
        button.className = "fg-kick-button";
        button.textContent = "Kick";
        button.dataset.targetUserId = target.user_id;
        button.dataset.targetNickname = target.nickname;
        button.setAttribute("aria-label", `Kick ${target.nickname}`);
        button.title = `Remove ${target.nickname} from the room`;

        button.addEventListener("click", async (event) => {
          event.preventDefault();
          event.stopPropagation();

          const targetUserId = button.dataset.targetUserId;
          const targetNickname = button.dataset.targetNickname || "this player";
          if (!targetUserId) return;

          if (!window.confirm(`Kick ${targetNickname} from the room?`)) return;

          button.disabled = true;
          button.textContent = "Kicking…";

          const { error: kickError } = await supabase.rpc("kick_player", {
            p_room_id: roomId,
            p_host_user_id: playerId,
            p_host_player_secret: playerSecret,
            p_target_user_id: targetUserId,
          });

          if (kickError) {
            window.alert(kickError.message || "Could not kick that player.");
            button.disabled = false;
            button.textContent = "Kick";
          } else {
            button.remove();
            window.setTimeout(syncKickControls, 100);
          }
        });

        card.appendChild(button);
      });
    }

    const observer = new MutationObserver(() => {
      window.setTimeout(syncKickControls, 0);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    syncKickControls();
    const interval = window.setInterval(syncKickControls, 650);

    return () => {
      cancelled = true;
      observer.disconnect();
      window.clearInterval(interval);
      removeKickButtons();
    };
  }, []);

  return null;
}
