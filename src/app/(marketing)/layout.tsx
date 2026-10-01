import { Barlow_Condensed } from "next/font/google";
import type { ReactNode } from "react";

// Condensed display face for the public site's headlines (industrial, freight feel).
const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className={`${display.variable} flex flex-1 flex-col bg-white`}>{children}</div>;
}
