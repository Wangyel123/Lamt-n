import { ChevronRight, Info, MessageCircle, NotebookPen, Sparkles, Users, type LucideIcon } from "lucide-react";
import { isEnabled, type FeatureName } from "@/lib/features";
import Link from "next/link";
import { STUDENT_IDLE_MINUTES } from "@/lib/accessCodes";
import { CheckInTile } from "./CheckInTile";

const TILES: { feature: FeatureName; href: string; icon: LucideIcon; title: string; text: string }[] = [
  { feature: "messaging", href: "/student/messages", icon: MessageCircle, title: "Talk to my counsellor", text: "Send a private message. A real person replies." },
  { feature: "activities", href: "/student/activities", icon: Sparkles, title: "Self-care activities", text: "Short things to try when you feel worried or stressed" },
  { feature: "journal", href: "/student/journal", icon: NotebookPen, title: "My journal", text: "Private, unless you choose to share an entry" },
];

// The signed-in student's home. It never shows a flag, a reason, or anything counsellor-only.
// Phase 2 adds tiles here (talk to my counsellor, check-in, activities, journal) as each is built,
// each behind its switch in lib/features.ts. At most 4 big tiles (Hick's law).
export function StudentHome({ liveStudentId }: { liveStudentId?: string }) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-[32px] leading-tight font-semibold tracking-tight">You&apos;re in</h1>
        <p className="text-text-muted">This is your private space. Your counsellor is here for you.</p>
      </header>

      <ul className="space-y-3">
        {/* Phase 2 tiles, each shown only when its feature switch is on (at most 4 big tiles) */}
        {isEnabled("checkIns") && <CheckInTile liveStudentId={liveStudentId} />}
        {TILES.filter((t) => isEnabled(t.feature)).map(({ href, icon: Icon, title, text }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 items-center gap-4 rounded-[18px] border border-separator bg-surface p-5">
              <span aria-hidden className="flex shrink-0 text-student-accent">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{title}</span>
                <span className="text-[16px] text-text-muted">{text}</span>
              </span>
              <ChevronRight aria-hidden className="text-border" />
            </Link>
          </li>
        ))}
      </ul>

      {isEnabled("peerBoard") && (
        <Link href="/student/board" className="flex min-h-12 items-center gap-2 font-medium text-student-accent">
          <Users aria-hidden size={18} /> Student board: kind posts from others, read by a counsellor first
        </Link>
      )}
      <Link href="/student/about" className="inline-flex min-h-12 items-center gap-2 font-medium text-student-accent">
        <Info aria-hidden size={18} /> About this space: what it is, and who can see what
      </Link>

      <p className="text-[16px] text-text-muted">
        When you&apos;re done, tap &ldquo;Leave&rdquo;. If you forget, you&apos;ll be signed out after {STUDENT_IDLE_MINUTES} minutes.
      </p>
    </div>
  );
}
