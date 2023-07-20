import React, {useEffect, useRef, useState} from "react";
import {Prompt, usePromptStore} from "@/store/prompt";
import {useChatStore} from "@/store/chat";
import {DialogVar} from "@/components/dialog-var";


export default function PromptList() {
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt>({} as Prompt);
    const {prompts, setPrompts} = usePromptStore()
    const noPrompts = prompts.length === 0;
    const [selectIndex, setSelectIndex] = useState(0);
    const selectedRef = useRef<HTMLDivElement>(null);
    const {setUserInput, setUserInputFocus} = useChatStore();
    const handleSubmit = (submitContent: string) => {
        setUserInput(submitContent);
        setUserInputFocus(true);
        setIsDialogVisible(false);
        setPrompts([]);
    };
    useEffect(() => {
        setSelectIndex(0);
    }, [prompts.length]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (noPrompts) return;
            if (e.metaKey || e.altKey || e.ctrlKey) {
                return;
            }
            // arrow up / down to select prompt
            const changeIndex = (delta: number) => {
                e.stopPropagation();
                e.preventDefault();
                const nextIndex = Math.max(
                    0,
                    Math.min(prompts.length - 1, selectIndex + delta),
                );
                setSelectIndex(nextIndex);
                selectedRef.current?.scrollIntoView({
                    block: "center",
                });
            };

            if (e.key === "ArrowUp") {
                changeIndex(1);
            } else if (e.key === "ArrowDown") {
                changeIndex(-1);
            } else if (e.key === "Enter") {
                const selectedPrompt = prompts.at(selectIndex);
                if (selectedPrompt) {
                    onPromptSelect(selectedPrompt)
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prompts.length, selectIndex]);
    const onPromptSelect = (prompt: Prompt) => {
        if (prompt.vars && prompt.vars.length > 0) {
            setIsDialogVisible(true);
            setSelectedPrompt(prompt);
        } else {
            setTimeout(() => {
                setUserInput(prompt.content);
            }, 20)
            setTimeout(() => {
                setUserInputFocus(true);
            }, 20)
            setTimeout(() => {
                setPrompts([]);
            }, 20)
        }


    }
    if (noPrompts) return null;


    return (
        <div className="max-h-96 overflow-y-scroll overflow-x-hidden flex flex-col-reverse border rounded-lg m-4">

            {isDialogVisible && (
                <DialogVar
                    prompt={selectedPrompt}
                    onSubmit={handleSubmit}
                    onClose={() => {
                        setIsDialogVisible(false)
                    }

                    }
                />
            )}


            {prompts.map((prompt, i) => (
                <div
                    ref={i === selectIndex ? selectedRef : null}
                    className="py-2 px-4 hover:bg-gray-100 hover:text-gray-900
                    w-full
                    border-b border-gray-200
                    p-2
                    cursor-pointer"
                    key={prompt.id + i.toString()}
                    onClick={e => {
                        e.stopPropagation();
                        e.preventDefault();
                        onPromptSelect(prompt)
                    }}
                    onMouseEnter={() => setSelectIndex(i)}
                >
                    <div
                        className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis w-full">{prompt.name}</div>
                    <p className="text-xs  break-words overflow-hidden text-ellipsis w-full max-h-4">{prompt.content}</p>
                </div>
            ))}
        </div>
    );
}
