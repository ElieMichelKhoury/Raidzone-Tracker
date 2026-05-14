import './globals.css';

export const metadata = {
  title: 'RaidZone Crafting Tracker',
  description: 'Once Human RaidZone PVP — Crafting & Material Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
