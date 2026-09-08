import "./globals.css";
import "./multiplayer.css";
import SoundEffects from "../components/SoundEffects";
import HintEnhancer from "../components/HintEnhancer";
import PresenceManager from "../components/PresenceManager";
import KickManager from "../components/KickManager";

export const metadata = {
  title: "FriendGuess",
  description: "Race your friends to guess each other's secret answers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <PresenceManager />
        <KickManager />
        <HintEnhancer />
        <SoundEffects />
      </body>
    </html>
  );
}
