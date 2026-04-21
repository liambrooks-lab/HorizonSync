import { BrandLogo, BrandWordmark } from "@/shared/components/BrandIdentity";
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
          <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,rgba(var(--accent-strong),0.9),rgba(var(--accent),0.65))] p-6 text-white sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_30%),linear-gradient(180deg,rgba(7,9,18,0.04),rgba(7,9,18,0.24))]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <BrandLogo className="h-12 w-12 rounded-[18px]" href="/login" priority />
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  Secure access
                </span>
              </div>

              <BrandWordmark className="mt-8 w-full max-w-[360px] sm:max-w-[420px]" priority />
            </div>

            <h1 className="relative mt-8 text-3xl font-semibold leading-tight sm:text-4xl">
              One workspace for live conversation, global reach, and personal execution.
            </h1>
            <p className="relative mt-6 max-w-xl text-sm leading-7 text-white/80">
              HorizonSync unifies community, collaboration, and execution into one high-trust
              operating surface with secure sign-in, polished workflows, and branded product
              presence across every device.
            </p>

            <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                  Live
                </p>
                <p className="mt-2 text-sm font-semibold">Discord-grade Hubs</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                  Publish
                </p>
                <p className="mt-2 text-sm font-semibold">Global social signals</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/65">
                  Execute
                </p>
                <p className="mt-2 text-sm font-semibold">Private My Space planning</p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 sm:p-8">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
