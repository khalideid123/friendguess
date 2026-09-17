"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./SoloModeLauncher.module.css";

const BOTS = [
  { name: "Milo", avatar: "🤖" },
  { name: "Nova", avatar: "🧠" },
  { name: "Pixel", avatar: "🎮" },
  { name: "Luna", avatar: "✨" },
];

const DIFFICULTIES = {
  easy: { label: "Easy", seconds: 60, attempts: 6, basePoints: 100, cluePenalty: 0, description: "Straightforward answers and very clear clues" },
  medium: { label: "Medium", seconds: 45, attempts: 4, basePoints: 175, cluePenalty: 20, description: "Moderate knowledge and less obvious clues" },
  hard: { label: "Hard", seconds: 35, attempts: 3, basePoints: 275, cluePenalty: 40, description: "Challenging answers and indirect clues" },
};

const QUESTION_POOLS = {
  easy: [
    ["Fruit", "What fruit did the bot choose?", "apple", ["apple"], "A common red or green fruit that grows on trees.", "Starts with A and has 5 letters."],
    ["Fruit", "What fruit did the bot choose?", "banana", ["banana"], "A long yellow fruit that you peel.", "Starts with B and has 6 letters."],
    ["Food", "What food did the bot choose?", "pizza", ["pizza"], "A round food with cheese and sauce, usually cut into slices.", "Starts with P and has 5 letters."],
    ["Animal", "What animal did the bot choose?", "dog", ["dog", "puppy"], "A common pet that barks and wags its tail.", "Starts with D and has 3 letters."],
    ["Animal", "What animal did the bot choose?", "cat", ["cat", "kitty", "kitten"], "A common pet that meows and purrs.", "Starts with C and has 3 letters."],
    ["Color", "What color did the bot choose?", "blue", ["blue"], "The color of a clear daytime sky.", "Starts with B and has 4 letters."],
    ["Color", "What color did the bot choose?", "green", ["green"], "The color of grass and many leaves.", "Starts with G and has 5 letters."],
    ["Space", "What object did the bot choose?", "moon", ["moon"], "The object that orbits Earth and is often visible at night.", "Starts with M and has 4 letters."],
    ["Transport", "What vehicle did the bot choose?", "car", ["car"], "A common four-wheel vehicle people drive on roads.", "Starts with C and has 3 letters."],
    ["Technology", "What device did the bot choose?", "phone", ["phone", "smartphone", "cellphone", "cell phone"], "A pocket device used for calls, texts, and apps.", "Starts with P and has 5 letters."],
    ["Sport", "What sport did the bot choose?", "soccer", ["soccer", "football"], "Players mainly kick a ball toward a goal.", "Starts with S and has 6 letters."],
    ["Sport", "What sport did the bot choose?", "tennis", ["tennis"], "Players hit a ball over a net using rackets.", "Starts with T and has 6 letters."],
    ["Place", "What place did the bot choose?", "school", ["school"], "A place students go to learn from teachers.", "Starts with S and has 6 letters."],
    ["Place", "What place did the bot choose?", "beach", ["beach"], "A sandy place next to the ocean.", "Starts with B and has 5 letters."],
    ["Object", "What object did the bot choose?", "book", ["book"], "An object with pages that you read.", "Starts with B and has 4 letters."],
    ["Object", "What object did the bot choose?", "chair", ["chair"], "A piece of furniture made for one person to sit on.", "Starts with C and has 5 letters."],
    ["Weather", "What weather did the bot choose?", "rain", ["rain"], "Water falling from clouds in drops.", "Starts with R and has 4 letters."],
    ["Dessert", "What sweet food did the bot choose?", "cake", ["cake"], "A sweet baked dessert often eaten on birthdays.", "Starts with C and has 4 letters."],
    ["Entertainment", "What did the bot choose?", "movie", ["movie", "film"], "A story you watch on a screen.", "Starts with M and has 5 letters."],
    ["Music", "What instrument did the bot choose?", "guitar", ["guitar"], "A string instrument that is often strummed.", "Starts with G and has 6 letters."],
  ],
  medium: [
    ["Science", "What science word did the bot choose?", "gravity", ["gravity"], "The force that pulls objects toward Earth.", "It begins with G."],
    ["Science", "What process did the bot choose?", "evaporation", ["evaporation"], "Liquid water changes into vapor through this process.", "It begins with E."],
    ["Biology", "What body part did the bot choose?", "retina", ["retina"], "The light-sensitive layer at the back of the eye.", "It begins with R."],
    ["Biology", "What organ did the bot choose?", "pancreas", ["pancreas"], "This organ helps with digestion and blood-sugar control.", "It begins with P."],
    ["Geography", "What geography word did the bot choose?", "equator", ["equator"], "An imaginary line around Earth's middle at zero degrees latitude.", "It begins with E."],
    ["Geography", "What landform did the bot choose?", "peninsula", ["peninsula"], "Land surrounded by water on three sides.", "It begins with P."],
    ["Space", "What planet did the bot choose?", "saturn", ["saturn"], "A gas giant famous for its large ring system.", "It begins with S."],
    ["Space", "What planet did the bot choose?", "mercury", ["mercury"], "The planet closest to the Sun.", "It begins with M."],
    ["History", "What historical period did the bot choose?", "renaissance", ["renaissance"], "A European cultural revival associated with art, science, and humanism.", "It begins with R."],
    ["History", "What ancient civilization did the bot choose?", "rome", ["rome", "roman empire"], "Its empire once controlled much of the Mediterranean world.", "Its capital was in Italy."],
    ["Government", "What political term did the bot choose?", "democracy", ["democracy"], "A system in which citizens choose leaders through voting.", "It begins with D."],
    ["Math", "What shape did the bot choose?", "trapezoid", ["trapezoid"], "A four-sided shape with at least one pair of parallel sides.", "It begins with T."],
    ["Math", "What math word did the bot choose?", "fraction", ["fraction"], "A number representing part of a whole, often written with a numerator and denominator.", "It begins with F."],
    ["Technology", "What computer part did the bot choose?", "processor", ["processor", "cpu"], "The component that executes instructions inside a computer.", "CPU is another accepted answer."],
    ["Technology", "What security word did the bot choose?", "firewall", ["firewall"], "A security system that filters network traffic.", "It begins with F."],
    ["Language", "What word type did the bot choose?", "adjective", ["adjective"], "A word that describes a noun.", "It begins with A."],
    ["Music", "What instrument did the bot choose?", "clarinet", ["clarinet"], "A woodwind instrument played with a single reed.", "It begins with C."],
    ["Nature", "What natural event did the bot choose?", "eclipse", ["eclipse"], "One celestial object blocks the light of another.", "It begins with E."],
    ["Chemistry", "What element did the bot choose?", "oxygen", ["oxygen"], "A gas essential for human respiration, symbol O.", "It begins with O."],
    ["Economics", "What finance word did the bot choose?", "inflation", ["inflation"], "A general rise in prices that reduces purchasing power.", "It begins with I."],
  ],
  hard: [
    ["Geography", "What geography term did the bot choose?", "archipelago", ["archipelago"], "A chain or cluster of islands grouped together.", "It begins with A and has 11 letters."],
    ["Biology", "What cell structure did the bot choose?", "mitochondria", ["mitochondria", "mitochondrion"], "Organelles that generate much of a cell's usable energy.", "Often called the powerhouse of the cell."],
    ["Biology", "What process did the bot choose?", "metamorphosis", ["metamorphosis"], "A major biological transformation in body form during development.", "Butterflies famously undergo it."],
    ["Astronomy", "What astronomy term did the bot choose?", "supernova", ["supernova"], "A powerful stellar explosion that can briefly outshine a galaxy.", "It begins with S."],
    ["Astronomy", "What object did the bot choose?", "quasar", ["quasar"], "An extremely luminous active galactic nucleus powered by a distant supermassive black hole.", "It begins with Q."],
    ["Earth Science", "What layer did the bot choose?", "stratosphere", ["stratosphere"], "The atmospheric layer above the troposphere that contains most of the ozone layer.", "It begins with S."],
    ["Earth Science", "What term did the bot choose?", "tectonics", ["tectonics", "plate tectonics"], "The theory explaining the movement of Earth's large crustal plates.", "Plate ____ is the full phrase."],
    ["Chemistry", "What chemistry term did the bot choose?", "catalyst", ["catalyst"], "A substance that speeds up a chemical reaction without being consumed.", "It begins with C."],
    ["Chemistry", "What element did the bot choose?", "tungsten", ["tungsten"], "A dense metal with chemical symbol W and an exceptionally high melting point.", "Its symbol is W."],
    ["Physics", "What physics term did the bot choose?", "refraction", ["refraction"], "The bending of a wave when it enters a medium where its speed changes.", "Light does this when passing from air into water."],
    ["Physics", "What physics term did the bot choose?", "inertia", ["inertia"], "The tendency of an object to resist changes in its motion.", "Newton's first law is closely associated with it."],
    ["History", "What historical treaty did the bot choose?", "versailles", ["versailles", "treaty of versailles"], "The treaty signed in 1919 that formally ended the war between Germany and the Allied powers.", "It was signed after World War I."],
    ["History", "What empire did the bot choose?", "byzantine", ["byzantine", "byzantine empire"], "The eastern continuation of the Roman Empire centered on Constantinople.", "Its capital was Constantinople."],
    ["Literature", "What literary term did the bot choose?", "allegory", ["allegory"], "A story whose characters and events represent a deeper symbolic meaning.", "It begins with A."],
    ["Language", "What language term did the bot choose?", "onomatopoeia", ["onomatopoeia"], "A word formed to imitate the sound it describes.", "Buzz and hiss are examples."],
    ["Math", "What math term did the bot choose?", "hypotenuse", ["hypotenuse"], "The side opposite the right angle in a right triangle.", "It is the longest side of a right triangle."],
    ["Math", "What math term did the bot choose?", "logarithm", ["logarithm"], "The exponent to which a base must be raised to produce a given number.", "It is the inverse operation of exponentiation."],
    ["Computing", "What computing term did the bot choose?", "recursion", ["recursion"], "A technique where a function solves a problem by calling itself on smaller versions of that problem.", "The function calls itself."],
    ["Cybersecurity", "What security term did the bot choose?", "encryption", ["encryption"], "The process of transforming readable data into coded form to protect it from unauthorized access.", "It begins with E."],
    ["Economics", "What economics term did the bot choose?", "monopoly", ["monopoly"], "A market structure where a single seller dominates the supply of a product or service.", "It begins with M."],
  ],
};

