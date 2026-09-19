"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MILO_PART_NAMES,
  MILO_PARTS,
  MILO_REACTION_MS,
  miloDescription,
  miloPose,
  partPlacement,
} from "../lib/milo-rig";
import styles from "./Milo.module.css";

function Part({ name, className = "", onLoad, onError }) {
  const { size } = MILO_PARTS[name];
  return (
    <span
      className={`${styles.part} ${className}`}
      style={partPlacement(name)}
      data-milo-part={name}
    >
      <Image
        src={`./art/milo-rig/${name}.webp`}
        width={size[0]}
        height={size[1]}
        alt=""
        loading="eager"
        draggable={false}
        onLoad={() => onLoad(name)}
        onError={onError}
      />
    </span>
  );
}

// Transform/opacity-only cutout animation. No per-frame React updates or
// animation runtime. Static art is the loading/reduced-motion/error fallback.
export default function Milo({
  pose = "hello",
  reaction = null,
  reactionKey = null,
  className = "",
  priority = false,
}) {
  const root = useRef(null);
  const loaded = useRef(new Set());
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

  const onLoad = useCallback((name) => {
    loaded.current.add(name);
    if (loaded.current.size === MILO_PART_NAMES.length) setReady(true);
  }, []);
  const onError = useCallback(() => setFailed(true), []);
  const partProps = { onLoad, onError };
  const mood = miloPose(pose, activeReaction);
  const animated = canAnimate && ready && !failed;
  const fallback = ["hello", "thinking", "celebrate", "encourage"].includes(pose)
    ? pose
    : "thinking";

  return (
    <div
      ref={root}
      className={`milo milo-${pose} ${styles.character} ${className}`}
      role="img"
      aria-label={`Milo the fox, ${miloDescription(mood)}`}
      data-milo-pose={mood}
      data-animated={animated}
      data-paused={!visible || !tabVisible || !animated}
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
        <div className={styles.rig} aria-hidden="true">
          <Part name="tail" className={styles.tail} {...partProps} />
          <Part name="body" className={styles.body} {...partProps} />
          <div className={styles.head}>
            <Part name="ear-left" className={styles.earLeft} {...partProps} />
            <Part name="ear-right" className={styles.earRight} {...partProps} />
            <div className={styles.eyes}>
              <Part name="face" className={styles.face} {...partProps} />
              <Part name="encourage" className={styles.encourage} {...partProps} />
            </div>
            <Part name="blink" className={styles.blink} {...partProps} />
            <Part name="laugh" className={styles.laugh} {...partProps} />
          </div>
          <Part name="arm-left" className={styles.armLeft} {...partProps} />
          <Part name="arm-right" className={styles.armRight} {...partProps} />
          <Part name="wave" className={styles.wave} {...partProps} />
          <Part name="think" className={styles.think} {...partProps} />
        </div>
      )}
    </div>
  );
}
