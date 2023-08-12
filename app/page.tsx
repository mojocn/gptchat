'use client';
import React, {useEffect} from 'react';
import {useUserStore} from "@/store/user";
import {useRouter} from "next/navigation";
import ChatInput from "@/components/chat-input";
import dynamic from 'next/dynamic'
import {Card, CardHeader} from "@/components/ui/card";


const SideBar = dynamic(() => import('../components/sidebar'), {ssr: false,});
const ChatHeader = dynamic(() => import('../components/chat-header'), {ssr: false,});
const ChatMsgList = dynamic(() => import('../components/chat-msg-list'), {ssr: false,});
export default function Home() {
    const router = useRouter();
    const {isAuthed} = useUserStore();
    useEffect(() => {
        !isAuthed && router.push('/login')
    }, [isAuthed, router])

    return (

        <div
            className={"flex overflow-hidden box-border w-screen h-screen"}
        >
            <SideBar/>
            <Card className="h-screen w-full flex flex-col grow">
                <CardHeader>
                    <ChatHeader/>
                </CardHeader>
                <ChatMsgList/>
                <ChatInput/>
            </Card>
        </div>
    )
}






