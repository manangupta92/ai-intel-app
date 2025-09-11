import "./globals.css";
import { AuthProvider } from "@/lib/contexts/auth";

export const metadata = {
  title: "AI Stock Trading Assistant",
  description: "News + Intraday Candles + AI Analysis"
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
