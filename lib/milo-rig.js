// Registration points in a 480 × 480 canvas. Joints overlap behind the
// head/body, so gestures never open seams. Asset sizes are intrinsic pixels.
export const MILO_PARTS = {
  body: { x: 167, y: 267, w: 174, h: 189, size: [300, 326] },
  face: { x: 112, y: 82, w: 266, h: 225, size: [360, 305] },
  blink: { x: 112, y: 82, w: 266, h: 225, size: [360, 305] },
  laugh: { x: 112, y: 78, w: 266, h: 238, size: [360, 322] },
  encourage: { x: 112, y: 78, w: 266, h: 238, size: [360, 322] },
  tail: { x: 280, y: 272, w: 152, h: 156, size: [260, 267] },
  "ear-left": { x: 129, y: 46, w: 114, h: 128, size: [160, 180] },
  "ear-right": { x: 265, y: 48, w: 114, h: 128, size: [160, 180] },
  wave: { x: 107, y: 237, w: 104, h: 107, size: [200, 205] },
};

export const MILO_REACTION_MS = 2200;

export function miloPose(pose, reaction) {
  if (reaction === "close") return "curious";
  if (reaction === "hint") return "hint";
  if (reaction === "wrong") return "encourage";
  return ["hello", "thinking", "celebrate", "encourage"].includes(pose)
    ? pose
    : "thinking";
}

export function miloDescription(pose) {
  return (
    {
      hello: "waving hello",
      thinking: "thinking and tapping his chin",
      curious: "perking up at your close guess",
      hint: "offering you a clue",
      celebrate: "celebrating with both paws",
      encourage: "giving you an encouraging nod",
    }[pose] || "thinking"
  );
}
