'use client';
import React, {useEffect} from 'react';
import {useConfigStore} from "@/store/config";
import {useUserStore} from "@/store/user";
import {useRouter} from "next/navigation";
import ChatInput from "@/components/chat-input";
import dynamic from 'next/dynamic'
import {Theme} from "@/types/const";


const SideBar = dynamic(() => import('../components/sidebar'), {ssr: false,});
const ChatHeader = dynamic(() => import('../components/chat-header'), {ssr: false,});
const ChatMsgList = dynamic(() => import('../components/chat-msg-list'), {ssr: false,});
const PromptList = dynamic(() => import('../components/prompt-list'), {ssr: false,});
export default function Home() {
    const router = useRouter();
    const {isAuthed} = useUserStore();
    const {theme} = useConfigStore()
    useEffect(() => {
        // On page load or when changing themes, best to add inline in `head` to avoid FOUC
        if (theme === Theme.Dark || (theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        if (theme === Theme.Light || (theme === Theme.Auto && window.matchMedia('(prefers-color-scheme: light)').matches)) {
            document.documentElement.classList.add('light')
        } else {
            document.documentElement.classList.remove('light')
        }
    }, [theme])

    useEffect(() => {
        !isAuthed && router.push('/login')
    }, [isAuthed, router])

    return (

        <div
            className={" bg-white text-black dark:text-white dark:bg-gray-800 rounded-lg flex overflow-hidden box-border w-screen h-screen"}
        >
            <SideBar/>
            <div className="h-full w-full flex flex-col flex-1">
                <ChatHeader/>
                <ChatMsgList/>
                <PromptList/>
                <ChatInput/>
            </div>
        </div>
    )
}






