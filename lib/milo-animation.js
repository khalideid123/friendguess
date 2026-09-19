import { MILO_PARTS } from "./milo-rig.js";

// One clock and stable shoulder joints. Reactions retain velocity, so a new
// guess never restarts a collection of independent animations.
export const MILO_ASSETS = [
  "body",
  "face",
  "blink",
  "laugh",
  "encourage",
  "tail",
  "ear-left",
  "ear-right",
  "wave",
];
export const MILO_POSES = {
  hello: {
    left: 0,
    right: -85,
    head: 0,
    ears: 0,
    happy: 0,
    kind: 0,
    greeting: 1,
    pondering: 0,
    clue: 0,
  },
  thinking: {
    left: 87,
    right: -85,
    head: -3,
    ears: 0,
    happy: 0,
    kind: 0,
    greeting: 0,
    pondering: 1,
    clue: 0,
  },
  curious: {
    left: 78,
    right: -65,
    head: -6,
    ears: -4,
    happy: 0,
    kind: 0,
    greeting: 0,
    pondering: 0,
    clue: 0,
  },
  hint: {
    left: 24,
    right: -75,
    head: 2,
    ears: -2,
    happy: 0,
    kind: 0,
    greeting: 0,
    pondering: 0,
    clue: 1,
  },
  encourage: {
    left: 68,
    right: -70,
    head: 3,
    ears: 2,
    happy: 0,
    kind: 1,
    greeting: 0,
    pondering: 0,
    clue: 0,
  },
  celebrate: {
    left: 0,
    right: 0,
    head: 0,
    ears: -2,
    happy: 1,
    kind: 0,
    greeting: 0,
    pondering: 0,
    clue: 0,
  },
};
const TAU = Math.PI * 2;
const radians = (degrees) => (degrees * Math.PI) / 180;
const ease = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

// Exact critically damped spring step, stable at different refresh rates and
// when a gesture is interrupted. No position or velocity reset at a pose change.
export function springStep(value, velocity, target, dt, speed = 11) {
  const offset = value - target;
  const decay = Math.exp(-speed * dt);
  const step = (velocity + speed * offset) * dt;
  return [target + (offset + step) * decay, (velocity - speed * step) * decay];
}

let assetPromise;
export function loadMiloAssets() {
  if (!assetPromise) {
    assetPromise = Promise.all(
      MILO_ASSETS.map(
        (name) =>
          new Promise((resolve, reject) => {
            const image = new window.Image();
            image.onload = () => resolve([name, image]);
            image.onerror = () =>
              reject(new Error(`Milo asset failed: ${name}`));
            image.src = `./art/milo-rig/${name}.webp`;
          }),
      ),
    )
      .then(Object.fromEntries)
      .then((assets) =>
        prepareMiloAssets(assets, () => document.createElement("canvas")),
      )
      .catch((error) => {
        assetPromise = null;
        throw error;
      });
  }
  return assetPromise;
}

// Prepare feathered expression overlays once, outside the animation loop.
// Facial changes cannot expose a hard mask edge or alter the head outline.
export function prepareMiloAssets(assets, createSurface) {
  const result = { ...assets };
  for (const name of ["laugh", "encourage"]) {
    const layer = createSurface();
    layer.width = layer.height = 480;
    const ctx = layer.getContext("2d");
    const p = MILO_PARTS[name];
    ctx.drawImage(assets[name], p.x, p.y, p.w, p.h);
    ctx.globalCompositeOperation = "destination-in";
    const horizontal = ctx.createLinearGradient(140, 0, 353, 0);
    horizontal.addColorStop(0, "#ffffff00");
    horizontal.addColorStop(0.1, "#fff");
    horizontal.addColorStop(0.9, "#fff");
    horizontal.addColorStop(1, "#ffffff00");
    ctx.fillStyle = horizontal;
    ctx.fillRect(0, 0, 480, 480);
    const vertical = ctx.createLinearGradient(122, 125, 122, 299);
    vertical.addColorStop(0, "#ffffff00");
    vertical.addColorStop(0.1, "#fff");
    vertical.addColorStop(0.9, "#fff");
    vertical.addColorStop(1, "#ffffff00");
    ctx.fillStyle = vertical;
    ctx.fillRect(0, 0, 480, 480);
    result[`${name}-overlay`] = layer;
  }
  return result;
}

function pivot(ctx, x, y, angle, draw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(radians(angle));
  ctx.translate(-x, -y);
  draw();
  ctx.restore();
}

function blinkAt(time) {
  const phase = time % 5.7;
  return ease((phase - 3.7) / 0.095) * (1 - ease((phase - 3.83) / 0.17));
}

