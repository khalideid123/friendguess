"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const QUESTIONS = [
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

const AVATARS = ["😎", "🦊", "🐸", "🐼", "🐯", "🐵", "🐧", "🐙", "🦁", "🐨"];

function formatError(error) {
  const message = error?.message || "Something went wrong.";
  if (message.toLowerCase().includes("anonymous") && message.toLowerCase().includes("disabled")) {
    return "Anonymous play is not enabled in Supabase yet.";
  }
  return message;
}

export default function Home() {
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState(null);
  const [nickname, setNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [guesses, setGuesses] = useState([]);
  const [mySecret, setMySecret] = useState("");
  const [secretInput, setSecretInput] = useState("");
  const [guessInput, setGuessInput] = useState("");
  const [roundsTotal, setRoundsTotal] = useState(6);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  const currentRound = useMemo(() => {
    if (!room || room.current_round < 0) return null;
    return rounds.find((item) => item.round_number === room.current_round) || null;
  }, [room, rounds]);

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => b.score - a.score || new Date(a.joined_at) - new Date(b.joined_at)),
    [players]
  );

  const answerer = useMemo(
    () => players.find((player) => player.user_id === currentRound?.answerer_user_id) || null,
    [players, currentRound]
  );

  const winner = useMemo(
    () => players.find((player) => player.user_id === currentRound?.winner_user_id) || null,
    [players, currentRound]
  );

  const isHost = room?.host_user_id === userId;
  const isAnswerer = currentRound?.answerer_user_id === userId;
  const timeLeft = currentRound?.ends_at
    ? Math.max(0, Math.ceil((new Date(currentRound.ends_at).getTime() - now) / 1000))
    : 60;

  useEffect(() => {
    const saved = window.localStorage.getItem("friendguess-nickname");
    if (saved) setNickname(saved.slice(0, 18));

    async function ensureAnonymousSession() {
      setError("");
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        setUserId(sessionData.session.user.id);
        setAuthReady(true);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) {
        setError(formatError(signInError));
        setAuthReady(true);
        return;
      }
      setUserId(data.user?.id || data.session?.user?.id || null);
      setAuthReady(true);
    }

    ensureAnonymousSession();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshRoom = useCallback(async () => {
    if (!roomId) return;

    const [roomResult, playersResult, roundsResult] = await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).single(),
      supabase.from("players").select("*").eq("room_id", roomId).order("joined_at", { ascending: true }),
      supabase.from("rounds").select("*").eq("room_id", roomId).order("round_number", { ascending: true }),
    ]);

    if (roomResult.error) {
      setError(formatError(roomResult.error));
      return;
    }

    setRoom(roomResult.data);
    setPlayers(playersResult.data || []);
    setRounds(roundsResult.data || []);
    setRoundsTotal(roomResult.data.rounds_total || 6);

    const activeRound = (roundsResult.data || []).find(
      (item) => item.round_number === roomResult.data.current_round
    );

    if (activeRound) {
      const guessesResult = await supabase
        .from("guesses")
        .select("*")
        .eq("round_id", activeRound.id)
        .order("created_at", { ascending: true });
      setGuesses(guessesResult.data || []);

      if (activeRound.answerer_user_id === userId) {
        const secretResult = await supabase
          .from("secret_answers")
          .select("answer")
          .eq("round_id", activeRound.id)
          .maybeSingle();
        setMySecret(secretResult.data?.answer || "");
      } else {
        setMySecret("");
      }
    } else {
      setGuesses([]);
      setMySecret("");
    }
  }, [roomId, userId]);

  useEffect(() => {
    if (!roomId || !userId) return;
    refreshRoom();

    const channel = supabase
      .channel(`friendguess-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "rounds", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .on("postgres_changes", { event: "*", schema: "public", table: "guesses", filter: `room_id=eq.${roomId}` }, refreshRoom)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, refreshRoom]);

  useEffect(() => {
    if (!currentRound || currentRound.status !== "guessing" || timeLeft > 0) return;
    supabase.rpc("finish_round_timeout", { p_round_id: currentRound.id }).then(() => refreshRoom());
  }, [currentRound, timeLeft, refreshRoom]);

  function rememberNickname() {
    window.localStorage.setItem("friendguess-nickname", nickname.trim());
  }

  async function createRoom() {
    if (!nickname.trim() || !userId) return;
    setBusy(true);
    setError("");
    rememberNickname();

    const { data, error: rpcError } = await supabase.rpc("create_room", {
      p_nickname: nickname.trim(),
      p_rounds_total: roundsTotal,
    });

    setBusy(false);
    if (rpcError) {
      setError(formatError(rpcError));
      return;
    }

    const created = data?.[0];
    if (created?.room_id) setRoomId(created.room_id);
  }

  async function joinRoom() {
    if (!nickname.trim() || joinCode.length !== 5 || !userId) return;
    setBusy(true);
    setError("");
    rememberNickname();

    const { data, error: rpcError } = await supabase.rpc("join_room", {
      p_code: joinCode,
      p_nickname: nickname.trim(),
    });

    setBusy(false);
    if (rpcError) {
      setError(formatError(rpcError));
      return;
    }

    const joined = data?.[0];
    if (joined?.room_id) setRoomId(joined.room_id);
  }

  async function startGame() {
    if (!roomId || !isHost) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("start_game", {
      p_room_id: roomId,
      p_question: QUESTIONS[0],
      p_rounds_total: roundsTotal,
    });
    setBusy(false);
    if (rpcError) setError(formatError(rpcError));
    else refreshRoom();
  }

  async function lockAnswer(event) {
    event.preventDefault();
    if (!currentRound || !secretInput.trim()) return;
    setBusy(true);
    setError("");
    const { error: rpcError } = await supabase.rpc("lock_answer", {
      p_round_id: currentRound.id,
      p_answer: secretInput.trim(),
    });
    setBusy(false);
    if (rpcError) setError(formatError(rpcError));
    else {
      setMySecret(secretInput.trim());
      setSecretInput("");
      refreshRoom();
    }
  }

  async function submitGuess(event) {
    event.preventDefault();
    if (!currentRound || !guessInput.trim() || isAnswerer || currentRound.status !== "guessing") return;
    const submitted = guessInput.trim();
    setGuessInput("");
    setError("");

    const { error: insertError } = await supabase.from("guesses").insert({
      room_id: roomId,
      round_id: currentRound.id,
      user_id: userId,
      guess: submitted,
      is_correct: false,
    });

    if (insertError) setError(formatError(insertError));
  }

  async function advanceRound() {
    if (!isHost || !currentRound) return;
    setBusy(true);
    setError("");
    const nextIndex = room.current_round + 1;
    const { error: rpcError } = await supabase.rpc("next_round", {
      p_room_id: roomId,
      p_question: QUESTIONS[nextIndex % QUESTIONS.length],
    });
    setBusy(false);
    if (rpcError) setError(formatError(rpcError));
    else refreshRoom();
  }

  async function resetRoom() {
    if (!isHost) return;
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("reset_room", { p_room_id: roomId });
    setBusy(false);
    if (rpcError) setError(formatError(rpcError));
    else refreshRoom();
  }

  function leaveRoom() {
    setRoomId(null);
    setRoom(null);
    setPlayers([]);
    setRounds([]);
    setGuesses([]);
    setMySecret("");
    setError("");
  }

  if (!authReady) {
    return <main className="loading-screen"><div className="loader-card">Connecting to FriendGuess…</div></main>;
  }

  if (!roomId) {
    return (
      <main className="home-shell">
        <div className="bg-orb orb-a" />
        <div className="bg-orb orb-b" />
        <section className="hero-card">
          <div className="logo-mark">FG</div>
          <h1>FriendGuess</h1>
          <p className="tagline">How well do your friends actually know you?</p>
          <p className="no-account">No account. No email. Pick a nickname and play.</p>

          <label className="field-label" htmlFor="nickname">Nickname</label>
          <input
            id="nickname"
            className="big-input"
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 18))}
            placeholder="Enter your nickname"
            maxLength={18}
          />

          <label className="field-label" htmlFor="rounds">Rounds</label>
          <select id="rounds" className="big-input select-input" value={roundsTotal} onChange={(e) => setRoundsTotal(Number(e.target.value))}>
            <option value={4}>4 rounds</option>
            <option value={6}>6 rounds</option>
            <option value={8}>8 rounds</option>
            <option value={10}>10 rounds</option>
          </select>

          <button className="primary-button" onClick={createRoom} disabled={busy || !nickname.trim() || !userId}>
            {busy ? "Creating…" : "Create private room"}
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
            <button className="secondary-button" onClick={joinRoom} disabled={busy || !nickname.trim() || joinCode.length !== 5 || !userId}>
              Join
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}
        </section>
      </main>
    );
  }

  if (!room) {
    return <main className="loading-screen"><div className="loader-card">Loading room…</div></main>;
  }

  if (room.status === "lobby") {
    return (
      <main className="game-bg">
        <TopBar room={room} />
        <section className="lobby-wrap">
          <div className="lobby-card">
            <p className="eyebrow">PRIVATE ROOM</p>
            <h2>Waiting for friends…</h2>
            <p>Share this code. Friends only need the link, a nickname, and this room code.</p>
            <div className="share-code">{room.code}</div>

            <div className="player-grid">
              {players.map((player, index) => (
                <div className="player-tile" key={player.id}>
                  <span className="avatar">{AVATARS[index % AVATARS.length]}</span>
                  <strong>{player.nickname}</strong>
                  {player.user_id === room.host_user_id && <small>HOST</small>}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, index) => (
                <div className="player-tile empty" key={`empty-${index}`}>Waiting…</div>
              ))}
            </div>

            {isHost ? (
              <>
                <div className="settings-row">
                  <label>
                    Rounds
                    <select value={roundsTotal} onChange={(e) => setRoundsTotal(Number(e.target.value))}>
                      <option value={4}>4</option>
                      <option value={6}>6</option>
                      <option value={8}>8</option>
                      <option value={10}>10</option>
                    </select>
                  </label>
                  <span>60 seconds per turn</span>
                </div>
                <button className="primary-button" onClick={startGame} disabled={busy || players.length < 2}>
                  {players.length < 2 ? "Waiting for another player" : busy ? "Starting…" : "Start game"}
                </button>
              </>
            ) : (
              <div className="waiting-banner">Waiting for the host to start…</div>
            )}

            <button className="ghost-button" onClick={leaveRoom}>Leave room</button>
            {error && <div className="error-box">{error}</div>}
          </div>
        </section>
      </main>
    );
  }

  if (room.status === "finished") {
    const champion = sortedPlayers[0];
    return (
      <main className="game-bg confetti-bg">
        <section className="center-stage">
          <div className="result-card final-card">
            <div className="trophy">🏆</div>
            <p className="eyebrow">GAME OVER</p>
            <h2>{champion?.nickname || "Someone"} wins!</h2>
            <ScoreList players={sortedPlayers} />
            {isHost && <button className="primary-button" onClick={resetRoom} disabled={busy}>Play again</button>}
            <button className="ghost-button" onClick={leaveRoom}>Leave room</button>
          </div>
        </section>
      </main>
    );
  }

  if (!currentRound) {
    return <main className="loading-screen"><div className="loader-card">Preparing the round…</div></main>;
  }

  if (currentRound.status === "waiting") {
    if (isAnswerer) {
      return (
        <main className="game-bg">
          <GameHeader room={room} round={currentRound} timeLeft={60} />
          <section className="center-stage">
            <form className="answer-card" onSubmit={lockAnswer}>
              <div className="turn-badge">YOUR TURN</div>
              <h2>{currentRound.question}</h2>
              <p>Type your secret answer. Other players cannot read it.</p>
              <input
                autoFocus
                className="secret-input"
                value={secretInput}
                onChange={(event) => setSecretInput(event.target.value.slice(0, 40))}
                placeholder="Your secret answer…"
                maxLength={40}
              />
              <button className="primary-button" type="submit" disabled={busy || !secretInput.trim()}>
                {busy ? "Locking…" : "Lock answer 🔒"}
              </button>
              {error && <div className="error-box">{error}</div>}
            </form>
          </section>
        </main>
      );
    }

    return (
      <main className="game-bg">
        <GameHeader room={room} round={currentRound} timeLeft={60} />
        <section className="center-stage">
          <div className="answer-card">
            <div className="turn-badge">GET READY</div>
            <h2>{currentRound.question}</h2>
            <p><strong>{answerer?.nickname}</strong> is choosing a secret answer…</p>
            <div className="pulse-dots"><span /><span /><span /></div>
          </div>
        </section>
      </main>
    );
  }

  if (currentRound.status === "complete") {
    return (
      <main className="game-bg">
        <GameHeader room={room} round={currentRound} timeLeft={timeLeft} />
        <section className="center-stage">
          <div className="result-card">
            <p className="eyebrow">ROUND {currentRound.round_number + 1} COMPLETE</p>
            <h2>{winner ? `${winner.nickname} got it first!` : "Time ran out!"}</h2>
            <p>The answer was</p>
            <div className="reveal-answer">{currentRound.revealed_answer}</div>
            <ScoreList players={sortedPlayers} />
            {isHost ? (
              <button className="primary-button" onClick={advanceRound} disabled={busy}>
                {currentRound.round_number + 1 >= room.rounds_total ? "See final scores" : "Next round"}
              </button>
            ) : (
              <div className="waiting-banner">Waiting for the host…</div>
            )}
            {error && <div className="error-box">{error}</div>}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="game-bg">
      <GameHeader room={room} round={currentRound} timeLeft={timeLeft} />
      <div className="game-layout">
        <aside className="players-panel">
          <h3>Players</h3>
          {sortedPlayers.map((player, index) => (
            <div className={`score-player ${player.user_id === currentRound.answerer_user_id ? "active-player" : ""}`} key={player.id}>
              <span className="rank">#{index + 1}</span>
              <span className="avatar small">{AVATARS[players.findIndex((p) => p.id === player.id) % AVATARS.length]}</span>
              <div><strong>{player.nickname}</strong><small>{player.score} pts</small></div>
              {player.user_id === currentRound.answerer_user_id && <span className="answerer-dot" title="Answerer" />}
            </div>
          ))}
        </aside>

        <section className="play-panel">
          <div className="question-card">
            <p>{answerer?.nickname} answered:</p>
            <h2>{currentRound.question}</h2>
            {isAnswerer ? (
              <div className="hidden-answer">Your answer: <strong>{mySecret || "••••••"}</strong></div>
            ) : (
              <div className="hidden-answer">Secret answer: <strong>••••••••</strong></div>
            )}
          </div>

          <div className="guess-feed" aria-live="polite">
            {guesses.length === 0 && <p className="empty-feed">Guesses will appear here…</p>}
            {guesses.map((item) => {
              const player = players.find((p) => p.user_id === item.user_id);
              return (
                <div className={`feed-line ${item.is_correct ? "correct" : "guess"}`} key={item.id}>
                  {item.is_correct ? `${player?.nickname || "Someone"} guessed the answer!` : `${player?.nickname || "Player"}: ${item.guess}`}
                </div>
              );
            })}
          </div>

          {isAnswerer ? (
            <div className="answerer-controls">
              <p>Your answer is hidden. Watch your friends guess in real time.</p>
            </div>
          ) : (
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
          )}

          {error && <div className="error-box inline-error">{error}</div>}
        </section>
      </div>
    </main>
  );
}

function TopBar({ room }) {
  return (
    <header className="topbar">
      <div className="brand-small"><span>FG</span> FriendGuess</div>
      <div className="room-pill">Room <strong>{room.code}</strong></div>
    </header>
  );
}

function GameHeader({ room, round, timeLeft }) {
  return (
    <header className="topbar game-topbar">
      <div className="brand-small"><span>FG</span> FriendGuess</div>
      <div className="round-info">Round <strong>{round.round_number + 1}/{room.rounds_total}</strong></div>
      <div className={`timer ${timeLeft <= 10 ? "timer-danger" : ""}`}>{timeLeft}s</div>
      <div className="room-pill">Room <strong>{room.code}</strong></div>
    </header>
  );
}

function ScoreList({ players }) {
  return (
    <div className="score-list">
      {players.map((player, index) => (
        <div className="score-row" key={player.id}>
          <span>#{index + 1}</span>
          <strong>{player.nickname}</strong>
          <b>{player.score} pts</b>
        </div>
      ))}
    </div>
  );
}
