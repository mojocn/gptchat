import {FC, KeyboardEvent, useEffect, useRef, useState} from 'react';
import {useConfigStore} from "@/store/config";
import {CaButton, CaInput, CaSelect} from "@/components/ui-lib";
import {ALL_LANG, useLocal} from "@/store/local";
import {ALL_MODELS, ModelType, Theme} from "@/types/const";


interface Props {
    onClose: () => void;
}

export const DialogConfig: FC<Props> = ({
                                            onClose,
                                        }) => {
    const modalRef = useRef<HTMLFormElement>(null);
    const config = useConfigStore();
    const {lang, setLang} = useLocal();
    const handleSubmit = () => {
        config.resetFn()
        onClose();
    };
    const doClearCache = () => {
        localStorage.clear();
        config.resetFn()
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
                <CaSelect
                    name="model"
                    value={config.modelConfig.model}
                    onChange={v => {
                        config.updateFn(config => {
                            config.modelConfig.model = v as ModelType;
                            if (config.modelConfig.model === 'gpt-3.5-turbo') {
                                config.modelConfig.max_tokens = 1500
                            } else if (config.modelConfig.model === 'gpt-3.5-16k') {
                                config.modelConfig.max_tokens = 4000
                            } else {
                                config.modelConfig.max_tokens = 1000
                            }
                            return config
                        })
                    }
                    }
                    placeholder="choose a model"
                    options={ALL_MODELS}

                />
                <CaSelect
                    name="theme"
                    value={config.theme}
                    onChange={v => {
                        config.updateFn(config => {
                            config.theme = v as Theme;
                            return config
                        })
                    }
                    }
                    placeholder="choose a theme"
                    options={["auto", "dark", "light"].map(e => ({label: e, value: e}))}

                />
                <CaSelect
                    name='lang'
                    value={lang}
                    onChange={v => {
                        setLang(v)
                    }}
                    placeholder="choose a language"
                    options={ALL_LANG}
                />


                <CaInput name={'top_p'}
                         value={config.modelConfig.top_p}
                         onChange={e => {
                             config.updateFn(config => {
                                 config.modelConfig.top_p = parseFloat(e)
                                 return config
                             })
                         }
                         }
                         placeholder={'top_p'}
                         type={'number'}
                         min={0} max={1} step={0.1}
                />

                <CaInput name={'temperature'}
                         value={config.modelConfig.temperature}
                         onChange={e => {
                             config.updateFn(config => {
                                 config.modelConfig.temperature = parseFloat(e)
                                 return config
                             })
                         }
                         }
                         placeholder={'temperature'}
                         type={'number'}
                         min={0} max={1} step={0.1}
                />


                <CaInput name={'max_history'}
                         value={config.modelConfig.max_history}
                         onChange={e => {
                             config.updateFn(config => {
                                 config.modelConfig.max_history = parseInt(e)
                                 return config
                             })
                         }
                         }
                         placeholder={'max_history'}
                         type={'number'}
                         min={4} max={32} step={2}
                />

                <div className="flex justify-end gap-x-1">
                    <CaButton type={'primary'}
                              onClick={onClose}
                    >Close</CaButton>
                    <CaButton type={'primary'}
                              onClick={doClearCache}
                    >Clear Cache</CaButton>
                    <CaButton type={'primary'}
                              onClick={handleSubmit}
                    >Submit</CaButton>
                </div>
            </form>
        </div>
    );
};
