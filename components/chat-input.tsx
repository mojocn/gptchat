import {type ChatState, Message, Session, useChatStore} from "@/store/chat";
import {CaButton} from "@/components/ui-lib";
import React, {useEffect, useRef, useState} from "react";
import {UiStore, useUiStore} from "@/store/ui";
import {useUserStore} from "@/store/user";
import {
    IconAdjustments,
    IconArrowsDown,
    IconArrowsUp,
    IconBackspace,
    IconMenu2, IconMicrophone,
    IconSend, IconWaveSine,
} from "@tabler/icons-react";
import {usePromptStore} from "@/store/prompt";
import {showToast} from "@/components/ui-lib";
import {useLocal} from "@/store/local";
import {DialogSession} from "@/components/dialog-session";
import {useSpeech2txt} from "@/components/speech2txt";
import {sleep2} from "@/pkg/util";

const MSG_DRAFT = "MSG_DRAFT_TO_PREVIEW"
const ChatInput = () => {
    const {recognizerStart, recognizerStop, loading, recognizing} = useSpeech2txt();


    const [session, setSession] = useState<Session>({} as Session);
    const [isDialogVisible, setIsDialogVisible] = useState(false);

    const {user} = useUserStore();
    const {t} = useLocal();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        userInput,
        setUserInput,
        sessions,
        doCallOpenAiCompletion,
        userInputFocus,
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

    useEffect(() => {
        const ss = sessions.find(s => s.id === selectedSessionId);
        ss && setSession(ss!);
    }, [selectedSessionId, sessions]);

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
        <div className="relative w-full px-2 py-3  border-t border-gray-200">

            {
                isDialogVisible && (
                    <DialogSession
                        session={session}
                        onClose={() => {
                            setIsDialogVisible(false);
                        }}
                    />
                )
            }


            <div className="flex gap-2 mb-2">
                <CaButton
                    loading={false}
                    onClick={doScrollToTop}
                    title="scroll to top"
                >
                    <IconArrowsUp/>

                </CaButton>

                <CaButton
                    loading={false}
                    onClick={doScrollToBottom}
                    title="scroll to bottom"
                >
                    <IconArrowsDown/>

                </CaButton>

                <CaButton
                    loading={false}
                    onClick={doShowPromptList}
                    title='use prompt template'
                >
                    <IconMenu2/>

                </CaButton>


                <CaButton
                    loading={false}

                    onClick={doClearMessages}
                    title="empty all messages"
                >
                    <IconBackspace/>

                </CaButton>
                <CaButton
                    loading={false}

                    onClick={(e: any) => {
                        e.stopPropagation()
                        e.preventDefault()
                        setIsDialogVisible(true);
                    }
                    }
                >
                    <IconAdjustments/>
                </CaButton>


                {
                    recognizing ?
                        <CaButton
                            loading={false}
                            onClick={async () => {
                            await recognizerStop();
                            sleep2(100)
                            await doSubmit(userInput)
                        }} className='bg-orange-600'> <IconWaveSine
                            className="animate-ping "/></CaButton>
                        :
                        <CaButton onClick={async ()=>{
                            await recognizerStart((txt: string) => {
                                setUserInput(txt)
                            })
                        }} loading={loading} className="bg-green-600">
                            <IconMicrophone/></CaButton>
                }

            </div>

            <div className="flex flex-1 relative">
            <textarea id="user-input"
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
                      className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-200 shadow-sm
                      outline-none
                      focus:border-blue-400 focus:ring-blue-400 focus:ring-1 focus:outline-none focus-within:ring-1 focus-within:ring-blue-400
                      dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                      placeholder={t.inputPlaceholder} required></textarea>
                <CaButton
                    loading={false}
                    onClick={async () => await doSubmit(userInput)}
                    className="absolute right-2 bottom-4"
                    title="send"
                ><IconSend></IconSend></CaButton>
            </div>
        </div>

    )

}


export default ChatInput;