import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-prose text-text-muted">This page doesn&apos;t exist. It may have moved.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-bold text-white">
        Go to the start page
      </Link>
    </main>
  );
}
