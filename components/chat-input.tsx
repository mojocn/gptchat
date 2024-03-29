"use client";
import { type ChatState, Message, Session, useChatStore } from "@/store/chat";
import React, { useEffect, useRef } from "react";
import { UiStore, useUiStore } from "@/store/ui";
import { useUserStore } from "@/store/user";
import {
  IconArrowsDown,
  IconArrowsUp,
  IconBackspace,
  IconHistory,
  IconMicrophone,
  IconSend,
  IconWaveSine,
} from "@tabler/icons-react";
import { showToast } from "@/components/ui-lib";
import { DialogSession } from "@/components/dialog-session";
import { useSpeech2txt } from "@/components/speech2txt";
import { sleep2 } from "@/pkg/util";
import { useLocal } from "@/store/local";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MSG_DRAFT = "MSG_DRAFT_TO_PREVIEW";
const ChatInput = () => {
  const { recognizerStart, recognizerStop, recognizing } = useSpeech2txt();
  const { user } = useUserStore();
  const { t } = useLocal();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    userInput,
    setUserInput,
    doCallOpenAiCompletion,
    userInputFocus,
    getSelectedSession,
    lastUserInput,
    setLastUserInput,
    upsertMessage,
    deleteMessagesBySessionId,
    deleteMessageFromSelectedSession,
    selectedSessionId,
  }: ChatState = useChatStore();
  const { setIsScrollBottom, setIsScrollTop, setIsScrollAuto }: UiStore =
    useUiStore();
  const session = getSelectedSession() || ({} as Session);

  const doClearMessages = () => {
    selectedSessionId && deleteMessagesBySessionId(selectedSessionId);
  };
  function doShowInputHistory() {}
  function doScrollToBottom() {
    console.info("doScrollToBottom");
    setIsScrollAuto(true);
    setIsScrollAuto(false);
    setIsScrollBottom(true);
    setIsScrollTop(false);
  }

  function doScrollToTop() {
    console.info("doScrollToTop");
    setIsScrollAuto(undefined);
    setIsScrollBottom(undefined);
    setIsScrollTop(true);
  }

  const onInputKeyDown = async (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      e.preventDefault();
      setUserInput(lastUserInput ?? "");
      return;
    }
    if (e.key === "Enter" && !(e.metaKey || e.altKey || e.ctrlKey)) {
      e.preventDefault(); // enter key send msg
      await doSubmit(userInput);
    }
    if (e.key === "Enter" && (e.metaKey || e.altKey || e.ctrlKey)) {
      const textareaTarget = e.target as HTMLTextAreaElement;
      const { value, selectionStart, selectionEnd } = textareaTarget;
      textareaTarget.value = `${value.slice(0, selectionStart)}\n${value.slice(
        selectionEnd,
      )}`;
      textareaTarget.selectionStart = selectionStart + 1;
      textareaTarget.selectionEnd = selectionStart + 1;
      e.preventDefault(); //break a new line
      return;
    }
  };
  const doSubmit = async (userInput: string) => {
    deleteMessageFromSelectedSession(MSG_DRAFT);
    userInput = userInput.trim();
    if (userInput === "") return;

    setIsScrollTop(false);
    setIsScrollBottom(false);
    setIsScrollAuto(true);
    const newMsg = {
      id: new Date().toISOString(),
      role: "user",
      content: userInput,
      time: new Date().toLocaleString(),
      isTyping: false,
      streaming: false,
    } as Message;
    upsertMessage(newMsg, selectedSessionId);
    setLastUserInput(userInput);
    setUserInput("");
    const { code, msg } = await doCallOpenAiCompletion(
      user.username,
      selectedSessionId,
    );
    if (code !== 200) {
      console.error(msg, code);
      showToast(msg, 1000);
    }
    if (code === 401) {
      window.location.href = "/login";
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const vv = e.target.value;
    setUserInput(vv);
    setIsScrollAuto(true);
    upsertMessage(
      {
        id: MSG_DRAFT,
        role: "user",
        content: vv,
        time: new Date().toLocaleString(),
        isTyping: true,
        streaming: false,
      },
      selectedSessionId,
    );
  };
  // autofocus on input
  useEffect(() => {
    if (userInputFocus) {
      textareaRef.current?.focus();
    } else {
      textareaRef.current?.blur();
    }
  }, [userInputFocus]);

  return (
    <div className="chat-footer-height relative flex-col items-start border-t p-4">
      <div className="mb-3 flex w-full justify-start gap-x-2">
        <Button variant="ghost" onClick={doScrollToTop} title="scroll to top">
          <IconArrowsUp />
        </Button>

        <Button
          variant="ghost"
          onClick={doScrollToBottom}
          title="scroll to bottom"
        >
          <IconArrowsDown />
        </Button>

        <Button
          variant="ghost"
          onClick={doClearMessages}
          title="empty all messages"
        >
          <IconBackspace />
        </Button>

        <DialogSession session={session} />

        {recognizing ? (
          <Button
            variant="ghost"
            onClick={async () => {
              await recognizerStop();
              sleep2(100);
              await doSubmit(userInput);
            }}
            className="bg-orange-600"
          >
            {" "}
            <IconWaveSine className="animate-ping " />
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={async () => {
              await recognizerStart((txt: string) => {
                setUserInput(txt);
              });
            }}
            className=""
          >
            <IconMicrophone />
          </Button>
        )}
      </div>

      <Textarea
        id="user-input"
        rows={5}
        value={userInput}
        ref={textareaRef}
        onKeyDown={onInputKeyDown}
        onChange={handleInputChange}
        onCompositionStart={() => {}}
        onCompositionEnd={() => {}}
        onBlur={() => {
          setIsScrollTop(false);
          setIsScrollBottom(false);
          setIsScrollAuto(false);
        }}
        onFocus={() => {
          setIsScrollTop(false);
          setIsScrollBottom(false);
          setIsScrollAuto(true);
        }}
        className="relative w-full  resize-none"
        placeholder={t.inputPlaceholder}
        required
      />
      <Button
        type="submit"
        variant="ghost"
        className="absolute bottom-8 right-8"
        title="send"
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          await doSubmit(userInput);
        }}
      >
        <IconSend size={16} />
        <span className="sr-only">Send</span>
      </Button>
    </div>
  );
};

export default ChatInput;
