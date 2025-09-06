import "./globals.css";

export const metadata = {
  title: "AI Stock Trading Assistant",
  description: "News + Intraday Candles + AI Analysis"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
