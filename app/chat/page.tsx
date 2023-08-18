import React, { useEffect } from "react";
import { redirect, useRouter } from "next/navigation";
import { checkAuth } from "@/app/api/check-auth";
import dynamic from "next/dynamic";

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

export default async function ChatPage() {
  const userId = await checkAuth();
  if (!userId) {
    redirect("/login");
    return null;
  }

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
