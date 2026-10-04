import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { COMPANY_DEFAULTS } from "@/config/company-defaults";
import { SITE_DESCRIPTION } from "@/config/marketing-content";
import { siteUrl } from "@/lib/site-url";
import { SHARED_OPEN_GRAPH, SHARED_TWITTER } from "@/lib/social-metadata";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Shared by every page. The share image comes from app/opengraph-image.tsx and
// app/twitter-image.tsx; pages add their own title, description and canonical URL.
export const metadata: Metadata = {
  metadataBase: siteUrl(),
  applicationName: COMPANY_DEFAULTS.displayName,
  title: {
    default: COMPANY_DEFAULTS.displayName,
    template: `%s | ${COMPANY_DEFAULTS.displayName}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: SHARED_OPEN_GRAPH,
  twitter: SHARED_TWITTER,
  // Lets phones turn the numbers on the page into tap-to-call links.
  formatDetection: { telephone: true, email: true, address: true },
  appleWebApp: { title: "DRAY-WORLD", statusBarStyle: "default" },
};

// Colours the phone browser bar in the brand navy.
export const viewport: Viewport = {
  themeColor: "#18234a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
