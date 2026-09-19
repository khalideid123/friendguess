import test from "node:test";
import assert from "node:assert/strict";
import { MILO_POSES, springStep } from "../lib/milo-animation.js";

test("Milo's gestures have the same timing at 30, 60 and 120 Hz", () => {
  const outcomes = [30, 60, 120].map((fps) => {
    let position = MILO_POSES.thinking.left,
      velocity = 0;
    for (let frame = 0; frame < fps; frame++) {
      const target =
        frame < fps / 2 ? MILO_POSES.hint.left : MILO_POSES.curious.left;
      [position, velocity] = springStep(position, velocity, target, 1 / fps);
    }
    return position;
  });
  assert.ok(Math.max(...outcomes) - Math.min(...outcomes) < 1e-8);
});

test("rapid guess reactions blend through the current pose without jumping", () => {
  const reactions = ["hint", "curious", "encourage", "thinking"];
  let position = MILO_POSES.thinking.left,
    velocity = 0;
  for (let frame = 0; frame < 240; frame++) {
    const target =
      MILO_POSES[reactions[Math.floor(frame / 30) % reactions.length]].left;
    const previous = position;
    [position, velocity] = springStep(position, velocity, target, 1 / 60);
    assert.ok(Number.isFinite(position) && Number.isFinite(velocity));
    assert.ok(
      Math.abs(position - previous) < 5,
      "a paw must not snap between gestures",
    );
  }
  for (let frame = 0; frame < 120; frame++) {
    [position, velocity] = springStep(
      position,
      velocity,
      MILO_POSES.thinking.left,
      1 / 60,
    );
  }
  assert.ok(Math.abs(position - MILO_POSES.thinking.left) < 0.01);
});
