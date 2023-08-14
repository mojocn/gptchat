import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.scss";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/store/site";
import { Metadata } from "next";
import { cn } from "@/lib/utils";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Next.js",
    "React",
    "Tailwind CSS",
    "Server Components",
    "Fullstack",
    "OpenAI",
    "ChatGPT",
    "Azure OpenAI",
  ],
  authors: [
    {
      name: "EricZhou",
      url: "https://github.com/mojocn",
    },
  ],
  creator: "EricZhou",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  // openGraph: {
  //     type: 'website',
  //     locale: 'en_US',
  //     url: siteConfig.url,
  //     title: siteConfig.name,
  //     description: siteConfig.description,
  //     siteName: siteConfig.name,
  //     images: [
  //         {
  //             url: siteConfig.ogImage,
  //             width: 1200,
  //             height: 630,
  //             alt: siteConfig.name,
  //         },
  //     ],
  // },
  // twitter: {
  //     card: 'summary_large_image',
  //     title: siteConfig.name,
  //     description: siteConfig.description,
  //     images: [siteConfig.ogImage],
  //     creator: '@neochau',
  // },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("select-auto bg-background font-sans antialiased")}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
        <TailwindIndicator />
        <Analytics />
      </body>
    </html>
  );
}
