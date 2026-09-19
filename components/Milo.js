"use client";

import Image from "next/image";
import { memo } from "react";

function Milo({
  pose = "hello",
  reaction = null,
  className = "",
  priority = false,
}) {
  const staticPose =
    reaction === "wrong"
      ? "encourage"
      : ["hello", "thinking", "celebrate", "encourage"].includes(pose)
        ? pose
        : "thinking";

  const description =
    staticPose === "celebrate"
      ? "celebrating"
      : staticPose === "thinking"
        ? "thinking"
        : staticPose === "encourage"
          ? "encouraging you"
          : "waving hello";

  return (
    <div
      className={`milo milo-${staticPose} ${className}`}
      role="img"
      aria-label={`Milo the fox, ${description}`}
    >
      <Image
        src={`./art/milo-${staticPose}.webp`}
        alt=""
        aria-hidden="true"
        width={480}
        height={480}
        priority={priority}
        draggable={false}
      />
    </div>
  );
}

export default memo(Milo);
