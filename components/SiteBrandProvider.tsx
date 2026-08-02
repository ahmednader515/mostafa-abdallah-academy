"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

type SiteBrandContextValue = {
  platformName: string | null;
  headerLogoUrl: string | null;
  platformNameColor: string | null;
  platformNameColor2: string | null;
  showPlatformName: boolean;
  showPlatformLogo: boolean;
  authLoginBody: string | null;
  authLoginBodyEn: string | null;
};

const SiteBrandContext = createContext<SiteBrandContextValue>({
  platformName: null,
  headerLogoUrl: null,
  platformNameColor: null,
  platformNameColor2: null,
  showPlatformName: true,
  showPlatformLogo: true,
  authLoginBody: null,
  authLoginBodyEn: null,
});

export function SiteBrandProvider({
  platformName,
  headerLogoUrl,
  platformNameColor,
  platformNameColor2,
  showPlatformName = true,
  showPlatformLogo = true,
  authLoginBody = null,
  authLoginBodyEn = null,
  children,
}: {
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformNameColor?: string | null;
  platformNameColor2?: string | null;
  showPlatformName?: boolean;
  showPlatformLogo?: boolean;
  authLoginBody?: string | null;
  authLoginBodyEn?: string | null;
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
      authLoginBody: authLoginBody?.trim() || null,
      authLoginBodyEn: authLoginBodyEn?.trim() || null,
    }),
    [
      platformName,
      headerLogoUrl,
      platformNameColor,
      platformNameColor2,
      showPlatformName,
      showPlatformLogo,
      authLoginBody,
      authLoginBodyEn,
    ],
  );

  return <SiteBrandContext.Provider value={value}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand() {
  return useContext(SiteBrandContext);
}
