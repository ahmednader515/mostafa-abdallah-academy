type Props = {
  title: string;
  name: string;
  bio: string;
  imageUrl: string | null;
};

export function CourseInstructorBlock({ title, name, bio, imageUrl }: Props) {
  if (!name && !bio && !imageUrl) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{title}</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--color-border)]">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl text-[var(--color-muted)]">
              {(name || "?").slice(0, 1)}
            </div>
          )}
        </div>
        <div className="min-w-0">
          {name ? <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{name}</h3> : null}
          {bio ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-muted)] sm:text-base">
              {bio}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
