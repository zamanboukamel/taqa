import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

// UI / body — clean grotesque (Vercel-ish), kept from the original.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Data / eyebrows / calorie counters — instrument feel (Oura/Whoop).
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display — a characterful variable serif. High optical contrast reads premium
// against the dark "stadium" base; far from any default sans-only sports look.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  title: "Taqa — Fuel the Athlete",
  description:
    "AI-built, training-aware nutrition plans for GCC sports academies. Taqa (طاقة) means energy.",
};

// Dark status bar to match the app chrome.
export const viewport: Viewport = {
  themeColor: "#0b1410",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