export function drawMilo(ctx, assets, state, time) {
  const part = (name) => {
    const p = MILO_PARTS[name];
    ctx.drawImage(assets[name], p.x, p.y, p.w, p.h);
  };
  const breath = Math.sin((time * TAU) / 4.8);
  const waveCycle = time % 6.8;
  const waveWindow =
    ease(waveCycle / 0.4) * (1 - ease((waveCycle - 1.85) / 0.5));
  const helloWave =
    Math.sin((waveCycle * TAU) / 0.85) * 11 * waveWindow * state.greeting;
  const cheer = Math.sin((time * TAU) / 1.4) * 9 * state.happy;

  pivot(ctx, 311, 404, Math.sin((time * TAU) / 3.4) * 4 + cheer * 0.5, () =>
    part("tail"),
  );
  ctx.save();
  ctx.translate(254, 454);
  ctx.scale(1 + breath * 0.002, 1 + breath * 0.003);
  ctx.translate(-254, -454);
  part("body");
  ctx.restore();

  const nod = Math.sin((time * TAU) / 2.8) * 1.5 * state.kind;
  const head =
    state.head + Math.sin((time * TAU) / 6.8) * 1.2 + cheer * 0.2 + nod;
  pivot(ctx, 248, 292, head, () => {
    const earPhase = time % 9.2;
    const flick =
      Math.sin(Math.max(0, Math.min(1, (earPhase - 6.5) / 0.65)) * Math.PI) * 3;
    pivot(ctx, 219, 160, state.ears + flick, () => part("ear-left"));
    pivot(ctx, 290, 164, -state.ears - flick * 0.45, () => part("ear-right"));
    part("face");

    // The outline stays fixed. Expressions blend inside the face, rather than
    // replacing the entire head with a slightly different drawing.
    for (const [name, alpha] of [
      ["encourage", state.kind],
      ["laugh", state.happy],
    ]) {
      if (alpha < 0.002) continue;
      ctx.save();
      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));
      ctx.drawImage(assets[`${name}-overlay`], 0, 0);
      ctx.restore();
    }

    const blink = blinkAt(time) * (1 - Math.max(state.happy, state.kind));
    if (blink > 0.001) {
      const f = MILO_PARTS.face;
      const scaleX = f.w / 360,
        scaleY = f.h / 305;
      for (const [sx, sy, sw, sh] of [
        [60, 125, 83, 97],
        [193, 137, 94, 93],
      ]) {
        const x = f.x + sx * scaleX,
          y = f.y + sy * scaleY;
        const w = sw * scaleX,
          h = sh * scaleY;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * 0.62, h * 0.59, 0, 0, TAU);
        ctx.clip();
        part("blink");
        const openHeight = h * (1 - blink);
        if (openHeight > 0.1) {
          ctx.beginPath();
          ctx.ellipse(
            x + w / 2,
            y + h / 2,
            w * 0.62,
            openHeight * 0.59,
            0,
            0,
            TAU,
          );
          ctx.clip();
          part("face");
        }
        ctx.restore();
      }
    }
  });

  // The same connected bent arm is used in every pose. Both pivots sit inside
  // the torso, so raising a paw never swaps or detaches a limb.
  const paw = MILO_PARTS.wave;
  const jointX = paw.x + paw.w * 0.82,
    jointY = paw.y + paw.h * 0.86;
  const ponder = Math.sin((time * TAU) / 3.2) * 1.8 * state.pondering;
  const clue = Math.sin((time * TAU) / 2.3) * 3 * state.clue;
  pivot(
    ctx,
    jointX,
    jointY,
    state.left + helloWave + cheer + ponder + clue,
    () => part("wave"),
  );
  ctx.save();
  ctx.translate(489.6, 0);
  ctx.scale(-1, 1);
  pivot(ctx, jointX, jointY, state.right - cheer + breath * 0.7, () =>
    part("wave"),
  );
  ctx.restore();
}

export function createMiloAnimator(
  canvas,
  assets,
  { mood = "hello", paused = false } = {},
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  let target = MILO_POSES[mood] || MILO_POSES.thinking;
  const state = { ...target };
  const keys = Object.keys(state);
  const velocity = Object.fromEntries(keys.map((key) => [key, 0]));
  let frame = 0,
    previous = null,
    time = 0,
    destroyed = false;

  function paint() {
    const scale = canvas.width / 480;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawMilo(ctx, assets, state, time);
  }
  function resize() {
    const width = canvas.getBoundingClientRect().width;
    const resolution = Math.max(
      1,
      Math.round(width * Math.min(window.devicePixelRatio || 1, 2)),
    );
    if (canvas.width !== resolution) canvas.width = canvas.height = resolution;
    paint();
  }
  function tick(now) {
    if (destroyed || paused) return;
    const dt = previous === null ? 0 : Math.min((now - previous) / 1000, 0.05);
    previous = now;
    time += dt;
    for (const key of keys) {
      [state[key], velocity[key]] = springStep(
        state[key],
        velocity[key],
        target[key],
        dt,
      );
    }
    paint();
    frame = requestAnimationFrame(tick);
  }
  const observer = window.ResizeObserver ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  resize();
  if (!paused) frame = requestAnimationFrame(tick);
  return {
    setPose(next) {
      target = MILO_POSES[next] || MILO_POSES.thinking;
    },
    setPaused(next) {
      if (next === paused || destroyed) return;
      paused = next;
      cancelAnimationFrame(frame);
      previous = null;
      if (!paused) frame = requestAnimationFrame(tick);
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
    },
  };
}
