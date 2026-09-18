"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

const PATHS = {
  arrow: "M5 12h14m-6-6 6 6-6 6",
  back: "M19 12H5m6-6-6 6 6 6",
  play: "m9 5 11 7-11 7Z",
  close: "m6 6 12 12M6 18 18 6",
  check: "m5 12 4 4L19 6",
  bolt: "m13 2-9 12h7l-1 8 10-12h-7Z",
  clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  trophy:
    "M8 3h8v7a4 4 0 0 1-8 0ZM8 5H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 2v6m-4 1h8",
  flame: "M12 3c1 5-5 5-5 11a5 5 0 0 0 10 0c0-3-2-5-2-5s0 4-2 4c-2 0 2-6-1-10Z",
  sparkles:
    "m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5ZM20 2v4m-2-2h4",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0m4-3a4 4 0 0 1 0 8",
  calendar:
    "M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM7 2v4m10-4v4M3 10h18m-14 4h3m4 0h3m-10 3h3",
  sound: "m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14",
  muted: "m11 5-6 4H2v6h3l6 4Zm5 4 5 6m0-6-5 6",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  help: "M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  lock: "M5 11h14v10H5Zm3 0V7a4 4 0 0 1 8 0v4",
  hint: "M9 18h6m-5 3h4M8 14a7 7 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2",
  copy: "M9 8h12v13H9ZM5 16H3V3h12v2",
  crown: "m2 7 5 4 5-8 5 8 5-4-3 13H5Z",
  home: "m3 10 9-7 9 7v11h-6v-7H9v7H3Z",
  brain:
    "M12 5a4 4 0 0 0-7-2 4 4 0 0 0-3 6 5 5 0 0 0 1 8 4 4 0 0 0 9 2Zm0 0a4 4 0 0 1 7-2 4 4 0 0 1 3 6 5 5 0 0 1-1 8 4 4 0 0 1-9 2M6 8l3 2m9-2-3 2M6 15l3-2m9 2-3-2",
  star: "m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z",
  chart: "M4 20V10m8 10V4m8 16v-7",
  refresh: "M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1m0 11A8 8 0 0 1 5 18",
};
export function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={PATHS[name] || PATHS.sparkles} />
    </svg>
  );
}
export function Milo({ pose = "hello", className = "", priority = false }) {
  return (
    <div className={`milo milo-${pose} ${className}`}>
      <Image
        src={`./art/milo-${pose}.webp`}
        alt={`Milo the fox, ${pose === "celebrate" ? "celebrating" : pose === "thinking" ? "thinking" : pose === "encourage" ? "encouraging you" : "waving hello"}`}
        width={480}
        height={480}
        priority={priority}
        draggable={false}
      />
    </div>
  );
}
export function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="FriendGuess home">
      <span className="brand-mark">
        f<span>g</span>
        <i />
      </span>
      <span>
        friend<span>guess</span>
      </span>
    </button>
  );
}
export function AnimatedNumber({ value, duration = 550 }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    let frame;
    const start = performance.now(),
      from = previous.current;
    function tick(t) {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    previous.current = value;
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}
export function Confetti() {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 22 }, (_, i) => (
        <i
          key={i}
          style={{
            "--i": i,
            "--x": `${(i * 47) % 100}%`,
            "--r": `${i * 39}deg`,
            "--color": ["#cdfb67", "#ac94ff", "#68e6d6", "#ffac68"][i % 4],
          }}
        />
      ))}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const id = useId(),
    ref = useRef(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const el = ref.current;
    el?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const nodes = el.querySelectorAll(
          'button:not(:disabled),input:not(:disabled),select,a[href],[tabindex="0"]',
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first || document.activeElement === el)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el?.addEventListener("keydown", onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      el?.removeEventListener("keydown", onKey);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        ref={ref}
        tabIndex={-1}
      >
        <div className="section-heading">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
const AVATARS = ["🦊", "🐸", "🐼", "🐯", "🐧", "🐨", "🐙", "🦁", "🐰", "🐵"];
export function Avatar({ index = 0, small = false }) {
  return (
    <span
      className={`avatar ${small ? "small" : ""} avatar-${index % 5}`}
      aria-hidden="true"
    >
      {AVATARS[index % AVATARS.length]}
    </span>
  );
}
export function Scoreboard({
  players,
  playerId,
  hostId,
  answererId,
  onKick,
  compact = false,
}) {
  const sorted = [...players].sort(
    (a, b) =>
      b.score - a.score || new Date(a.joined_at) - new Date(b.joined_at),
  );
  return (
    <ol className={`scoreboard ${compact ? "compact" : ""}`}>
      {sorted.map((p, i) => (
        <li key={p.user_id} className={p.user_id === playerId ? "is-you" : ""}>
          <span className="score-rank">{i + 1}</span>
          <Avatar
            index={players.findIndex((x) => x.user_id === p.user_id)}
            small
          />
          <div className="player-name">
            <strong title={p.nickname}>{p.nickname}</strong>
            <small>
              {p.user_id === answererId
                ? "Answerer"
                : p.user_id === hostId
                  ? "Host"
                  : p.user_id === playerId
                    ? "You"
                    : "Guessing"}
            </small>
          </div>
          <b className="score-points">
            <AnimatedNumber value={p.score} />
            <small>pts</small>
          </b>
          {onKick && p.user_id !== playerId && (
            <button
              className="kick-button"
              aria-label={`Remove ${p.nickname}`}
              onClick={() => onKick(p)}
            >
              <Icon name="close" size={15} />
            </button>
          )}
        </li>
      ))}
    </ol>
  );
}
export function RunTrack({ history, index, total = 10 }) {
  return (
    <div
      className="run-track"
      aria-label={`Round ${Math.min(index + 1, total)} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            history[i]
              ? history[i].correct
                ? "solved"
                : "missed"
              : i === index
                ? "current"
                : ""
          }
        >
          {history[i] ? (
            <Icon name={history[i].correct ? "check" : "close"} size={14} />
          ) : (
            i + 1
          )}
        </span>
      ))}
    </div>
  );
}
