import {FC, KeyboardEvent, useEffect, useRef, useState} from 'react';
import {Session, useChatStore} from "@/store/chat";
import {CaButton, CaInput, CaSelect} from "@/components/ui-lib";
import {ALL_MODELS, ModelType} from "@/types/const";


interface Props {
    session: Session;
    onClose: () => void;
}

export const DialogSession: FC<Props> = ({
                                             session,
                                             onClose,
                                         }) => {
    const modalRef = useRef<HTMLFormElement>(null);
    const [form, setForm] = useState({...session});
    const {upsertSession} = useChatStore();


    const handleSubmit = () => {
        upsertSession(form);
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

    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onKeyDown={handleKeyDown}
        >
            <form
                ref={modalRef}
                className="dark:border-netural-400
                inline-block max-h-[400px] transform overflow-y-auto rounded-lg
                border border-gray-300 bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl
                max-w-[600px]
                transition-all dark:bg-[#202123] sm:my-8 sm:max-h-[600px] sm:w-full sm:max-w-lg sm:p-6 sm:align-middle"
                role="dialog"
            >
                <div className="flex my-2 justify-between">
                    <label htmlFor="title"
                           className="mr-3 text-sm text-gray-900 dark:text-white align-middle">Session Title</label>
                    <input type="text" name="title" id="title"
                           value={form.title}
                           onChange={e => {
                               e.stopPropagation()
                               setForm({...form, title: e.target.value})
                           }}
                           className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg
                           focus:ring-primary-600 focus:border-primary-600 block w-64 p-1 dark:bg-gray-700 dark:border-gray-600
                           dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                           placeholder="session title to be renamed"/>
                </div>


                <CaSelect
                    name="model"
                    value={form.modelConfig.model}
                    onChange={v => {
                        setForm({...form, modelConfig: {...form.modelConfig, model: v as ModelType}})

                    }
                    }
                    placeholder="choose a model"
                    options={ALL_MODELS}

                />


                <CaInput name={'top_p'}
                         value={form.modelConfig.top_p}
                         onChange={e => {
                             setForm({...form, modelConfig: {...form.modelConfig, top_p: parseFloat(e)}})
                         }
                         }
                         placeholder={'top_p'}
                         type={'number'}
                         min={0} max={1} step={0.1}
                />

                <CaInput name={'temperature'}
                         value={form.modelConfig.temperature}
                         onChange={e => {
                             setForm({
                                 ...form,
                                 modelConfig: {...form.modelConfig, temperature: parseFloat(e)}
                             })
                         }
                         }
                         placeholder={'temperature'}
                         type={'number'}
                         min={0} max={1} step={0.1}
                />


                <CaInput name={'max_history'}
                         value={form.modelConfig.max_history}
                         onChange={e => {
                             setForm({
                                 ...form,
                                 modelConfig: {...form.modelConfig, max_history: parseInt(e)}
                             })

                         }
                         }
                         placeholder={'max_history'}
                         type={'number'}
                         min={4} max={32} step={2}
                />

                <div className="flex justify-end gap-x-4 mt-4">
                    <CaButton onClick={onClose}>Close</CaButton>
                    <CaButton onClick={handleSubmit}>Submit</CaButton>
                </div>


            </form>
        </div>
    );
};

