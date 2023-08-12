import "katex/dist/katex.min.css";
import React, {useRef, useState} from "react";
import {Markdown} from "@/components/markdown";
import {ChatState, Message, useChatStore} from "@/store/chat";
import {showToast} from "./ui-lib";
import {IconCheck, IconRobot,  IconX} from "@tabler/icons-react";
import {UiStore, useUiStore} from "@/store/ui";
import {useUserStore} from "@/store/user";
import {fetchSpeechToken, text2speech} from "@/pkg/tts";
import {useLocal} from "@/store/local";
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";

async function copyToClipboard(text: string) {
    const success = "已写入剪切板"
    const fail = "复制失败，请赋予剪切板权限"
    try {
        await navigator.clipboard.writeText(text);
        showToast(success);
    } catch (error) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand("copy");
            showToast(success);
        } catch (error) {
            showToast(fail);
        }
        document.body.removeChild(textArea);
    }
}

async function doText2Speech(markdownCode: string) {
    //markdown code to plain text
    const text = markdownCode.replace(/<[^>]+>/g, '');
    const {jwt, region} = await fetchSpeechToken()
    text2speech(jwt,region,text)
}


export function ChatMsg({msg}: { msg: Message }) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    //ref textarea
    //let message = {content: 'sssss', date: '', streaming: false, id: '', role: 'user', preview: false}
    const isUser = msg.role === "user";
    const {setIsScrollAuto}: UiStore = useUiStore();
    const {user} = useUserStore();
    const {t} = useLocal();

    const {
        setUserInput,
        sessions,
        doCallOpenAiCompletion,
        selectedSessionId,
        setLastUserInput,
        deleteMessageFromSelectedSession,
        editMessageFromSelectedSession,
        upsertSession
    }: ChatState = useChatStore();
    const [isEdit, setIsEdit] = useState(false)
    const [msgContent, setMsgContent] = useState(msg.content)

    function doMsgDrawback(m: Message) {
        const session = sessions.find(ss => ss.id === selectedSessionId);
        if (!session) return;
        const idx = session.messages.findIndex(mm => mm.id === m.id);
        if (idx > -1) {
            const withdrawContent = session.messages.slice(idx).map(m => m.content.trim()).join('\n');
            setUserInput(withdrawContent);
            session.messages = session.messages.slice(0, idx);
            upsertSession(session);
        }
    }

    async function doRetryMsg(m: Message) {
        const userInput = m.content;
        if (userInput === "") return;

        //remove afterwards messages
        const session = sessions.find(ss => ss.id === selectedSessionId);
        if (!session) return;
        const idx = session.messages.findIndex(mm => mm.id === m.id);
        if (idx > -1) {
            session.messages = session.messages.slice(0, idx + 1);
            upsertSession(session);
        }
        //send open ai completion
        setLastUserInput(userInput)
        setIsScrollAuto(true);

        const {code, msg} = await doCallOpenAiCompletion(user.username, selectedSessionId);
        if (code != 200) {
            msg && showToast(msg)
        }
        if (code == 401) {
            window.location.href = '/login'
        }


    }

    function doShowEditMsg() {
        setIsEdit(true)
        setTimeout(() => {
            textareaRef.current?.focus()
        }, 50)
    }

    return (
        <div
            className={
                isUser ? 'flex flex-row-reverse' : 'flex flex-row'
            }
        >

            <section className={"mt-8 group " + (isUser ? "min-w-4/5 md:min-w-1/2" : "min-w-1/2 max-w-3/4")}>
                <div
                    className={"flex justify-between items-center align-center " + (isUser ? "flex-row-reverse" : "flex-row")}>
                    <div className="flex space-x-2">
                        {isUser ? (
                            <span></span>
                        ) : (
                            <IconRobot></IconRobot>
                        )}
                        {(msg.isTyping || msg.streaming) && (
                            <p className="text-gray-400 text-xs">
                                {t.Typing}
                            </p>
                        )}
                    </div>
                    <div className="invisible group-hover:visible flex space-x-2 text-xs
                    text-gray-400
                    hover:[&>button]:text-gray-900
                    py-2 w-18">
                        <button
                            onClick={doShowEditMsg}
                        >
                            {t.Edit}
                        </button>

                        <button
                            onClick={() => deleteMessageFromSelectedSession(msg.id)}
                        >
                            {t.Delete}
                        </button>


                        {
                            isUser && (
                                <button
                                    onClick={async () => await doRetryMsg(msg)}
                                >
                                    {t.Retry}
                                </button>
                            )
                        }

                        {
                            isUser && (
                                <button
                                    onClick={() => doMsgDrawback(msg)}
                                >
                                    {t.Drawback}
                                </button>
                            )
                        }


                        <button
                            onClick={async () => {
                                await copyToClipboard(msg.content);
                            }}
                        >
                            {t.Copy}
                        </button>

                        <button
                            onClick={async () => {
                                await doText2Speech(msg.content);
                            }}
                        >
                            Speech
                        </button>
                    </div>
                </div>
                <div
                    className={cn("rounded-lg  p-3  select-text   w-full " , isUser ? "bg-primary text-primary-foreground" : "bg-muted")}
                >
                    {
                        isEdit ?
                            (
                                <div className="w-full">
                                    <Textarea
                                        ref={textareaRef}
                                        className=""
                                        rows={msg.content.split('\n').length + 1}
                                        onInput={(e) => {
                                            setMsgContent((e.target as HTMLTextAreaElement).value)
                                        }}
                                        value={msgContent}></Textarea>
                                    <div className="flex flex-row-reverse gap-4 mt-3">
                                        <IconCheck className="cursor-pointer text-green-600"
                                                   onClick={() => {
                                                       editMessageFromSelectedSession(msg.id, msgContent)
                                                       msg.content = msgContent
                                                       setIsEdit(false)
                                                   }}
                                        />
                                        <IconX
                                            onClick={() => {
                                                setIsEdit(false)
                                            }}
                                            className="cursor-pointer text-red-600"/>
                                    </div>
                                </div>
                            )
                            :
                            <Markdown
                                miniWidth="75%"
                                content={msg.content || ''}
                                loading={false}
                                defaultShow={true}
                            />
                    }

                </div>

                <p className={"text-gray-400 text-xs mt-2 w-full " + (isUser ? "text-left" : "text-right")}>
                    {msg.time}
                </p>
            </section>

        </div>

    )
}
