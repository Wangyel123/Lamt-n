"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";
import { ui } from "@/lib/ui";

// Sign-in (live mode). Labels sit above the fields, so they never disappear while typing.
export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className={ui.label}>Email</span>
        <input name="email" type="email" autoComplete="username" required className={ui.input} />
      </label>
      <label className="block space-y-1.5">
        <span className={ui.label}>Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={ui.input} />
      </label>
      {state.error && (
        <p role="alert" className="text-[14px] font-medium text-urgent-ink">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${ui.primary} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
