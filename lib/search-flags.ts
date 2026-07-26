export type SearchFlags = {
  enabled: boolean;
  courses: boolean;
  forum: boolean;
  library: boolean;
  jobs: boolean;
};

export const DEFAULT_SEARCH_FLAGS: SearchFlags = {
  enabled: true,
  courses: true,
  forum: true,
  library: true,
  jobs: true,
};

export function parseSearchFlags(raw: string | null | undefined): SearchFlags {
  if (!raw?.trim()) return { ...DEFAULT_SEARCH_FLAGS };
  try {
    const o = JSON.parse(raw) as Partial<SearchFlags>;
    return {
      enabled: o.enabled !== false,
      courses: o.courses !== false,
      forum: o.forum !== false,
      library: o.library !== false,
      jobs: o.jobs !== false,
    };
  } catch {
    return { ...DEFAULT_SEARCH_FLAGS };
  }
}
