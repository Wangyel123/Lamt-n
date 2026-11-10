// The Lamtön mark: a single winding path leading to a point, drawn by hand (not an icon set).
// Used at two sizes: the top bar and the sign-in page.
export function Mark({ size = 28, tone = "staff" }: { size?: number; tone?: "staff" | "student" }) {
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 28 28" className="shrink-0">
      <rect width="28" height="28" rx="8" fill={tone === "student" ? "var(--student-accent)" : "var(--primary)"} />
      <path d="M7.5 20.5c3.5-1 4.2-5.6 7.4-6.6 2.3-.7 4.2.4 5.6-3.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20.6" cy="9.6" r="1.9" fill="#fff" />
    </svg>
  );
}

export function Wordmark({ size = "md", tone = "staff" }: { size?: "md" | "lg"; tone?: "staff" | "student" }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={size === "lg" ? 36 : 26} tone={tone} />
      <span className={`font-semibold tracking-[-0.02em] ${size === "lg" ? "text-[24px]" : "text-[17px]"}`}>Lamtön</span>
    </span>
  );
}
