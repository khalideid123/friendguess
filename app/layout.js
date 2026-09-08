import "./globals.css";

export const metadata = {
  title: "FriendGuess",
  description: "Race your friends to guess each other's secret answers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
