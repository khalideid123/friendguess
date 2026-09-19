"use client";

import Image from "next/image";
import { memo, useEffect, useRef, useState } from "react";
import { MILO_REACTION_MS, miloDescription, miloPose } from "../lib/milo-rig";
import { createMiloAnimator, loadMiloAssets } from "../lib/milo-animation";
import styles from "./Milo.module.css";

function Milo({
  pose = "hello",
  reaction = null,
  reactionKey = null,
  className = "",
  priority = false,
}) {
  const root = useRef(null);
  const canvas = useRef(null);
  const animator = useRef(null);
  const latest = useRef({ mood: pose, paused: false });
  const [canAnimate, setCanAnimate] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [activeReaction, setActiveReaction] = useState(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setCanAnimate(!preference.matches);
    const updateVisibility = () => setTabVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    preference.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = window.IntersectionObserver
      ? new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
      : null;
    if (root.current) observer?.observe(root.current);
    return () => {
      preference.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
      observer?.disconnect();
    };
  }, []);

  useEffect(() => {
    setActiveReaction(reaction);
    if (!reaction) return;
    const timer = setTimeout(() => setActiveReaction(null), MILO_REACTION_MS);
    return () => clearTimeout(timer);
  }, [reaction, reactionKey]);

  const mood = miloPose(pose, activeReaction);
  const paused = !visible || !tabVisible;
  useEffect(() => {
    latest.current = { mood, paused };
    animator.current?.setPose(mood);
    animator.current?.setPaused(paused);
  }, [mood, paused]);

  useEffect(() => {
    if (!canAnimate || failed) return;
    let cancelled = false;
    setReady(false);
    loadMiloAssets()
      .then((assets) => {
        if (cancelled || !canvas.current) return;
        animator.current = createMiloAnimator(
          canvas.current,
          assets,
          latest.current,
        );
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      animator.current?.destroy();
      animator.current = null;
    };
  }, [canAnimate, failed]);

  const animated = canAnimate && ready && !failed;
  const fallback = ["hello", "thinking", "celebrate", "encourage"].includes(
    mood,
  )
    ? mood
    : "thinking";
  return (
    <div
      ref={root}
      className={`milo milo-${pose} ${styles.character} ${className}`}
      role="img"
      aria-label={`Milo the fox, ${miloDescription(mood)}`}
      data-milo-pose={mood}
      data-animated={animated}
      data-paused={paused || !animated}
    >
      <Image
        className={styles.fallback}
        src={`./art/milo-${fallback}.webp`}
        alt=""
        aria-hidden="true"
        width={480}
        height={480}
        priority={priority}
        draggable={false}
      />
      {canAnimate && !failed && (
        <canvas
          ref={canvas}
          className={styles.canvas}
          width={480}
          height={480}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default memo(Milo);
