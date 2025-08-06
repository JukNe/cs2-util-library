import type { Metadata } from "next";
import "./globals.scss";
import { AuthWrapper } from "@/components/auth/AuthWrapper";


export const metadata: Metadata = {
  title: "CS2 Util Library",
  description: "Your personal library for CS2 lineups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  );
}
