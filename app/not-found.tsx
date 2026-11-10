import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { ui } from "@/lib/ui";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-[80vh] w-full max-w-[400px] flex-col justify-center px-4 py-16">
      <Wordmark />
      <h1 className={`${ui.pageTitle} mt-10`}>Page not found</h1>
      <p className="mt-2 text-text-muted">This page doesn&apos;t exist. It may have moved.</p>
      <Link href="/" className={`${ui.primary} mt-8 self-start`}>
        Go to the start page
      </Link>
    </main>
  );
}
