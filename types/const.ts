import { OptionItem } from "@/types/item";

export const ALL_MODELS = [
  {
    label: "gpt-3.5-turbo",
    value: "gpt-3.5-turbo",
    disabled: false,
  },
  {
    label: "gpt-3.5-turbo-16k",
    value: "gpt-3.5-turbo-16k",
    disabled: false,
  },
  {
    label: "gpt-4",
    value: "gpt-4",
    disabled: true,
  },
] as OptionItem[];

export type ModelType = (typeof ALL_MODELS)[number]["value"];

export const AllLangs = ["en", "cn"] as const;
export type Lang = (typeof AllLangs)[number];
