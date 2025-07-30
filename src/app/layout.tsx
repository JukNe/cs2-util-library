import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/header";
import Navbar from "@/components/navbar";


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
          <Header />
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
