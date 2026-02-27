import { Suspense } from "react";
import type { Metadata } from "next";
import { Outfit, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProviders } from "@/components/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Runway - Ship work that matters",
  description: "Project management stripped to its essence. No clutter. No complexity. Just results.",
  keywords: ["project management", "agile", "sprint planning", "team collaboration", "task management", "productivity"],
  openGraph: {
    title: "Runway - Ship work that matters",
    description: "Project management stripped to its essence. No clutter. No complexity. Just results.",
    type: "website",
    url: "https://runway.app",
    siteName: "Runway",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runway - Ship work that matters",
    description: "Project management stripped to its essence. No clutter. No complexity. Just results.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased`}>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider>
            <AppProviders>
              {children}
              <Toaster />
            </AppProviders>
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
