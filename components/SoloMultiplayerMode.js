"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SoloMultiplayerMode.module.css";

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

const QUESTION_POOLS = {
  easy: [
    ["Fruit", "What fruit did Milo choose?", "apple", ["apple"], "A common red or green fruit that grows on trees."],
    ["Fruit", "What fruit did Milo choose?", "banana", ["banana"], "A long yellow fruit that you peel before eating."],
    ["Food", "What food did Milo choose?", "pizza", ["pizza"], "A round food with cheese and sauce, usually cut into slices."],
    ["Food", "What food did Milo choose?", "burger", ["burger", "hamburger"], "A sandwich with a patty inside a round bun."],
    ["Animal", "What animal did Milo choose?", "dog", ["dog", "puppy"], "A common pet that barks and wags its tail."],
    ["Animal", "What animal did Milo choose?", "cat", ["cat", "kitty", "kitten"], "A common pet that meows and purrs."],
    ["Color", "What color did Milo choose?", "blue", ["blue"], "The color of a clear daytime sky."],
    ["Color", "What color did Milo choose?", "green", ["green"], "The color of grass and many leaves."],
    ["Space", "What object did Milo choose?", "moon", ["moon"], "The object that orbits Earth and is often visible at night."],
    ["Transport", "What vehicle did Milo choose?", "car", ["car", "automobile"], "A common four-wheel vehicle people drive on roads."],
    ["Technology", "What device did Milo choose?", "phone", ["phone", "smartphone", "cellphone", "cell phone"], "A pocket device used for calls, texts, and apps."],
    ["Sport", "What sport did Milo choose?", "soccer", ["soccer", "football"], "Players mainly kick a ball toward a goal."],
    ["Sport", "What sport did Milo choose?", "tennis", ["tennis"], "Players hit a ball over a net using rackets."],
    ["Place", "What place did Milo choose?", "school", ["school"], "A place students go to learn from teachers."],
    ["Place", "What place did Milo choose?", "beach", ["beach"], "A sandy place next to the ocean."],
    ["Object", "What object did Milo choose?", "book", ["book"], "An object with pages that you read."],
    ["Object", "What object did Milo choose?", "chair", ["chair"], "A piece of furniture made for one person to sit on."],
    ["Weather", "What weather did Milo choose?", "rain", ["rain"], "Water falling from clouds in drops."],
    ["Dessert", "What sweet food did Milo choose?", "cake", ["cake"], "A sweet baked dessert often eaten on birthdays."],
    ["Music", "What instrument did Milo choose?", "guitar", ["guitar"], "A string instrument that is often strummed."],
  ],
  medium: [
    ["Science", "What science word did Milo choose?", "gravity", ["gravity"], "The force that pulls objects toward Earth."],
    ["Science", "What process did Milo choose?", "evaporation", ["evaporation"], "Liquid water changes into vapor through this process."],
    ["Biology", "What body part did Milo choose?", "retina", ["retina"], "The light-sensitive layer at the back of the eye."],
    ["Biology", "What organ did Milo choose?", "pancreas", ["pancreas"], "This organ helps with digestion and blood-sugar control."],
    ["Geography", "What geography word did Milo choose?", "equator", ["equator"], "An imaginary line around Earth's middle at zero degrees latitude."],
    ["Geography", "What landform did Milo choose?", "peninsula", ["peninsula"], "Land surrounded by water on three sides."],
    ["Space", "What planet did Milo choose?", "saturn", ["saturn"], "A gas giant famous for its large ring system."],
    ["Space", "What planet did Milo choose?", "mercury", ["mercury"], "The planet closest to the Sun."],
    ["History", "What historical period did Milo choose?", "renaissance", ["renaissance"], "A European cultural revival associated with art, science, and humanism."],
    ["History", "What ancient civilization did Milo choose?", "rome", ["rome", "roman empire"], "Its empire once controlled much of the Mediterranean world."],
    ["Civics", "What government term did Milo choose?", "democracy", ["democracy"], "A system in which citizens choose leaders through voting."],
    ["Math", "What shape did Milo choose?", "trapezoid", ["trapezoid"], "A four-sided shape with at least one pair of parallel sides."],
    ["Math", "What math word did Milo choose?", "fraction", ["fraction"], "A number representing part of a whole using a numerator and denominator."],
    ["Technology", "What computer part did Milo choose?", "processor", ["processor", "cpu"], "The component that executes instructions inside a computer."],
    ["Technology", "What security word did Milo choose?", "firewall", ["firewall"], "A security system that filters network traffic."],
    ["Language", "What word type did Milo choose?", "adjective", ["adjective"], "A word that describes a noun."],
    ["Music", "What instrument did Milo choose?", "clarinet", ["clarinet"], "A woodwind instrument played with a single reed."],
    ["Nature", "What natural event did Milo choose?", "eclipse", ["eclipse"], "One celestial object blocks the light of another."],
    ["Chemistry", "What element did Milo choose?", "oxygen", ["oxygen"], "A gas essential for human respiration, with symbol O."],
    ["Economics", "What economics word did Milo choose?", "inflation", ["inflation"], "A general rise in prices that reduces purchasing power."],
  ],
  hard: [
    ["Geography", "What geography term did Milo choose?", "archipelago", ["archipelago"], "A chain or cluster of islands grouped together."],
    ["Biology", "What cell structure did Milo choose?", "mitochondria", ["mitochondria", "mitochondrion"], "Organelles that generate much of a cell's usable energy."],
    ["Biology", "What process did Milo choose?", "metamorphosis", ["metamorphosis"], "A major biological transformation in body form during development."],
    ["Astronomy", "What astronomy term did Milo choose?", "supernova", ["supernova"], "A powerful stellar explosion that can briefly outshine a galaxy."],
    ["Astronomy", "What object did Milo choose?", "quasar", ["quasar"], "An extremely luminous active galactic nucleus powered by a distant black hole."],
    ["Earth Science", "What atmospheric layer did Milo choose?", "stratosphere", ["stratosphere"], "The layer above the troposphere that contains most of the ozone layer."],
    ["Earth Science", "What theory did Milo choose?", "tectonics", ["tectonics", "plate tectonics"], "The theory explaining the movement of Earth's large crustal plates."],
    ["Chemistry", "What chemistry term did Milo choose?", "catalyst", ["catalyst"], "A substance that speeds up a reaction without being consumed."],
    ["Chemistry", "What element did Milo choose?", "tungsten", ["tungsten"], "A dense metal with chemical symbol W and an exceptionally high melting point."],
    ["Physics", "What physics term did Milo choose?", "refraction", ["refraction"], "The bending of a wave when it enters a medium where its speed changes."],
    ["Physics", "What physics term did Milo choose?", "inertia", ["inertia"], "The tendency of an object to resist changes in its motion."],
    ["History", "What treaty did Milo choose?", "versailles", ["versailles", "treaty of versailles"], "The 1919 treaty that formally ended the war between Germany and the Allied powers."],
    ["History", "What empire did Milo choose?", "byzantine", ["byzantine", "byzantine empire"], "The eastern continuation of the Roman Empire centered on Constantinople."],
    ["Literature", "What literary term did Milo choose?", "allegory", ["allegory"], "A story whose characters and events represent a deeper symbolic meaning."],
    ["Language", "What language term did Milo choose?", "onomatopoeia", ["onomatopoeia"], "A word formed to imitate the sound it describes."],
    ["Math", "What math term did Milo choose?", "hypotenuse", ["hypotenuse"], "The side opposite the right angle in a right triangle."],
    ["Math", "What math term did Milo choose?", "logarithm", ["logarithm"], "The exponent to which a base must be raised to produce a given number."],
    ["Computing", "What computing term did Milo choose?", "recursion", ["recursion"], "A technique where a function solves a problem by calling itself on smaller versions of that problem."],
    ["Cybersecurity", "What security term did Milo choose?", "encryption", ["encryption"], "The process of transforming readable data into coded form to protect it."],
    ["Economics", "What economics term did Milo choose?", "monopoly", ["monopoly"], "A market structure where a single seller dominates supply."],
  ],
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

function toQuestion(tuple) {
  return {
    category: tuple[0],
    question: tuple[1],
    answer: tuple[2],
    answers: tuple[3],
    hint: tuple[4],
  };
}

function makeFeedLine(text, type = "guess") {
  return { id: `${Date.now()}-${Math.random()}`, text, type };
}

export default function SoloMultiplayerMode() {
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
    const nextDeck = shuffle(QUESTION_POOLS[difficulty])
      .slice(0, roundsTotal)
      .map(toQuestion);
    setDeck(nextDeck);
    setRoundIndex(0);
    setHistory([]);
    resetRoundState();
    beginRound();
  }

  function beginRound() {
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
                <p>You will always guess Milo's hidden answers. Hints make the solo version possible without needing a friend.</p>
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

              <button className="primary-button" type="button" onClick={enterLobby}>
                Enter bot room
              </button>
              <button className="ghost-button" type="button" onClick={closeSolo}>
                Back
              </button>
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
