import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "ことばバトル — 言葉で戦うカードRPG",
  description: "日本語の言葉がカードになって戦うRPG。火は水に負け、包丁は風船を切る。現実の因果関係で勝敗が決まる。",
  keywords: ["ことばバトル","カードゲーム","RPG","日本語"],
  openGraph: {
    title: "ことばバトル",
    description: "言葉で戦うカードバトルRPG",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={geist.variable}>
      <body className="noise">{children}</body>
    </html>
  );
}