function toQuestion(item) {
  return { category: item[0], question: item[1], answer: item[2], answers: item[3], hint: item[4], extra: item[5] };
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeGuess(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

export default function SoloModeLauncherV2() {
  const [homeTarget, setHomeTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("setup");
  const [playerName, setPlayerName] = useState("Player");
  const [difficulty, setDifficulty] = useState("easy");
  const [roundCount, setRoundCount] = useState(8);
  const [deck, setDeck] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [deadline, setDeadline] = useState(0);
  const [tick, setTick] = useState(Date.now());
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [extraClueUsed, setExtraClueUsed] = useState(false);
  const [roundResult, setRoundResult] = useState(null);
  const [history, setHistory] = useState([]);

  const config = DIFFICULTIES[difficulty];
  const current = deck[roundIndex] || null;
  const bot = BOTS[roundIndex % BOTS.length];
  const timeLeft = phase === "playing" && deadline ? Math.max(0, Math.ceil((deadline - tick) / 1000)) : config.seconds;
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
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const savedNickname = window.localStorage.getItem("friendguess-nickname");
    if (savedNickname?.trim()) setPlayerName(savedNickname.trim().slice(0, 18));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => {
    if (phase !== "playing") return undefined;
    const timer = window.setInterval(() => setTick(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && deadline && tick >= deadline) finishRound(false, "Time ran out.", 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, deadline, phase]);

  function startGame() {
    const pool = QUESTION_POOLS[difficulty].map(toQuestion);
    const nextDeck = shuffle(pool).slice(0, roundCount);
    const safeName = playerName.trim().slice(0, 18) || "Player";
    window.localStorage.setItem("friendguess-nickname", safeName);
    setPlayerName(safeName);
    setDeck(nextDeck); setRoundIndex(0); setScore(0); setStreak(0); setBestStreak(0); setHistory([]);
    setGuess(""); setWrongGuesses([]); setFeedback(""); setExtraClueUsed(false); setRoundResult(null);
    const now = Date.now(); setTick(now); setDeadline(now + config.seconds * 1000); setPhase("playing");
  }

  function finishRound(correct, message, points) {
    if (phase !== "playing" || !current) return;
    const nextStreak = correct ? streak + 1 : 0;
    if (correct) { setScore((s) => s + points); setStreak(nextStreak); setBestStreak((b) => Math.max(b, nextStreak)); }
    else setStreak(0);
    const result = { correct, message, points, answer: current.answer };
    setRoundResult(result);
    setHistory((h) => [...h, { correct, answer: current.answer }]);
    setPhase("result");
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!current || phase !== "playing") return;
    const normalized = normalizeGuess(guess);
    if (!normalized) return;
    const isCorrect = current.answers.some((answer) => normalizeGuess(answer) === normalized);
    if (isCorrect) {
      const speedBonus = Math.max(0, timeLeft * (difficulty === "hard" ? 3 : difficulty === "medium" ? 2 : 1));
      const missPenalty = wrongGuesses.length * (difficulty === "hard" ? 15 : 10);
      const cluePenalty = extraClueUsed ? config.cluePenalty : 0;
      const points = Math.max(25, config.basePoints + speedBonus - missPenalty - cluePenalty);
      finishRound(true, "Correct!", points);
      return;
    }
    const nextWrong = [...wrongGuesses, guess.trim()];
    setWrongGuesses(nextWrong); setGuess("");
    const remaining = config.attempts - nextWrong.length;
    if (remaining <= 0) finishRound(false, "Out of guesses.", 0);
    else setFeedback(`Not quite — ${remaining} guess${remaining === 1 ? "" : "es"} left.`);
  }

  function nextRound() {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= deck.length) { setPhase("finished"); return; }
    setRoundIndex(nextIndex); setGuess(""); setWrongGuesses([]); setFeedback(""); setExtraClueUsed(false); setRoundResult(null);
    const now = Date.now(); setTick(now); setDeadline(now + config.seconds * 1000); setPhase("playing");
  }

  function closeSolo() {
    setOpen(false); setPhase("setup"); setDeck([]); setHistory([]); setRoundIndex(0); setRoundResult(null);
  }

  const launcher = homeTarget ? createPortal(
    <div className={styles.launcherWrap}>
      <div className={styles.launcherDivider}><span>or play solo</span></div>
      <button className={styles.launcherButton} type="button" onClick={() => setOpen(true)}>
        <span><strong>Play solo vs bots</strong><small>Test your clue-solving skills</small></span>
      </button>
    </div>, homeTarget
  ) : null;

  const modal = open ? createPortal(
    <div className={styles.overlay}>
      <div className={styles.soloShell}>
        <div className={styles.topbar}>
          <button className={styles.backButton} onClick={closeSolo} type="button">←</button>
          <div className={styles.soloBrand}><span>FG</span><strong>Solo Challenge</strong></div>
          <div className={styles.topScore}>{score} pts</div>
        </div>

        {phase === "setup" && <div className={styles.setupCard}>
          <p className={styles.eyebrow}>Solo mode</p>
          <h2>How sharp is your guessing?</h2>
          <p className={styles.setupText}>Choose a difficulty. Easy uses familiar answers, Medium raises the knowledge level, and Hard gives you genuinely challenging clues and answers.</p>
          <label className={styles.label}>Nickname</label>
          <input className={styles.input} value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={18} />
          <label className={styles.label}>Difficulty</label>
          <div className={styles.difficultyGrid}>{Object.entries(DIFFICULTIES).map(([key, value]) => <button key={key} type="button" className={`${styles.difficultyCard} ${difficulty === key ? styles.selected : ""}`} onClick={() => setDifficulty(key)}><strong>{value.label}</strong><small>{value.description}</small></button>)}</div>
          <label className={styles.label}>Rounds</label>
          <select className={styles.input} value={roundCount} onChange={(e) => setRoundCount(Number(e.target.value))}><option value={5}>5 rounds</option><option value={8}>8 rounds</option><option value={10}>10 rounds</option></select>
          <button className={styles.primaryButton} type="button" onClick={startGame}>Start {DIFFICULTIES[difficulty].label} challenge</button>
        </div>}

        {phase === "playing" && current && <div className={styles.playArea}>
          <div className={styles.statusRow}><div><span className={styles.botAvatar}>{bot.avatar}</span><strong>{bot.name}</strong></div><span className={styles.roundPill}>Round {roundIndex + 1}/{deck.length}</span><span className={`${styles.timer} ${timeLeft <= 8 ? styles.timerDanger : ""}`}>{timeLeft}s</span></div>
          <div className={styles.progressTrack}><span style={{ width: `${((roundIndex + 1) / deck.length) * 100}%` }} /></div>
          <div className={styles.questionCard}>
            <p className={styles.category}>{current.category} · {config.label}</p>
            <h2>{current.question}</h2>
            <div className={styles.hintBox}><span>CLUE</span><p>{current.hint}</p></div>
            {extraClueUsed ? <div className={styles.extraClue}>{current.extra}</div> : <button type="button" className={styles.clueButton} onClick={() => setExtraClueUsed(true)}>Need another clue?{config.cluePenalty ? ` (-${config.cluePenalty} pts)` : ""}</button>}
            <form className={styles.guessForm} onSubmit={submitGuess}><input autoFocus className={styles.guessInput} value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Type your answer…" /><button className={styles.guessButton} type="submit">Guess</button></form>
            <div className={styles.gameMeta}><span>{config.attempts - wrongGuesses.length} guesses left</span><span>{config.label}</span><span>Streak {streak}</span></div>
            {feedback && <div className={styles.feedback}>{feedback}</div>}
            {wrongGuesses.length > 0 && <div className={styles.wrongList}><span>Previous:</span>{wrongGuesses.map((item, index) => <b key={`${item}-${index}`}>{item}</b>)}</div>}
          </div>
          <button className={styles.skipButton} type="button" onClick={() => finishRound(false, "Skipped.", 0)}>Skip & reveal answer</button>
        </div>}

        {phase === "result" && roundResult && <div className={styles.resultCard}>
          <p className={styles.eyebrow}>{roundResult.correct ? "Nice work" : "Answer revealed"}</p>
          <h2>{roundResult.message}</h2>
          <p>The answer was</p><div className={styles.revealAnswer}>{roundResult.answer}</div>
          {roundResult.correct && <div className={styles.pointsEarned}>+{roundResult.points} points</div>}
          <div className={styles.miniStats}><span>Score<br/><strong>{score}</strong></span><span>Streak<br/><strong>{streak}</strong></span><span>Difficulty<br/><strong>{config.label}</strong></span></div>
          <button className={styles.primaryButton} type="button" onClick={nextRound}>{roundIndex + 1 >= deck.length ? "See final score" : "Next question"}</button>
        </div>}

        {phase === "finished" && <div className={styles.resultCard}>
          <p className={styles.eyebrow}>Challenge complete</p><h2>{playerName}, your final score is {score}</h2>
          <div className={styles.finalStats}><div><strong>{score}</strong><span>Points</span></div><div><strong>{accuracy}%</strong><span>Accuracy</span></div><div><strong>{bestStreak}</strong><span>Best streak</span></div></div>
          <button className={styles.primaryButton} type="button" onClick={startGame}>Play again</button>
          <button className={styles.secondaryAction} type="button" onClick={() => setPhase("setup")}>Change difficulty</button>
        </div>}
      </div>
    </div>, document.body
  ) : null;

  return <>{launcher}{modal}</>;
}
