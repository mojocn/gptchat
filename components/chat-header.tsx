import * as React from "react";
import {useEffect, useState} from "react";
import {ChatState, Session, useChatStore} from "@/store/chat";
import {IconAdjustments} from "@tabler/icons-react";
import {DialogSession} from "@/components/dialog-session";
import {CaButton} from "@/components/ui-lib";
import {useLocal} from "@/store/local";

export default function ChatHeader(props: {
    onClick?: any;
    icon?: string;
    type?: "primary" | "danger";
    text?: string;
    bordered?: boolean;
    shadow?: boolean;
    className?: string;
    title?: string;
    disabled?: boolean;
}) {
    const [session, setSession] = useState<Session>({} as Session);
    const {selectedSessionId, sessions}: ChatState = useChatStore();
    const {t} = useLocal();

    useEffect(() => {
        const ss = sessions.find(s => s.id === selectedSessionId);
        ss && setSession(ss!);
    }, [selectedSessionId, sessions]);


    return (
        <div className="flex align-center justify-between px-4 py-3 border-b border-gray-200">

        <div className="">
                <h2
                    className="text-lg font-bold"
                >
                    {session.title}
                </h2>
                <h4 className="text-sm font-medium">
                    {t.SubTitle(session.messages?.length)}
                </h4>
            </div>

        </div>
    );
}
