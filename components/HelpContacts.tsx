import { Phone, School, Siren, UserRound } from "lucide-react";
import { EMERGENCY, HELPLINE, SCHOOL_COUNSELLOR_NOTE } from "@/lib/helpContacts";

// The list of real people a student can reach now. Numbers are tap-to-call links, because
// every extra step loses someone (Radez et al. 2021: not knowing where to go is a top barrier).
// Calm green, no red: it should feel safe to open, not alarming.
export function HelpContacts() {
  const item = "flex gap-3 rounded-[14px] border border-separator bg-surface p-4";
  const second = "inline-flex min-h-12 items-center rounded-[12px] border border-separator-strong bg-surface px-4 font-semibold text-student-accent";
  const call = "mt-2 inline-flex min-h-12 items-center gap-2 rounded-[12px] bg-student-accent px-4 font-semibold text-white";
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        <li className={item}>
          <Phone aria-hidden className="mt-1 shrink-0 text-student-accent" />
          <div>
            <strong className="block">Call the {HELPLINE.name}: {HELPLINE.number}</strong>
            <span className="text-text-muted">{HELPLINE.description}</span>
            <div>
              <a href={`tel:${HELPLINE.number}`} className={call}>
                Call {HELPLINE.number}
              </a>
            </div>
            <a href={`mailto:${HELPLINE.email}`} className="mt-1 inline-flex min-h-12 items-center text-[16px] font-medium break-all text-student-accent underline underline-offset-2">
              Or email {HELPLINE.email}
            </a>
          </div>
        </li>
        <li className={item}>
          <UserRound aria-hidden className="mt-1 shrink-0 text-student-accent" />
          <span>
            <strong className="block">Tell a trusted adult now</strong>
            <span className="text-text-muted">A teacher, a parent, a family member, or another adult you trust.</span>
          </span>
        </li>
        <li className={item}>
          <School aria-hidden className="mt-1 shrink-0 text-student-accent" />
          <span>
            <strong className="block">Your school counsellor</strong>
            <span className="text-text-muted">{SCHOOL_COUNSELLOR_NOTE}</span>
          </span>
        </li>
      </ul>
      <section aria-labelledby="danger-now" className="flex gap-3 rounded-[14px] border border-separator bg-surface p-4">
        <Siren aria-hidden className="mt-1 shrink-0 text-student-accent" />
        <div>
          <p id="danger-now" className="font-semibold">If you or someone else is in danger right now</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={`tel:${EMERGENCY.police}`} className={second}>
              Call {EMERGENCY.police} (police)
            </a>
            <a href={`tel:${EMERGENCY.ambulance}`} className={second}>
              Call {EMERGENCY.ambulance} (ambulance)
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
