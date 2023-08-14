import Link from "next/link"

import {siteConfig} from "@/store/site"
import {cn} from "@/lib/utils"
import {NavBarCommandK} from "./nav-bar-command-k"
import {NavBarMain} from "./nav-bar-main"
import {NavBarMobile} from "./nav-bar-mobile"
import {buttonVariants} from "./ui/button"
import {ModeToggle} from "./mode-toggle";
import {Github, Twitter} from "lucide-react";

export function SiteHeader() {
    return (
        <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
            <div className="container  h-14 flex items-center">
                <NavBarMain/>
                <NavBarMobile/>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        <NavBarCommandK/>
                    </div>
                    <nav className="flex items-center">
                        <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
                            <div
                                className={cn(
                                    buttonVariants({
                                        variant: "ghost",
                                    }),
                                    "w-9 px-0"
                                )}
                            >
                                <Github className="h-4 w-4"/>
                                <span className="sr-only">GitHub</span>
                            </div>
                        </Link>
                        <Link href={siteConfig.links.twitter} target="_blank" rel="noreferrer">
                            <div
                                className={cn(
                                    buttonVariants({
                                        variant: "ghost",
                                    }),
                                    "w-9 px-0"
                                )}
                            >
                                <Twitter className="h-4 w-4 fill-current"/>
                                <span className="sr-only">Twitter</span>
                            </div>
                        </Link>
                        <ModeToggle/>
                    </nav>
                </div>
            </div>
        </header>
    )
}
