export default function GlobalLoading() {
  return (
    <div className="animate-pulse rounded-[28px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-8">
      <div className="h-4 w-24 rounded bg-[rgb(var(--surface-elevated))]" />
      <div className="mt-4 h-8 w-2/3 rounded bg-[rgb(var(--surface-elevated))]" />
      <div className="mt-6 space-y-3">
        <div className="h-4 rounded bg-[rgb(var(--surface-elevated))]" />
        <div className="h-4 rounded bg-[rgb(var(--surface-elevated))]" />
        <div className="h-4 w-4/5 rounded bg-[rgb(var(--surface-elevated))]" />
      </div>
    </div>
  );
}
