"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";

const inputClass = "mt-1 min-h-11 w-full rounded-lg border border-border bg-surface px-3 font-normal";

// Calm, one-column login (live mode).
export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <label className="block font-bold">
        Email
        <input name="email" type="email" autoComplete="username" required className={inputClass} />
      </label>
      <label className="block font-bold">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="font-bold text-urgent-ink">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-primary px-4 font-bold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
