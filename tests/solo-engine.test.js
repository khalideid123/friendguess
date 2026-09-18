import test from "node:test";
import assert from "node:assert/strict";
import { SOLO_QUESTION_POOLS as pools } from "../components/soloQuestionBank.js";
import {
  createRun,
  makeDeck,
  normalize,
  assessGuess,
  soloReducer,
  scoreRound,
  roundConfig,
  utcDay,
} from "../lib/solo-engine.js";
import { EMPTY_PROFILE, applyProgress, levelInfo } from "../lib/progress.js";
const now = Date.UTC(2026, 8, 18, 12);
function fresh(mode = "easy", seed = "test") {
  return createRun(makeDeck(pools, mode, seed), mode, now, seed);
}
function answer(run, delay = 1000) {
  return soloReducer(run, {
    type: "guess",
    guess: run.round.question.answer,
    now: run.round.startedAt + delay,
  });
}

test("all 600 questions have useful semantic clues, spelling hints and valid unique IDs", () => {
  const ids = new Set();
  for (const [difficulty, pool] of Object.entries(pools)) {
    assert.equal(pool.length, 200);
    for (const q of pool) {
      assert.equal(q.difficulty, difficulty);
      assert(!ids.has(q.id));
      ids.add(q.id);
      assert.equal(q.clues.length, 5);
      assert(q.clues[0].length > 12 && q.clues[1].length > 15);
      assert(!q.clues[0].includes("starts with"));
      assert(!q.clues[1].includes("letters."));
      for (const accepted of q.answers)
        assert.equal(assessGuess(q, accepted), "correct");
      assert.equal(assessGuess(q, q.answer), "correct");
      assert.equal(assessGuess(q, "certainly not the answer xyz"), "wrong");
    }
  }
  assert.equal(ids.size, 600);
});
test("normalization is accent, case, space and punctuation tolerant", () => {
  assert.equal(normalize("  Café-AU lait! "), "cafeaulait");
  const ice = pools.easy.find((q) => q.id === "easy:icecream");
  assert.equal(assessGuess(ice, "ICE CREAM!"), "correct");
  assert.match(ice.clues[3], /8 letters across 2 words/);
});
test("near guesses help with spelling without accepting a wrong answer", () => {
  const q = pools.easy.find((q) => q.answer === "elephant");
  assert.equal(assessGuess(q, "elephent"), "close");
  assert.equal(assessGuess(q, "lion"), "wrong");
  assert.equal(
    assessGuess(
      pools.easy.find((q) => q.answer === "cat"),
      "car",
    ),
    "wrong",
  );
});
test("seeded daily deck is identical for everyone and ramps across three difficulties", () => {
  const a = makeDeck(pools, "daily", "friendguess-v1:2026-09-18"),
    b = makeDeck(pools, "daily", "friendguess-v1:2026-09-18");
  assert.deepEqual(a, b);
  assert.deepEqual(
    a.map((q) => q.difficulty),
    [
      "easy",
      "easy",
      "easy",
      "easy",
      "medium",
      "medium",
      "medium",
      "medium",
      "hard",
      "hard",
    ],
  );
  assert.notDeepEqual(a, makeDeck(pools, "daily", "friendguess-v1:2026-09-19"));
  assert.equal(utcDay(new Date("2026-09-19T00:01:00Z")), "2026-09-19");
});
test("each run contains ten distinct questions and tutorial opens with the readable elephant round", () => {
  for (const d of Object.keys(pools)) {
    const deck = makeDeck(pools, d, "unique");
    assert.equal(deck.length, 10);
    assert.equal(new Set(deck.map((q) => q.id)).size, 10);
  }
  assert.equal(makeDeck(pools, "easy", "tutorial", true)[0].answer, "elephant");
});
test("later rounds tighten the clock without changing selected difficulty", () => {
  for (const d of Object.keys(pools)) {
    const q = pools[d][0];
    assert.equal(roundConfig(q, 0).seconds - roundConfig(q, 8).seconds, 10);
    assert(roundConfig(q, 8).seconds >= 40);
  }
});
test("timed clues unlock at the exact boundary and tick is otherwise stable", () => {
  let r = fresh();
  const before = r;
  assert.equal(soloReducer(r, { type: "tick", now: now + 500 }), before);
  const time = r.round.config.timeline[1] * 1000;
  r = soloReducer(r, { type: "tick", now: now + time - 1 });
  assert.equal(r.round.revealed, 1);
  r = soloReducer(r, { type: "tick", now: now + time });
  assert.equal(r.round.revealed, 2);
});
test("early clue costs are counted once and never reveal beyond five", () => {
  let r = fresh();
  for (let i = 0; i < 9; i++)
    r = soloReducer(r, { type: "hint", now: now + 1000 });
  assert.equal(r.round.revealed, 5);
  assert.equal(r.round.earlyHints, 4);
  assert.equal(soloReducer(r, { type: "hint", now: now + 1001 }), r);
  const solved = answer(r, 2000);
  assert(
    solved.result.score.lines.some(
      (l) => l.label === "Early clues" && l.points === -240,
    ),
  );
});
test("wrong, repeated and blank guesses behave correctly", () => {
  let r = fresh();
  r = soloReducer(r, { type: "guess", guess: "wrong idea", now: now + 1000 });
  assert.equal(r.round.guesses.length, 1);
  assert.equal(r.feedback.kind, "wrong");
  r = soloReducer(r, {
    type: "guess",
    guess: " WRONG IDEA! ",
    now: now + 2000,
  });
  assert.equal(r.round.guesses.length, 1);
  assert.equal(r.feedback.kind, "duplicate");
  const prev = r;
  assert.equal(
    soloReducer(r, { type: "guess", guess: "  !!!", now: now + 2001 }),
    prev,
  );
});
test("running out of guesses ends round exactly once", () => {
  let r = fresh();
  for (let i = 0; i < r.round.config.guesses; i++)
    r = soloReducer(r, {
      type: "guess",
      guess: `nope ${i}`,
      now: now + 1000 + i,
    });
  assert.equal(r.phase, "result");
  assert.equal(r.result.reason, "guesses");
  assert.equal(r.history.length, 1);
  assert.equal(r.result.score.total, 0);
  assert.equal(answer(r), r);
});
test("timer expiry defeats a correct guess submitted at or after deadline", () => {
  let r = fresh();
  r = soloReducer(r, {
    type: "guess",
    guess: r.round.question.answer,
    now: r.round.deadline,
  });
  assert.equal(r.result.correct, false);
  assert.equal(r.result.reason, "time");
  assert.equal(r.history.length, 1);
});
test("restored stale runs expire using real elapsed time", () => {
  let r = JSON.parse(JSON.stringify(fresh()));
  r = soloReducer(r, { type: "tick", now: now + 3600000 });
  assert.equal(r.result.reason, "time");
  assert.equal(r.result.score.total, 0);
});
test("speed, clue restraint, first guess, streak and difficulty reward better play", () => {
  const config = {
    secondsLeft: 60,
    seconds: 65,
    hints: 1,
    earlyHints: 0,
    attempts: 1,
    streak: 1,
    multiplier: 1,
  };
  const score = scoreRound(config).total;
  assert(score > scoreRound({ ...config, secondsLeft: 10 }).total);
  assert(score > scoreRound({ ...config, hints: 4 }).total);
  assert(score > scoreRound({ ...config, attempts: 3 }).total);
  assert(score < scoreRound({ ...config, streak: 5 }).total);
  assert.equal(
    scoreRound({ ...config, multiplier: 1.8 }).total,
    Math.round(score * 1.8),
  );
});
test("perfect runs complete in Easy, Medium, Hard and Daily; XP is idempotent", () => {
  for (const mode of ["easy", "medium", "hard", "daily"]) {
    let r = fresh(mode, mode);
    let p = { ...EMPTY_PROFILE };
    for (let i = 0; i < 10; i++) {
      r = answer(r);
      p = applyProgress(p, r);
      assert.equal(r.phase, "result");
      assert.equal(r.history.length, i + 1);
      r = soloReducer(r, { type: "next", now: now + (i + 1) * 100000 });
    }
    assert.equal(r.phase, "finished");
    assert.equal(r.streak, 10);
    assert.equal(r.bestStreak, 10);
    p = applyProgress(p, r);
    assert.equal(p.runs, 1);
    assert.equal(p.rounds, 10);
    assert.equal(p.correct, 10);
    assert(p.badges.includes("perfect"));
    assert(p.badges.includes("streak"));
    const again = applyProgress(p, r);
    assert.deepEqual(again, p);
    assert(p.xp > 1000);
    assert(levelInfo(p.xp).level >= 3);
  }
});
test("a failed round resets current streak but preserves the best streak", () => {
  let r = fresh();
  r = answer(r);
  r = soloReducer(r, { type: "next", now: now + 100000 });
  r = answer(r);
  r = soloReducer(r, { type: "next", now: now + 200000 });
  r = soloReducer(r, { type: "tick", now: r.round.deadline });
  assert.equal(r.streak, 0);
  assert.equal(r.bestStreak, 2);
});
test("score is nonnegative and failures keep previously earned points", () => {
  let r = fresh();
  r = answer(r);
  const score = r.score;
  r = soloReducer(r, { type: "next", now: now + 100000 });
  r = soloReducer(r, { type: "tick", now: r.round.deadline });
  assert.equal(r.score, score);
  assert.equal(r.history[1].xp, 25);
});
