import { LogOut, UserRound } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import type { Profile } from "@/lib/auth";
import { LanguageToggle } from "./LanguageToggle";
import { T } from "./T";

// Live mode: who is signed in, with what role and scope, plus sign out.
export function AccountBar({ profile }: { profile: Profile }) {
  const scope =
    profile.role === "supervisor" ? "Supervisor (counts only)" : `Counsellor · ${profile.school ?? "All schools (demo)"}`;
  return (
    <header className="border-b border-border bg-surface px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2">
          <UserRound aria-hidden size={16} className="text-primary" />
          <span>
            <strong>{profile.email}</strong> <span className="text-text-muted">· {scope}</span>
          </span>
        </p>
        <span className="flex flex-wrap items-center gap-3">
        <LanguageToggle />
        <form action={signOut}>
          <button type="submit" className="inline-flex min-h-11 items-center gap-1 font-bold text-primary">
            <LogOut aria-hidden size={16} /> <T k="action.signOut" />
          </button>
        </form>
        </span>
      </div>
    </header>
  );
}
