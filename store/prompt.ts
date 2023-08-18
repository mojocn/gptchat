import { create } from "zustand";
import { promptData } from "@/store/prompt-data";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  vars: string[];
}

export interface PromptStore {
  prompts: Prompt[];
  setPrompts: (prompts: Prompt[]) => void;
  rawPrompts: Prompt[];
}

export const usePromptStore = create<PromptStore>()((set, get) => ({
  prompts: loadPrompt(),
  setPrompts: (prompts: Prompt[]) => set({ prompts }),
  rawPrompts: loadPrompt(),
}));

function loadPrompt(): Prompt[] {
  let fetchPrompts = [...promptData.var, ...promptData.cn, ...promptData.en];
  return fetchPrompts.map((titleContent) => {
    let [title, content] = titleContent;
    const vars = parseVariables(content);
    return {
      id: Math.random().toString(),
      vars,
      content,
      name: title,
    } as Prompt;
  });
}

function parseVariables(content: string) {
  const regex = /{{(.*?)}}/g;
  const foundVariables = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    foundVariables.push(match[1]);
  }

  return foundVariables;
}
