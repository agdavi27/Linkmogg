import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, Bricolage_Grotesque, Caveat, VT323, JetBrains_Mono } from "next/font/google";
import { appUrl } from "@/lib/config";
import "./globals.css";

// Site voice: a condensed-capable grotesk for display, a plain workhorse for reading and forms.
const body = Hanken_Grotesk({ variable: "--font-body", subsets: ["latin"] });
const display = Archivo({ variable: "--font-site-face", subsets: ["latin"], axes: ["wdth"] });
// Themes keep the face they were designed with.
const themeDisplay = Bricolage_Grotesque({ variable: "--font-site-face", subsets: ["latin"], preload: false });
const hand = Caveat({ variable: "--font-hand-face", subsets: ["latin"], preload: false });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], preload: false });
const pixel = VT323({ variable: "--font-pixel-face", subsets: ["latin"], weight: "400", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Linkmogg: a link-in-bio people actually play with", template: "%s · Linkmogg" },
  description: "One link for everything you do, in a page people want to touch. Click wheels, sunflowers, bookshelves and more.",
  openGraph: { siteName: "Linkmogg", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f1f1ee", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${themeDisplay.variable} ${hand.variable} ${pixel.variable} ${mono.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
