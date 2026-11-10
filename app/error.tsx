"use client";

import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ui } from "@/lib/ui";

// Shown if a page crashes (e.g. the database is unreachable).
// PRIVACY: we never show the technical error, which could contain student data.
// Only a calm message and a way to try again.

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[80vh] w-full max-w-[400px] flex-col justify-center px-4 py-16">
      <Wordmark />
      <h1 className={`${ui.pageTitle} mt-10`}>Something went wrong</h1>
      <p className="mt-2 text-text-muted">We couldn&apos;t load this page. Nothing you saved has been lost. Please try again in a moment.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className={ui.primary}>
          Try again
        </button>
        <Link href="/" className={ui.secondary}>
          Go to the start page
        </Link>
      </div>
    </main>
  );
}
