// Phase 0 placeholder home. Becomes the role chooser (demo) / login (live) in later phases.
// The swatches let us eyeball the design tokens before building real screens.
const levels = [
  { name: "Urgent", solid: "bg-urgent", tint: "bg-urgent-tint", ink: "text-urgent-ink" },
  { name: "High", solid: "bg-high", tint: "bg-high-tint", ink: "text-high-ink" },
  { name: "Review", solid: "bg-review", tint: "bg-review-tint", ink: "text-review-ink" },
  { name: "None", solid: "bg-none", tint: "bg-none-tint", ink: "text-none-ink" },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">SA Wellbeing — Counsellor Board</h1>
      <p className="mt-2 max-w-prose text-text-muted">
        Prototype under construction. Synthetic data only.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {levels.map((l) => (
          <li key={l.name} className={`rounded-lg border border-border p-4 ${l.tint}`}>
            <span className={`rounded px-2 py-1 text-sm font-bold text-white ${l.solid}`}>{l.name}</span>
            <span className={`ml-3 ${l.ink}`}>Text on tint</span>
          </li>
        ))}
      </ul>

      <button className="mt-8 min-h-11 rounded-lg bg-primary px-5 font-bold text-white">
        Primary action
      </button>

      <p className="mt-8 text-sm text-text-muted">
        Flags are a screening aid to help you decide who to meet first. They are not a diagnosis.
        Your professional judgement comes first.
      </p>
    </main>
  );
}
