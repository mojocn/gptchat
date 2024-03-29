"use client";

import React, { useState } from "react";
import { Markdown } from "@/components/markdown";
import { ChatState, Message, useChatStore } from "@/store/chat";
import { showToast } from "@/components/ui-lib";
import { IconLoader, IconRobot, IconUser } from "@tabler/icons-react";
import { UiStore, useUiStore } from "@/store/ui";
import { useUserStore } from "@/store/user";
import { fetchSpeechToken, text2speech } from "@/pkg/tts";
import { useLocal } from "@/store/local";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

async function doText2Speech(markdownCode: string) {
  const text = markdownCode.replace(/<[^>]+>/g, "");
  const { jwt, region } = await fetchSpeechToken();
  text2speech(jwt, region, text);
}

function MsgContent({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={cn(
        "w-full  select-text rounded-lg   p-2 ",
        isUser ? "bg-primary text-white" : "bg-muted",
      )}
    >
      <Markdown content={msg.content || ""} defaultShow={true} />
    </div>
  );
}

export function ChatMsg({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <section
      className={cn(
        "w-full  rounded-lg px-3 py-2 text-sm ",
        isUser ? "ml-auto sm:max-w-[50%]" : "sm:max-w-[75%]",
      )}
    >
      <MsgHeader msg={msg}></MsgHeader>
      <MsgContent msg={msg} />
      <p
        className={cn(
          "mt-2 w-full text-xs text-gray-400 ",
          isUser ? "text-left" : "text-right",
        )}
      >
        {msg.time}
      </p>
    </section>
  );
}

function MsgHeader({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const { setIsScrollAuto }: UiStore = useUiStore();
  const { user } = useUserStore();
  const { t } = useLocal();
  const {
    setUserInput,
    sessions,
    doCallOpenAiCompletion,
    selectedSessionId,
    setLastUserInput,
    deleteMessageFromSelectedSession,
    upsertSession,
  }: ChatState = useChatStore();

  function doMsgDrawback(m: Message) {
    const session = sessions.find((ss) => ss.id === selectedSessionId);
    if (!session) return;
    const idx = session.messages.findIndex((mm) => mm.id === m.id);
    if (idx > -1) {
      const withdrawContent = session.messages
        .slice(idx)
        .map((m) => m.content.trim())
        .join("\n");
      setUserInput(withdrawContent);
      session.messages = session.messages.slice(0, idx);
      upsertSession(session);
    }
  }

  async function doRetryMsg(m: Message) {
    const userInput = m.content;
    if (userInput === "") return;

    //remove afterwards messages
    const session = sessions.find((ss) => ss.id === selectedSessionId);
    if (!session) return;
    const idx = session.messages.findIndex((mm) => mm.id === m.id);
    if (idx > -1) {
      session.messages = session.messages.slice(0, idx + 1);
      upsertSession(session);
    }
    //send open ai completion
    setLastUserInput(userInput);
    setIsScrollAuto(true);

    const { code, msg } = await doCallOpenAiCompletion(
      user.username,
      selectedSessionId,
    );
    if (code != 200) {
      msg && showToast(msg);
    }
    if (code == 401) {
      window.location.href = "/login";
    }
  }

  return (
    <div
      className={cn(
        "align-center mx-2 flex items-center justify-between gap-x-6",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <section
        className={cn(
          "align-center flex flex-row items-center justify-items-start gap-4",
          isUser ? "flex-row" : "flex-row-reverse",
        )}
      >
        {msg.isTyping || msg.streaming ? (
          // <p className="text-gray-400 text-xs ">
          //     {t.Typing}
          // </p>
          <IconLoader className="animate-spin" size={18} />
        ) : isUser ? (
          <IconUser />
        ) : (
          <IconRobot />
        )}
      </section>

      <section className="w-18 flex flex-row gap-x-4   py-2 text-xs   text-gray-400 hover:[&>button]:text-gray-900">
        <DialogMsgEdit msg={msg} />

        <button onClick={() => deleteMessageFromSelectedSession(msg.id)}>
          {t.Delete}
        </button>

        {isUser && (
          <button onClick={async () => await doRetryMsg(msg)}>{t.Retry}</button>
        )}

        {isUser && (
          <button onClick={() => doMsgDrawback(msg)}>{t.Drawback}</button>
        )}

        <ButtonCopy msg={msg} />

        <button
          onClick={async () => {
            await doText2Speech(msg.content);
          }}
        >
          Speech
        </button>
      </section>
    </div>
  );
}

function ButtonCopy({ msg }: { msg: Message }) {
  const { toast } = useToast();
  const { t } = useLocal();
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard
          .writeText(msg.content)
          .then(() => {
            toast({
              title: "Copied",
              description: "successfully copied to clipboard.",
            });
          })
          .catch((e) => {
            toast({
              title: "Error",
              description: "failed to copy to clipboard. " + e.msg,
            });
          });
      }}
    >
      {t.Copy}
    </button>
  );
}

function DialogMsgEdit({ msg }: { msg: Message }) {
  const [content, setContent] = useState(msg.content);
  const [open, setOpen] = useState(false);
  const { t } = useLocal();
  const { editMessageFromSelectedSession }: ChatState = useChatStore();

  function doEdit() {
    setOpen(false);
    editMessageFromSelectedSession(msg.id, content);

    //todo
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/*<Button variant="outline">Edit Profile</Button>*/}
        <button>{t.Edit} </button>
      </DialogTrigger>
      <DialogContent className=" min-w-max">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
          <DialogDescription>
            Edit Message to make chat GPT work better
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={content}
          className="min-h-fit min-w-fit resize"
          rows={msg.content.split("\n").length + 2}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              doEdit();
            }
          }}
          onInput={(e) => setContent(e.currentTarget.value)}
        />
        <DialogFooter>
          <Button
            type="submit"
            onClick={(event) => {
              event.preventDefault();
              doEdit();
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
