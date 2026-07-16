"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SiteBrandContextValue = {
  platformName: string | null;
  headerLogoUrl: string | null;
};

const SiteBrandContext = createContext<SiteBrandContextValue>({
  platformName: null,
  headerLogoUrl: null,
});

export function SiteBrandProvider({
  platformName,
  headerLogoUrl,
  children,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      platformName: platformName?.trim() || null,
      headerLogoUrl: headerLogoUrl?.trim() || null,
    }),
    [platformName, headerLogoUrl],
  );

  return <SiteBrandContext.Provider value={value}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand() {
  return useContext(SiteBrandContext);
}
