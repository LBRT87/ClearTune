import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Providers } from "./providers";
import { RouteProgress } from "@/components/ui/RouteProgress";

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
    "Music royalties that are clear about where they go: split per play, in real time, on-chain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Variabel font dipasang di <html>, bukan <body>: token --px/--tx
    // dideklarasikan di :root, dan var(--font-press-start) yang cuma ada di
    // <body> tidak terbaca di sana — judul & paragraf jatuh ke font sans.
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body className="antialiased">
        {/* useSearchParams butuh Suspense boundary, kalau tidak seluruh
            halaman statis ikut turun ke render sisi klien. */}
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
