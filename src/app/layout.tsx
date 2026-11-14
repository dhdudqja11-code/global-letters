import type { Metadata } from "next";
import { Inter, Gowun_Batang } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const gowunBatang = Gowun_Batang({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "마음을 묻다 - 당신만의 선명한 빛을 찾아가세요",
  description: "현대인을 위한 AI 심리 처방전. 불안, 무기력, 불면증 등 당신의 아픈 마음을 위로하는 아날로그 편지.",
  robots: {
    index: false,
    follow: false,
  },
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${gowunBatang.variable} antialiased`}>
        <Script src="https://cdn.jsdelivr.net/npm/html2canvas-pro@latest/dist/html2canvas-pro.min.js" strategy="afterInteractive" />
        <Script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" strategy="afterInteractive" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
