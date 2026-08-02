import { getYouTubeEmbedUrl } from "@/lib/youtube";

type Props = {
  title: string;
  videoUrl: string | null;
  imageUrl: string | null;
  playLabel: string;
};

export function CourseIntroMedia({ title, videoUrl, imageUrl, playLabel }: Props) {
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{title}</h2>
      <div className="aspect-video overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={playLabel}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl opacity-40">📚</div>
        )}
      </div>
    </section>
  );
}
