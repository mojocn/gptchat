import {Analytics} from '@vercel/analytics/react';
import "@/styles/globals.scss";
import "@/styles/markdown.scss";
import "@/styles/highlight.scss";
import React from "react";
import {ThemeProvider} from "@/components/theme-provider"
import {siteConfig} from "@/store/site"
import {Metadata} from "next"
import {cn} from "@/lib/utils";
import {fontSans} from "@/lib/fonts";
import {TailwindIndicator} from "@/components/tailwind-indicator";
import {SiteFooter} from "@/components/site-footer";
import {SiteHeader} from "@/components/site-header";
import {Toaster} from "@/components/ui/toaster";


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
        {media: "(prefers-color-scheme: light)", color: "white"},
        {media: "(prefers-color-scheme: dark)", color: "black"},
    ],
    openGraph: {
        type: "website",
        locale: "en_US",
        url: siteConfig.url,
        title: siteConfig.name,
        description: siteConfig.description,
        siteName: siteConfig.name,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
        creator: "@neochau",
    },
    icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon-16x16.png",
        apple: "/apple-touch-icon.png",
    },
    manifest: `${siteConfig.url}/site.webmanifest`,
}


export default function RootLayout({children,}: { children: React.ReactNode }) {


    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}
        >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {/*<main className="select-none w-screen h-screen xl:w-[1200px]  xl:mx-auto ">*/}
            {/*    {children}*/}
            {/*</main>*/}
            <div className="relative flex min-h-screen flex-col">
                <SiteHeader/>
                <div className="flex-1">{children}</div>
                <SiteFooter/>
            </div>
            <TailwindIndicator/>
        </ThemeProvider>
        <Analytics/>
        <Toaster/>
        </body>
        </html>
    )
}


