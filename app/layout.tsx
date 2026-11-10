import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Geist for everything, Geist Mono for student IDs and codes. next/font self-hosts both at build time,
// so there are no third-party font requests and the look is identical on every device.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lamtön",
  description: "Wellbeing follow-up for school counsellors, from the Situational Analysis survey. Prototype with synthetic data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full">
        {/* First thing a keyboard user reaches: jump past the top bar straight to the content */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-[10px] focus:bg-primary focus:px-4 focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
