import { LoginForm } from "@/modules/auth/components/LoginForm";

type LoginPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
        Sign in
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-[rgb(var(--foreground))]">
        Welcome back to HorizonSync
      </h2>
      <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
        Choose a provider or sign in with your email and password.
      </p>

      <div className="mt-8">
        <LoginForm callbackUrl={searchParams?.callbackUrl} />
      </div>
    </div>
  );
}
