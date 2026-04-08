import { RegisterForm } from "@/modules/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[rgb(var(--muted-foreground))]">
        Register
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-[rgb(var(--foreground))]">
        Create your HorizonSync account
      </h2>
      <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted-foreground))]">
        Credentials login is available immediately, and social providers appear when their env keys
        are configured.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
