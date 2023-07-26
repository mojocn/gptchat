import {create} from 'zustand'
import {OptionItem} from "@/types/item";

const cn = {
    inputPlaceholder: "Enter 发送消息,Ctrl+Enter 换行, 向上箭头上一条消息",
    SubTitle: (count: number) => `与 ChatGPT 的 ${count} 条对话`,
    ChatList: "查看消息列表",
    CompressedHistory: "查看压缩后的历史 Prompt",
    Export: "导出聊天记录",
    Copy: "复制",
    Stop: "停止",
    Retry: "重试",
    Drawback: "撤回",
    Delete: "删除",
    Edit: "编辑",
    Rename: "重命名对话",
    Typing: "正在输入…",
    SessionTitle: '会话标题',
    SessionTitlePh: '重命名会话标题',
    MaxHistoryMsg: '上文消息数量',
    OpenAiModel: "OpenAI 模型",
    Temperature: '温度',
}
type Translation = typeof cn;

const en: Translation = {
    inputPlaceholder: "Enter send message, Ctrl+Enter line break, Up arrow previous message",
    SubTitle: (count: number) => `${count} messages with ChatGPT`,
    ChatList: "Go To Chat List",
    CompressedHistory: "Compressed History Memory Prompt",
    Export: "Export All Messages as Markdown",
    Copy: "Copy",
    Stop: "Stop",
    Retry: "Retry",
    Drawback: "Drawback",
    Delete: "Delete",
    Edit: "Edit",
    Rename: "Rename Chat",
    Typing: "Typing…",
    SessionTitle: 'Session Title',
    SessionTitlePh: 'rename session title',
    MaxHistoryMsg: 'Max Context Message',
    OpenAiModel: "OpenAI model",
    Temperature: 'temperature',

}
export const ALL_LANG: OptionItem[] = [
    {
        label: "中文",
        value: "zh"
    },
    {
        label: "English",
        value: "en"
    },
]

export interface LocalStore {
    t: Translation;
    lang: string;
    setLang: (lang: string) => void;
}


export const useLocal = create<LocalStore>((set) => ({
    t: cn,
    lang: "en",
    setLang: (lang: string) => set(state => {
        state.lang = lang
        if (lang == "zh") {
            state.t = cn
        } else if (lang == "en") {
            state.t = en
        } else {
            state.t = en
            alert("not support language:" + lang)
        }

        //todo add more language
        return {...state, lang}
    }),
}))
