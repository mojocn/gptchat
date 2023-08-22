"use client";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { NavBarCommandK } from "@/components/nav-bar-command-k";
import { NavBarMain } from "@/components/nav-bar-main";
import { NavBarMobile } from "@/components/nav-bar-mobile";
import { buttonVariants } from "@/components/ui/button";
import { UserNav } from "@/components/user-nav";
import { IconRobot } from "@tabler/icons-react";

export function SiteHeader() {
  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container  flex h-14 items-center">
        <NavBarMain />
        <NavBarMobile />
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <NavBarCommandK />
          </div>
          <nav className="flex items-center">
            <Link href="/chat" target="_blank" rel="noreferrer">
              <div
                className={cn(
                  buttonVariants({
                    variant: "ghost",
                  }),
                  "w-9 px-0",
                )}
              >
                <IconRobot className="h-4 w-4 " size={24} />
                <span className="sr-only">ChatGPT</span>
              </div>
            </Link>

            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  );
}
