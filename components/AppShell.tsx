"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppSidebar, type SidebarSocialLink } from "@/components/AppSidebar";
import { AppTopBar } from "@/components/AppTopBar";
import type { NavTab } from "@/lib/nav-tabs";

const AUTH_PATHS = ["/login", "/register"];

function isAuthPath(pathname: string) {
  if (AUTH_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/login/")) return true;
  return false;
}

function isDesktopViewport() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
}

export function AppShell({
  children,
  footer,
  platformName,
  headerLogoUrl,
  platformSubscriptionExpiryLabel,
  subscriptionBanner,
  socialLinks,
  navTabs,
}: {
  children: ReactNode;
  footer: ReactNode;
  platformName?: string | null;
  headerLogoUrl?: string | null;
  platformSubscriptionExpiryLabel?: string | null;
  subscriptionBanner?: ReactNode;
  socialLinks?: SidebarSocialLink[];
  navTabs?: NavTab[] | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopHidden, setDesktopHidden] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (isAuthPath(pathname)) {
    return <>{children}</>;
  }

  function toggleMenu() {
    if (isDesktopViewport()) {
      setDesktopHidden((hidden) => !hidden);
      setMobileOpen(false);
      return;
    }
    setMobileOpen((open) => !open);
  }

  const menuOpen = isDesktop ? !desktopHidden : mobileOpen;

  return (
    <div className="app-shell" data-sidebar-hidden={desktopHidden ? "true" : "false"}>
      <AppSidebar
        open={mobileOpen}
        desktopHidden={desktopHidden}
        onClose={() => setMobileOpen(false)}
        socialLinks={socialLinks}
        navTabs={navTabs ?? undefined}
      />
      <div className="app-shell-main">
        <AppTopBar
          platformName={platformName}
          headerLogoUrl={headerLogoUrl}
          platformSubscriptionExpiryLabel={platformSubscriptionExpiryLabel}
          subscriptionBanner={subscriptionBanner}
          onMenuClick={toggleMenu}
          menuOpen={menuOpen}
        />
        <main className="flex-1">{children}</main>
        {footer}
      </div>
    </div>
  );
}
