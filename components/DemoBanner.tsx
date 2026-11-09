import { FlaskConical } from "lucide-react";
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { T } from "./T";

// Always visible in demo mode, so nobody mistakes this for a real system with real data.
export function DemoBanner() {
  return (
    <header className="border-b border-border bg-none-tint px-4 py-2 text-sm text-none-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-2">
          <FlaskConical aria-hidden size={16} />
          <span>
            <strong>Demo mode:</strong> synthetic data, saved only in this browser.
          </span>
        </p>
        <span className="flex flex-wrap items-center gap-3">
          <LanguageToggle />
          <Link href="/" className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-2">
            <T k="action.switchRole" />
          </Link>
        </span>
      </div>
    </header>
  );
}
