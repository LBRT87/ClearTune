import type { Metadata } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

/* Self-host lewat next/font, bukan <link> ke Google Fonts.
   Font pixel yang FOUT-nya kelihatan sangat mengganggu — swap-nya jauh lebih
   mencolok daripada font biasa karena metrik fallback-nya tidak pernah cocok. */
const px = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-px",
});

const tx = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-tx",
});

export const metadata: Metadata = {
  title: "ClearTune — Royalti musik dibagi tiap play, on-chain",
  description:
    "Sekali lagumu diputar, uangnya langsung terbagi ke semua pemilik hak. Bukan enam bulan sekali.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${px.variable} ${tx.variable}`}>
      {/* `Providers` client component, tapi `children` dioper dari layout
          server ini sebagai slot — `app/page.tsx` tetap dirender di server
          dan landing page tidak berubah statusnya. */}
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
