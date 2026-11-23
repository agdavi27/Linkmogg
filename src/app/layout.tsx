import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Sans, Caveat, VT323, JetBrains_Mono, Permanent_Marker } from "next/font/google";
import { appUrl } from "@/lib/config";
import "./globals.css";

const body = Instrument_Sans({ variable: "--font-body", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand-face", subsets: ["latin"], preload: false });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], preload: false });
const marker = Permanent_Marker({ variable: "--font-marker-face", subsets: ["latin"], weight: "400", preload: false });
const pixel = VT323({ variable: "--font-pixel-face", subsets: ["latin"], weight: "400", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Linkmogg: a link-in-bio people actually play with", template: "%s · Linkmogg" },
  description: "One link for everything you do, in a page people want to touch. Click wheels, sunflowers, bookshelves and more.",
  openGraph: { siteName: "Linkmogg", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f6f1e8", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${hand.variable} ${pixel.variable} ${mono.variable} ${marker.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
