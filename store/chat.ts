import { create } from "zustand";
import { persist } from "zustand/middleware";
import { OpenAiChatCompletionReq } from "@/pkg/openai";
import { DEFAULT_CONFIG, ModelConfig } from "@/store/config";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number]; // "system" | "user" | "assistant"
export interface RequestMessage {
  role: MessageRole;
  content: string;
}

const defaultSystemMsg = (): Message => {
  return {
    id: "system",
    role: "system",
    content: "",
    time: new Date().toLocaleString(),
  } as Message;
};

function blankSession(): Session {
  return {
    id: "default",
    messages: [defaultSystemMsg()],
    modelConfig: DEFAULT_CONFIG.modelConfig,
    time: new Date().toLocaleString(),
    title: "New Session",
  } as Session;
}

export interface ChatState {
  reset: () => void;
  userInputFocus: boolean;
  setUserInputFocus: (_: boolean) => void;
  userInput: string;
  setUserInput: (_: string) => void;
  getCurrentMessages: () => Message[];
  deleteMessagesBySessionId: (_: string) => void;
  deleteMessageFromSelectedSession: (msgID: string) => void;
  editMessageFromSelectedSession: (_: string, _1: string) => void;

  selectedSessionId: string;
  getSelectedSession: () => Session | undefined;
  sessionById: (id: string) => Session | undefined;

  renameSession: (sessionId: string, title: string) => void;
  sessions: Session[];
  setSelectedSessionId: (id: string) => void;
  addSession: (cfg: ModelConfig, title: string, messages: Message[]) => void;
  deleteSession: (id: string) => void;

  upsertMessage: (m: Message, sessionId: string) => void;
  upsertSession: (s: Session) => void;

  lastUserInput: string;
  setLastUserInput: (_: string) => void;

  getLastMessages: (sessionId: string, size: number) => RequestMessage[];
  getChatCompletionArgs: (username: string) => OpenAiChatCompletionReq;

  doCallOpenAiCompletion: (
    username: string,
    selectedSessionId: string,
  ) => Promise<Result>;
}

export interface Message {
  role: string; //open ai
  content: string; //open ai
  time: string;
  id: string;
  streaming: boolean;
  isTyping?: boolean;
}

export interface Session {
  id: string;
  title: string;
  time: string;
  messages: Message[];
  modelConfig: ModelConfig;
}

