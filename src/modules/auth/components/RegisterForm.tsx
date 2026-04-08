"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { registerUserAction } from "@/modules/auth/actions/auth.actions";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

function RegisterSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Creating account..." : "Create account"}
    </Button>
  );
}

const initialState = {
  error: null as string | null,
  success: null as string | null,
};

export function RegisterForm() {
  const [state, formAction] = useFormState(registerUserAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="name">
          Name
        </label>
        <Input id="name" name="name" placeholder="Aarav Mehta" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="email">
          Email
        </label>
        <Input id="email" name="email" placeholder="you@horizonsync.com" required type="email" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="password">
          Password
        </label>
        <Input id="password" minLength={8} name="password" required type="password" />
      </div>

      {state.error ? (
        <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <RegisterSubmitButton />

      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Already have an account?{" "}
        <Link className="font-semibold text-[rgb(var(--accent-strong))]" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
