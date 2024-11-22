import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "CS2 Util Library",
  description: "Library for CS2 utility lineups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main style={{ height: '100vh' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
