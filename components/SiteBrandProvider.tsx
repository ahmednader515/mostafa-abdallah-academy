"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SiteBrandContextValue = {
  platformName: string | null;
  headerLogoUrl: string | null;
  platformNameColor: string | null;
  platformNameColor2: string | null;
  showPlatformName: boolean;
  showPlatformLogo: boolean;
};

const SiteBrandContext = createContext<SiteBrandContextValue>({
  platformName: null,
  headerLogoUrl: null,
  platformNameColor: null,
  platformNameColor2: null,
  showPlatformName: true,
  showPlatformLogo: true,
});

export function SiteBrandProvider({
  platformName,
  headerLogoUrl,
  platformNameColor,
  platformNameColor2,
  showPlatformName = true,
  showPlatformLogo = true,
  children,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformNameColor?: string | null;
  platformNameColor2?: string | null;
  showPlatformName?: boolean;
  showPlatformLogo?: boolean;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      platformName: platformName?.trim() || null,
      headerLogoUrl: headerLogoUrl?.trim() || null,
      platformNameColor: platformNameColor?.trim() || null,
      platformNameColor2: platformNameColor2?.trim() || null,
      showPlatformName: showPlatformName !== false,
      showPlatformLogo: showPlatformLogo !== false,
    }),
    [
      platformName,
      headerLogoUrl,
      platformNameColor,
      platformNameColor2,
      showPlatformName,
      showPlatformLogo,
    ],
  );

  return <SiteBrandContext.Provider value={value}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand() {
  return useContext(SiteBrandContext);
}
