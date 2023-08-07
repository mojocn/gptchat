'use client';
import React, {useEffect} from 'react';
import {useUserStore} from "@/store/user";
import {useRouter} from "next/navigation";
import ChatInput from "@/components/chat-input";
import dynamic from 'next/dynamic'
import {useTheme} from "@/app/use-theme";


const SideBar = dynamic(() => import('../components/sidebar'), {ssr: false,});
const ChatHeader = dynamic(() => import('../components/chat-header'), {ssr: false,});
const ChatMsgList = dynamic(() => import('../components/chat-msg-list'), {ssr: false,});
const PromptList = dynamic(() => import('../components/prompt-list'), {ssr: false,});
export default function Home() {
    const router = useRouter();
    const {isAuthed} = useUserStore();
    useTheme();

    useEffect(() => {
        !isAuthed && router.push('/login')
    }, [isAuthed, router])

    return (

        <div
            className={"bg-white text-black dark:text-white dark:bg-gray-800 rounded-lg flex overflow-hidden box-border w-screen h-screen"}
        >
            <SideBar/>
            <div className="h-full w-full flex flex-col grow">
                <ChatHeader/>
                <ChatMsgList/>
                <PromptList/>
                <ChatInput/>
            </div>
        </div>
    )
}






