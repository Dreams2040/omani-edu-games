import type { Metadata, Viewport } from "next";
import { Baloo_Bhaijaan_2, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const display = Baloo_Bhaijaan_2({
  variable: "--font-baloo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const body = IBM_Plex_Sans_Arabic({
  variable: "--font-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ألعاب الصف العُماني",
  description: "أسئلة جاهزة حسب دروس المنهج العُماني، تتحول بضغطة إلى لعبة جماعية في الصف.",
};

export const viewport: Viewport = {
  themeColor: "#0fa3a3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
