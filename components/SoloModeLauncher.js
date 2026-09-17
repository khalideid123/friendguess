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
  easy: {
    label: "Easy",
    seconds: 60,
    attempts: 6,
    basePoints: 100,
    hintKey: "easy",
    cluePenalty: 0,
    description: "Very clear hints, 6 guesses, 60 seconds",
  },
  medium: {
    label: "Medium",
    seconds: 45,
    attempts: 4,
    basePoints: 150,
    hintKey: "medium",
    cluePenalty: 20,
    description: "Clear hints, 4 guesses, 45 seconds",
  },
  hard: {
    label: "Hard",
    seconds: 30,
    attempts: 3,
    basePoints: 200,
    hintKey: "hard",
    cluePenalty: 30,
    description: "Shorter hints, 3 guesses, 30 seconds",
  },
};

const SOLO_QUESTIONS = [
  { category: "Fruit", question: "What fruit did the bot choose?", answer: "apple", answers: ["apple"], hints: { easy: "A very common red or green fruit that grows on trees.", medium: "It can be red or green and is common in school lunches.", hard: "Teachers are often pictured receiving this fruit." } },
  { category: "Fruit", question: "What fruit did the bot choose?", answer: "banana", answers: ["banana"], hints: { easy: "A long yellow fruit that you peel before eating.", medium: "It is yellow, curved, and comes in bunches.", hard: "A monkey is often shown eating this fruit." } },
  { category: "Food", question: "What food did the bot choose?", answer: "pizza", answers: ["pizza"], hints: { easy: "A round food with cheese and sauce, usually cut into slices.", medium: "It is baked, sliced, and often topped with cheese.", hard: "Pepperoni is a famous topping for it." } },
  { category: "Food", question: "What food did the bot choose?", answer: "burger", answers: ["burger", "hamburger"], hints: { easy: "A sandwich with a meat patty inside a round bun.", medium: "It usually comes in a bun with toppings like lettuce and cheese.", hard: "It is a classic fast-food meal served in a bun." } },
  { category: "Drink", question: "What drink did the bot choose?", answer: "water", answers: ["water"], hints: { easy: "A clear drink your body needs every day.", medium: "It is clear, has no calories, and comes from a faucet.", hard: "About three quarters of Earth is covered by it." } },
  { category: "Drink", question: "What drink did the bot choose?", answer: "milk", answers: ["milk"], hints: { easy: "A white drink that often comes from cows.", medium: "It is commonly poured over cereal.", hard: "It is a white drink known for calcium." } },
  { category: "Drink", question: "What drink did the bot choose?", answer: "coffee", answers: ["coffee"], hints: { easy: "A hot brown drink many adults have in the morning.", medium: "It is brewed from roasted beans and contains caffeine.", hard: "People often order it as a latte or espresso." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "cat", answers: ["cat", "kitty", "kitten"], hints: { easy: "A small pet that says meow.", medium: "This common house pet purrs and has whiskers.", hard: "It is known for purring and chasing mice." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "dog", answers: ["dog", "puppy"], hints: { easy: "A common pet that barks and wags its tail.", medium: "This pet is often called a person's best friend.", hard: "It is known for barking and fetching." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "lion", answers: ["lion"], hints: { easy: "A big wild cat with a mane that is called king of the jungle.", medium: "The male has a large mane and a loud roar.", hard: "This roaring big cat lives in a pride." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "elephant", answers: ["elephant"], hints: { easy: "A huge gray animal with a long trunk.", medium: "It is the largest land animal and has a trunk.", hard: "This giant animal uses its nose like a hand." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "fish", answers: ["fish"], hints: { easy: "An animal that lives in water and swims with fins.", medium: "It breathes underwater using gills.", hard: "It has fins instead of legs." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "bird", answers: ["bird"], hints: { easy: "An animal with feathers and wings that usually flies.", medium: "It has feathers, a beak, and lays eggs.", hard: "Most of these animals can fly and sing." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "turtle", answers: ["turtle"], hints: { easy: "A slow animal that carries a hard shell on its back.", medium: "It can pull its head into its shell.", hard: "This slow reptile has built-in armor." } },
  { category: "Animal", question: "What animal did the bot choose?", answer: "snake", answers: ["snake"], hints: { easy: "A long animal with no legs that slithers.", medium: "This reptile moves without legs.", hard: "It slithers and may hiss." } },
  { category: "Color", question: "What color did the bot choose?", answer: "blue", answers: ["blue"], hints: { easy: "The color of a clear daytime sky.", medium: "A clear sky and much of the ocean look this color.", hard: "It is a primary color often linked with the sky." } },
  { category: "Color", question: "What color did the bot choose?", answer: "red", answers: ["red"], hints: { easy: "The color of a stop sign and many roses.", medium: "Stop signs are this bright color.", hard: "This primary color is strongly linked with hearts." } },
  { category: "Color", question: "What color did the bot choose?", answer: "green", answers: ["green"], hints: { easy: "The color of grass and most leaves.", medium: "Grass and leaves are commonly this color.", hard: "Mixing blue and yellow makes this color." } },
  { category: "Space", question: "What object in the sky did the bot choose?", answer: "sun", answers: ["sun"], hints: { easy: "The bright object in the sky that gives Earth daylight and heat.", medium: "Earth travels around this very hot star.", hard: "It is the star at the center of our solar system." } },
  { category: "Space", question: "What object in the sky did the bot choose?", answer: "moon", answers: ["moon"], hints: { easy: "The large object you often see shining in the night sky.", medium: "It orbits Earth and changes shape in the sky.", hard: "Humans first landed on it in 1969." } },
  { category: "Space", question: "What object in the sky did the bot choose?", answer: "star", answers: ["star"], hints: { easy: "A tiny-looking point of light you see in the night sky.", medium: "The night sky is filled with these distant glowing objects.", hard: "Our Sun is actually one of these." } },
  { category: "Transport", question: "What vehicle did the bot choose?", answer: "car", answers: ["car", "automobile"], hints: { easy: "A common four-wheel vehicle people drive on roads.", medium: "Most families use this road vehicle to travel around town.", hard: "You drive it using a steering wheel and pedals." } },
  { category: "Transport", question: "What vehicle did the bot choose?", answer: "bus", answers: ["bus"], hints: { easy: "A large road vehicle that carries many passengers.", medium: "Students often ride one of these to school.", hard: "It has many seats and follows stops along a route." } },
  { category: "Transport", question: "What vehicle did the bot choose?", answer: "bicycle", answers: ["bicycle", "bike"], hints: { easy: "A two-wheel vehicle you move by pedaling.", medium: "It has two wheels, handlebars, and pedals.", hard: "You can ride it without any gasoline." } },
  { category: "Transport", question: "What vehicle did the bot choose?", answer: "airplane", answers: ["airplane", "plane", "aeroplane"], hints: { easy: "A large vehicle with wings that flies people through the sky.", medium: "You board this vehicle at an airport.", hard: "Pilots fly this vehicle between airports." } },
  { category: "Transport", question: "What vehicle did the bot choose?", answer: "train", answers: ["train"], hints: { easy: "A long vehicle that travels on railroad tracks.", medium: "It has connected cars and runs on tracks.", hard: "It stops at stations and travels by rail." } },
  { category: "Technology", question: "What device did the bot choose?", answer: "phone", answers: ["phone", "smartphone", "cellphone", "cell phone"], hints: { easy: "A small device you carry to call, text, and use apps.", medium: "You probably carry this device in your pocket every day.", hard: "It rings when someone calls you." } },
  { category: "Technology", question: "What device did the bot choose?", answer: "laptop", answers: ["laptop", "computer"], hints: { easy: "A portable computer that folds shut.", medium: "This computer has a screen attached to a keyboard and can travel with you.", hard: "It is a computer designed to sit on your lap." } },
  { category: "Sport", question: "What sport did the bot choose?", answer: "soccer", answers: ["soccer", "football"], hints: { easy: "A sport where players kick a black-and-white ball into a goal.", medium: "Players mainly use their feet to move the ball toward a goal.", hard: "A goalkeeper is the one player allowed to use hands in the box." } },
  { category: "Sport", question: "What sport did the bot choose?", answer: "basketball", answers: ["basketball"], hints: { easy: "A sport where players shoot an orange ball through a hoop.", medium: "Players dribble a ball and try to score in a hoop.", hard: "A three-pointer is a scoring play in this sport." } },
  { category: "Sport", question: "What sport did the bot choose?", answer: "tennis", answers: ["tennis"], hints: { easy: "A sport where players hit a ball over a net using rackets.", medium: "This sport uses rackets, a net, and a small yellow ball.", hard: "Love means zero in this sport." } },
  { category: "Season", question: "What season did the bot choose?", answer: "winter", answers: ["winter"], hints: { easy: "The cold season when it may snow.", medium: "It is the coldest season of the year.", hard: "Snow and freezing temperatures are common in this season." } },
  { category: "Season", question: "What season did the bot choose?", answer: "summer", answers: ["summer"], hints: { easy: "The hot season when many people go swimming and school is out.", medium: "It is usually the hottest season of the year.", hard: "Long hot days and vacations are common in this season." } },
  { category: "Place", question: "What place did the bot choose?", answer: "beach", answers: ["beach"], hints: { easy: "A sandy place next to the ocean where people swim.", medium: "You may build sandcastles and hear waves here.", hard: "This place is where land meets the sea and often has sand." } },
  { category: "Place", question: "What place did the bot choose?", answer: "mountain", answers: ["mountain"], hints: { easy: "A very tall natural landform that people climb.", medium: "It rises high above the land and may have snow on top.", hard: "Climbers try to reach the summit of one." } },
  { category: "Place", question: "What place did the bot choose?", answer: "school", answers: ["school"], hints: { easy: "A place students go to learn from teachers.", medium: "It has classrooms, teachers, and students.", hard: "Homework usually comes from this place." } },
  { category: "Place", question: "What place did the bot choose?", answer: "library", answers: ["library"], hints: { easy: "A quiet place full of books you can borrow.", medium: "You can get a library card and borrow books here.", hard: "Shelves of books and quiet reading are common here." } },
  { category: "Place", question: "What place did the bot choose?", answer: "hospital", answers: ["hospital"], hints: { easy: "A place where doctors and nurses treat sick or injured people.", medium: "Patients may stay here to receive medical care.", hard: "Doctors, nurses, and patient rooms fill this building." } },
  { category: "Job", question: "What job did the bot choose?", answer: "doctor", answers: ["doctor", "physician"], hints: { easy: "A medical professional who treats people when they are sick.", medium: "You may visit this person for a checkup.", hard: "This professional can diagnose illnesses." } },
  { category: "Job", question: "What job did the bot choose?", answer: "teacher", answers: ["teacher"], hints: { easy: "A person who teaches students in a classroom.", medium: "This person gives lessons and may assign homework.", hard: "Students learn from this person at school." } },
  { category: "Object", question: "What object did the bot choose?", answer: "pencil", answers: ["pencil"], hints: { easy: "A writing tool with graphite that often has an eraser.", medium: "You can write with it and erase your mistakes.", hard: "It is sharpened when the tip gets dull." } },
  { category: "Object", question: "What object did the bot choose?", answer: "book", answers: ["book"], hints: { easy: "An object with pages that you read.", medium: "It has pages, a cover, and words or pictures.", hard: "A library is full of these." } },
  { category: "Object", question: "What object did the bot choose?", answer: "chair", answers: ["chair"], hints: { easy: "A piece of furniture made for one person to sit on.", medium: "It usually has a seat, legs, and a back.", hard: "You pull this out before sitting at a table." } },
  { category: "Object", question: "What object did the bot choose?", answer: "table", answers: ["table"], hints: { easy: "A piece of furniture with a flat top where people eat or work.", medium: "Plates are often placed on top of this during a meal.", hard: "It is flat on top and usually surrounded by chairs." } },
  { category: "Object", question: "What object did the bot choose?", answer: "bed", answers: ["bed"], hints: { easy: "The furniture you sleep on at night.", medium: "It usually has a mattress and pillows.", hard: "You lie on this when it is time to sleep." } },
  { category: "Clothing", question: "What item did the bot choose?", answer: "shoe", answers: ["shoe", "shoes"], hints: { easy: "Something you wear on your foot before going outside.", medium: "You wear one on each foot.", hard: "Sneakers are a type of this." } },
  { category: "Clothing", question: "What item did the bot choose?", answer: "hat", answers: ["hat", "cap"], hints: { easy: "Something you wear on top of your head.", medium: "A cap is one type of this item.", hard: "It sits above your hair." } },
  { category: "Object", question: "What object did the bot choose?", answer: "clock", answers: ["clock"], hints: { easy: "An object that tells you what time it is.", medium: "You look at it to check the time.", hard: "It may have hands that move around numbers." } },
  { category: "Object", question: "What object did the bot choose?", answer: "key", answers: ["key"], hints: { easy: "A small object used to unlock a door or lock.", medium: "You put it into a lock to open something.", hard: "You may keep several of these on a ring." } },
  { category: "Object", question: "What object did the bot choose?", answer: "door", answers: ["door"], hints: { easy: "You open this to enter or leave a room.", medium: "It swings or slides open in a doorway.", hard: "It often has a handle and a lock." } },
  { category: "Weather", question: "What weather did the bot choose?", answer: "rain", answers: ["rain"], hints: { easy: "Water falling from clouds in drops.", medium: "You may carry an umbrella when this happens.", hard: "Clouds release this as drops of water." } },
  { category: "Weather", question: "What weather did the bot choose?", answer: "snow", answers: ["snow"], hints: { easy: "Soft white flakes that fall from the sky when it is cold.", medium: "People make snowmen from this in winter.", hard: "Frozen flakes fall from clouds and cover the ground." } },
  { category: "Nature", question: "What thing did the bot choose?", answer: "ice", answers: ["ice"], hints: { easy: "Water that has frozen solid and becomes very cold.", medium: "You may put cubes of this in a drink.", hard: "Water becomes this below its freezing point." } },
  { category: "Nature", question: "What thing did the bot choose?", answer: "fire", answers: ["fire"], hints: { easy: "Something hot with flames that can burn wood.", medium: "It gives heat and light and has flames.", hard: "A campfire is one example of this." } },
  { category: "Dessert", question: "What sweet food did the bot choose?", answer: "chocolate", answers: ["chocolate"], hints: { easy: "A brown sweet treat made from cocoa.", medium: "It can come as a candy bar and is made from cocoa.", hard: "Cocoa is the main ingredient in this sweet treat." } },
  { category: "Dessert", question: "What sweet food did the bot choose?", answer: "cake", answers: ["cake"], hints: { easy: "A sweet baked dessert often eaten on birthdays with candles.", medium: "Birthday candles are often placed on top of this dessert.", hard: "It is baked, frosted, and sliced for celebrations." } },
  { category: "Dessert", question: "What sweet food did the bot choose?", answer: "cookie", answers: ["cookie", "biscuit"], hints: { easy: "A small sweet baked snack that may have chocolate chips.", medium: "Chocolate chips are commonly baked into this round snack.", hard: "You might leave this sweet snack out with milk." } },
  { category: "Snack", question: "What snack did the bot choose?", answer: "popcorn", answers: ["popcorn"], hints: { easy: "A light snack made from popped corn that people often eat at movies.", medium: "This snack pops when heated and is popular at movie theaters.", hard: "Movie theaters are strongly associated with this crunchy snack." } },
  { category: "Entertainment", question: "What did the bot choose?", answer: "music", answers: ["music"], hints: { easy: "Something you listen to that has songs, sounds, and rhythm.", medium: "You may use headphones to listen to this.", hard: "Songs are a form of this." } },
  { category: "Entertainment", question: "What did the bot choose?", answer: "movie", answers: ["movie", "film"], hints: { easy: "A story you watch on a screen, often at a theater.", medium: "You might buy a ticket and popcorn to watch this.", hard: "Actors perform in this form of entertainment." } },
  { category: "Music", question: "What instrument did the bot choose?", answer: "guitar", answers: ["guitar"], hints: { easy: "A musical instrument with strings that you strum.", medium: "It usually has six strings and is played with your hands.", hard: "Rock musicians often strum this instrument." } },
];

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function normalizeGuess(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function SoloModeLauncher() {
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
  const timeLeft = phase === "playing" && deadline
    ? Math.max(0, Math.ceil((deadline - tick) / 1000))
    : config.seconds;

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
    endRound(false, "time", 0, wrongGuesses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, deadline, phase]);

  function startGame() {
    const nextDeck = shuffle(SOLO_QUESTIONS).slice(0, roundCount);
    const safeName = playerName.trim().slice(0, 18) || "Player";
    window.localStorage.setItem("friendguess-nickname", safeName);
    setPlayerName(safeName);
    setDeck(nextDeck);
    setRoundIndex(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setGuess("");
    setWrongGuesses([]);
    setFeedback("");
    setExtraClueUsed(false);
    setRoundResult(null);
    const now = Date.now();
    setTick(now);
    setDeadline(now + config.seconds * 1000);
    setPhase("playing");
  }

  function endRound(correct, reason, points = 0, guessesForRound = wrongGuesses) {
    if (!current) return;

    const record = {
      question: current.question,
      answer: current.answer,
      correct,
      reason,
      points,
      bot: bot.name,
      wrongGuesses: guessesForRound.length,
    };

    setHistory((items) => [...items, record]);
    setRoundResult(record);
    setPhase("round-result");
    setDeadline(0);
    setGuess("");
    setFeedback("");
  }

  function submitGuess(event) {
    event.preventDefault();
    if (phase !== "playing" || !current || !guess.trim()) return;

    const submitted = guess.trim().slice(0, 40);
    const normalized = normalizeGuess(submitted);
    const accepted = current.answers.some((answer) => normalizeGuess(answer) === normalized);

    if (accepted) {
      const secondsRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      const clueCost = extraClueUsed ? config.cluePenalty : 0;
      const points = Math.max(25, config.basePoints + secondsRemaining * 2 - wrongGuesses.length * 12 - clueCost);
      const nextStreak = streak + 1;
      setScore((value) => value + points);
      setStreak(nextStreak);
      setBestStreak((value) => Math.max(value, nextStreak));
      endRound(true, "correct", points, wrongGuesses);
      return;
    }

    const nextWrongGuesses = [...wrongGuesses, submitted];
    setWrongGuesses(nextWrongGuesses);
    setGuess("");
    setStreak(0);

    const guessesLeft = config.attempts - nextWrongGuesses.length;
    if (guessesLeft <= 0) {
      endRound(false, "attempts", 0, nextWrongGuesses);
    } else {
      setFeedback(`Not quite. ${guessesLeft} ${guessesLeft === 1 ? "guess" : "guesses"} left.`);
    }
  }

  function skipRound() {
    if (phase !== "playing") return;
    setStreak(0);
    endRound(false, "skip", 0, wrongGuesses);
  }

  function nextRound() {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= deck.length) {
      setPhase("finished");
      return;
    }

    setRoundIndex(nextIndex);
    setGuess("");
    setWrongGuesses([]);
    setFeedback("");
    setExtraClueUsed(false);
    setRoundResult(null);
    const now = Date.now();
    setTick(now);
    setDeadline(now + config.seconds * 1000);
    setPhase("playing");
  }

  function returnToSetup() {
    setPhase("setup");
    setDeck([]);
    setRoundIndex(0);
    setGuess("");
    setWrongGuesses([]);
    setFeedback("");
    setDeadline(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setExtraClueUsed(false);
    setRoundResult(null);
    setHistory([]);
  }

  const launcher = homeTarget ? createPortal(
    <div className={styles.launcherWrap}>
      <div className={styles.launcherDivider}><span>or practice solo</span></div>
      <button className={styles.launcherButton} type="button" onClick={() => setOpen(true)}>
        <span className={styles.launcherIcon}>🤖</span>
        <span><strong>Play solo vs bots</strong><small>Guess simple answers from clues</small></span>
      </button>
    </div>,
    homeTarget
  ) : null;

  const overlay = open ? createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="FriendGuess solo mode">
      <div className={styles.soloShell}>
        <header className={styles.topbar}>
          <button className={styles.backButton} type="button" onClick={() => setOpen(false)} aria-label="Close solo mode">←</button>
          <div className={styles.soloBrand}><span>FG</span><strong>Solo Guess</strong></div>
          {phase !== "setup" && <div className={styles.topScore}>{score} pts</div>}
        </header>

        {phase === "setup" && (
          <section className={styles.setupCard}>
            <div className={styles.botHero}>🤖</div>
            <p className={styles.eyebrow}>SINGLE PLAYER</p>
            <h2>Can you read the bot's clue?</h2>
            <p className={styles.setupText}>The bot chooses a very simple answer. You get a hint and try to figure it out. No friends needed.</p>

            <label className={styles.label} htmlFor="solo-name">Nickname</label>
            <input id="solo-name" className={styles.input} value={playerName} onChange={(event) => setPlayerName(event.target.value.slice(0, 18))} maxLength={18} />

            <div className={styles.label}>Difficulty</div>
            <div className={styles.difficultyGrid}>
              {Object.entries(DIFFICULTIES).map(([key, option]) => (
                <button
                  type="button"
                  key={key}
                  className={`${styles.difficultyCard} ${difficulty === key ? styles.selected : ""}`}
                  onClick={() => setDifficulty(key)}
                >
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </button>
              ))}
            </div>

            <label className={styles.label} htmlFor="solo-rounds">Rounds</label>
            <select id="solo-rounds" className={styles.input} value={roundCount} onChange={(event) => setRoundCount(Number(event.target.value))}>
              <option value={5}>5 rounds</option>
              <option value={8}>8 rounds</option>
              <option value={10}>10 rounds</option>
            </select>

            <button className={styles.primaryButton} type="button" onClick={startGame}>Start solo game</button>
          </section>
        )}

        {phase === "playing" && current && (
          <section className={styles.playArea}>
            <div className={styles.statusRow}>
              <div><span className={styles.botAvatar}>{bot.avatar}</span><strong>{bot.name} Bot</strong></div>
              <div className={styles.roundPill}>Round {roundIndex + 1}/{deck.length}</div>
              <div className={`${styles.timer} ${timeLeft <= 10 ? styles.timerDanger : ""}`}>{timeLeft}s</div>
            </div>

            <div className={styles.progressTrack}><span style={{ width: `${((roundIndex + 1) / deck.length) * 100}%` }} /></div>

            <div className={styles.questionCard}>
              <p className={styles.category}>{current.category}</p>
              <h2>{current.question}</h2>
              <div className={styles.hintBox}>
                <span>💡 HINT</span>
                <p>{current.hints[config.hintKey]}</p>
              </div>

              {(difficulty === "easy" || extraClueUsed) && (
                <div className={styles.extraClue}>
                  Extra clue: starts with <strong>{current.answer[0].toUpperCase()}</strong> and has <strong>{current.answer.replace(/\s/g, "").length}</strong> letters.
                </div>
              )}

              {difficulty !== "easy" && !extraClueUsed && (
                <button className={styles.clueButton} type="button" onClick={() => setExtraClueUsed(true)}>
                  Need another clue? {config.cluePenalty ? `(-${config.cluePenalty} pts)` : ""}
                </button>
              )}
            </div>

            <form className={styles.guessForm} onSubmit={submitGuess}>
              <input
                className={styles.guessInput}
                autoFocus
                value={guess}
                onChange={(event) => setGuess(event.target.value.slice(0, 40))}
                placeholder="Type your answer…"
                maxLength={40}
                autoComplete="off"
              />
              <button className={styles.guessButton} type="submit" disabled={!guess.trim()}>Guess</button>
            </form>

            <div className={styles.gameMeta}>
              <span>{Math.max(0, config.attempts - wrongGuesses.length)} guesses left</span>
              <span>🔥 Streak {streak}</span>
              <span>{config.label}</span>
            </div>

            {feedback && <div className={styles.feedback} aria-live="polite">{feedback}</div>}

            {wrongGuesses.length > 0 && (
              <div className={styles.wrongList}>
                <span>Previous guesses:</span>
                {wrongGuesses.map((item, index) => <b key={`${item}-${index}`}>{item}</b>)}
              </div>
            )}

            <button className={styles.skipButton} type="button" onClick={skipRound}>Skip & reveal answer</button>
          </section>
        )}

        {phase === "round-result" && current && roundResult && (
          <section className={styles.resultCard}>
            <div className={styles.resultEmoji}>{roundResult.correct ? "✅" : "💡"}</div>
            <p className={styles.eyebrow}>ROUND {roundIndex + 1} COMPLETE</p>
            <h2>{roundResult.correct ? "You got it!" : roundResult.reason === "time" ? "Time ran out" : roundResult.reason === "attempts" ? "Out of guesses" : "Answer revealed"}</h2>
            <p>The bot's answer was</p>
            <div className={styles.revealAnswer}>{current.answer}</div>
            {roundResult.correct && <div className={styles.pointsEarned}>+{roundResult.points} points</div>}
            <div className={styles.miniStats}>
              <span>Total <strong>{score}</strong></span>
              <span>Streak <strong>{streak}</strong></span>
              <span>Correct <strong>{correctCount}/{history.length}</strong></span>
            </div>
            <button className={styles.primaryButton} type="button" onClick={nextRound}>
              {roundIndex + 1 >= deck.length ? "See results" : "Next bot clue"}
            </button>
          </section>
        )}

        {phase === "finished" && (
          <section className={styles.resultCard}>
            <div className={styles.resultEmoji}>🏆</div>
            <p className={styles.eyebrow}>SOLO GAME COMPLETE</p>
            <h2>{playerName}, you scored {score} points!</h2>
            <div className={styles.finalStats}>
              <div><strong>{correctCount}/{history.length}</strong><span>Correct</span></div>
              <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
              <div><strong>{bestStreak}</strong><span>Best streak</span></div>
            </div>
            <div className={styles.historyList}>
              {history.map((item, index) => (
                <div key={`${item.answer}-${index}`}>
                  <span>{item.correct ? "✅" : "➖"}</span>
                  <strong>{item.answer}</strong>
                  <small>{item.correct ? `+${item.points} pts` : "0 pts"}</small>
                </div>
              ))}
            </div>
            <button className={styles.primaryButton} type="button" onClick={startGame}>Play again</button>
            <button className={styles.secondaryAction} type="button" onClick={returnToSetup}>Change difficulty</button>
            <button className={styles.skipButton} type="button" onClick={() => setOpen(false)}>Back to FriendGuess</button>
          </section>
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return <>{launcher}{overlay}</>;
}
