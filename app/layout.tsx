import type { Metadata } from "next";
import "./globals.css";

// Text uses the device's system font (SF Pro on Apple devices): familiar, very legible, no download.

export const metadata: Metadata = {
  title: "Student Wellbeing",
  description: "Helps school counsellors see which students may need support first, from the wellbeing survey. Sample data only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        {/* First thing a keyboard user reaches: jump past the top bar straight to the content */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-xl focus:bg-primary focus:px-4 focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
