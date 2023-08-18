"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useUserStore } from "@/store/user";

const SideBar = dynamic(() => import("@/components/sidebar"), { ssr: false });
const ChatHeader = dynamic(() => import("@/components/chat-header"), {
  ssr: false,
});
const ChatInput = dynamic(() => import("@/components/chat-input"), {
  ssr: false,
});
const ChatMsgList = dynamic(() => import("@/components/chat-msg-list"), {
  ssr: false,
});

export default function ChatPage() {
  const router = useRouter();
  const { isAuthed } = useUserStore();
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
