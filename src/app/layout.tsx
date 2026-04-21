import "./globals.css";
import type { Metadata } from "next";
import { Space_Grotesk, Source_Sans_3 } from "next/font/google";

import { AppProviders } from "@/shared/components/providers/AppProviders";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "HorizonSync",
    template: "%s | HorizonSync",
  },
  description:
    "A unified collaboration platform combining real-time communication, global publishing, and private execution in one polished workspace.",
  applicationName: "HorizonSync",
  icons: {
    apple: "/branding/horizonsync-logo.jpg",
    icon: "/branding/horizonsync-logo.jpg",
    shortcut: "/branding/horizonsync-logo.jpg",
  },
  openGraph: {
    title: "HorizonSync",
    description:
      "A unified collaboration platform combining real-time communication, global publishing, and private execution in one polished workspace.",
    images: [
      {
        alt: "HorizonSync wordmark banner",
        height: 210,
        url: "/branding/horizonsync-banner.jpg",
        width: 989,
      },
    ],
    siteName: "HorizonSync",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "A unified collaboration platform combining real-time communication, global publishing, and private execution in one polished workspace.",
    images: ["/branding/horizonsync-banner.jpg"],
    title: "HorizonSync",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-[rgb(var(--background))] font-sans text-[rgb(var(--foreground))] antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
