"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SoloMultiplayerMode.module.css";

const BOT_PLAYERS = [
  { id: "bot-milo", nickname: "Milo", avatar: "🦊" },
  { id: "bot-nova", nickname: "Nova", avatar: "🐼" },
  { id: "bot-pixel", nickname: "Pixel", avatar: "🐸" },
];

const DIFFICULTIES = {
  easy: {
    label: "Easy",
    description: "Familiar answers, very clear hints, slower bots",
    botWinDelay: [34000, 50000],
    wrongGuessDelay: 6500,
  },
  medium: {
    label: "Medium",
    description: "Moderate answers, balanced hints, average-speed bots",
    botWinDelay: [22000, 36000],
    wrongGuessDelay: 5000,
  },
  hard: {
    label: "Hard",
    description: "Challenging answers, less obvious hints, faster bots",
    botWinDelay: [12000, 24000],
    wrongGuessDelay: 3600,
  },
};

const PERSONAL_QUESTIONS = [
  "What is your favorite color?",
  "What food could you eat every week?",
  "What country would you most like to visit?",
  "What is your favorite season?",
  "What animal would you want as a pet?",
  "What is your favorite fast-food place?",
  "What is your favorite movie genre?",
  "What is your dream vacation?",
  "What is your favorite sport?",
  "What is your favorite school subject?",
  "What is your favorite snack?",
  "What is your favorite video game?",
  "What is your favorite holiday?",
  "What is your favorite type of music?",
  "What is your dream car brand?",
  "What is your favorite dessert?",
  "What is your favorite app?",
  "What is your favorite restaurant?",
  "What is your favorite weather?",
  "What is your favorite thing to do on weekends?",
];

