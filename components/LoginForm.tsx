"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";

const field = "min-h-12 w-full bg-transparent px-4 text-[17px] placeholder:text-text-muted";

// Calm, one-column sign-in (live mode), styled like an Apple grouped form.
export function LoginForm() {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(signIn, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <div className="divide-y divide-separator overflow-hidden rounded-2xl bg-surface">
        <label className="block">
          <span className="sr-only">Email</span>
          <input name="email" type="email" autoComplete="username" placeholder="Email" required className={field} />
        </label>
        <label className="block">
          <span className="sr-only">Password</span>
          <input name="password" type="password" autoComplete="current-password" placeholder="Password" required className={field} />
        </label>
      </div>
      {state.error && (
        <p role="alert" className="px-1 font-medium text-urgent-ink">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-full bg-primary px-4 font-semibold text-white disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
