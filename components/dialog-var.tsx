import {FC, KeyboardEvent, useEffect, useRef, useState} from 'react';
import {Prompt} from "@/store/prompt";


interface Props {
    prompt: Prompt;
    onSubmit: (submitContent: string) => void;
    onClose: () => void;
}

export const DialogVar: FC<Props> = ({
                                         prompt,
                                         onSubmit,
                                         onClose,
                                     }) => {
    const vv = prompt.vars ? prompt.vars.map(variable => ({key: variable, value: ''})) : [];
    const [updatedVariables, setUpdatedVariables] = useState(vv);
    const modalRef = useRef<HTMLDivElement>(null);
    const nameInputRef = useRef<HTMLTextAreaElement>(null);
    const [submitContent, setSubmitContent] = useState<string>(prompt.content);
    const handleChange = (k: string, value: string) => {
        const newVars = updatedVariables.map(e => {
            if (e.key === k) {
                return {key: k, value: value};
            } else {
                return e;
            }
        });
        setUpdatedVariables(newVars);
        const newContent = prompt.content?.replace(/{{(.*?)}}/g, (match, variable) => {
            const index = updatedVariables.findIndex((v) => v.key === variable);
            return updatedVariables[index]?.value || `{{${variable}}}`;
        });
        setSubmitContent(newContent);
    };

    const handleSubmit = () => {
        if (updatedVariables.some((variable) => variable.value === '')) {
            alert('Please fill out all variables');
            return;
        }
        onSubmit(submitContent);
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        window.addEventListener('click', handleOutsideClick);

        return () => {
            window.removeEventListener('click', handleOutsideClick);
        };
    }, [onClose]);

    useEffect(() => {
        if (nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onKeyDown={handleKeyDown}
        >
            <div
                ref={modalRef}
                className="dark:border-netural-400
                inline-block max-h-[400px] transform overflow-y-auto rounded-lg
                border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl
                max-w-[600px]
                transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
            >
                <div className="mb-4 text-xl font-bold text-black dark:text-neutral-200">
                    {prompt.name}
                </div>

                <div className="mb-4 text-sm italic text-black dark:text-neutral-200">
                    {submitContent}
                </div>

                {updatedVariables.map((variable, index) => (
                    <div className="mb-2 flex " key={index}>
                        <div className="mb-1 text-sm font-bold text-gray w-[150px] align-right">
                            {variable.key}
                        </div>

                        <textarea
                            ref={index === 0 ? nameInputRef : undefined}
                            rows={2}
                            className="mt-1 w-full rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow
                            focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-[#40414F] dark:text-neutral-100"
                            placeholder={`Enter a value for ${variable.key}...`}
                            value={variable.value}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleChange(variable.key, e.target.value)
                            }}
                        />
                    </div>
                ))}

                <div className="flex justify-end gap-x-4">
                    <button
                        className="mt-6 w-1/4 rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                        onClick={onClose}
                    >
                        Close
                    </button>
                    <button
                        className="mt-6 w-1/4 rounded-lg border border-neutral-500 px-4 py-2 text-neutral-900 shadow hover:bg-neutral-100 focus:outline-none dark:border-neutral-800 dark:border-opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-300"
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};
