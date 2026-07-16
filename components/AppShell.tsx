"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AppSidebar, type SidebarSocialLink } from "@/components/AppSidebar";
import { AppTopBar } from "@/components/AppTopBar";

const AUTH_PATHS = ["/login", "/register"];

function isAuthPath(pathname: string) {
  if (AUTH_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/login/")) return true;
  return false;
}

export function AppShell({
  children,
  footer,
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
  socialLinks,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformSubscriptionExpiryLabel?: string | null;
  socialLinks?: SidebarSocialLink[];
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isAuthPath(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      <AppSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        socialLinks={socialLinks}
      />
      <div className="app-shell-main">
        <AppTopBar
          platformName={platformName}
          headerLogoUrl={headerLogoUrl}
          platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
          onMenuClick={() => setSidebarOpen((open) => !open)}
        />
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </div>
  );
}
