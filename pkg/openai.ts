import {RequestMessage} from "@/store/chat";

type ChatGPTAgent = 'user' | 'system' | 'assistant'

export interface OpenAiChatCompletionReq {
    model: string
    messages: RequestMessage[]
    temperature?: number
    top_p?: number
    frequency_penalty?: number
    presence_penalty?: number
    max_tokens?: number
    stream?: boolean
    stop?: string[]
    user?: string
    n?: number
    // logit_bias?: object
}

export interface OpenAiChatCompletionResp {
    id: string;
    object: string;
    created: number;
    choices: Choice[];
    usage: Usage;
}

export interface Choice {
    index: number;
    message: RequestMessage;
    finish_reason: string;
    delta?: {
        role?: string
        content?: string
    }
}


//    let message = {content: 'sssss', date: '', streaming: false, id: '', role: 'user', preview: false}

export interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

