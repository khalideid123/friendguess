"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AudioProvider, useAudio } from "./AudioProvider";
import { Avatar, Brand, Icon, Milo, Modal } from "./GameUI";
import {
  BADGES,
  EMPTY_PROFILE,
  PROFILE_KEY,
  RUN_KEY,
  applyProgress,
  levelInfo,
  readProfile,
  safeRead,
  safeWrite,
} from "../lib/progress";
import { utcDay } from "../lib/solo-engine";

const Loading = () => (
  <div className="loading-stage">
    <div className="loading-orbit" />
    <p>Getting the game ready…</p>
  </div>
);
const SoloGame = dynamic(() => import("./SoloGame"), {
  loading: Loading,
  ssr: false,
});
const MultiplayerGame = dynamic(() => import("./MultiplayerGame"), {
  loading: Loading,
  ssr: false,
});

export default function GameHub() {
  return (
    <AudioProvider>
      <Hub />
    </AudioProvider>
  );
}
function Hub() {
  const [view, setView] = useState("home"),
    [profile, setProfile] = useState(EMPTY_PROFILE),
    [difficulty, setDifficulty] = useState("easy"),
    [launch, setLaunch] = useState(null),
    [savedRun, setSavedRun] = useState(null),
    [modal, setModal] = useState(null),
    [joinCode, setJoinCode] = useState(""),
    [day, setDay] = useState(""),
    [notice, setNotice] = useState("");
  const { enabled, toggle, play, unlock } = useAudio();
  const screen = useRef(null);
  useEffect(() => {
    setProfile(readProfile());
    const saved = safeRead(RUN_KEY, null);
    if (
      saved?.deck?.length === 10 &&
      ["playing", "result"].includes(saved.phase) &&
      saved.round?.config
    )
      setSavedRun(saved);
    const code = new URLSearchParams(window.location.search).get("room");
    if (code && /^[A-Z0-9]{5}$/i.test(code)) {
      setJoinCode(code.toUpperCase());
      setView("friends");
    }
    setDay(utcDay());
    const timer = setInterval(() => setDay(utcDay()), 30000);
    return () => clearInterval(timer);
  }, []);
  const saveProfile = useCallback((p) => {
    setProfile(p);
    if (!safeWrite(PROFILE_KEY, p))
      setNotice("Progress can't be saved in this browser. You can still play.");
  }, []);
  const onProgress = useCallback((run) => {
    const next = applyProgress(readProfile(), run);
    setProfile(next);
    safeWrite(PROFILE_KEY, next);
    if (run.phase === "finished") {
      safeWrite(RUN_KEY, null);
      setSavedRun(null);
    } else {
      safeWrite(RUN_KEY, run);
      setSavedRun(run);
    }
  }, []);
  function goHome() {
    setView("home");
    setModal(null);
    play("click");
  }
  function startSolo(mode = difficulty, resume = null) {
    unlock();
    play("click");
    if (savedRun && !resume) {
      setLaunch({ mode });
      setModal("replace");
      return;
    }
    launchSolo(mode, resume);
  }
  function launchSolo(mode, resume = null) {
    setLaunch({ mode, resume, id: crypto.randomUUID() });
    setModal(null);
    setView("solo");
  }
  const lv = levelInfo(profile.xp);
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else setNotice("Use your browser's full-screen option.");
    } catch {
      setNotice("Full screen isn't available here. You can keep playing.");
    }
  }
  return (
    <div className={`game-shell theme-${profile.theme}`} ref={screen}>
      <div className="ambient" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <header className="app-header">
        <Brand
          onClick={() => (view === "home" ? goHome() : setModal("home"))}
        />
        <div className="header-right">
          <button className="level-pill" onClick={() => setModal("progress")}>
            <span className="mini-star">
              <Icon name="star" size={14} />
            </span>
            <span>Level {lv.level}</span>
            <span className="mini-xp">
              <i style={{ width: `${(lv.current / lv.next) * 100}%` }} />
            </span>
          </button>
          <button
            className="icon-button"
            onClick={() => setModal("help")}
            aria-label="How to play"
          >
            <Icon name="help" />
          </button>
          <button
            className="icon-button"
            onClick={toggle}
            aria-label={enabled ? "Mute sounds" : "Enable sounds"}
            aria-pressed={enabled}
          >
            <Icon name={enabled ? "sound" : "muted"} />
          </button>
          <button
            className="icon-button fullscreen-button"
            onClick={fullscreen}
            aria-label="Toggle full screen"
          >
            <Icon name="expand" />
          </button>
        </div>
      </header>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {view === "home" && (
        <main className="home-view enter">
          <div className="home-heading">
            <span className="eyebrow">
              <span className="tiny-diamond" /> LITTLE CLUES. BIG REVEALS.
            </span>
            <h1>
              FRIEND<span>GUESS</span>
              <i>?</i>
            </h1>
            <p>How well can you read people?</p>
          </div>
          <div className="mode-grid">
            <section className="solo-mode-card">
              <div className="card-grain" aria-hidden="true" />
              <div className="solo-card-copy">
                <span className="mode-label">
                  <Icon name="sparkles" size={15} /> YOUR NEXT LITTLE OBSESSION
                </span>
                <h2>
                  One clever fox.
                  <br />
                  Ten secret answers.
                </h2>
                <p>
                  Read the clues. Find Milo’s answer.
                  <br className="desktop-break" /> See how far your instincts
                  take you.
                </p>
                <div className="difficulty-picker" aria-label="Solo difficulty">
                  {["easy", "medium", "hard"].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDifficulty(d);
                        play("click");
                      }}
                      aria-pressed={d === difficulty}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <button
                  className="button button-lime solo-play"
                  onClick={() => startSolo()}
                >
                  <Icon name="play" />
                  Play solo
                  <Icon name="arrow" />
                </button>
                <span className="card-footnote">
                  Jump right in · No account needed
                </span>
              </div>
              <div className="home-milo">
                <span className="milo-hello-bubble">
                  Bet you can’t read my mind.
                </span>
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
                <span className="floating-star star-one">✦</span>
                <span className="floating-star star-two">✧</span>
                <Milo priority />
                <span className="milo-name-tag">
                  MILO <span>THE ANSWERER</span>
                </span>
              </div>
            </section>
            <section className="friends-mode-card">
              <div className="friends-art" aria-hidden="true">
                <Avatar index={1} />
                <Avatar index={3} />
                <Avatar index={2} />
                <span className="chat-chip">You picked WHAT?</span>
              </div>
              <span className="mode-label">
                <Icon name="users" size={16} /> BETTER TOGETHER
              </span>
              <h2>
                Know your
                <br />
                friends. Or don’t.
              </h2>
              <p>
                One secret answer.
                <br />A room full of wild guesses.
              </p>
              <button
                className="button button-light"
                onClick={() => {
                  unlock();
                  play("click");
                  setView("friends");
                }}
              >
                <Icon name="users" />
                Play with friends
                <Icon name="arrow" />
              </button>
              <span className="card-footnote">
                2–10 players · Private rooms
              </span>
            </section>
          </div>
          {savedRun && (
            <button
              className="resume-banner"
              onClick={() => startSolo(savedRun.mode, savedRun)}
            >
              <Icon name="play" />
              <span>
                <strong>Pick up where you left off</strong>
                <small>
                  Round {savedRun.index + 1} of 10 ·{" "}
                  {savedRun.score.toLocaleString()} points
                  {savedRun.phase === "playing" ? " · Clock keeps running" : ""}
                </small>
              </span>
              <span>Resume</span>
              <Icon name="arrow" />
            </button>
          )}
          <div className="home-bottom-grid">
            <button className="daily-card" onClick={() => startSolo("daily")}>
              <span className="feature-icon">
                <Icon name="calendar" size={27} />
              </span>
              <span className="feature-copy">
                <span className="eyebrow">A FRESH MYSTERY EVERY DAY</span>
                <strong>
                  Daily Challenge <span className="pill tiny">10 ROUNDS</span>
                </strong>
                <small>
                  {day
                    ? new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })
                    : "Today"}{" "}
                  · Same questions for everyone
                </small>
              </span>
              <Icon name="arrow" />
            </button>
            <button
              className="progress-card"
              onClick={() => setModal("progress")}
            >
              <span className="feature-icon gold">
                <Icon name="trophy" size={27} />
              </span>
              <span className="feature-copy">
                <span className="eyebrow">MAKE EVERY GUESS COUNT</span>
                <strong>Your little winning streak</strong>
                <small>
                  {profile.rounds
                    ? `${profile.rounds} rounds played · Best streak ${profile.bestStreak}`
                    : "Earn XP, collect badges & beat your best."}
                </small>
              </span>
              <Icon name="arrow" />
            </button>
          </div>
          <footer className="home-footer">
            <span>
              <Icon name="lock" size={14} /> No sign-up. Just one more round.
            </span>
            <button onClick={() => setModal("help")}>
              How to play <Icon name="help" size={15} />
            </button>
          </footer>
        </main>
      )}
      {view === "solo" && (
        <SoloGame
          key={launch.id}
          mode={launch.mode}
          resume={launch.resume}
          profile={profile}
          onProgress={onProgress}
          onOnboard={() => saveProfile({ ...readProfile(), onboarding: true })}
          onHome={goHome}
          onReplay={(mode) => launchSolo(mode)}
        />
      )}
      {view === "friends" && (
        <MultiplayerGame initialCode={joinCode} onHome={goHome} />
      )}
      {modal === "help" && (
        <Modal
          title="A little intuition goes a long way."
          onClose={() => setModal(null)}
        >
          <div className="help-block">
            <span className="pill violet">
              <Icon name="sparkles" size={16} /> Solo with Milo
            </span>
            <ol>
              <li>Milo picks a secret answer. You do all the guessing.</li>
              <li>Follow the clues. More appear as the clock ticks.</li>
              <li>
                Solve quickly with fewer clues for more points. An early clue
                costs 60 points before the difficulty multiplier.
              </li>
            </ol>
            <p>
              Ten rounds per run. Level up, collect badges, and come back for
              tomorrow’s Daily Challenge. Your progress stays on this browser.
            </p>
          </div>
          <div className="help-block">
            <span className="pill mint">
              <Icon name="users" size={16} /> With friends
            </span>
            <p>
              Create a room and share the code. One friend secretly answers a
              question; everyone else races to guess it. The first correct guess
              wins 100 points plus a speed bonus of up to 60. The Answerer
              rotates each round.
            </p>
          </div>
          <button
            className="button button-lime full"
            onClick={() => setModal(null)}
          >
            Got it <Icon name="check" />
          </button>
        </Modal>
      )}
      {modal === "progress" && (
        <Modal
          title="Your corner of FriendGuess"
          onClose={() => setModal(null)}
        >
          <div className="profile-level">
            <span className="level-medal">
              <Icon name="star" size={28} />
            </span>
            <div>
              <span className="eyebrow">
                {lv.level < 3
                  ? "CURIOUS MIND"
                  : lv.level < 6
                    ? "CLUE COLLECTOR"
                    : "MIND READER"}
              </span>
              <h3>Level {lv.level}</h3>
              <div className="xp-track">
                <i style={{ width: `${(lv.current / lv.next) * 100}%` }} />
              </div>
              <small>
                {lv.current} / {lv.next} XP to next level
              </small>
            </div>
          </div>
          <div className="stats-grid">
            <div>
              <b>{profile.rounds}</b>
              <span>Rounds</span>
            </div>
            <div>
              <b>
                {profile.rounds
                  ? Math.round((profile.correct / profile.rounds) * 100)
                  : 0}
                %
              </b>
              <span>Accuracy</span>
            </div>
            <div>
              <b>{profile.bestStreak}</b>
              <span>Best streak</span>
            </div>
          </div>
          <h3 className="subheading">A shelf for your best moments</h3>
          <div className="badge-grid">
            {BADGES.map((b) => (
              <div
                key={b.id}
                className={`badge ${profile.badges.includes(b.id) ? "earned" : "locked"}`}
              >
                <Icon name={b.icon} size={24} />
                <strong>{b.name}</strong>
                <small>{b.description}</small>
                <span>
                  {profile.badges.includes(b.id) ? "Earned" : "Not yet"}
                </span>
              </div>
            ))}
          </div>
          <h3 className="subheading">Make it yours</h3>
          <div className="theme-picker">
            {[
              { id: "arcade", name: "Arcade", level: 1 },
              { id: "lagoon", name: "Lagoon", level: 3 },
              { id: "sunset", name: "Sunset", level: 6 },
            ].map((t) => (
              <button
                key={t.id}
                className={`theme-swatch ${t.id}`}
                disabled={lv.level < t.level}
                aria-pressed={profile.theme === t.id}
                onClick={() => saveProfile({ ...profile, theme: t.id })}
              >
                <i />
                {t.name}
                <small>
                  {lv.level < t.level
                    ? `Level ${t.level}`
                    : profile.theme === t.id
                      ? "Selected"
                      : "Unlocked"}
                </small>
              </button>
            ))}
          </div>
          <h3 className="subheading">Personal records</h3>
          <div className="records">
            {["easy", "medium", "hard"].map((d) => (
              <div key={d}>
                <span>{d}</span>
                <strong>
                  {(profile.records[d] || 0).toLocaleString()}{" "}
                  <small>pts</small>
                </strong>
              </div>
            ))}
          </div>
          {profile.history.length > 0 && (
            <details className="history-details">
              <summary>Recent runs</summary>
              {profile.history.slice(0, 5).map((r) => (
                <div className="history-row" key={r.id}>
                  <span>
                    {r.mode} · {r.correct}/10
                  </span>
                  <b>{r.score.toLocaleString()} pts</b>
                </div>
              ))}
            </details>
          )}
          <p className="fine-print">
            Saved on this browser. These are your personal records, not a global
            leaderboard.
          </p>
        </Modal>
      )}
      {modal === "replace" && (
        <Modal title="Start a fresh run?" onClose={() => setModal(null)}>
          <p>
            Your completed rounds and XP are saved. Starting a new run replaces
            your unfinished one.
          </p>
          <button
            className="button button-lime full"
            onClick={() => launchSolo(launch.mode)}
          >
            Start new run <Icon name="arrow" />
          </button>
          <button
            className="button button-ghost full"
            onClick={() => {
              setModal(null);
              startSolo(savedRun.mode, savedRun);
            }}
          >
            Resume current run
          </button>
        </Modal>
      )}
      {modal === "home" && (
        <Modal title="Head back home?" onClose={() => setModal(null)}>
          <p>
            {view === "solo"
              ? "Your solo run will be saved. The current round's clock keeps running."
              : "If you're in a room, use its Leave room button to leave cleanly. You can stay here and keep playing."}
          </p>
          {view === "solo" && (
            <button className="button button-lime full" onClick={goHome}>
              Back to home
            </button>
          )}
          <button
            className="button button-ghost full"
            onClick={() => setModal(null)}
          >
            Keep playing
          </button>
        </Modal>
      )}
    </div>
  );
}
