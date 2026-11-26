import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { CommandPalette } from "@/components/CommandPalette";
import { CompareTray } from "@/components/CompareTray";
import { BackToTop } from "@/components/BackToTop";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { BetaBanner } from "@/components/BetaBanner";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://marhaba.ma";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MARHABA | Morocco Travel Marketplace — Stays, Mobility & eSIM",
    template: "%s | MARHABA",
  },
  description:
    "Discover verified riads, luxury hotels, desert camps, car rentals, dining, flights/train/eSIM requests, and authentic Moroccan experiences in MAD, EUR, and USD.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand/app-icon-192.png",
    apple: "/brand/app-icon-192.png",
  },
  openGraph: {
    type: "website",
    siteName: "MARHABA",
    title: "MARHABA | Morocco Travel Marketplace",
    description:
      "Book verified Moroccan riads, coastal resorts, desert camps, cars, ONCF/CTM transport, flights, and 5G eSIMs across 56 cities.",
    url: SITE_URL,
    images: [
      {
        url: "/images/hero-morocco.jpg",
        width: 1280,
        height: 698,
        alt: "MARHABA Morocco Travel Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MARHABA | Morocco Travel Marketplace",
    description:
      "Verified stays, cars, trains, buses, flights & instant Morocco 5G eSIM across all 12 Moroccan regions.",
    images: ["/images/hero-morocco.jpg"],
  },
  appleWebApp: {
    capable: true,
    title: "MARHABA",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1F40C5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Noto+Sans+Arabic:wght@400;600;700;800&family=Readex+Pro:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <Navbar />
          <BetaBanner />
          <main style={{ minHeight: "70vh" }}>{children}</main>
          <Footer />
          <MobileBottomNav />
          <AuthModal />
          <AiAssistantDrawer />
          <CommandPalette />
          <CompareTray />
          <PwaInstallPrompt />
          <BackToTop />
        </AppProvider>
      </body>
    </html>
  );
}
