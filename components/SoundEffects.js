"use client";

import { useEffect, useRef, useState } from "react";

function makeTone(context, frequency, duration, options = {}) {
  const { type = "sine", volume = 0.055, delay = 0 } = options;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

export default function SoundEffects() {
  const [enabled, setEnabled] = useState(true);
  const contextRef = useRef(null);
  const lastTimerRef = useRef(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("friendguess-sound");
    if (saved === "off") setEnabled(false);
  }, []);

  function getContext() {
    if (!contextRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === "suspended") {
      contextRef.current.resume().catch(() => {});
    }
    return contextRef.current;
  }

  function play(kind) {
    if (!enabled) return;
    const context = getContext();
    if (!context) return;

    if (kind === "click") {
      makeTone(context, 520, 0.07, { type: "triangle", volume: 0.028 });
      makeTone(context, 690, 0.055, { type: "triangle", volume: 0.018, delay: 0.025 });
    } else if (kind === "correct") {
      makeTone(context, 523.25, 0.16, { volume: 0.06 });
      makeTone(context, 659.25, 0.16, { volume: 0.06, delay: 0.11 });
      makeTone(context, 783.99, 0.24, { volume: 0.07, delay: 0.22 });
    } else if (kind === "round") {
      makeTone(context, 440, 0.13, { type: "triangle", volume: 0.045 });
      makeTone(context, 554.37, 0.16, { type: "triangle", volume: 0.05, delay: 0.1 });
      makeTone(context, 659.25, 0.19, { type: "triangle", volume: 0.055, delay: 0.2 });
    } else if (kind === "win") {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        makeTone(context, frequency, 0.3, { volume: 0.065, delay: index * 0.11 });
      });
    } else if (kind === "tick") {
      makeTone(context, 880, 0.045, { type: "square", volume: 0.018 });
    }
  }

  useEffect(() => {
    const handlePointer = (event) => {
      const button = event.target.closest?.("button");
      if (button && !button.disabled) play("click");
    };

    document.addEventListener("pointerdown", handlePointer);
    return () => document.removeEventListener("pointerdown", handlePointer);
  }, [enabled]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          const finalCard = node.matches?.(".final-card") || node.querySelector?.(".final-card");
          if (finalCard) {
            play("win");
            return;
          }

          const correct = node.matches?.(".feed-line.correct") || node.querySelector?.(".feed-line.correct");
          if (correct) {
            play("correct");
            return;
          }

          const result = node.matches?.(".result-card") || node.querySelector?.(".result-card");
          if (result) {
            play("round");
            return;
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const element = document.querySelector(".timer.timer-danger");
      if (!element) {
        lastTimerRef.current = null;
        return;
      }

      const value = Number.parseInt(element.textContent || "", 10);
      if (Number.isFinite(value) && value > 0 && value <= 5 && value !== lastTimerRef.current) {
        lastTimerRef.current = value;
        play("tick");
      }
    }, 180);

    return () => window.clearInterval(timer);
  }, [enabled]);

  function toggleSound() {
    const next = !enabled;
    setEnabled(next);
    window.localStorage.setItem("friendguess-sound", next ? "on" : "off");
    if (next) {
      window.setTimeout(() => {
        const context = getContext();
        if (context) makeTone(context, 660, 0.09, { type: "triangle", volume: 0.035 });
      }, 0);
    }
  }

  return (
    <button
      type="button"
      className="sound-toggle"
      onClick={toggleSound}
      aria-label={enabled ? "Mute game sounds" : "Turn on game sounds"}
      title={enabled ? "Mute sounds" : "Turn on sounds"}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}
