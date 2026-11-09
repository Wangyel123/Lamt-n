import type { Metadata } from "next";
import { Atkinson_Hyperlegible, Jomolhari } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible: designed for low-vision readers; keeps I/l/1, O/0 and
// XI/XII clearly distinct, which matters for IDs like S-010 and class names.
// next/font self-hosts it at build time, so no third-party font requests at runtime.
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
});

// Jomolhari: a Tibetan-script font designed for Dzongkha (used for UI labels only).
const jomolhari = Jomolhari({
  variable: "--font-jomolhari",
  subsets: ["tibetan"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "SA Wellbeing — Counsellor Board",
  description: "Prototype flag board for the Situational Analysis wellbeing survey (synthetic data only).",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${atkinson.variable} ${jomolhari.variable} h-full antialiased`}>
      <body className="min-h-full">
        {/* First thing a keyboard user reaches: jump past the top bar straight to the content */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-lg focus:bg-primary focus:px-4 focus:font-bold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
