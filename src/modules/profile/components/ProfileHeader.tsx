type ProfileHeaderProps = {
  name: string;
  username: string;
  bio?: string | null;
  image?: string | null;
};

export function ProfileHeader({
  name,
  username,
  bio,
  image,
}: ProfileHeaderProps) {
  return (
    <section className="panel-surface rounded-[28px] border border-[rgb(var(--border))] p-6 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {image ? (
          <img
            alt={`${name}'s profile image`}
            className="h-24 w-24 rounded-[28px] border border-[rgb(var(--border))] object-cover"
            src={image}
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface-elevated))] text-2xl font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[rgb(var(--foreground))]">{name}</h1>
          <p className="text-sm font-medium text-[rgb(var(--accent-strong))]">@{username}</p>
          <p className="max-w-2xl text-sm leading-6 text-[rgb(var(--muted-foreground))]">
            {bio || "This HorizonSync profile is still taking shape."}
          </p>
        </div>
      </div>
    </section>
  );
}