const QUESTION_POOLS = {
  easy: [
    ["Fruit", "What fruit did the bot choose?", "apple", ["apple"], "A common red or green fruit that grows on trees."],
    ["Fruit", "What fruit did the bot choose?", "banana", ["banana"], "A long yellow fruit that you peel before eating."],
    ["Food", "What food did the bot choose?", "pizza", ["pizza"], "A round food with cheese and sauce, usually cut into slices."],
    ["Food", "What food did the bot choose?", "burger", ["burger", "hamburger"], "A sandwich with a patty inside a round bun."],
    ["Animal", "What animal did the bot choose?", "dog", ["dog", "puppy"], "A common pet that barks and wags its tail."],
    ["Animal", "What animal did the bot choose?", "cat", ["cat", "kitty", "kitten"], "A common pet that meows and purrs."],
    ["Color", "What color did the bot choose?", "blue", ["blue"], "The color of a clear daytime sky."],
    ["Color", "What color did the bot choose?", "green", ["green"], "The color of grass and many leaves."],
    ["Space", "What object did the bot choose?", "moon", ["moon"], "The object that orbits Earth and is often visible at night."],
    ["Transport", "What vehicle did the bot choose?", "car", ["car"], "A common four-wheel vehicle people drive on roads."],
    ["Technology", "What device did the bot choose?", "phone", ["phone", "smartphone", "cellphone", "cell phone"], "A pocket device used for calls, texts, and apps."],
    ["Sport", "What sport did the bot choose?", "soccer", ["soccer", "football"], "Players mainly kick a ball toward a goal."],
    ["Sport", "What sport did the bot choose?", "tennis", ["tennis"], "Players hit a ball over a net using rackets."],
    ["Place", "What place did the bot choose?", "school", ["school"], "A place students go to learn from teachers."],
    ["Place", "What place did the bot choose?", "beach", ["beach"], "A sandy place next to the ocean."],
    ["Object", "What object did the bot choose?", "book", ["book"], "An object with pages that you read."],
    ["Object", "What object did the bot choose?", "chair", ["chair"], "A piece of furniture made for one person to sit on."],
    ["Weather", "What weather did the bot choose?", "rain", ["rain"], "Water falling from clouds in drops."],
    ["Dessert", "What sweet food did the bot choose?", "cake", ["cake"], "A sweet baked dessert often eaten on birthdays."],
    ["Music", "What instrument did the bot choose?", "guitar", ["guitar"], "A string instrument that is often strummed."],
  ],
  medium: [
    ["Science", "What science word did the bot choose?", "gravity", ["gravity"], "The force that pulls objects toward Earth."],
    ["Science", "What process did the bot choose?", "evaporation", ["evaporation"], "Liquid water changes into vapor through this process."],
    ["Biology", "What body part did the bot choose?", "retina", ["retina"], "The light-sensitive layer at the back of the eye."],
    ["Biology", "What organ did the bot choose?", "pancreas", ["pancreas"], "This organ helps with digestion and blood-sugar control."],
    ["Geography", "What geography word did the bot choose?", "equator", ["equator"], "An imaginary line around Earth's middle at zero degrees latitude."],
    ["Geography", "What landform did the bot choose?", "peninsula", ["peninsula"], "Land surrounded by water on three sides."],
    ["Space", "What planet did the bot choose?", "saturn", ["saturn"], "A gas giant famous for its large ring system."],
    ["Space", "What planet did the bot choose?", "mercury", ["mercury"], "The planet closest to the Sun."],
    ["History", "What historical period did the bot choose?", "renaissance", ["renaissance"], "A European cultural revival associated with art, science, and humanism."],
    ["History", "What ancient civilization did the bot choose?", "rome", ["rome", "roman empire"], "Its empire once controlled much of the Mediterranean world."],
    ["Civics", "What government term did the bot choose?", "democracy", ["democracy"], "A system in which citizens choose leaders through voting."],
    ["Math", "What shape did the bot choose?", "trapezoid", ["trapezoid"], "A four-sided shape with at least one pair of parallel sides."],
    ["Math", "What math word did the bot choose?", "fraction", ["fraction"], "A number representing part of a whole using a numerator and denominator."],
    ["Technology", "What computer part did the bot choose?", "processor", ["processor", "cpu"], "The component that executes instructions inside a computer."],
    ["Technology", "What security word did the bot choose?", "firewall", ["firewall"], "A security system that filters network traffic."],
    ["Language", "What word type did the bot choose?", "adjective", ["adjective"], "A word that describes a noun."],
    ["Music", "What instrument did the bot choose?", "clarinet", ["clarinet"], "A woodwind instrument played with a single reed."],
    ["Nature", "What natural event did the bot choose?", "eclipse", ["eclipse"], "One celestial object blocks the light of another."],
    ["Chemistry", "What element did the bot choose?", "oxygen", ["oxygen"], "A gas essential for human respiration, with symbol O."],
    ["Economics", "What economics word did the bot choose?", "inflation", ["inflation"], "A general rise in prices that reduces purchasing power."],
  ],
  hard: [
    ["Geography", "What geography term did the bot choose?", "archipelago", ["archipelago"], "A chain or cluster of islands grouped together."],
    ["Biology", "What cell structure did the bot choose?", "mitochondria", ["mitochondria", "mitochondrion"], "Organelles that generate much of a cell's usable energy."],
    ["Biology", "What process did the bot choose?", "metamorphosis", ["metamorphosis"], "A major biological transformation in body form during development."],
    ["Astronomy", "What astronomy term did the bot choose?", "supernova", ["supernova"], "A powerful stellar explosion that can briefly outshine a galaxy."],
    ["Astronomy", "What object did the bot choose?", "quasar", ["quasar"], "An extremely luminous active galactic nucleus powered by a distant black hole."],
    ["Earth Science", "What atmospheric layer did the bot choose?", "stratosphere", ["stratosphere"], "The layer above the troposphere that contains most of the ozone layer."],
    ["Earth Science", "What theory did the bot choose?", "tectonics", ["tectonics", "plate tectonics"], "The theory explaining the movement of Earth's large crustal plates."],
    ["Chemistry", "What chemistry term did the bot choose?", "catalyst", ["catalyst"], "A substance that speeds up a reaction without being consumed."],
    ["Chemistry", "What element did the bot choose?", "tungsten", ["tungsten"], "A dense metal with chemical symbol W and an exceptionally high melting point."],
    ["Physics", "What physics term did the bot choose?", "refraction", ["refraction"], "The bending of a wave when it enters a medium where its speed changes."],
    ["Physics", "What physics term did the bot choose?", "inertia", ["inertia"], "The tendency of an object to resist changes in its motion."],
    ["History", "What treaty did the bot choose?", "versailles", ["versailles", "treaty of versailles"], "The 1919 treaty that formally ended the war between Germany and the Allied powers."],
    ["History", "What empire did the bot choose?", "byzantine", ["byzantine", "byzantine empire"], "The eastern continuation of the Roman Empire centered on Constantinople."],
    ["Literature", "What literary term did the bot choose?", "allegory", ["allegory"], "A story whose characters and events represent a deeper symbolic meaning."],
    ["Language", "What language term did the bot choose?", "onomatopoeia", ["onomatopoeia"], "A word formed to imitate the sound it describes."],
    ["Math", "What math term did the bot choose?", "hypotenuse", ["hypotenuse"], "The side opposite the right angle in a right triangle."],
    ["Math", "What math term did the bot choose?", "logarithm", ["logarithm"], "The exponent to which a base must be raised to produce a given number."],
    ["Computing", "What computing term did the bot choose?", "recursion", ["recursion"], "A technique where a function solves a problem by calling itself on smaller versions of that problem."],
    ["Cybersecurity", "What security term did the bot choose?", "encryption", ["encryption"], "The process of transforming readable data into coded form to protect it."],
    ["Economics", "What economics term did the bot choose?", "monopoly", ["monopoly"], "A market structure where a single seller dominates supply."],
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

function randomBetween([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeQuestion(tuple) {
  return {
    category: tuple[0],
    question: tuple[1],
    answer: tuple[2],
    answers: tuple[3],
    hint: tuple[4],
  };
}

function buildDeck(difficulty, roundsTotal) {
  const botPool = shuffle(QUESTION_POOLS[difficulty]).map(makeQuestion);
  const personal = shuffle(PERSONAL_QUESTIONS);
  let botIndex = 0;
  let personalIndex = 0;

  return Array.from({ length: roundsTotal }, (_, index) => {
    if (index % 4 === 0) {
      const question = personal[personalIndex % personal.length];
      personalIndex += 1;
      return { category: "Friends", question, humanTurn: true };
    }
    const item = botPool[botIndex % botPool.length];
    botIndex += 1;
    return { ...item, humanTurn: false };
  });
}

function BotScoreList({ players }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <div className="result-scores">
      {sorted.map((player, index) => (
        <div key={player.id}>
          <span>#{index + 1} {player.nickname}</span>
          <strong>{player.score} pts</strong>
        </div>
      ))}
    </div>
  );
}

export default function SoloMultiplayerMode() {
  const [homeTarget, setHomeTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [playerName, setPlayerName] = useState("Player");
  const [difficulty, setDifficulty] = useState("easy");
  const [roundsTotal, setRoundsTotal] = useState(8);
  const [players, setPlayers] = useState([]);
  const [deck, setDeck] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [secretInput, setSecretInput] = useState("");
  const [hintInput, setHintInput] = useState("");
  const [lockedAnswer, setLockedAnswer] = useState("");
  const [acceptedAnswers, setAcceptedAnswers] = useState([]);
  const [activeHint, setActiveHint] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [feed, setFeed] = useState([]);
  const [winnerId, setWinnerId] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState("");
  const [deadline, setDeadline] = useState(0);
  const [tick, setTick] = useState(Date.now());

  const config = DIFFICULTIES[difficulty];
  const current = deck[roundIndex] || null;
  const answererIndex = roundIndex % 4;
  const answerer = players[answererIndex] || null;
  const isHumanAnswerer = answerer?.id === "human";
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const timeLeft = phase === "guessing" && deadline
    ? Math.max(0, Math.ceil((deadline - tick) / 1000))
    : 60;

  useEffect(() => {
    const updateTarget = () => {
      const activeRoom = window.sessionStorage.getItem("friendguess-active-room-id");
      const target = activeRoom ? null : document.querySelector(".hero-card");
      setHomeTarget((old) => (old === target ? old : target));
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
    const saved = window.localStorage.getItem("friendguess-nickname");
    if (saved?.trim()) setPlayerName(saved.trim().slice(0, 18));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (phase !== "guessing") return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "guessing" || !deadline || tick < deadline) return;
    finishRound(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, deadline, phase]);

  useEffect(() => {
    if (phase !== "guessing" || !lockedAnswer || !answerer) return undefined;

    const guessers = players.filter((player) => player.id !== answerer.id && player.id !== "human");
    if (!guessers.length) return undefined;

    const allPoolAnswers = QUESTION_POOLS[difficulty].map((item) => item[2]);
    const wrongWords = shuffle(allPoolAnswers.filter((word) => normalize(word) !== normalize(lockedAnswer)));
    const timers = [];
    const winningDelay = randomBetween(config.botWinDelay);
    const wrongCount = difficulty === "easy" ? 3 : difficulty === "medium" ? 4 : 5;

    for (let i = 0; i < wrongCount; i += 1) {
      const delay = config.wrongGuessDelay * (i + 1);
      if (delay >= winningDelay - 1800) break;
      const guesser = guessers[i % guessers.length];
      const word = wrongWords[i % wrongWords.length] || "maybe";
      timers.push(window.setTimeout(() => {
        setFeed((old) => [...old, { id: `${Date.now()}-${i}`, text: `${guesser.nickname}: ${word}`, correct: false }]);
      }, delay));
    }

    const winnerBot = guessers[Math.floor(Math.random() * guessers.length)];
    timers.push(window.setTimeout(() => {
      setFeed((old) => [...old, { id: `${Date.now()}-correct`, text: `${winnerBot.nickname} guessed the answer!`, correct: true }]);
      finishRound(winnerBot.id);
    }, winningDelay));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIndex, lockedAnswer]);

  function resetRoundState() {
    setSecretInput("");
    setHintInput("");
    setLockedAnswer("");
    setAcceptedAnswers([]);
    setActiveHint("");
    setGuessInput("");
    setFeed([]);
    setWinnerId(null);
    setRevealedAnswer("");
    setDeadline(0);
  }

  function prepareRound(index, activeDeck = deck) {
    resetRoundState();
    const item = activeDeck[index];
    if (!item) {
      setPhase("final");
      return;
    }

    if (index % 4 === 0) {
      setPhase("answering");
      return;
    }

    setLockedAnswer(item.answer);
    setAcceptedAnswers(item.answers);
    setActiveHint(item.hint);
    setFeed([{ id: "system-start", text: `${BOT_PLAYERS[(index % 4) - 1]?.nickname || "Bot"} locked in a secret answer.`, system: true }]);
    const now = Date.now();
    setTick(now);
    setDeadline(now + 60000);
    setPhase("guessing");
  }

  function openMode() {
    setOpen(true);
    setPhase("setup");
  }

  function closeMode() {
    setOpen(false);
    setPhase("setup");
    setPlayers([]);
    setDeck([]);
    setRoundIndex(0);
    resetRoundState();
  }

  function createBotRoom() {
    const safeName = playerName.trim().slice(0, 18) || "Player";
    window.localStorage.setItem("friendguess-nickname", safeName);
    setPlayerName(safeName);
    setPlayers([
      { id: "human", nickname: safeName, avatar: "😎", score: 0 },
      ...BOT_PLAYERS.map((bot) => ({ ...bot, score: 0 })),
    ]);
    setPhase("lobby");
  }

  function startGame() {
    const nextDeck = buildDeck(difficulty, roundsTotal);
    setDeck(nextDeck);
    setPlayers((old) => old.map((player) => ({ ...player, score: 0 })));
    setRoundIndex(0);
    prepareRound(0, nextDeck);
  }

  function lockHumanAnswer(event) {
    event.preventDefault();
    if (!secretInput.trim() || !hintInput.trim()) return;
    const answer = secretInput.trim().slice(0, 40);
    setLockedAnswer(answer);
    setAcceptedAnswers([answer]);
    setActiveHint(hintInput.trim().slice(0, 100));
    setFeed([{ id: "system-start", text: "Your answer is locked. The bots are guessing live.", system: true }]);
    const now = Date.now();
    setTick(now);
    setDeadline(now + 60000);
    setPhase("guessing");
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!guessInput.trim() || isHumanAnswerer || phase !== "guessing") return;
    const submitted = guessInput.trim().slice(0, 40);
    setGuessInput("");
    const correct = acceptedAnswers.some((answer) => normalize(answer) === normalize(submitted));

    if (correct) {
      setFeed((old) => [...old, { id: `${Date.now()}-human-correct`, text: `${playerName} guessed the answer!`, correct: true }]);
      finishRound("human");
    } else {
      setFeed((old) => [...old, { id: `${Date.now()}-human`, text: `${playerName}: ${submitted}`, correct: false }]);
    }
  }

  function finishRound(winner) {
    if (phase !== "guessing") return;
    if (winner) {
      setPlayers((old) => old.map((player) => player.id === winner ? { ...player, score: player.score + 100 } : player));
    }
    setWinnerId(winner);
    setRevealedAnswer(lockedAnswer || current?.answer || secretInput.trim());
    setPhase("result");
  }

  function nextRound() {
    const next = roundIndex + 1;
    if (next >= roundsTotal) {
      setPhase("final");
      return;
    }
    setRoundIndex(next);
    prepareRound(next);
  }

  function replay() {
    setRoundIndex(0);
    setPhase("lobby");
    resetRoundState();
  }

  const launcher = homeTarget ? createPortal(
    <div className={styles.launcherWrap}>
      <div className={styles.launcherDivider}><span>or play with bots</span></div>
      <button className={styles.launcherButton} type="button" onClick={openMode}>
        <span><strong>Play solo vs bots</strong><small>Experience FriendGuess without needing another player</small></span>
      </button>
    </div>,
    homeTarget
  ) : null;

  if (!open) return launcher;

  const activeQuestion = current?.question || "Get ready for the next question";
  const currentWinner = players.find((player) => player.id === winnerId) || null;

  let screen = null;

  if (phase === "setup") {
    screen = (
      <div className={styles.setupShell}>
        <section className={styles.setupCard}>
          <div className={styles.setupHeader}>
            <div className={styles.logoMark}>FG</div>
            <h2>Play FriendGuess with bots</h2>
            <p>This follows the same FriendGuess round flow as multiplayer, but bots fill the other player spots. Every bot answer includes a hint.</p>
          </div>

          <label className="field-label" htmlFor="bot-name">Nickname</label>
          <input id="bot-name" className="big-input" value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 18))} maxLength={18} />

          <label className="field-label" style={{ marginTop: 18 }}>Difficulty</label>
          <div className={styles.difficultyGrid}>
            {Object.entries(DIFFICULTIES).map(([key, item]) => (
              <button
                type="button"
                key={key}
                className={`${styles.difficultyButton} ${difficulty === key ? styles.difficultySelected : ""}`}
                onClick={() => setDifficulty(key)}
              >
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="bot-rounds">Rounds</label>
          <select id="bot-rounds" className="big-input select-input" value={roundsTotal} onChange={(event) => setRoundsTotal(Number(event.target.value))}>
            <option value={4}>4 rounds</option>
            <option value={6}>6 rounds</option>
            <option value={8}>8 rounds</option>
            <option value={10}>10 rounds</option>
          </select>

          <button className="primary-button" type="button" onClick={createBotRoom}>Create bot room</button>
          <button className="ghost-button" type="button" onClick={closeMode}>Back to home</button>
        </section>
      </div>
    );
  }

  if (phase === "lobby") {
    screen = (
      <main className="game-bg">
        <header className="topbar">
          <div className="brand-small"><span>FG</span> FriendGuess</div>
          <div className={styles.difficultyPill}>{config.label} bot room</div>
          <button className={styles.soloTopButton} type="button" onClick={closeMode}>Exit</button>
        </header>
        <section className="lobby-wrap">
          <div className="lobby-card">
            <p className="eyebrow">BOT ROOM</p>
            <h2>Everyone is ready!</h2>
            <p>This is the multiplayer experience with three bot players standing in for friends.</p>
            <div className={styles.lobbyDifficulty}>{config.label} difficulty</div>
            <div className="player-grid">
              {players.map((player, index) => (
                <div className="player-tile" key={player.id}>
                  <span className="avatar">{player.avatar}</span>
                  <strong>{player.nickname}</strong>
                  <small>{index === 0 ? "HOST" : "BOT"}</small>
                </div>
              ))}
            </div>
            <div className="settings-row">
              <strong>{roundsTotal} rounds</strong>
              <span>60 seconds per turn</span>
            </div>
            <button className="primary-button" type="button" onClick={startGame}>Start game</button>
            <button className="ghost-button" type="button" onClick={closeMode}>Leave room</button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "answering") {
    screen = (
      <main className="game-bg">
        <GameHeader roundIndex={roundIndex} roundsTotal={roundsTotal} timeLeft={60} difficulty={config.label} onExit={closeMode} />
        <section className="center-stage">
          <div className="answer-card">
            <div className="turn-badge">YOUR TURN</div>
            <h2>{activeQuestion}</h2>
            <p>Answer just like multiplayer. Since the bots do not actually know you, give them a hint too.</p>
            <form onSubmit={lockHumanAnswer}>
              <div className={styles.answerFields}>
                <label htmlFor="solo-secret">Secret answer</label>
                <input id="solo-secret" autoFocus value={secretInput} onChange={(event) => setSecretInput(event.target.value.slice(0, 40))} placeholder="Your secret answer…" maxLength={40} />
                <label htmlFor="solo-hint">Hint for the bots</label>
                <input id="solo-hint" value={hintInput} onChange={(event) => setHintInput(event.target.value.slice(0, 100))} placeholder="Give a useful hint…" maxLength={100} />
              </div>
              <button className="primary-button" type="submit" disabled={!secretInput.trim() || !hintInput.trim()}>Lock answer 🔒</button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "guessing") {
    screen = (
      <main className="game-bg">
        <GameHeader roundIndex={roundIndex} roundsTotal={roundsTotal} timeLeft={timeLeft} difficulty={config.label} onExit={closeMode} />
        <div className="game-layout">
          <aside className="players-panel">
            <h3>Players</h3>
            {sortedPlayers.map((player, index) => (
              <div className={`score-player ${player.id === answerer?.id ? "active-player" : ""}`} key={player.id}>
                <span className="rank">#{index + 1}</span>
                <span className="avatar small">{player.avatar}</span>
                <div><strong>{player.nickname}</strong><small>{player.score} pts</small></div>
                {player.id === answerer?.id && <span className="answerer-dot" title="Answerer" />}
              </div>
            ))}
          </aside>

          <section className="play-panel">
            <div className="question-card">
              <p>{answerer?.nickname} answered:</p>
              <h2>{activeQuestion}</h2>
              <div className={styles.hintBanner}><strong>Hint:</strong> {activeHint}</div>
              {isHumanAnswerer ? (
                <div className="hidden-answer">Your answer: <strong>{lockedAnswer}</strong></div>
              ) : (
                <div className="hidden-answer">Secret answer: <strong>••••••••</strong></div>
              )}
            </div>

            <div className="guess-feed" aria-live="polite">
              {feed.length === 0 && <p className="empty-feed">Guesses will appear here…</p>}
              {feed.map((item) => (
                <div className={`feed-line ${item.correct ? "correct" : item.system ? "system" : "guess"}`} key={item.id}>{item.text}</div>
              ))}
            </div>

            {isHumanAnswerer ? (
              <div className="answerer-controls">
                <p>Your answer is hidden. Watch the bots guess live.</p>
                <span className={styles.botNotice}>Difficulty affects how quickly and accurately the bots guess.</span>
              </div>
            ) : (
              <form className="guess-form" onSubmit={submitGuess}>
                <input autoFocus value={guessInput} onChange={(event) => setGuessInput(event.target.value.slice(0, 40))} placeholder="Type a guess…" maxLength={40} disabled={timeLeft <= 0} />
                <button type="submit" disabled={!guessInput.trim() || timeLeft <= 0}>Guess</button>
              </form>
            )}
          </section>
        </div>
      </main>
    );
  }

  if (phase === "result") {
    screen = (
      <main className="game-bg">
        <GameHeader roundIndex={roundIndex} roundsTotal={roundsTotal} timeLeft={timeLeft} difficulty={config.label} onExit={closeMode} />
        <section className="center-stage">
          <div className="result-card">
            <p className="eyebrow">ROUND {roundIndex + 1} COMPLETE</p>
            <h2>{currentWinner ? `${currentWinner.nickname} got it first!` : "Time ran out!"}</h2>
            <p>The answer was</p>
            <div className="reveal-answer">{revealedAnswer}</div>
            <BotScoreList players={players} />
            <button className="primary-button" type="button" onClick={nextRound}>{roundIndex + 1 >= roundsTotal ? "See final scores" : "Next round"}</button>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "final") {
    const champion = sortedPlayers[0];
    screen = (
      <main className="game-bg confetti-bg">
        <section className="center-stage">
          <div className="result-card final-card">
            <div className="trophy">🏆</div>
            <p className="eyebrow">GAME OVER</p>
            <h2>{champion?.nickname || playerName} wins!</h2>
            <BotScoreList players={players} />
            <button className="primary-button" type="button" onClick={replay}>Play again</button>
            <button className="ghost-button" type="button" onClick={closeMode}>Back to home</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      {launcher}
      {createPortal(<div className={styles.overlay}>{screen}</div>, document.body)}
    </>
  );
}

function GameHeader({ roundIndex, roundsTotal, timeLeft, difficulty, onExit }) {
  return (
    <header className="topbar game-topbar">
      <div className="brand-small"><span>FG</span> FriendGuess</div>
      <div className="round-info">Round <strong>{roundIndex + 1}/{roundsTotal}</strong></div>
      <div className={`timer ${timeLeft <= 10 ? "timer-danger" : ""}`}>{timeLeft}s</div>
      <div className={styles.difficultyPill}>{difficulty}</div>
      <button className={styles.soloTopButton} type="button" onClick={onExit}>Exit</button>
    </header>
  );
}
