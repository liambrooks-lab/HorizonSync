import { ThemeSwitcher } from "@/shared/components/ui/theme-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 sm:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent),0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(var(--accent-strong),0.16),transparent_28%)]" />
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ThemeSwitcher />
      </div>
      <div className="relative z-10 w-full max-w-5xl rounded-[36px] border border-[rgb(var(--border))] bg-[rgba(var(--surface),0.86)] p-3 shadow-[0_40px_120px_-54px_rgba(12,24,68,0.8)] backdrop-blur-xl sm:p-4 md:p-8">
        <div className="grid gap-4 md:gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] bg-[linear-gradient(180deg,rgba(var(--accent-strong),0.9),rgba(var(--accent),0.65))] p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">
              HorizonSync
            </p>
            <h1 className="mt-6 text-3xl font-semibold leading-tight sm:text-4xl">
              One workspace for live conversation, global reach, and personal execution.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-7 text-white/80">
              Phase 4 brings the final polish: richer themes, smoother motion, stronger security
              signals, and a shell that feels fast on every screen size.
            </p>
          </section>

          <section className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 sm:p-8">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
