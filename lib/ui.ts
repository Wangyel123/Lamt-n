// Shared styles: the ONE place buttons, fields and panels are defined, so every screen matches.
// (Plain class strings, not a component library: easy to read and change.)

export const ui = {
  /** White surface with a hairline edge. Used for lists and forms instead of floating cards. */
  panel: "rounded-[14px] border border-separator bg-surface",
  /** The single main action on a screen. */
  primary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-primary-hover disabled:opacity-40",
  /** Other actions. */
  secondary:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-separator-strong bg-surface px-4 text-[15px] font-medium text-text transition-colors duration-150 hover:bg-fill disabled:opacity-40",
  /** Low-emphasis actions that read like links. */
  ghost: "inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-3 text-[15px] font-medium text-primary transition-colors duration-150 hover:bg-fill",
  input:
    "min-h-11 w-full rounded-[10px] border border-border bg-surface px-3 text-[15px] text-text placeholder:text-text-muted/70 focus:border-primary",
  select:
    "min-h-11 w-full appearance-none rounded-[10px] border border-border bg-surface py-2 pr-9 pl-3 text-[15px] text-text focus:border-primary",
  label: "block text-[13px] font-medium text-text-muted",
  pageTitle: "text-[28px] leading-tight font-semibold tracking-[-0.02em]",
  sectionTitle: "text-[15px] font-semibold tracking-[-0.01em]",
  muted: "text-text-muted",
} as const;
