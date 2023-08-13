import * as React from "react";
import {useEffect, useState} from "react";
import {ChatState, Session, useChatStore} from "@/store/chat";
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
        <div className="w-full flex align-center items-center justify-between border-b chat-header-height py-[8px] px-4">
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
                <UserNav/>
            </div>
        </div>
    );
}


