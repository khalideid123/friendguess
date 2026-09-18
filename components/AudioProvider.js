"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
const AudioContextValue = createContext(null);
export function AudioProvider({ children }) {
  const [enabled, setEnabled] = useState(true);
  const context = useRef(null),
    unlocked = useRef(false);
  useEffect(() => {
    try {
      setEnabled(localStorage.getItem("friendguess-sound") !== "off");
    } catch {}
    return () => {
      context.current?.close().catch(() => {});
      context.current = null;
    };
  }, []);
  const unlock = useCallback(() => {
    unlocked.current = true;
    if (!context.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) context.current = new AC();
    }
    if (context.current?.state === "suspended")
      context.current.resume().catch(() => {});
  }, []);
  const play = useCallback(
    (kind) => {
      if (!enabled || !unlocked.current || document.hidden) return;
      const c = context.current;
      if (!c || c.state !== "running") return;
      const notes = {
        click: [620],
        correct: [523, 659, 784, 1047],
        wrong: [190, 160],
        close: [440, 554],
        hint: [554, 740],
        tick: [660],
        win: [523, 659, 784, 1047, 1319],
        round: [392, 523],
      }[kind] || [520];
      notes.forEach((f, i) => {
        const o = c.createOscillator(),
          g = c.createGain(),
          t = c.currentTime + i * 0.08;
        o.type = kind === "wrong" ? "triangle" : "sine";
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(
          kind === "tick" ? 0.017 : 0.055,
          t + 0.01,
        );
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g);
        g.connect(c.destination);
        o.start(t);
        o.stop(t + 0.18);
        o.onended = () => {
          o.disconnect();
          g.disconnect();
        };
      });
    },
    [enabled],
  );
  const toggle = useCallback(() => {
    unlock();
    setEnabled((v) => {
      try {
        localStorage.setItem("friendguess-sound", v ? "off" : "on");
      } catch {}
      return !v;
    });
  }, [unlock]);
  return (
    <AudioContextValue.Provider value={{ enabled, toggle, play, unlock }}>
      {children}
    </AudioContextValue.Provider>
  );
}
export function useAudio() {
  return useContext(AudioContextValue);
}
