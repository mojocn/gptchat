'use client';
import React, {useEffect} from 'react';
import {useUserStore} from "@/store/user";
import {useRouter} from "next/navigation";
import ChatInput from "@/components/chat-input";
import dynamic from 'next/dynamic'


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
            className={"flex overflow-hidden box-border shadow-sm xl:border"}
        >
            <SideBar/>
            <div className="h-screen w-full border-l flex-1">
                <ChatHeader/>
                <ChatMsgList/>
                <ChatInput/>
            </div>
        </div>
    )
}






