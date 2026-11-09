"use client";

import Link from "next/link";

// Shown if a page crashes (e.g. the database is unreachable).
// PRIVACY: we never show the technical error, which could contain student data.
// Only a calm message and a way to try again.

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-prose text-text-muted">
        We couldn&apos;t load this page. Nothing you saved has been lost. Please try again in a moment.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="min-h-11 rounded-lg bg-primary px-5 font-bold text-white">
          Try again
        </button>
        <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-border px-5 font-bold">
          Go to the start page
        </Link>
      </div>
    </main>
  );
}
