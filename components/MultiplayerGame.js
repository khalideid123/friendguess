"use client";
import { useEffect, useRef, useState } from "react";
import { useRoom } from "../lib/use-room";
import { Avatar, Confetti, Icon, Modal, Scoreboard } from "./GameUI";
import { useAudio } from "./AudioProvider";

export default function MultiplayerGame({ initialCode = "", onHome }) {
  const game = useRoom();
  const { state, identity, session, busy, error, connection } = game;
  const [nickname, setNickname] = useState(""),
    [code, setCode] = useState(initialCode),
    [tab, setTab] = useState(initialCode ? "join" : "create"),
    [rounds, setRounds] = useState(6),
    [answer, setAnswer] = useState(""),
    [hint, setHint] = useState(""),
    [guess, setGuess] = useState(""),
    [now, setNow] = useState(Date.now()),
    [modal, setModal] = useState(null),
    [copied, setCopied] = useState(""),
    [copyError, setCopyError] = useState("");
  const previousRound = useRef(null),
    previousStatus = useRef(null),
    feed = useRef(null),
    guessRef = useRef(null),
    timerSound = useRef(-1),
    baseScores = useRef({});
  const { play, unlock } = useAudio();
  const room = state?.room,
    players = state?.players || [],
    round = state?.currentRound,
    guesses = state?.guesses || [],
    me = identity?.playerId;
  const host = room?.host_user_id === me,
    isAnswerer = round?.answerer_user_id === me,
    answerer = players.find((p) => p.user_id === round?.answerer_user_id),
    winner = players.find((p) => p.user_id === round?.winner_user_id);
  const timeLeft = round?.ends_at
    ? Math.max(0, Math.ceil((new Date(round.ends_at).getTime() - now) / 1000))
    : 60;
  useEffect(() => {
    try {
      setNickname(
        (localStorage.getItem("friendguess-nickname") || "").slice(0, 18),
      );
    } catch {}
  }, []);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!round) return;
    if (previousRound.current !== round.id) {
      previousRound.current = round.id;
      baseScores.current = Object.fromEntries(
        players.map((p) => [p.user_id, p.score]),
      );
      setAnswer("");
      setHint("");
      setGuess("");
      play("round");
      timerSound.current = -1;
    }
    const signature = `${round.id}:${round.status}`;
    if (previousStatus.current !== signature) {
      if (round.status === "complete")
        play(round.winner_user_id ? "correct" : "wrong");
      previousStatus.current = signature;
    }
  }, [round, players, play]);
  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [guesses.length]);
  useEffect(() => {
    if (
      round?.status === "guessing" &&
      !isAnswerer &&
      window.matchMedia("(min-width: 760px)").matches
    )
      guessRef.current?.focus({ preventScroll: true });
  }, [round?.status, round?.id, isAnswerer]);
  useEffect(() => {
    if (
      round?.status === "guessing" &&
      timeLeft <= 5 &&
      timeLeft > 0 &&
      timerSound.current !== timeLeft
    ) {
      timerSound.current = timeLeft;
      play("tick");
    }
  }, [round?.status, timeLeft, play]);
  async function enter(e) {
    e.preventDefault();
    unlock();
    play("click");
    await game.enter(tab, nickname, rounds, code);
  }
  async function leave() {
    if (await game.leave()) {
      setModal(null);
      onHome();
    }
  }
  async function copy(kind) {
    setCopyError("");
    const text =
      kind === "code"
        ? room.code
        : `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      play("click");
    } catch {
      setCopyError(`Copy this ${kind}: ${text}`);
    }
  }
  async function submitAnswer(e) {
    e.preventDefault();
    const result = await game.roundAction("lock_answer", {
      p_answer: answer.trim(),
      p_hint: hint.trim(),
    });
    if (!result?.error) {
      setAnswer("");
      setHint("");
      play("click");
    }
  }
  async function submitGuess(e) {
    e.preventDefault();
    if (!guess.trim() || busy) return;
    const text = guess.trim();
    setGuess("");
    const result = await game.guess(text);
    if (result?.error) setGuess(text);
    guessRef.current?.focus({ preventScroll: true });
  }
  const errorBox = error ? (
    <div className="error-box" role="alert">
      {error}
    </div>
  ) : null;
  if (!session)
    return (
      <main className="friends-entry enter">
        <button className="text-button" onClick={onHome}>
          <Icon name="back" size={17} />
          Back home
        </button>
        <div className="friends-entry-header">
          <div className="entry-avatars">
            <Avatar index={1} />
            <Avatar index={3} />
            <Avatar index={2} />
          </div>
          <span className="eyebrow">YOUR PEOPLE. THEIR SECRETS.</span>
          <h1>Get the gang guessing.</h1>
          <p>No accounts. Just a nickname and a little intuition.</p>
        </div>
        <section className="entry-panel panel">
          <div className="entry-tabs">
            <button
              onClick={() => {
                setTab("create");
                game.setError("");
              }}
              aria-pressed={tab === "create"}
            >
              <Icon name="users" size={18} />
              Create a room
            </button>
            <button
              onClick={() => {
                setTab("join");
                game.setError("");
              }}
              aria-pressed={tab === "join"}
            >
              <Icon name="arrow" size={18} />
              Join a room
            </button>
          </div>
          <form onSubmit={enter}>
            <label htmlFor="nickname">What should we call you?</label>
            <input
              id="nickname"
              placeholder="Your nickname"
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              autoComplete="nickname"
            />
            <div className="field-note">{nickname.length}/18 characters</div>
            {tab === "create" ? (
              <>
                <label htmlFor="room-rounds">Make it a…</label>
                <select
                  id="room-rounds"
                  value={rounds}
                  onChange={(e) => setRounds(Number(e.target.value))}
                >
                  <option value={4}>Quick game · 4 rounds</option>
                  <option value={6}>Classic game · 6 rounds</option>
                  <option value={10}>Full game · 10 rounds</option>
                </select>
              </>
            ) : (
              <>
                <label htmlFor="room-code">Your friend's room code</label>
                <input
                  className="room-code-input"
                  id="room-code"
                  placeholder="ABCDE"
                  value={code}
                  onChange={(e) =>
                    setCode(
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 5),
                    )
                  }
                  maxLength={5}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </>
            )}
            {errorBox}
            <button
              className="button button-lime full"
              disabled={
                busy ||
                !identity ||
                !nickname.trim() ||
                (tab === "join" && code.length !== 5)
              }
            >
              {busy
                ? "Connecting…"
                : tab === "create"
                  ? "Create room"
                  : "Join room"}
              <Icon name="arrow" />
            </button>
          </form>
          <p className="fine-print">
            <Icon name="lock" size={14} /> Private rooms for 2–10 players. Share
            the code with your friends.
          </p>
        </section>
        <div className="multiplayer-how">
          <span>
            <b>01</b>One friend answers.
          </span>
          <span>
            <b>02</b>Everyone else guesses.
          </span>
          <span>
            <b>03</b>First correct wins.
          </span>
        </div>
      </main>
    );
  if (!room)
    return (
      <main className="loading-stage">
        <div className="loading-orbit" />
        <h2>Finding your friends…</h2>
        {connection && <p role="status">{connection}</p>}
        {errorBox}
        <button className="text-button" onClick={leave} disabled={busy}>
          Leave room
        </button>
      </main>
    );
  const board = (
    <Scoreboard
      players={players}
      playerId={me}
      hostId={room.host_user_id}
      answererId={round?.answerer_user_id}
      onKick={host ? (p) => setModal({ type: "kick", player: p }) : undefined}
    />
  );
  const sorted = [...players].sort((a, b) => b.score - a.score),
    champions = sorted.filter((p) => p.score === sorted[0]?.score);
  const header = (
    <div className="game-toolbar">
      <button
        className="text-button"
        onClick={() => setModal({ type: "leave" })}
      >
        <Icon name="back" size={17} />
        Leave room
      </button>
      <span className="game-mode-label">
        <Icon name="users" size={17} />
        {room.status === "lobby"
          ? "THE WAITING ROOM"
          : room.status === "finished"
            ? "FINAL SCORES"
            : `ROUND ${(round?.round_number || 0) + 1} / ${room.rounds_total}`}
      </span>
      <button
        className="room-pill"
        onClick={() => copy("code")}
        title="Copy room code"
      >
        {copied === "code" ? "Copied!" : room.code}
        <Icon name="copy" size={14} />
      </button>
    </div>
  );
  return (
    <main className="multiplayer-view enter">
      {header}
      {connection && (
        <div className="connection-banner" role="status">
          {connection}
        </div>
      )}
      {copyError && (
        <p className="notice" role="status">
          {copyError}
        </p>
      )}
      {room.status === "lobby" ? (
        <>
          <div className="lobby-heading">
            <span className="eyebrow">SOME THINGS ARE BETTER WITH FRIENDS</span>
            <h1>Your room. Your people.</h1>
            <p>Send the link. Start guessing.</p>
          </div>
          <div className="lobby-layout">
            <section className="lobby-players panel">
              <div className="section-heading">
                <h2>The crew</h2>
                <span className="pill tiny">{players.length}/10 players</span>
              </div>
              <div className="lobby-player-grid">
                {players.map((p, i) => (
                  <div
                    className={`lobby-player ${p.user_id === me ? "is-you" : ""}`}
                    key={p.user_id}
                  >
                    <Avatar index={i} />
                    <strong title={p.nickname}>{p.nickname}</strong>
                    <small>
                      {p.user_id === room.host_user_id ? (
                        <>
                          <Icon name="crown" size={13} />
                          Host
                        </>
                      ) : p.user_id === me ? (
                        "That’s you"
                      ) : (
                        "Ready to play"
                      )}
                    </small>
                    {host && p.user_id !== me && (
                      <button
                        className="kick-button"
                        aria-label={`Remove ${p.nickname}`}
                        onClick={() => setModal({ type: "kick", player: p })}
                      >
                        <Icon name="close" size={14} />
                      </button>
                    )}
                  </div>
                ))}
                {Array.from(
                  { length: Math.max(0, 4 - players.length) },
                  (_, i) => (
                    <div className="lobby-player empty" key={i}>
                      <span>?</span>
                      <small>Room for a friend</small>
                    </div>
                  ),
                )}
              </div>
              <div className="lobby-rule">
                <Icon name="hint" />
                <p>
                  One of you picks a secret answer. Everyone else races to read
                  their mind. The Answerer changes each round.
                </p>
              </div>
            </section>
            <aside className="invite-panel panel">
              <span className="eyebrow">THE CODE TO YOUR CREW</span>
              <button
                className="share-code"
                onClick={() => copy("code")}
                aria-label={`Copy room code ${room.code}`}
              >
                {room.code}
                <Icon name="copy" />
              </button>
              <button
                className="button button-violet full"
                onClick={() => copy("link")}
              >
                <Icon name="copy" />
                {copied === "link" ? "Invite link copied!" : "Copy invite link"}
              </button>
              <div className="invite-divider" />
              {host ? (
                <>
                  <label htmlFor="lobby-rounds">Round count</label>
                  <select
                    id="lobby-rounds"
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value))}
                  >
                    <option value={2}>2 rounds</option>
                    <option value={4}>4 rounds</option>
                    <option value={6}>6 rounds</option>
                    <option value={8}>8 rounds</option>
                    <option value={10}>10 rounds</option>
                  </select>
                  <p className="fine-print">
                    60 seconds per round · First correct guess wins
                  </p>
                  <button
                    className="button button-lime full"
                    disabled={busy || players.length < 2}
                    onClick={() =>
                      game.roomAction("start_game", {
                        p_question: "What is your favorite color?",
                        p_rounds_total: rounds,
                      })
                    }
                  >
                    {busy
                      ? "Starting…"
                      : players.length < 2
                        ? "Waiting for a friend"
                        : "Let’s play"}
                    <Icon name="play" />
                  </button>
                </>
              ) : (
                <div className="waiting-host">
                  <div className="pulse-dots">
                    <i />
                    <i />
                    <i />
                  </div>
                  <strong>Almost time to play.</strong>
                  <p>Waiting for the host to start.</p>
                </div>
              )}
              {errorBox}
            </aside>
          </div>
        </>
      ) : room.status === "finished" ? (
        <section className="multiplayer-final panel enter">
          <Confetti />
          <div className="results-trophy">
            <Icon name="trophy" size={36} />
          </div>
          <span className="eyebrow">THE MINDS HAVE BEEN READ</span>
          <h1>{champions.length > 1 ? "It’s a tie!" : "We have a winner!"}</h1>
          <div className="champion-names">
            {champions.map((p) => (
              <strong key={p.user_id}>{p.nickname}</strong>
            ))}
          </div>
          <p>{sorted[0]?.score || 0} points · A very well-read room.</p>
          <Scoreboard
            players={players}
            playerId={me}
            hostId={room.host_user_id}
          />
          {host ? (
            <button
              className="button button-lime full"
              onClick={() => game.roomAction("reset_room")}
              disabled={busy}
            >
              <Icon name="refresh" />
              Play again
            </button>
          ) : (
            <p className="waiting-message">
              Waiting for the host to start a rematch.
            </p>
          )}
          <button
            className="text-button result-home"
            onClick={leave}
            disabled={busy}
          >
            Leave room
          </button>
          {errorBox}
        </section>
      ) : !round ? (
        <div className="loading-stage">
          <div className="loading-orbit" />
          <p>Preparing the next round…</p>
        </div>
      ) : (
        <div className="multiplayer-stage">
          <aside className="players-panel panel">
            <div className="section-heading">
              <h2>The crew</h2>
              <span className="pill tiny">{players.length}</span>
            </div>
            {board}
            <p className="score-help">
              First correct: 100 pts
              <br />
              Speed bonus: up to 60 pts
            </p>
            {host && players.length < 2 && (
              <>
                <p className="fine-print">
                  Need more friends? Return to the lobby to invite them.
                </p>
                <button
                  className="button button-violet full"
                  onClick={() => game.roomAction("reset_room")}
                  disabled={busy}
                >
                  Back to lobby
                </button>
              </>
            )}
          </aside>
          <section className="multiplayer-play panel" key={round.id}>
            {round.status === "waiting" ? (
              <div className="answer-stage enter">
                <div className="answerer-avatar">
                  <Avatar
                    index={players.findIndex(
                      (p) => p.user_id === round.answerer_user_id,
                    )}
                  />
                  <span className="pill lime">
                    {isAnswerer ? "YOUR TURN TO ANSWER" : "GET READY"}
                  </span>
                </div>
                <span className="eyebrow">ROUND {round.round_number + 1}</span>
                <h1>{round.question}</h1>
                {isAnswerer ? (
                  <form onSubmit={submitAnswer}>
                    <p>Think of an answer your friends might know.</p>
                    <label htmlFor="secret-answer">Your secret answer</label>
                    <input
                      id="secret-answer"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      maxLength={40}
                      placeholder="Keep it short and guessable"
                      autoComplete="off"
                    />
                    <label htmlFor="answer-hint">
                      Give them a little nudge <small>optional</small>
                    </label>
                    <input
                      id="answer-hint"
                      value={hint}
                      onChange={(e) => setHint(e.target.value)}
                      maxLength={100}
                      placeholder="A clue everyone will see"
                      autoComplete="off"
                    />
                    <button
                      className="button button-lime full"
                      type="submit"
                      disabled={busy || !answer.trim()}
                    >
                      <Icon name="lock" />
                      {busy ? "Locking…" : "Lock my answer"}
                    </button>
                    <p className="fine-print">
                      <Icon name="lock" size={14} /> Only you can see your
                      answer until the round ends.
                    </p>
                  </form>
                ) : (
                  <>
                    <p>
                      <strong className="inline-name">
                        {answerer?.nickname}
                      </strong>{" "}
                      is choosing a secret answer.
                    </p>
                    <div className="pulse-dots">
                      <i />
                      <i />
                      <i />
                    </div>
                    <p className="fine-print">
                      You’ll have 60 seconds to guess. First correct wins.
                    </p>
                  </>
                )}
              </div>
            ) : round.status === "complete" ? (
              <div className="multiplayer-result enter">
                {winner && <Confetti />}
                <span className={`pill ${winner ? "lime" : "violet"}`}>
                  <Icon name={winner ? "bolt" : "clock"} size={16} />
                  {winner ? "FASTEST MIND IN THE ROOM" : "ROUND COMPLETE"}
                </span>
                <h1>
                  {winner ? (
                    <>
                      <span className="inline-name">{winner.nickname}</span> got
                      it first!
                    </>
                  ) : (
                    "A well-kept secret."
                  )}
                </h1>
                <p>The answer was</p>
                <strong className="answer-reveal">
                  {round.revealed_answer || "No answer locked"}
                </strong>
                {winner && (
                  <div className="winner-points">
                    +
                    {Math.max(
                      0,
                      winner.score -
                        (baseScores.current[winner.user_id] ?? winner.score),
                    )}{" "}
                    pts
                  </div>
                )}
                <Scoreboard
                  players={players}
                  playerId={me}
                  hostId={room.host_user_id}
                />
                {host ? (
                  <button
                    className="button button-lime full"
                    disabled={busy}
                    onClick={() =>
                      game.roomAction("next_round", {
                        p_question: "What is your favorite snack?",
                      })
                    }
                  >
                    {round.round_number + 1 >= room.rounds_total
                      ? "See final scores"
                      : "Next round"}
                    <Icon name="arrow" />
                  </button>
                ) : (
                  <p className="waiting-message">
                    Waiting for the host to continue…
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="question-meta">
                  <span className="pill violet">
                    <Icon name="lock" size={15} />
                    {isAnswerer ? "YOUR ANSWER IS LOCKED" : "READ THEIR MIND"}
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
                    style={{ width: `${(timeLeft / 60) * 100}%` }}
                    className={timeLeft <= 10 ? "urgent" : ""}
                  />
                </div>
                <div className="question-title">
                  <span className="eyebrow">
                    <span className="inline-name">{answerer?.nickname}</span>{" "}
                    PICKED AN ANSWER
                  </span>
                  <h1>{round.question}</h1>
                </div>
                <div className="locked-answer">
                  <Icon name="lock" size={16} />
                  {isAnswerer ? (
                    <span>
                      Your answer: <strong>{state.mySecret}</strong>
                    </span>
                  ) : (
                    <span>Their answer is a secret. For now.</span>
                  )}
                </div>
                {round.hint && (
                  <div className="multiplayer-hint">
                    <Icon name="hint" />
                    <p>{round.hint}</p>
                  </div>
                )}
                <div
                  className="guess-feed"
                  ref={feed}
                  role="log"
                  aria-label="Live guesses"
                  aria-live="polite"
                >
                  {guesses.length === 0 ? (
                    <div className="empty-feed">
                      <Icon name="brain" size={28} />
                      <p>
                        {isAnswerer
                          ? "Watch the guesses come in…"
                          : "Go on. Trust your first instinct."}
                      </p>
                    </div>
                  ) : (
                    guesses.slice(-50).map((g) => {
                      const p = players.find((p) => p.user_id === g.user_id);
                      return (
                        <div
                          className={`feed-line ${g.is_correct ? "correct" : g.is_close ? "close" : ""}`}
                          key={g.id}
                        >
                          <Avatar
                            index={Math.max(
                              0,
                              players.findIndex((p) => p.user_id === g.user_id),
                            )}
                            small
                          />
                          <div>
                            <strong>{p?.nickname || "A friend"}</strong>
                            <span>{g.guess}</span>
                          </div>
                          {g.is_correct ? (
                            <span className="feed-tag">Got it!</span>
                          ) : g.is_close ? (
                            <span className="feed-tag">Getting close!</span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
                {isAnswerer ? (
                  <p className="answerer-watching">
                    <Icon name="users" size={18} />
                    Sit back. Your friends are figuring you out.
                  </p>
                ) : (
                  <form className="solo-guess-form" onSubmit={submitGuess}>
                    <label htmlFor="friend-guess">Your guess</label>
                    <div className="guess-input-row">
                      <input
                        id="friend-guess"
                        ref={guessRef}
                        placeholder="What are they thinking?"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        maxLength={40}
                        autoComplete="off"
                        disabled={timeLeft === 0}
                        enterKeyHint="send"
                      />
                      <button
                        type="submit"
                        className="button button-lime"
                        disabled={busy || !guess.trim() || timeLeft === 0}
                      >
                        {busy ? "…" : "Guess"}
                        <Icon name="arrow" />
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
            {errorBox}
          </section>
        </div>
      )}
      {modal?.type === "leave" && (
        <Modal title="Leave this room?" onClose={() => setModal(null)}>
          <p>
            {host
              ? "The next player becomes host, so your friends can keep playing."
              : "Your spot and score will be removed. You can join again while the room is in the lobby."}
          </p>
          <button
            className="button button-violet full"
            onClick={leave}
            disabled={busy}
          >
            {busy ? "Leaving…" : "Leave room"}
          </button>
          <button
            className="button button-ghost full"
            onClick={() => setModal(null)}
          >
            Stay with friends
          </button>
          {errorBox}
        </Modal>
      )}
      {modal?.type === "kick" && (
        <Modal title="Remove this player?" onClose={() => setModal(null)}>
          <p>
            <strong className="inline-name">{modal.player.nickname}</strong>{" "}
            will leave this room and lose their score.
          </p>
          <button
            className="button button-violet full"
            disabled={busy}
            onClick={async () => {
              const result = await game.kick(modal.player.user_id);
              if (!result?.error) setModal(null);
            }}
          >
            Remove player
          </button>
          <button
            className="button button-ghost full"
            onClick={() => setModal(null)}
          >
            Keep them here
          </button>
          {errorBox}
        </Modal>
      )}
    </main>
  );
}
