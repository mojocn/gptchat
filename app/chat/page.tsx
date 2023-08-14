"use client";
import React, { useEffect } from "react";
import { useUserStore } from "@/store/user";
import { useRouter } from "next/navigation";
import ChatInput from "@/components/chat-input";
import dynamic from "next/dynamic";

const SideBar = dynamic(() => import("@/components/sidebar"), { ssr: false });
const ChatHeader = dynamic(() => import("@/components/chat-header"), {
  ssr: false,
});
const ChatMsgList = dynamic(() => import("@/components/chat-msg-list"), {
  ssr: false,
});
export default function ChatPage() {
  const router = useRouter();
  const { isAuthed } = useUserStore();
  useEffect(() => {
    document && document.body.style.setProperty("overflow-y", "hidden");
    return () => {
      document && document.body.style.setProperty("overflow-y", "auto");
    };
  }, []);
  useEffect(() => {
    !isAuthed && router.push("/login");
  }, [isAuthed, router]);
  return (
    <main
      className={
        "box-border  flex  w-screen  overflow-hidden shadow-sm xl:mx-auto xl:w-[1200px] xl:border "
      }
    >
      <SideBar />
      <div className="h-screen w-full flex-1 border-l">
        <ChatHeader />
        <ChatMsgList />
        <ChatInput />
      </div>
    </main>
  );
}
