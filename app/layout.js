import "./globals.css";
export const metadata = {
  title: "FriendGuess — Read the clues. Read your friends.",
  description:
    "Read Milo's mind in a fast solo guessing game, or race your friends to guess their secret answers. Daily challenges, 600 questions, no account needed.",
  icons: { icon: "./icon.svg" },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#141323",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
