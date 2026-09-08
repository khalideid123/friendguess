"use client";

import { useEffect, useMemo, useState } from "react";

const QUESTION_BANK = [
  { question: "What is your favorite color?", answer: "blue" },
  { question: "What food could you eat every week?", answer: "pizza" },
  { question: "What country would you most like to visit?", answer: "japan" },
  { question: "What is your favorite season?", answer: "summer" },
  { question: "What animal would you want as a pet?", answer: "cat" },
  { question: "What is your favorite fast-food place?", answer: "chick-fil-a" },
];

const DEMO_PLAYERS = [
  { id: "you", name: "You", score: 0, avatar: "😎" },
  { id: "maya", name: "Maya", score: 0, avatar: "🦊" },
  { id: "noah", name: "Noah", score: 0, avatar: "🐸" },
  { id: "zoe", name: "Zoe", score: 0, avatar: "🐼" },
];

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function clean(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function Home() {
  const [screen, setScreen] = useState("home");
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [round, setRound] = useState(0);
  const [roundsTotal, setRoundsTotal] = useState(6);
  const [answererIndex, setAnswererIndex] = useState(0);
  const [secretAnswer, setSecretAnswer] = useState("");
  const [guess, setGuess] = useState("");
  const [feed, setFeed] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [winner, setWinner] = useState(null);

  const currentQuestion = QUESTION_BANK[round % QUESTION_BANK.length];
  const answerer = players[answererIndex] || players[0];
  const isMyTurn = answerer?.id === "you";
  const expectedAnswer = isMyTurn ? secretAnswer : currentQuestion?.answer || "";

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score),
    [players]
  );

  useEffect(() => {
    if (screen !== "guessing") return;
    if (timeLeft <= 0) {
      setWinner(null);
      setScreen("roundResult");
      return;
    }
    const timer = setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [screen, timeLeft]);

  function enterLobby(code = makeRoomCode()) {
    setRoomCode(code.toUpperCase());
    setPlayers([{ ...DEMO_PLAYERS[0], name: name.trim() || "You" }]);
    setScreen("lobby");
  }

  function fillDemoRoom() {
    const myName = players[0]?.name || name.trim() || "You";
    setPlayers(DEMO_PLAYERS.map((player, index) => index === 0 ? { ...player, name: myName } : player));
  }

  function beginGame() {
    const readyPlayers = players.length >= 2 ? players : DEMO_PLAYERS;
    setPlayers(readyPlayers);
    setRound(0);
    setAnswererIndex(0);
    setFeed([]);
    setWinner(null);
    setTimeLeft(60);
    setSecretAnswer("");
    setScreen(readyPlayers[0].id === "you" ? "answer" : "guessing");
  }

  function lockAnswer(event) {
    event.preventDefault();
    if (!secretAnswer.trim()) return;
    setFeed([{ id: Date.now(), type: "system", text: `${answerer.name} locked in an answer.` }]);
    setTimeLeft(60);
    setScreen("guessing");
  }

  function submitGuess(event) {
    event.preventDefault();
    if (!guess.trim() || isMyTurn || screen !== "guessing") return;

    const submitted = guess.trim();
    setGuess("");

    if (clean(submitted) === clean(expectedAnswer)) {
      const points = 100 + timeLeft;
      setPlayers((current) => current.map((player) =>
        player.id === "you" ? { ...player, score: player.score + points } : player
      ));
      setFeed((current) => [
        ...current,
        { id: Date.now(), type: "correct", text: `${players[0]?.name || "You"} guessed the answer! +${points}` },
      ]);
      setWinner(players[0] || null);
      setTimeout(() => setScreen("roundResult"), 450);
      return;
    }

    setFeed((current) => [
      ...current,
      { id: Date.now(), type: "guess", text: `${players[0]?.name || "You"}: ${submitted}` },
    ]);
  }

  function simulateFriendWin() {
    const friend = players.find((player) => player.id !== "you");
    if (!friend) return;
    const points = 100 + timeLeft;
    setPlayers((current) => current.map((player) =>
      player.id === friend.id ? { ...player, score: player.score + points } : player
    ));
    setFeed((current) => [
      ...current,
      { id: Date.now(), type: "guess", text: `${friend.name}: red` },
      { id: Date.now() + 1, type: "guess", text: `${friend.name}: green` },
      { id: Date.now() + 2, type: "correct", text: `${friend.name} guessed the answer! +${points}` },
    ]);
    setWinner(friend);
    setTimeout(() => setScreen("roundResult"), 550);
  }

  function nextRound() {
    const nextRoundNumber = round + 1;
    if (nextRoundNumber >= roundsTotal) {
      setScreen("final");
      return;
    }

    const nextAnswererIndex = (answererIndex + 1) % players.length;
    setRound(nextRoundNumber);
    setAnswererIndex(nextAnswererIndex);
    setSecretAnswer("");
    setGuess("");
    setWinner(null);
    setFeed([]);
    setTimeLeft(60);
    setScreen(players[nextAnswererIndex]?.id === "you" ? "answer" : "guessing");
  }

  function resetGame() {
    setPlayers((current) => current.map((player) => ({ ...player, score: 0 })));
    setRound(0);
    setAnswererIndex(0);
    setSecretAnswer("");
    setGuess("");
    setWinner(null);
    setFeed([]);
    setTimeLeft(60);
    setScreen("lobby");
  }

  if (screen === "home") {
    return (
      <main className="home-shell">
        <div className="floating-shape shape-one" />
        <div className="floating-shape shape-two" />
        <section className="hero-card">
          <div className="logo-mark">FG</div>
          <h1>FriendGuess</h1>
          <p className="tagline">How well do your friends actually know you?</p>

          <label className="field-label" htmlFor="player-name">Your name</label>
          <input
            id="player-name"
            className="big-input"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 18))}
            placeholder="Enter a nickname"
            maxLength={18}
          />

          <button className="primary-button" onClick={() => enterLobby()}>
            Create private room
          </button>

          <div className="divider"><span>or join a friend</span></div>

          <div className="join-row">
            <input
              aria-label="Room code"
              className="code-input"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
              placeholder="ROOM CODE"
              maxLength={5}
            />
            <button className="secondary-button" onClick={() => joinCode.length === 5 && enterLobby(joinCode)}>
              Join
            </button>
          </div>

          <p className="prototype-note">Original party-game prototype. Online sync will be connected with Supabase Realtime.</p>
        </section>
      </main>
    );
  }

  if (screen === "lobby") {
    return (
      <main className="game-bg">
        <header className="topbar">
          <div className="brand-small"><span>FG</span> FriendGuess</div>
          <div className="room-pill">Room <strong>{roomCode}</strong></div>
        </header>

        <section className="lobby-wrap">
          <div className="lobby-card">
            <p className="eyebrow">PRIVATE ROOM</p>
            <h2>Waiting for friends...</h2>
            <p>Share the room code. When everybody is in, start the game.</p>

            <div className="share-code">{roomCode}</div>

            <div className="player-grid">
              {players.map((player) => (
                <div className="player-tile" key={player.id}>
                  <span className="avatar">{player.avatar}</span>
                  <strong>{player.name}</strong>
                  {player.id === "you" && <small>HOST</small>}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, index) => (
                <div className="player-tile empty" key={`empty-${index}`}>Waiting...</div>
              ))}
            </div>

            {players.length < 2 && (
              <button className="ghost-button" onClick={fillDemoRoom}>Fill with demo friends</button>
            )}

            <div className="settings-row">
              <label>
                Rounds
                <select value={roundsTotal} onChange={(event) => setRoundsTotal(Number(event.target.value))}>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>
              </label>
              <span>60 seconds per turn</span>
            </div>

            <button className="primary-button" disabled={players.length < 2} onClick={beginGame}>
              Start game
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "answer") {
    return (
      <main className="game-bg">
        <GameHeader round={round} roundsTotal={roundsTotal} timeLeft={60} roomCode={roomCode} />
        <section className="center-stage">
          <form className="answer-card" onSubmit={lockAnswer}>
            <div className="turn-badge">YOUR TURN</div>
            <h2>{currentQuestion.question}</h2>
            <p>Type your secret answer. Nobody else should be able to see it.</p>
            <input
              autoFocus
              className="secret-input"
              value={secretAnswer}
              onChange={(event) => setSecretAnswer(event.target.value.slice(0, 40))}
              placeholder="Your secret answer..."
              maxLength={40}
            />
            <button className="primary-button" type="submit">Lock answer 🔒</button>
          </form>
        </section>
      </main>
    );
  }

  if (screen === "roundResult") {
    return (
      <main className="game-bg">
        <GameHeader round={round} roundsTotal={roundsTotal} timeLeft={timeLeft} roomCode={roomCode} />
        <section className="center-stage">
          <div className="result-card">
            <p className="eyebrow">ROUND {round + 1} COMPLETE</p>
            <h2>{winner ? `${winner.name} got it first!` : "Time ran out!"}</h2>
            <p>The answer was</p>
            <div className="reveal-answer">{expectedAnswer || currentQuestion.answer}</div>
            <ScoreList players={players} />
            <button className="primary-button" onClick={nextRound}>
              {round + 1 >= roundsTotal ? "See final scores" : "Next round"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (screen === "final") {
    const champion = sortedPlayers[0];
    return (
      <main className="game-bg confetti-bg">
        <section className="center-stage">
          <div className="result-card final-card">
            <div className="trophy">🏆</div>
            <p className="eyebrow">GAME OVER</p>
            <h2>{champion?.name || "Someone"} wins!</h2>
            <ScoreList players={sortedPlayers} />
            <button className="primary-button" onClick={resetGame}>Play again</button>
            <button className="ghost-button" onClick={() => setScreen("home")}>Leave room</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-bg">
      <GameHeader round={round} roundsTotal={roundsTotal} timeLeft={timeLeft} roomCode={roomCode} />
      <div className="game-layout">
        <aside className="players-panel">
          <h3>Players</h3>
          {sortedPlayers.map((player, index) => (
            <div className={`score-player ${player.id === answerer?.id ? "active-player" : ""}`} key={player.id}>
              <span className="rank">#{index + 1}</span>
              <span className="avatar small">{player.avatar}</span>
              <div><strong>{player.name}</strong><small>{player.score} pts</small></div>
              {player.id === answerer?.id && <span className="answerer-dot" title="Answerer" />}
            </div>
          ))}
        </aside>

        <section className="play-panel">
          <div className="question-card">
            <p>{answerer?.name} answered:</p>
            <h2>{currentQuestion.question}</h2>
            {isMyTurn ? (
              <div className="hidden-answer">Your answer: <strong>{secretAnswer}</strong></div>
            ) : (
              <div className="hidden-answer">Secret answer: <strong>••••••••</strong></div>
            )}
          </div>

          <div className="guess-feed" aria-live="polite">
            {feed.length === 0 && <p className="empty-feed">Guesses will appear here...</p>}
            {feed.map((item) => (
              <div className={`feed-line ${item.type}`} key={item.id}>{item.text}</div>
            ))}
          </div>

          {isMyTurn ? (
            <div className="answerer-controls">
              <p>Your answer is hidden. Your friends would be guessing from their devices.</p>
              <button className="secondary-button" onClick={simulateFriendWin}>Simulate friends guessing</button>
            </div>
          ) : (
            <form className="guess-form" onSubmit={submitGuess}>
              <input
                autoFocus
                value={guess}
                onChange={(event) => setGuess(event.target.value.slice(0, 40))}
                placeholder="Type a guess..."
                maxLength={40}
              />
              <button type="submit">Guess</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function GameHeader({ round, roundsTotal, timeLeft, roomCode }) {
  return (
    <header className="game-header">
      <div className="brand-small"><span>FG</span> FriendGuess</div>
      <div className="game-meta">
        <span>Round <strong>{round + 1}/{roundsTotal}</strong></span>
        <span className={timeLeft <= 10 ? "timer danger" : "timer"}>⏱ {timeLeft}s</span>
        <span>Room <strong>{roomCode}</strong></span>
      </div>
    </header>
  );
}

function ScoreList({ players }) {
  return (
    <div className="result-scores">
      {[...players].sort((a, b) => b.score - a.score).map((player, index) => (
        <div key={player.id}>
          <span>{index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`} {player.name}</span>
          <strong>{player.score} pts</strong>
        </div>
      ))}
    </div>
  );
}
