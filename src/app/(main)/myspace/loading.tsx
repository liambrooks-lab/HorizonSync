export default function MySpaceLoading() {
  return (
    <div className="flex min-h-[640px] animate-pulse">
      <div className="w-[320px] border-r border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))]" />
      <div className="flex-1 p-4">
        <div className="h-full rounded-[30px] border border-[rgb(var(--border))] bg-[rgb(var(--surface))]" />
      </div>
    </div>
  );
}