const decoder = new TextDecoder();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => {
      return {
        reset: () => localStorage.removeItem("chat"),

        userInputFocus: true, //useEffect: tell user input textarea to focus
        setUserInputFocus: (v: boolean) => set({ userInputFocus: v }),

        lastUserInput: "",
        setLastUserInput: (v: string) => set({ lastUserInput: v.trim() }),

        userInput: "",
        sessions: [blankSession()],

        setSelectedSessionId: (id: string): void => {
          set({ selectedSessionId: id });
        },
        getSelectedSession() {
          let id = get().selectedSessionId;
          return get().sessions.find((e) => e.id === id);
        },
        upsertSession: (s: Session) => {
          let isNotExist = true;
          const newSessions = get().sessions.map((e) => {
            if (e.id === s.id) {
              isNotExist = false;
              e = { ...s };
            } else {
              isNotExist = true;
            }
            return { ...e };
          });
          if (isNotExist) {
            newSessions.push({ ...s });
          }
          set({ sessions: newSessions });
        },
        renameSession: (sessionId: string, title: string) => {
          const sessions = get().sessions.map((e) => {
            if (e.id === sessionId) {
              e.title = title.trim();
            }
            return { ...e };
          });
          set({ sessions: sessions });
        },
        selectedSessionId: "default",
        addSession: (
          modelCfg: ModelConfig,
          title: string,
          messages: Message[],
        ) => {
          const s = {
            title: title,
            modelConfig: modelCfg,
            messages: messages,
            count: 0,
            id: new Date().getTime().toString(),
            time: new Date().toLocaleString(),
          } as Session;
          const oldSessions = get().sessions.map((e) => {
            return { ...e };
          });
          set({ selectedSessionId: s.id });
          set({ sessions: [s, ...oldSessions] });
        },
        deleteSession: (id: string) => {
          if (!id) return;
          const oldSessions = get().sessions;
          if (oldSessions.length === 1) return;
          const newSessions = oldSessions.filter((e) => e.id !== id);
          set({ sessions: newSessions });
          if (newSessions.length > 0 && get().selectedSessionId === id) {
            let firstSession = newSessions[0];
            set({ selectedSessionId: firstSession.id });
          }
        },

        upsertMessage(m: Message, sessionId: string) {
          const sessions = get().sessions.map((ss) => {
            if (ss.id === sessionId) {
              let isMsgNotFound = true;
              ss.messages = ss.messages.map((msg) => {
                if (msg.id === m.id) {
                  isMsgNotFound = false;
                  return { ...m } as Message;
                } else return { ...msg } as Message;
              });
              if (isMsgNotFound) {
                ss.messages.push(m); //insert a new message into
              }
            }
            return { ...ss } as Session;
          });
          set({ sessions: sessions });
        },
        getLastMessages(sessionId: string, size: number): RequestMessage[] {
          const findSession = get().sessions.find((e) => e.id === sessionId);
          if (!findSession) return [];
          return findSession.messages
            .map((e) => {
              return { role: e.role, content: e.content } as RequestMessage;
            })
            .slice(-size);
        },

        sessionById(id: string): Session | undefined {
          return get().sessions.find((e) => e.id === id);
        },

        setUserInput: (v: string) => set({ userInput: v }),

        deleteMessagesBySessionId: (sessionId: string) => {
          const sessions = get().sessions.map((e) => {
            if (e.id === sessionId) {
              return { ...e, messages: [defaultSystemMsg()] };
            } else return { ...e };
          });
          set({ sessions: sessions });
        },
        editMessageFromSelectedSession: (msgID: string, content: string) => {
          if (!msgID || !content) return;
          const newSessions = get().sessions.map((e) => {
            if (e.id === get().selectedSessionId) {
              const newMessages = e.messages.map((e) => {
                if (e.id === msgID) {
                  e.content = content;
                }
                return e;
              });
              return { ...e, messages: newMessages };
            } else return { ...e };
          });
          set({ sessions: newSessions });
        },
        deleteMessageFromSelectedSession: (msgID: string) => {
          if (!msgID) return;
          const newSessions = get().sessions.map((e) => {
            if (e.id === get().selectedSessionId) {
              const newMessages = e.messages.filter((e) => e.id !== msgID);
              return { ...e, messages: newMessages };
            } else return { ...e };
          });
          set({ sessions: newSessions });
        },
        getChatCompletionArgs: (username: string) => {
          const selectedSessionId = get().selectedSessionId;
          const s = get().sessions.find((e) => e.id === selectedSessionId);
          const lastMessages = get().getLastMessages(
            get().selectedSessionId,
            s?.modelConfig.max_history || 8,
          );
          return {
            model: s?.modelConfig.model,
            messages: lastMessages,
            temperature: s?.modelConfig.temperature,
            top_p: s?.modelConfig.top_p,
            frequency_penalty: s?.modelConfig.frequency_penalty,
            presence_penalty: s?.modelConfig.presence_penalty,
            max_tokens: s?.modelConfig.max_tokens,
            stream: true,
            user: username,
          } as OpenAiChatCompletionReq;
        },
        doCallOpenAiCompletion: async (
          username: string,
          selectedSessionId: string,
        ) => {
          const openAiArgs = get().getChatCompletionArgs(username);
          let msgObj = {
            id: BLANK_LOADING_MSG_ID,
            role: "assistant",
            content: "",
            time: new Date().toLocaleString(),
            isTyping: false,
            streaming: true,
          } as Message;
          get().upsertMessage(msgObj, selectedSessionId);
          const result = await callAzureChatCompletion(
            openAiArgs,
            (msgId: string, deltaMsg: string) => {
              get().deleteMessageFromSelectedSession(BLANK_LOADING_MSG_ID);
              msgObj.id = msgId;
              msgObj.content += deltaMsg;
              msgObj.time = new Date().toLocaleString();
              msgObj.isTyping = false;
              msgObj.streaming = true;
              get().upsertMessage(msgObj, selectedSessionId);
            },
          );
          if (result.code !== 200) {
            get().deleteMessageFromSelectedSession(BLANK_LOADING_MSG_ID);
          }
          msgObj.isTyping = false;
          msgObj.streaming = false;
          get().upsertMessage(msgObj, selectedSessionId);
          return result;
        },
      } as ChatState;
    },
    {
      name: "chat", // name of the item in the storage (must be unique)
    },
  ),
);

const BLANK_LOADING_MSG_ID = "blank_loading_msg_id";

interface Result {
  code: number;
  msg: string;
}

export async function callAzureChatCompletion(
  arg: OpenAiChatCompletionReq,
  handleDeltaMsgFn: (messageId: string, deltaMsg: string) => void,
) {
  arg.stream = true;
  const response = await fetch("/api/gpt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });
  let result = { code: response.status, msg: "" } as Result;
  if (!response.ok) {
    result.msg = await response.text();
    return result;
  }
  if (!response.body) {
    result.msg = "response.body is null";
    return result;
  }
  const reader = response.body.getReader();
  const onParse = (event: ParsedEvent | ReconnectInterval) => {
    if (event.type !== "event") return;
    const data = event.data;
    if (!data) return;
    try {
      const json = JSON.parse(data);
      if (json.choices[0].finish_reason != null) return;
      const deltaContent = json.choices[0].delta.content;
      if (!deltaContent) return;
      handleDeltaMsgFn(json.id, deltaContent);
    } catch (e) {
      console.error("try catch");
      console.error(data);
    }
  };
  const parser = createParser(onParse);
  let notDone = true;
  while (notDone) {
    const { done, value } = await reader.read();
    notDone = !done;
    const textValue = decoder.decode(value);
    parser.feed(textValue);
  }
  return result;
}
