"use client";

// An Apple-style on/off switch (role="switch", so screen readers say "on" / "off").
// The knob is positioned with explicit left offsets inside a fixed-size track, so it can never
// slide outside the track: track 51×31, knob 27×27, 2px inset → off at left 2px, on at left 22px.
interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string; // accessible name when there is no visible label to point at
  labelledBy?: string;
  describedBy?: string;
  tone?: "staff" | "student"; // teal for staff screens, green for student screens
}

export function Switch({ checked, onChange, label, labelledBy, describedBy, tone = "staff" }: Props) {
  const on = tone === "student" ? "bg-student-accent" : "bg-primary";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 shrink-0 items-center rounded-full"
    >
      <span aria-hidden className={`relative block h-[31px] w-[51px] rounded-full transition-colors duration-150 ${checked ? on : "bg-separator"}`}>
        <span
          className={`absolute top-[2px] block size-[27px] rounded-full bg-white shadow-[0_2px_4px_hsla(0,0%,0%,.2)] transition-[left] duration-150 ${
            checked ? "left-[22px]" : "left-[2px]"
          }`}
        />
      </span>
    </button>
  );
}
