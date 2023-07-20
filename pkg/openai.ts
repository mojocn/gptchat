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

export const fetchAzureOpenAiChatCompeletion = async (payload: OpenAiChatCompletionReq): Promise<any> => {
    return await fetch('https://zhouqingai.openai.azure.com/openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-03-15-preview', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
            'api-key': `${process.env.OPENAI_API_KEY ?? ''}`,
        },
        method: 'POST',
        body: JSON.stringify(payload),
    })

}

class OpenAiClient {
    // apiType: "azure" | "openai";
    // apiBase: string;
    // apiVersion: string;
    // apiKey: string;
    //
    // openAiApiKey: string;
    // openAiOrganization: string;
    //
    //
    // isAzure: boolean;
    // azureApiVersion: string;
    // endpoint: string;
    //
    // constructor(isAzure: boolean, endpoint: string, azureApiVersion: string, azureDeployment: string, apiKey: string) {
    //     this.apiKey = apiKey;
    //     this.endpoint = endpoint;
    //     this.isAzure = isAzure;
    //     this.azureApiVersion = azureApiVersion
    // }

    // async chatCompletion(arg: { method: string, url: string, params?: object, payload?: object }): Promise<Response> {
    //     // @ts-ignore
    //     const fullURL = arg.params ? `${arg.url}?${new URLSearchParams(arg.params).toString()}` : arg.url
    //     return await fetch(fullURL, {
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${process.env.OPENAI_API_KEY ?? ''}`,
    //             'api-key': `${process.env.OPENAI_API_KEY ?? ''}`,
    //         },
    //         method: "POST",
    //         body: arg.payload ? JSON.stringify(arg.payload) : null,
    //     })
    // }
}