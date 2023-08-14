import * as React from "react";
import { useEffect, useState } from "react";
import { ChatState, Session, useChatStore } from "@/store/chat";
import { useLocal } from "@/store/local";
import { UserNav } from "@/components/user-nav";

export default function ChatHeader() {
  const [session, setSession] = useState<Session>({} as Session);
  const { selectedSessionId, sessions }: ChatState = useChatStore();
  const { t } = useLocal();

  useEffect(() => {
    const ss = sessions.find((s) => s.id === selectedSessionId);
    ss && setSession(ss!);
  }, [selectedSessionId, sessions]);

  return (
    <div className="align-center chat-header-height flex w-full items-center justify-between border-b px-4 py-[8px]">
      <section>
        <h2 className="text-lg font-bold">{`${session.title} / ${session.modelConfig?.model}`}</h2>
        <h4 className="text-sm font-medium">
          {t.SubTitle && t.SubTitle(session.messages?.length)}
          {/*    todo:fix this*/}
        </h4>
      </section>
      <div className="align-center flex items-center justify-center gap-x-4">
        <UserNav />
      </div>
    </div>
  );
}
