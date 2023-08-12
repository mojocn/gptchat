import {type ChatState, Message, Session, useChatStore} from "@/store/chat";
import {CaButton} from "@/components/ui-lib";
import React, {useEffect, useRef, useState} from "react";
import {UiStore, useUiStore} from "@/store/ui";
import {useUserStore} from "@/store/user";
import {
    IconArrowsDown,
    IconArrowsUp,
    IconBackspace,
    IconMenu2, IconMicrophone,
    IconSend, IconWaveSine,
} from "@tabler/icons-react";
import {usePromptStore} from "@/store/prompt";
import {showToast} from "@/components/ui-lib";
import {DialogSession} from "@/components/dialog-session";
import {useSpeech2txt} from "@/components/speech2txt";
import {sleep2} from "@/pkg/util";
import {useLocal} from "@/store/local";
import {Button} from "@/components/ui/button";
import {Textarea } from "@/components/ui/textarea";
import {Send} from "lucide-react";

const MSG_DRAFT = "MSG_DRAFT_TO_PREVIEW"
const ChatInput = () => {
    const {recognizerStart, recognizerStop, recognizing} = useSpeech2txt();
    const {user} = useUserStore();
    const {t} = useLocal();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        userInput,
        setUserInput,
        doCallOpenAiCompletion,
        userInputFocus,
        getSelectedSession,
        setUserInputFocus,
        lastUserInput,
        setLastUserInput,
        upsertMessage,
        deleteMessagesBySessionId,
        deleteMessageFromSelectedSession,
        selectedSessionId
    }: ChatState = useChatStore();
    const {setIsScrollBottom, setIsScrollTop, setIsScrollAuto}: UiStore = useUiStore();
    let {prompts, setPrompts, rawPrompts} = usePromptStore();
    const session = getSelectedSession() || {} as Session;


    const doClearMessages = () => {
        setPrompts([]);
        selectedSessionId && deleteMessagesBySessionId(selectedSessionId);
    }


    function doShowPromptList() {
        if (prompts.length > 0) {
            setPrompts([]);
            return
        } else {
            setPrompts(rawPrompts);
            setUserInputFocus(true);
        }
    }


    function doScrollToBottom() {
        console.info("doScrollToBottom")
        setPrompts([]);
        setIsScrollAuto(true);
        setIsScrollAuto(false);
        setIsScrollBottom(true);
        setIsScrollTop(false);
    }

    function doScrollToTop() {
        console.info("doScrollToTop")
        setPrompts([]);
        setIsScrollAuto(undefined);
        setIsScrollBottom(undefined);
        setIsScrollTop(true);
    }


    const onInputKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
            e.preventDefault();// enter key send msg
            await doSubmit(userInput);
        }
        if (e.key === "Enter" && (e.metaKey || e.altKey || e.ctrlKey)) {
            const textareaTarget = e.target as HTMLTextAreaElement;
            const {value, selectionStart, selectionEnd} = textareaTarget;
            textareaTarget.value = `${value.slice(0, selectionStart)}\n${value.slice(selectionEnd)}`;
            textareaTarget.selectionStart = selectionStart + 1;
            textareaTarget.selectionEnd = selectionStart + 1;
            e.preventDefault();//break a new line
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
        const newMsg =
            {
                id: new Date().toISOString(),
                role: 'user',
                content: userInput,
                time: (new Date().toLocaleString()),
                isTyping: false,
                streaming: false,
            } as Message;
        upsertMessage(newMsg, selectedSessionId);
        setLastUserInput(userInput)
        setUserInput("");
        const {code, msg} = await doCallOpenAiCompletion(user.username, selectedSessionId);
        if (code !== 200) {
            console.error(msg, code)
            showToast(msg, 1000)
        }
        if (code === 401) {
            window.location.href = '/login'
        }
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const vv = e.target.value;
        setUserInput(vv)
        setIsScrollAuto(true);
        upsertMessage({
            id: MSG_DRAFT,
            role: 'user',
            content: vv,
            time: (new Date().toLocaleString()),
            isTyping: true,
            streaming: false,
        }, selectedSessionId)
    };
    // autofocus on input
    useEffect(() => {
        if (userInputFocus) {
            textareaRef.current?.focus()
        } else {
            textareaRef.current?.blur()
        }
    }, [userInputFocus])

    return (
        <div className="relative w-full px-2 py-3 border-t">


            <div className="flex gap-2 mb-2">
                <CaButton
                    onClick={doScrollToTop}
                    title="scroll to top"
                >
                    <IconArrowsUp/>

                </CaButton>

                <CaButton
                    onClick={doScrollToBottom}
                    title="scroll to bottom"
                >
                    <IconArrowsDown/>

                </CaButton>

                <CaButton
                    onClick={doShowPromptList}
                    title='use prompt template'
                >
                    <IconMenu2/>

                </CaButton>


                <CaButton
                    onClick={doClearMessages}
                    title="empty all messages"
                >
                    <IconBackspace/>

                </CaButton>

                <DialogSession session={session}/>


                {
                    recognizing ?
                        <CaButton
                            onClick={async () => {
                                await recognizerStop();
                                sleep2(100)
                                await doSubmit(userInput)
                            }} className='bg-orange-600'> <IconWaveSine
                            className="animate-ping "/></CaButton>
                        :
                        <CaButton onClick={async () => {
                            await recognizerStart((txt: string) => {
                                setUserInput(txt)
                            })
                        }} className="bg-green-600">
                            <IconMicrophone/></CaButton>
                }

            </div>

            <form className="relative flex w-full items-center space-x-4 mx-2"
                onSubmit={async (e) => {
                    e.preventDefault();
                    await doSubmit(userInput);
                }}
            >
                <Textarea id="user-input"
                          rows={5}
                          value={userInput}
                          ref={textareaRef}
                          onKeyDown={onInputKeyDown}
                          onChange={handleInputChange}
                          onCompositionStart={() => {
                          }}
                          onCompositionEnd={() => {
                          }}
                          onBlur={() => {
                              setIsScrollTop(false)
                              setIsScrollBottom(false)
                              setIsScrollAuto(false)
                          }
                          }
                          onFocus={() => {
                              setPrompts([])
                              setIsScrollTop(false)
                              setIsScrollBottom(false)
                              setIsScrollAuto(true)
                          }
                          }
                          className=""
                          placeholder={t.inputPlaceholder} required/>
                <Button
                    type="submit"
                    size="icon"
                    title="send"
                >
                    <Send className="h-4 w-4"/>
                    <span className="sr-only">Send</span>
                </Button>
            </form>
        </div>

    )

}


export default ChatInput;