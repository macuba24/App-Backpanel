import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";

import { LocaleProvider } from "@/lib/locale";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Backpanel",
  description: "Steuerung für die Kunden-App eines Händlers.",
  icons: {
    icon: [{ url: "/hcq-logo.png", type: "image/png" }],
    apple: "/hcq-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-svh bg-background font-sans text-foreground">
        <LocaleProvider>
          <TooltipProvider>
            <Suspense fallback={<p className="p-8 text-sm text-zinc-500">Wird geladen…</p>}>{children}</Suspense>
            <Toaster />
          </TooltipProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
