"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { SOLO_QUESTION_POOLS } from "./soloQuestionBank";
import {
  createRun,
  DIFFICULTIES,
  makeDeck,
  soloReducer,
  utcDay,
} from "../lib/solo-engine";
import { BADGES, levelInfo } from "../lib/progress";
import {
  AnimatedNumber,
  Confetti,
  Icon,
  Milo,
  Modal,
  RunTrack,
} from "./GameUI";
import { useAudio } from "./AudioProvider";

export default function SoloGame({
  mode,
  resume,
  profile,
  onProgress,
  onOnboard,
  onHome,
  onReplay,
}) {
  const [run, dispatch] = useReducer(soloReducer, resume || null);
  const [intro, setIntro] = useState(!resume && !profile.onboarding),
    [guess, setGuess] = useState(""),
    [now, setNow] = useState(Date.now()),
    [exit, setExit] = useState(false),
    [copied, setCopied] = useState(false);
  const input = useRef(null),
    started = useRef(false),
    previous = useRef(null),
    initialProfile = useRef(profile),
    lastTick = useRef(-1);
  const { play, unlock } = useAudio();
  function begin() {
    if (started.current) return;
    started.current = true;
    const time = Date.now(),
      id = crypto.randomUUID(),
      tutorial = !profile.onboarding && mode === "easy";
    const deck = makeDeck(
      SOLO_QUESTION_POOLS,
      mode,
      mode === "daily" ? `friendguess-v1:${utcDay()}` : id,
      tutorial,
    );
    dispatch({ type: "start", run: createRun(deck, mode, time, id) });
    setIntro(false);
    setNow(time);
    onOnboard();
    play("round");
  }
  useEffect(() => {
    if (!run && !intro) begin();
  }, []); // One run per mounted launch; Strict Mode is guarded.
  useEffect(() => {
    if (!run) return;
    onProgress(run);
  }, [run, onProgress]);
  useEffect(() => {
    if (run?.phase !== "playing") return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      dispatch({ type: "tick", now: t });
    };
    tick();
    const timer = setInterval(tick, 200);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [run?.phase, run?.index]);
  useEffect(() => {
    if (!run) return;
    const p = previous.current;
    if (p?.index !== run.index) {
      play("round");
      setGuess("");
      lastTick.current = -1;
    }
    if (p?.phase !== run.phase && run.phase === "result")
      play(run.result.correct ? "correct" : "wrong");
    if (p?.phase !== run.phase && run.phase === "finished") play("win");
    if (p?.round?.revealed < run.round.revealed && run.phase === "playing")
      play("hint");
    if (p?.feedback?.at !== run.feedback?.at && run.feedback)
      play(
        run.feedback.kind === "close"
          ? "close"
          : run.feedback.kind === "wrong"
            ? "wrong"
            : "click",
      );
    previous.current = run;
  }, [run, play]);
  useEffect(() => {
    if (
      run?.phase === "playing" &&
      window.matchMedia("(min-width: 760px)").matches
    )
      input.current?.focus({ preventScroll: true });
  }, [run?.phase, run?.index]);
  const timeLeft = run
    ? Math.max(0, Math.ceil((run.round.deadline - now) / 1000))
    : 0;
  useEffect(() => {
    if (
      run?.phase === "playing" &&
      timeLeft > 0 &&
      timeLeft <= 5 &&
      lastTick.current !== timeLeft
    ) {
      lastTick.current = timeLeft;
      play("tick");
    }
  }, [run?.phase, timeLeft, play]);

  if (intro)
    return (
      <main className="intro-stage enter">
        <div className="intro-art">
          <Milo priority />
          <span className="speech-bubble">I’ve got something in mind.</span>
        </div>
        <span className="eyebrow">MEET MILO. YOUR CLUE-GIVING FOX.</span>
        <h1>Let’s read a little mind.</h1>
        <div className="intro-steps">
          <p>
            <span>1</span>Milo picks a secret answer.
          </p>
          <p>
            <span>2</span>Use the clues to figure it out.
          </p>
          <p>
            <span>3</span>Guess before time runs out.
          </p>
        </div>
        <button
          className="button button-lime"
          onClick={() => {
            unlock();
            begin();
          }}
        >
          Let’s play <Icon name="play" />
        </button>
        <small>More clues appear as you play. You’ve got this.</small>
      </main>
    );
  if (!run)
    return (
      <div className="loading-stage">
        <div className="loading-orbit" />
      </div>
    );
  const round = run.round,
    q = round.question,
    config = round.config;
  const correct = run.history.filter((r) => r.correct).length;
  const attemptsLeft = config.guesses - round.guesses.length;
  const elapsed = Math.max(0, (now - round.startedAt) / 1000);
  const nextHint =
    round.revealed < 5
      ? Math.max(0, Math.ceil(config.timeline[round.revealed] - elapsed))
      : 0;
  const currentStreak = run.streak;
  function submit(e) {
    e.preventDefault();
    if (!guess.trim() || run.phase !== "playing") return;
    unlock();
    dispatch({ type: "guess", guess, now: Date.now() });
    setGuess("");
    input.current?.focus({ preventScroll: true });
  }
  function next() {
    dispatch({ type: "next", now: Date.now() });
    setNow(Date.now());
  }
  async function share() {
    const text = `FriendGuess ${mode === "daily" ? `Daily · ${run.date}` : DIFFICULTIES[mode].label}\n${run.history.map((r) => (r.correct ? "🟩" : "⬛")).join("")}\n${correct}/10 · ${run.score.toLocaleString()} points\n${window.location.origin}${window.location.pathname}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  const key = mode === "daily" ? `daily:${run.date}` : mode,
    newBest = run.score > (initialProfile.current.records[key] || 0);
  const gainedXp = run.history.reduce((s, r) => s + r.xp, 0),
    level = levelInfo(profile.xp),
    newBadges = BADGES.filter(
      (b) =>
        profile.badges.includes(b.id) &&
        !initialProfile.current.badges.includes(b.id),
    );
  return (
    <main className={`solo-view enter ${run.phase}`}>
      <div className="game-toolbar">
        <button
          className="text-button"
          onClick={() => (run.phase === "finished" ? onHome() : setExit(true))}
        >
          <Icon name="back" size={17} />
          <span>Home</span>
        </button>
        <span className="game-mode-label">
          {mode === "daily" ? (
            <>
              <Icon name="calendar" size={16} /> Daily · {run.date}
            </>
          ) : (
            <>
              SOLO WITH MILO{" "}
              <span className="pill tiny">{DIFFICULTIES[mode].label}</span>
            </>
          )}
        </span>
        <span className="toolbar-round">
          {run.phase === "finished"
            ? "Run complete"
            : `Round ${run.index + 1} / 10`}
        </span>
      </div>
      <div className="run-topline">
        <RunTrack history={run.history} index={run.index} />
        <div className="run-score">
          <Icon name="star" />
          <strong>
            <AnimatedNumber value={run.score} />
          </strong>
          <span>pts</span>
        </div>
      </div>
      {run.phase === "playing" && (
        <div className="solo-stage">
          <aside className="milo-panel">
            <div
              className="milo-speech"
              aria-live="polite"
              key={run.feedback?.at || run.index}
            >
              {run.feedback?.message ||
                (run.index === 0
                  ? "The clues are yours. The answer is mine."
                  : run.index === 4
                    ? "Picking up the pace. Ready?"
                    : run.index === 8
                      ? "Final stretch. Trust your instincts!"
                      : "I’ve picked another. What am I thinking?")}
            </div>
            <Milo
              pose={run.feedback?.kind === "wrong" ? "encourage" : "thinking"}
            />
            <div className="milo-caption">
              <strong>Milo</strong>
              <span>Your answerer</span>
            </div>
            <div className={`streak-box ${currentStreak >= 2 ? "hot" : ""}`}>
              <Icon name="flame" size={25} />
              <span>
                <strong>{currentStreak} in a row</strong>
                <small>
                  {currentStreak >= 2
                    ? "Keep that streak alive!"
                    : "One good guess starts a streak."}
                </small>
              </span>
            </div>
          </aside>
          <section className="question-panel panel" aria-label="Solo round">
            <div className="question-meta">
              <span className="pill violet">
                <Icon name="brain" size={16} />
                {q.category}
              </span>
              <div
                className={`round-timer ${timeLeft <= 10 ? "urgent" : ""}`}
                role="timer"
                aria-label={`${timeLeft} seconds remaining`}
              >
                <Icon name="clock" size={18} />
                <strong>{timeLeft}</strong>
                <span>s</span>
              </div>
            </div>
            <div className="timer-track">
              <i
                style={{ width: `${(timeLeft / config.seconds) * 100}%` }}
                className={timeLeft <= 10 ? "urgent" : ""}
              />
            </div>
            <div className="question-title">
              <span className="eyebrow">MILO HAS SOMETHING IN MIND</span>
              <h1>{q.question}</h1>
            </div>
            <div
              className="clue-stack"
              aria-live="polite"
              aria-relevant="additions"
            >
              {q.clues.slice(0, round.revealed).map((clue, i) => (
                <div
                  className={`clue-row ${i === round.revealed - 1 ? "fresh" : ""}`}
                  key={`${q.id}-${i}`}
                >
                  <span className="clue-number">{i + 1}</span>
                  <p>{clue}</p>
                  {i === round.revealed - 1 && i > 0 && (
                    <span className="clue-new">NEW</span>
                  )}
                </div>
              ))}
            </div>
            <div className="hint-controls">
              <div
                className="hint-dots"
                aria-label={`${round.revealed} of 5 clues revealed`}
              >
                {config.timeline.map((t, i) => (
                  <span
                    key={i}
                    className={i < round.revealed ? "revealed" : ""}
                  >
                    <Icon
                      name={i < round.revealed ? "check" : "lock"}
                      size={12}
                    />
                  </span>
                ))}
              </div>
              <span className="next-clue">
                {round.revealed < 5
                  ? `Next clue in ${nextHint}s`
                  : "All clues revealed"}
              </span>
              <button
                className="hint-button"
                onClick={() => dispatch({ type: "hint", now: Date.now() })}
                disabled={round.revealed >= 5 || timeLeft === 0}
              >
                <Icon name="hint" size={17} />
                <span>
                  Clue now<small>−60 pts</small>
                </span>
              </button>
            </div>
            <form className="solo-guess-form" onSubmit={submit}>
              <label htmlFor="solo-guess">Your guess</label>
              <div className="guess-input-row">
                <input
                  ref={input}
                  id="solo-guess"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  maxLength={40}
                  placeholder="I’m thinking…"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  enterKeyHint="send"
                  disabled={timeLeft === 0}
                />
                <button
                  className="button button-lime"
                  disabled={!guess.trim() || timeLeft === 0}
                  type="submit"
                >
                  Guess <Icon name="arrow" />
                </button>
              </div>
            </form>
            <div className="guess-meta">
              <div
                className="attempts"
                aria-label={`${attemptsLeft} guesses left`}
              >
                {Array.from({ length: config.guesses }, (_, i) => (
                  <i key={i} className={i < attemptsLeft ? "available" : ""} />
                ))}
                <span>{attemptsLeft} guesses left</span>
              </div>
              <span className="keyboard-hint">ENTER ↵</span>
            </div>
            {round.guesses.length > 0 && (
              <div className="guess-chips" aria-label="Previous guesses">
                {round.guesses.map((g, i) => (
                  <span key={i} className={g.kind === "close" ? "close" : ""}>
                    <Icon
                      name={g.kind === "close" ? "flame" : "close"}
                      size={13}
                    />
                    {g.text}
                    {g.kind === "close" && <small>Close spelling</small>}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
      {run.phase === "result" && (
        <section
          className={`round-result panel enter ${run.result.correct ? "success" : "miss"}`}
        >
          {run.result.correct && <Confetti />}
          <div className="result-art">
            <Milo pose={run.result.correct ? "celebrate" : "encourage"} />
          </div>
          <div className="result-content">
            <span className={`pill ${run.result.correct ? "lime" : "violet"}`}>
              <Icon name={run.result.correct ? "check" : "clock"} size={16} />
              {run.result.correct
                ? "MIND SUCCESSFULLY READ"
                : run.result.reason === "time"
                  ? "TIME’S UP"
                  : "OUT OF GUESSES"}
            </span>
            <h1>
              {run.result.correct
                ? run.streak >= 3
                  ? "You’re on fire!"
                  : "You got me!"
                : "A tricky one."}
            </h1>
            <p className="reveal-label">Milo was thinking of</p>
            <strong className="answer-reveal">
              {run.result.answer === "icecream"
                ? "ice cream"
                : run.result.answer}
            </strong>
            <p className="answer-context">{run.result.clue}</p>
            {run.result.correct ? (
              <>
                <div className="score-gain">
                  +<AnimatedNumber value={run.result.score.total} />
                  <span>points</span>
                </div>
                <div className="score-breakdown">
                  {run.result.score.lines.map((l) => (
                    <div key={l.label}>
                      <span>{l.label}</span>
                      <b>
                        {l.points > 0 ? "+" : ""}
                        {l.points}
                      </b>
                    </div>
                  ))}
                  {run.result.score.multiplier > 1 && (
                    <div className="multiplier">
                      <span>{DIFFICULTIES[q.difficulty].label} multiplier</span>
                      <b>×{run.result.score.multiplier}</b>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="encouragement">
                No points lost. A new answer is a fresh start.
              </p>
            )}
            <div className="xp-gain">
              <Icon name="star" size={16} />+{run.result.xp} XP
              <span>
                {run.streak > 1
                  ? `${run.streak}-round streak!`
                  : "A little sharper every round."}
              </span>
            </div>
            <button className="button button-lime full" onClick={next}>
              {run.index === 9 ? "See my results" : "Next round"}
              <Icon name="arrow" />
            </button>
          </div>
        </section>
      )}
      {run.phase === "finished" && (
        <section className="run-results panel enter">
          <Confetti />
          <div className="results-heading">
            <span className="results-trophy">
              <Icon name="trophy" size={36} />
            </span>
            <span className="eyebrow">TEN ANSWERS. ONE CLEVER HUMAN.</span>
            <h1>Run complete!</h1>
            <p>
              {correct >= 8
                ? "Milo might need a better poker face."
                : correct >= 5
                  ? "Those instincts are getting sharper."
                  : "Every clue is a little practice for the next one."}
            </p>
          </div>
          <div className="final-score">
            <AnimatedNumber value={run.score} />
            <span>points</span>
          </div>
          {newBest && (
            <span className="personal-best">
              <Icon name="sparkles" size={16} /> New personal best!
            </span>
          )}
          <div className="stats-grid">
            <div>
              <b>{correct}/10</b>
              <span>Correct</span>
            </div>
            <div>
              <b>{correct * 10}%</b>
              <span>Accuracy</span>
            </div>
            <div>
              <b>{run.bestStreak}</b>
              <span>Best streak</span>
            </div>
          </div>
          <div className="run-xp">
            <div>
              <strong>
                Level {level.level}
                {level.level > levelInfo(initialProfile.current.xp).level && (
                  <span className="pill tiny lime">LEVEL UP!</span>
                )}
              </strong>
              <span>+{gainedXp} XP this run</span>
            </div>
            <div className="xp-track">
              <i style={{ width: `${(level.current / level.next) * 100}%` }} />
            </div>
            <small>
              {level.current} / {level.next} XP to the next level
            </small>
          </div>
          {newBadges.length > 0 && (
            <div className="new-badges">
              {newBadges.map((b) => (
                <span key={b.id}>
                  <Icon name={b.icon} size={18} />
                  {b.name}
                  <small>Badge earned</small>
                </span>
              ))}
            </div>
          )}
          <div className="results-actions">
            <button
              className="button button-lime"
              onClick={() => onReplay(mode)}
            >
              <Icon name="refresh" />
              Play again
            </button>
            {mode !== "hard" && mode !== "daily" && (
              <button
                className="button button-violet"
                onClick={() => onReplay(mode === "easy" ? "medium" : "hard")}
              >
                Try {mode === "easy" ? "Medium" : "Hard"}
                <Icon name="bolt" />
              </button>
            )}
            {mode === "daily" && (
              <button className="button button-violet" onClick={share}>
                <Icon name="copy" />
                {copied ? "Copied!" : "Copy results"}
              </button>
            )}
          </div>
          <button className="text-button result-home" onClick={onHome}>
            <Icon name="home" size={17} />
            Back home
          </button>
          <details className="run-review">
            <summary>Look back at your 10 answers</summary>
            {run.history.map((r, i) => (
              <div key={`${r.id}-${i}`}>
                <span className={r.correct ? "text-lime" : "text-muted"}>
                  <Icon name={r.correct ? "check" : "close"} size={16} />
                  {i + 1}
                </span>
                <strong>{r.answer}</strong>
                <b>{r.score.total} pts</b>
              </div>
            ))}
          </details>
          {mode === "daily" && (
            <p className="fine-print">
              A new set arrives at 00:00 UTC. Replays use the same questions.
              Daily records are saved on this browser.
            </p>
          )}
        </section>
      )}
      {exit && (
        <Modal title="Take a breather?" onClose={() => setExit(false)}>
          <p>
            Your completed rounds and XP are saved. You can resume from home;
            the current round’s clock keeps running.
          </p>
          <button className="button button-lime full" onClick={onHome}>
            Save & go home
          </button>
          <button
            className="button button-ghost full"
            onClick={() => setExit(false)}
          >
            Keep guessing
          </button>
        </Modal>
      )}
    </main>
  );
}
