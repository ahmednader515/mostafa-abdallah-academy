export type SearchFlags = {
  enabled: boolean;
  courses: boolean;
  library: boolean;
  jobs: boolean;
  forum: boolean;
  live: boolean;
  consultations: boolean;
  trainers: boolean;
};

export const DEFAULT_SEARCH_FLAGS: SearchFlags = {
  enabled: true,
  courses: true,
  library: true,
  jobs: true,
  forum: true,
  live: true,
  consultations: true,
  trainers: true,
};

export function parseSearchFlags(raw: string | null | undefined): SearchFlags {
  if (!raw?.trim()) return { ...DEFAULT_SEARCH_FLAGS };
  try {
    const o = JSON.parse(raw) as Partial<SearchFlags>;
    return {
      enabled: o.enabled !== false,
      courses: o.courses !== false,
      library: o.library !== false,
      jobs: o.jobs !== false,
      forum: o.forum !== false,
      // New flags default ON when absent from older saved JSON
      live: o.live !== false,
      consultations: o.consultations !== false,
      trainers: o.trainers !== false,
    };
  } catch {
    return { ...DEFAULT_SEARCH_FLAGS };
  }
}
