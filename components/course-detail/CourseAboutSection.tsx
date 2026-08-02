"use client";

import { useState } from "react";

type Props = {
  title: string;
  description: string;
  readMoreLabel: string;
  readLessLabel: string;
};

export function CourseAboutSection({ title, description, readMoreLabel, readLessLabel }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!description.trim()) return null;

  const needsTruncate = description.length > 220 || description.split(/\n/).length > 3;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{title}</h2>
      <div
        className={`prose-custom whitespace-pre-wrap text-[var(--color-foreground)]/90 ${
          !expanded && needsTruncate ? "line-clamp-3" : ""
        }`}
      >
        {description}
      </div>
      {needsTruncate ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          {expanded ? readLessLabel : readMoreLabel}
        </button>
      ) : null}
    </section>
  );
}
