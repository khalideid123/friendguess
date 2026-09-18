export const PROFILE_KEY = "friendguess-progress-v1";
export const RUN_KEY = "friendguess-run-v1";
export const EMPTY_PROFILE = {
  version: 1,
  xp: 0,
  rounds: 0,
  correct: 0,
  bestStreak: 0,
  runs: 0,
  records: {},
  badges: [],
  history: [],
  awardedRounds: [],
  completedRuns: [],
  theme: "arcade",
  onboarding: false,
};
export const BADGES = [
  {
    id: "first",
    name: "Mind reader",
    description: "Find your first answer",
    icon: "sparkles",
  },
  {
    id: "streak",
    name: "On a roll",
    description: "Solve 5 rounds in a row",
    icon: "flame",
  },
  {
    id: "speed",
    name: "Quick thinker",
    description: "Solve in under 10 seconds",
    icon: "bolt",
  },
  {
    id: "perfect",
    name: "Perfect ten",
    description: "Finish a run with 10 correct",
    icon: "trophy",
  },
  {
    id: "hard",
    name: "Big brain",
    description: "Solve a Hard round",
    icon: "brain",
  },
  {
    id: "daily",
    name: "Daily detective",
    description: "Complete a Daily Challenge",
    icon: "calendar",
  },
];
export function levelInfo(xp) {
  const level = Math.floor(xp / 600) + 1;
  return { level, current: xp % 600, next: 600 };
}
export function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
export function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function readProfile() {
  const p = safeRead(PROFILE_KEY, EMPTY_PROFILE);
  if (
    p.version !== 1 ||
    !Number.isFinite(p.xp) ||
    !Array.isArray(p.badges) ||
    !Array.isArray(p.history)
  )
    return { ...EMPTY_PROFILE };
  return { ...EMPTY_PROFILE, ...p };
}
export function applyProgress(profile, run) {
  const p = {
    ...profile,
    badges: [...profile.badges],
    awardedRounds: [...profile.awardedRounds],
    completedRuns: [...profile.completedRuns],
    records: { ...profile.records },
    history: [...profile.history],
  };
  const unlock = (id) => {
    if (!p.badges.includes(id)) p.badges.push(id);
  };
  run.history.forEach((r, i) => {
    const id = `${run.id}:${i}`;
    if (p.awardedRounds.includes(id)) return;
    p.awardedRounds.push(id);
    p.rounds++;
    p.correct += Number(r.correct);
    p.xp += r.xp;
    if (r.correct) unlock("first");
    if (r.correct && r.elapsed < 10) unlock("speed");
    if (r.correct && r.difficulty === "hard") unlock("hard");
  });
  p.bestStreak = Math.max(p.bestStreak, run.bestStreak);
  if (run.bestStreak >= 5) unlock("streak");
  if (run.phase === "finished" && !p.completedRuns.includes(run.id)) {
    p.completedRuns.push(run.id);
    p.runs++;
    const correct = run.history.filter((r) => r.correct).length;
    if (correct === 10) unlock("perfect");
    if (run.mode === "daily") unlock("daily");
    const key = run.mode === "daily" ? `daily:${run.date}` : run.mode;
    p.records[key] = Math.max(p.records[key] || 0, run.score);
    p.history.unshift({
      id: run.id,
      mode: run.mode,
      score: run.score,
      correct,
      date: run.date,
    });
    p.history = p.history.slice(0, 20);
    // Keep local save files small without pruning the current run's dedupe keys.
    p.awardedRounds = p.awardedRounds.slice(-300);
    p.completedRuns = p.completedRuns.slice(-30);
    p.records = Object.fromEntries(
      Object.entries(p.records).filter(
        ([k]) =>
          !k.startsWith("daily:") ||
          k.slice(6) >=
            new Date(Date.now() - 32 * 86400000).toISOString().slice(0, 10),
      ),
    );
  }
  return p;
}
