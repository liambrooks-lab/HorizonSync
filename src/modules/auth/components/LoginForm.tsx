"use client";

import { Globe, Loader2, Lock, Mail, MonitorSmartphone, Twitter } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/components/ui/toast";

type LoginFormProps = {
  callbackUrl?: string;
};

const providerVisuals: Record<
  string,
  { label: string; icon: typeof Globe }
> = {
  google: { label: "Continue with Google", icon: Globe },
  twitter: { label: "Continue with X", icon: Twitter },
  "azure-ad": { label: "Continue with Microsoft", icon: MonitorSmartphone },
};

export function LoginForm({ callbackUrl = "/global" }: LoginFormProps) {
  const { showToast } = useToast();
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [isCredentialsPending, setIsCredentialsPending] = useState(false);

  useEffect(() => {
    async function loadProviders() {
      const resolvedProviders = await getProviders();

      setProviders(
        Object.values(resolvedProviders ?? {})
          .filter((provider) => provider.id !== "credentials")
          .map((provider) => provider.id),
      );
      setIsLoadingProviders(false);
    }

    void loadProviders();
  }, []);

  const providerButtons = useMemo(
    () =>
      providers
        .filter((providerId) => providerVisuals[providerId])
        .map((providerId) => ({
          id: providerId,
          ...providerVisuals[providerId],
        })),
    [providers],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {isLoadingProviders ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : null}

        {providerButtons.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            className="w-full justify-start gap-3"
            onClick={() => void signIn(id, { callbackUrl })}
            type="button"
            variant="secondary"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[rgb(var(--border))]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
          <span className="bg-[rgb(var(--surface))] px-3">or use email</span>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setCredentialError(null);
          setIsCredentialsPending(true);

          const formData = new FormData(event.currentTarget);
          const response = await signIn("credentials", {
            email: String(formData.get("email") ?? ""),
            password: String(formData.get("password") ?? ""),
            callbackUrl,
            redirect: false,
          });

          setIsCredentialsPending(false);

          if (response?.error) {
            setCredentialError("Invalid email or password.");
            showToast({
              title: "Sign-in failed",
              description: "Check your email and password, then try again.",
              variant: "error",
            });
            return;
          }

          showToast({
            title: "Signed in",
            description: "Your workspace is loading now.",
            variant: "success",
          });
          window.location.assign(response?.url ?? callbackUrl);
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="email">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
            <Input className="pl-11" id="email" name="email" placeholder="you@horizonsync.com" required type="email" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[rgb(var(--foreground))]" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--muted-foreground))]" />
            <Input className="pl-11" id="password" minLength={8} name="password" required type="password" />
          </div>
        </div>

        {credentialError ? (
          <p className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {credentialError}
          </p>
        ) : null}

        <Button className="w-full" disabled={isCredentialsPending} type="submit">
          {isCredentialsPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-[rgb(var(--muted-foreground))]">
        Need an account?{" "}
        <Link className="font-semibold text-[rgb(var(--accent-strong))]" href="/register">
          Create one
        </Link>
      </p>
    </div>
  );
}
