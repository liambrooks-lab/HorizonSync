export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent),0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(var(--accent-strong),0.16),transparent_28%)]" />
      <div className="relative z-10 w-full max-w-5xl rounded-[36px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.86)] p-4 shadow-[0_40px_120px_-54px_rgba(12,24,68,0.8)] backdrop-blur-xl md:p-8">
        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] bg-[linear-gradient(180deg,rgba(var(--accent-strong),0.9),rgba(var(--accent),0.65))] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
              HorizonSync
            </p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight">
              One workspace for live conversation, global reach, and personal execution.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/80">
              Phase 1 establishes authentication, route protection, and the macro navigation shell
              that makes context switching feel instant.
            </p>
          </section>

          <section className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
