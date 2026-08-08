import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});
const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
});

export const metadata: Metadata = {
  title: "ClearTune — Transparent Streaming for True Fans & Artists",
  description:
    "Royalti musik yang jelas ke mana perginya: dibagi per play, real-time, on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable} ${vt323.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
