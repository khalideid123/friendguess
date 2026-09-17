"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SoloMultiplayerMode.module.css";
import { SOLO_QUESTION_POOLS } from "./soloQuestionBank";

const BOT = { id: "bot-milo", nickname: "Milo", avatar: "🦊" };

const DIFFICULTIES = {
  easy: {
    label: "Easy",
    description: "Familiar answers with very clear hints",
    seconds: 60,
    attempts: 6,
  },
  medium: {
    label: "Medium",
    description: "Moderate answers with balanced hints",
    seconds: 50,
    attempts: 5,
  },
  hard: {
    label: "Hard",
    description: "Challenging answers with less obvious hints",
    seconds: 40,
    attempts: 4,
  },
};

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function makeFeedLine(text, type = "guess") {
  return { id: `${Date.now()}-${Math.random()}`, text, type };
}

export default function SoloMultiplayerModeV4() {
  const [homeTarget, setHomeTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [playerName, setPlayerName] = useState("Player");
  const [difficulty, setDifficulty] = useState("easy");
  const [roundsTotal, setRoundsTotal] = useState(8);
  const [deck, setDeck] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guessInput, setGuessInput] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [feed, setFeed] = useState([]);
  const [deadline, setDeadline] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const [roundResult, setRoundResult] = useState(null);
  const [history, setHistory] = useState([]);

  const config = DIFFICULTIES[difficulty];
  const current = deck[roundIndex] || null;
  const timeLeft = phase === "playing" && deadline
    ? Math.max(0, Math.ceil((deadline - tick) / 1000))
    : config.seconds;
  const attemptsLeft = Math.max(0, config.attempts - wrongGuesses.length);
  const correctCount = useMemo(() => history.filter((item) => item.correct).length, [history]);
  const accuracy = history.length ? Math.round((correctCount / history.length) * 100) : 0;

  useEffect(() => {
    const updateTarget = () => {
      const activeRoom = window.sessionStorage.getItem("friendguess-active-room-id");
      const target = activeRoom ? null : document.querySelector(".hero-card");
      setHomeTarget((existing) => (existing === target ? existing : target));
    };

    updateTarget();
    const observer = new MutationObserver(updateTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = window.setInterval(updateTarget, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const savedNickname = window.localStorage.getItem("friendguess-nickname");
    if (savedNickname?.trim()) setPlayerName(savedNickname.trim().slice(0, 18));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing" || !deadline || tick < deadline) return;
    finishRound(false, "time");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, deadline, phase]);

  function resetRoundState() {
    setGuessInput("");
    setWrongGuesses([]);
    setFeed([]);
    setRoundResult(null);
  }

  function openSolo() {
    setPhase("setup");
    setOpen(true);
  }

  function closeSolo() {
    setOpen(false);
    setPhase("setup");
    setDeck([]);
    setRoundIndex(0);
    setHistory([]);
    resetRoundState();
  }

  function enterLobby() {
    const safeName = playerName.trim().slice(0, 18) || "Player";
    window.localStorage.setItem("friendguess-nickname", safeName);
    setPlayerName(safeName);
    setHistory([]);
    setRoundIndex(0);
    resetRoundState();
    setPhase("lobby");
  }

  function startGame() {
    const nextDeck = shuffle(SOLO_QUESTION_POOLS[difficulty]).slice(0, roundsTotal);
    setDeck(nextDeck);
    setRoundIndex(0);
    setHistory([]);
    resetRoundState();
    const now = Date.now();
    setTick(now);
    setDeadline(now + config.seconds * 1000);
    setPhase("playing");
  }

  function finishRound(correct, reason) {
    if (phase !== "playing" || !current) return;

    const result = {
      correct,
      reason,
      answer: current.answer,
      question: current.question,
    };

    setHistory((items) => [...items, result]);
    setRoundResult(result);
    setPhase("roundComplete");
  }

  function submitGuess(event) {
    event.preventDefault();
    if (phase !== "playing" || !current || !guessInput.trim()) return;

    const submitted = guessInput.trim();
    const normalized = normalize(submitted);
    const isCorrect = current.answers.some((answer) => normalize(answer) === normalized);

    setGuessInput("");

    if (isCorrect) {
      setFeed((items) => [...items, makeFeedLine(`${playerName} guessed the answer!`, "correct")]);
      finishRound(true, "correct");
      return;
    }

    const nextWrong = [...wrongGuesses, submitted];
    setWrongGuesses(nextWrong);
    setFeed((items) => [...items, makeFeedLine(`${playerName}: ${submitted}`)]);

    if (nextWrong.length >= config.attempts) {
      finishRound(false, "attempts");
    }
  }

  function nextRound() {
    if (roundIndex + 1 >= deck.length) {
      setPhase("finished");
      return;
    }

    setRoundIndex((index) => index + 1);
    resetRoundState();
    const now = Date.now();
    setTick(now);
    setDeadline(now + config.seconds * 1000);
    setPhase("playing");
  }

  function playAgain() {
    setPhase("lobby");
    setDeck([]);
    setRoundIndex(0);
    setHistory([]);
    resetRoundState();
  }

  const launcher = homeTarget ? createPortal(
    <div className={styles.launcherWrap}>
      <div className={styles.launcherDivider}><span>or</span></div>
      <button className={styles.launcherButton} type="button" onClick={openSolo}>
        <span>
          <strong>Play solo vs Milo</strong>
          <small>Practice the FriendGuess experience by yourself</small>
        </span>
      </button>
    </div>,
    homeTarget
  ) : null;

  if (!open) return launcher;

  if (phase === "setup") {
    return (
      <>
        {launcher}
        <div className={styles.overlay}>
          <main className={styles.setupShell}>
            <section className={styles.setupCard}>
              <div className={styles.setupHeader}>
                <div className={styles.logoMark}>FG</div>
                <h2>Solo bot mode</h2>
                <p>You will always guess Milo&apos;s hidden answers. Hints make the solo version possible without needing a friend.</p>
              </div>

              <label className="field-label" htmlFor="solo-name">Nickname</label>
              <input
                id="solo-name"
                className="big-input"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value.slice(0, 18))}
                maxLength={18}
                placeholder="Enter your nickname"
              />

              <label className="field-label" style={{ marginTop: 18 }}>Difficulty</label>
              <div className={styles.difficultyGrid}>
                {Object.entries(DIFFICULTIES).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    className={`${styles.difficultyButton} ${difficulty === key ? styles.difficultySelected : ""}`}
                    onClick={() => setDifficulty(key)}
                  >
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>

              <label className="field-label" htmlFor="solo-rounds">Rounds</label>
              <select
                id="solo-rounds"
                className="big-input select-input"
                value={roundsTotal}
                onChange={(event) => setRoundsTotal(Number(event.target.value))}
              >
                <option value={5}>5 rounds</option>
                <option value={8}>8 rounds</option>
                <option value={10}>10 rounds</option>
              </select>

              <button className="primary-button" type="button" onClick={enterLobby}>Enter bot room</button>
              <button className="ghost-button" type="button" onClick={closeSolo}>Back</button>
            </section>
          </main>
        </div>
      </>
    );
  }

  if (phase === "lobby") {
    return (
      <div className={styles.overlay}>
        <main className="game-bg">
          <header className="topbar">
            <div className="brand-small"><span>FG</span> FriendGuess</div>
            <div className="room-pill">Solo <strong>BOT</strong></div>
          </header>
          <section className="lobby-wrap">
            <div className="lobby-card">
              <p className="eyebrow">BOT ROOM</p>
              <h2>You vs Milo</h2>
              <p>Same FriendGuess-style guessing flow, but Milo is always the Answerer and you are always the guesser.</p>
              <div className={styles.lobbyDifficulty}>{config.label} · {roundsTotal} rounds</div>

              <div className="player-grid">
                <div className="player-tile">
                  <span className="avatar">😎</span>
                  <strong>{playerName}</strong>
                  <small>YOU</small>
                </div>
                <div className="player-tile">
                  <span className="avatar">{BOT.avatar}</span>
                  <strong>{BOT.nickname}</strong>
                  <small>ANSWERER</small>
                </div>
              </div>

              <div className="settings-row">
                <strong>{roundsTotal} rounds</strong>
                <span>{config.seconds} seconds · {config.attempts} guesses per round</span>
              </div>

              <button className="primary-button" type="button" onClick={startGame}>Start game</button>
              <button className="ghost-button" type="button" onClick={() => setPhase("setup")}>Change settings</button>
              <button className="ghost-button" type="button" onClick={closeSolo}>Leave bot room</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (phase === "finished") {
    return (
      <div className={styles.overlay}>
        <main className="game-bg confetti-bg">
          <section className="center-stage">
            <div className="result-card final-card">
              <div className="trophy">🏁</div>
              <p className="eyebrow">YOUR RESULTS</p>
              <h2>You got {correctCount} out of {history.length} correct</h2>
              <p>{accuracy}% accuracy on {config.label} difficulty.</p>

              <div className="result-scores">
                <div><span>Correct answers</span><strong>{correctCount}</strong></div>
                <div><span>Missed answers</span><strong>{history.length - correctCount}</strong></div>
                <div><span>Total rounds</span><strong>{history.length}</strong></div>
              </div>

              <button className="primary-button" type="button" onClick={playAgain}>Play again</button>
              <button className="ghost-button" type="button" onClick={closeSolo}>Back to FriendGuess</button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (phase === "roundComplete" && roundResult) {
    const isLastRound = roundIndex + 1 >= deck.length;
    return (
      <div className={styles.overlay}>
        <main className="game-bg">
          <GameHeader
            roundNumber={roundIndex + 1}
            roundsTotal={roundsTotal}
            timeLeft={timeLeft}
            difficulty={config.label}
            onExit={closeSolo}
          />
          <section className="center-stage">
            <div className="result-card">
              <p className="eyebrow">ROUND {roundIndex + 1} COMPLETE</p>
              <h2>{roundResult.correct ? "You got it!" : roundResult.reason === "time" ? "Time ran out" : "No guesses left"}</h2>
              <p>The answer was</p>
              <div className="reveal-answer">{roundResult.answer}</div>
              <p>{correctCount} correct so far out of {history.length} played.</p>
              <button className="primary-button" type="button" onClick={nextRound}>
                {isLastRound ? "See your results" : "Next round"}
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <main className="game-bg">
        <GameHeader
          roundNumber={roundIndex + 1}
          roundsTotal={roundsTotal}
          timeLeft={timeLeft}
          difficulty={config.label}
          onExit={closeSolo}
        />

        <div className="game-layout">
          <aside className="players-panel">
            <h3>Players</h3>
            <div className="score-player">
              <span className="rank">#1</span>
              <span className="avatar small">😎</span>
              <div><strong>{playerName}</strong><small>Guessing</small></div>
            </div>
            <div className="score-player active-player">
              <span className="rank">#2</span>
              <span className="avatar small">{BOT.avatar}</span>
              <div><strong>{BOT.nickname}</strong><small>Answerer</small></div>
              <span className="answerer-dot" title="Answerer" />
            </div>
          </aside>

          <section className="play-panel">
            <div className="question-card">
              <p>Milo answered:</p>
              <h2>{current?.question}</h2>
              <div className="hidden-answer">Secret answer: <strong>••••••••</strong></div>
              <div className={styles.hintBanner}><strong>Hint:</strong> {current?.hint}</div>
              <p style={{ marginTop: 12 }}>{attemptsLeft} {attemptsLeft === 1 ? "guess" : "guesses"} left</p>
            </div>

            <div className="guess-feed" aria-live="polite">
              {feed.length === 0 && <p className="empty-feed">Your guesses will appear here…</p>}
              {feed.map((item) => (
                <div className={`feed-line ${item.type === "correct" ? "correct" : "guess"}`} key={item.id}>
                  {item.text}
                </div>
              ))}
            </div>

            <form className="guess-form" onSubmit={submitGuess}>
              <input
                autoFocus
                value={guessInput}
                onChange={(event) => setGuessInput(event.target.value.slice(0, 40))}
                placeholder="Type a guess…"
                maxLength={40}
                disabled={timeLeft <= 0}
              />
              <button type="submit" disabled={!guessInput.trim() || timeLeft <= 0}>Guess</button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

function GameHeader({ roundNumber, roundsTotal, timeLeft, difficulty, onExit }) {
  return (
    <header className="topbar game-topbar">
      <div className="brand-small"><span>FG</span> FriendGuess</div>
      <div className="round-info">Round <strong>{roundNumber}/{roundsTotal}</strong></div>
      <div className={`timer ${timeLeft <= 10 ? "timer-danger" : ""}`}>{timeLeft}s</div>
      <div className={styles.difficultyPill}>{difficulty}</div>
      <button className={styles.soloTopButton} type="button" onClick={onExit}>Exit</button>
    </header>
  );
}
