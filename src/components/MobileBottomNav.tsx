"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, LayoutGrid, Sparkles, User } from "lucide-react";
import { useApp } from "./AppProvider";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { tr } = useApp();

  const isHome = pathname === "/";
  const isSearch = pathname.startsWith("/search") || pathname.startsWith("/properties") || pathname.startsWith("/destinations");
  const isPlanner = pathname.startsWith("/planner");
  const isServices = pathname.startsWith("/services");
  const isAccount = pathname.startsWith("/account") || pathname.startsWith("/partner") || pathname.startsWith("/admin");

  return (
    <nav className="mobile-bottom-nav no-print" dir="ltr" aria-label={tr("nav.explore")}>
      <Link href="/" className={`mobile-bottom-item ${isHome ? "active" : ""}`}>
        <Home size={18} />
        <span dir="auto">{tr("nav.explore")}</span>
      </Link>
      <Link href="/search" className={`mobile-bottom-item ${isSearch ? "active" : ""}`}>
        <Compass size={18} />
        <span dir="auto">{tr("navSearch")}</span>
      </Link>
      <Link href="/planner" className={`mobile-bottom-item ${isPlanner ? "active" : ""}`}>
        <Sparkles size={18} />
        <span dir="auto">{tr("nav.planner")}</span>
      </Link>
      <Link href="/services" className={`mobile-bottom-item ${isServices ? "active" : ""}`}>
        <LayoutGrid size={18} />
        <span dir="auto">{tr("nav.services")}</span>
      </Link>
      <Link href="/account" className={`mobile-bottom-item ${isAccount ? "active" : ""}`}>
        <User size={18} />
        <span dir="auto">{tr("navAccount")}</span>
      </Link>
    </nav>
  );
}
