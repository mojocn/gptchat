import * as React from "react";
import {useEffect, useState} from "react";
import {ChatState, Session, useChatStore} from "@/store/chat";
import {useTheme} from "next-themes"
import {Button} from "@/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from "@/components/ui/dropdown-menu"
import {Moon, Sun} from "lucide-react"
import {useLocal} from "@/store/local";
import {UserNav} from "@/components/user-nav";

export default function ChatHeader() {
    const [session, setSession] = useState<Session>({} as Session);
    const {selectedSessionId, sessions}: ChatState = useChatStore();
    const {t} = useLocal();

    useEffect(() => {
        const ss = sessions.find(s => s.id === selectedSessionId);
        ss && setSession(ss!);
    }, [selectedSessionId, sessions]);


    return (
        <div className="w-full flex align-center items-center justify-between border-b chat-header-height p-[8px]">
            <section>
                <h2
                    className="text-lg font-bold"
                >
                    {`${session.title} / ${session.modelConfig?.model}`}
                </h2>
                <h4 className="text-sm font-medium">
                    {t.SubTitle && t.SubTitle(session.messages?.length)}
                    {/*    todo:fix this*/}

                </h4>
            </section>
            <div className="flex justify-center align-center items-center gap-x-4">
                <ThemeToggle/>
                <UserNav/>
            </div>

        </div>
    );
}


export function ThemeToggle() {
    //https://ui.shadcn.com/docs/dark-mode/next#add-a-mode-toggle
    const {setTheme} = useTheme()
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Sun
                        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                    <Moon
                        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}