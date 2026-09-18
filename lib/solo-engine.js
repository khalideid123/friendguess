export const RUN_LENGTH = 10;
export const DIFFICULTIES = {
  easy: {
    label: "Easy",
    description: "Everyday things. A little breathing room.",
    seconds: 65,
    guesses: 7,
    multiplier: 1,
  },
  medium: {
    label: "Medium",
    description: "Bigger ideas. Sharper instincts.",
    seconds: 60,
    guesses: 6,
    multiplier: 1.4,
  },
  hard: {
    label: "Hard",
    description: "Deep cuts for curious minds.",
    seconds: 55,
    guesses: 5,
    multiplier: 1.8,
  },
};

export function normalize(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function seededRandom(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random = Math.random) {
  const deck = [...items];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function makeDeck(pools, difficulty, seed, tutorial = false) {
  const random = seededRandom(seed);
  if (difficulty === "daily") {
    return [
      ...shuffle(pools.easy, random).slice(0, 4),
      ...shuffle(pools.medium, random).slice(0, 4),
      ...shuffle(pools.hard, random).slice(0, 2),
    ];
  }
  const deck = shuffle(pools[difficulty], random).slice(0, RUN_LENGTH);
  if (tutorial) {
    const first = pools.easy.find((q) => q.answer === "elephant");
    return [first, ...deck.filter((q) => q.id !== first.id)].slice(
      0,
      RUN_LENGTH,
    );
  }
  return deck;
}

export function roundConfig(question, index) {
  const base = DIFFICULTIES[question.difficulty];
  const seconds = base.seconds - Math.floor(index / 4) * 5;
  return {
    ...base,
    seconds,
    timeline: [0, 0.18, 0.36, 0.55, 0.75].map((f) => Math.round(f * seconds)),
  };
}

export function revealedCount(round, now) {
  const elapsed = Math.max(0, (now - round.startedAt) / 1000);
  return Math.max(
    round.revealed,
    round.config.timeline.filter((t) => elapsed >= t).length,
  );
}

function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return row[b.length];
}

export function assessGuess(question, input) {
  const guess = normalize(input);
  const answers = question.answers.map(normalize);
  if (answers.includes(guess)) return "correct";
  if (
    guess.length >= 4 &&
    answers.some((a) => distance(a, guess) <= (a.length >= 9 ? 2 : 1))
  )
    return "close";
  return "wrong";
}

export function scoreRound({
  secondsLeft,
  seconds,
  hints,
  earlyHints,
  attempts,
  streak,
  multiplier,
}) {
  const lines = [
    { label: "Answer found", points: 400 },
    {
      label: "Speed bonus",
      points: Math.round((300 * Math.max(0, secondsLeft)) / seconds),
    },
    {
      label: hints === 1 ? "No extra clues" : "Clue bonus",
      points: Math.max(0, 300 - (hints - 1) * 60),
    },
    { label: "First guess", points: attempts === 1 ? 100 : 0 },
    {
      label: `Streak ×${streak}`,
      points: Math.min(200, Math.max(0, streak - 1) * 40),
    },
    { label: "Early clues", points: -60 * earlyHints },
  ].filter((line) => line.points !== 0);
  return {
    lines,
    multiplier,
    total: Math.max(
      100,
      Math.round(lines.reduce((s, l) => s + l.points, 0) * multiplier),
    ),
  };
}

function beginRound(run, index, now) {
  const question = run.deck[index];
  const config = roundConfig(question, index);
  return {
    ...run,
    index,
    phase: "playing",
    feedback: null,
    round: {
      question,
      config,
      startedAt: now,
      deadline: now + config.seconds * 1000,
      guesses: [],
      revealed: 1,
      earlyHints: 0,
    },
  };
}

export function createRun(deck, mode, now, id) {
  return beginRound(
    {
      id,
      mode,
      deck,
      index: 0,
      history: [],
      score: 0,
      streak: 0,
      bestStreak: 0,
      phase: "playing",
      date: utcDay(new Date(now)),
    },
    0,
    now,
  );
}

function finishRound(run, correct, reason, now, guesses = run.round.guesses) {
  const { round } = run;
  const streak = correct ? run.streak + 1 : 0;
  const hints = revealedCount(round, now);
  const secondsLeft = Math.max(0, (round.deadline - now) / 1000);
  const score = correct
    ? scoreRound({
        secondsLeft,
        seconds: round.config.seconds,
        hints,
        earlyHints: round.earlyHints,
        attempts: guesses.length,
        streak,
        multiplier: round.config.multiplier,
      })
    : { lines: [], multiplier: 1, total: 0 };
  const result = {
    id: round.question.id,
    question: round.question.question,
    answer: round.question.answer,
    clue: round.question.clues[1],
    difficulty: round.question.difficulty,
    correct,
    reason,
    guesses: guesses.length,
    hints,
    elapsed: round.config.seconds - secondsLeft,
    score,
    xp: correct ? 100 + Math.round(score.total / 20) : 25,
  };
  return {
    ...run,
    phase: "result",
    round: { ...round, guesses, revealed: hints },
    result,
    history: [...run.history, result],
    score: run.score + score.total,
    streak,
    bestStreak: Math.max(run.bestStreak, streak),
    feedback: null,
  };
}

// All time-sensitive actions compare against the real deadline, including a
// submission racing a timer tick. Reducer purity makes duplicate events safe.
export function soloReducer(run, action) {
  if (action.type === "restore" || action.type === "start") return action.run;
  if (!run) return run;
  if (action.type === "next" && run.phase === "result") {
    return run.index + 1 === run.deck.length
      ? { ...run, phase: "finished" }
      : beginRound(run, run.index + 1, action.now);
  }
  if (run.phase !== "playing") return run;
  const now = action.now;
  if (now >= run.round.deadline) return finishRound(run, false, "time", now);
  if (action.type === "tick") {
    const revealed = revealedCount(run.round, now);
    return revealed === run.round.revealed
      ? run
      : { ...run, round: { ...run.round, revealed } };
  }
  if (action.type === "hint") {
    const revealed = revealedCount(run.round, now);
    if (revealed >= 5) return run;
    return {
      ...run,
      round: {
        ...run.round,
        revealed: revealed + 1,
        earlyHints: run.round.earlyHints + 1,
      },
      feedback: {
        kind: "hint",
        message: "A little nudge. You've got this.",
        at: now,
      },
    };
  }
  if (action.type === "guess") {
    const input = String(action.guess || "")
      .trim()
      .slice(0, 40);
    if (!normalize(input)) return run;
    if (run.round.guesses.some((g) => normalize(g.text) === normalize(input))) {
      return {
        ...run,
        feedback: {
          kind: "duplicate",
          message: "Already tried that. Try a new idea!",
          at: now,
        },
      };
    }
    const kind = assessGuess(run.round.question, input);
    const guesses = [...run.round.guesses, { text: input, kind }];
    if (kind === "correct")
      return finishRound(run, true, "correct", now, guesses);
    if (guesses.length >= run.round.config.guesses)
      return finishRound(run, false, "guesses", now, guesses);
    return {
      ...run,
      round: { ...run.round, guesses },
      feedback: {
        kind,
        message:
          kind === "close"
            ? "That spelling is close. Take another look!"
            : [
                "Not my answer. Follow the clues!",
                "Keep going. The next clue might help.",
                "Hmm, think in a different direction.",
              ][guesses.length % 3],
        at: now,
      },
    };
  }
  return run;
}
