"use client";

import React from "react";
import { SessionList } from "@/components/session-list";
import { useChatStore } from "@/store/chat";
import { useConfigStore } from "@/store/config";
import { IconMessageChatbot, IconRobot } from "@tabler/icons-react";
import { DialogConfig } from "@/components/dialog-config";
import { HeartHandshake, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lemonCheckoutURL } from "@/types/lemon";
import { useUserStore } from "@/store/user";

export default function SideBar() {
  const { addSession, sessions } = useChatStore();
  const { modelConfig } = useConfigStore();
  const { isAuthed, user } = useUserStore();

  function doCreateNewSession() {
    const n = sessions.length + 1;
    addSession(modelConfig, "New Session " + n, []);
    // navigate(Path.Chat);
  }

  // useHotKey();
  return (
    <div className=" relative hidden w-80 px-3 py-2 ease-in-out  sm:flex sm:flex-col">
      <div className="relative w-full py-4">
        <div className="text-lg font-bold ">MojoAI</div>
        <p className="text-sm">Transforming the Possible!</p>
        <div className="absolute bottom-4 right-0 text-orange-600">
          <IconRobot size={42}></IconRobot>
        </div>
      </div>

      <SessionList />

      <div className="align-center my-4 flex w-full  items-center justify-evenly">
        <Button variant="ghost" title="add new session" className={""}>
          <HeartHandshake />
        </Button>

        <Button
          variant="ghost"
          title="add new session"
          onClick={(e) => {
            e.stopPropagation();
            const url = lemonCheckoutURL(user.email, user.id);
            window.open(url, "_blank");
          }}
          className={""}
        >
          <ShoppingCart />
        </Button>

        <DialogConfig />

        <Button
          variant="ghost"
          title="add new session"
          onClick={doCreateNewSession}
          className={""}
        >
          <IconMessageChatbot />
        </Button>
      </div>
    </div>
  );
}
