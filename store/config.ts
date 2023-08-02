import {create} from "zustand";
import {persist} from "zustand/middleware";
import {ModelType, Theme} from "@/types/const";

export const DEFAULT_CONFIG = {
    fontSize: 14,
    theme: Theme.Dark as Theme,
    modelConfig: {
        model: "gpt-3.5-turbo" as ModelType,
        temperature: 1,
        max_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        max_history: 8,
    },
};

export type Config = typeof DEFAULT_CONFIG;
export type ModelConfig = Config["modelConfig"];

export type ConfigStore = Config & {
    resetFn: () => void;//reset config to default
    updateFn: (updater: (config: Config) => void) => void;
};

export const useConfigStore = create<ConfigStore>()(
    persist(
        (set, get) => ({
            ...DEFAULT_CONFIG,

            resetFn() {
                set(() => ({...DEFAULT_CONFIG}));
            },

            updateFn(updater) {
                const config = {...get()};
                updater(config);
                set(() => config);
            },
        }),
        {
            name: 'config',
        },
    ),
);









