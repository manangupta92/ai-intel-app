export const metadata = {
  title: "AI Intel App",
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
