import {OpenAiChatCompletionReq} from "@/pkg/openai";
import {checkAuth} from "../check-auth";
import {NextResponse, NextRequest} from "next/server";
import {UserVisitInc} from "@/model/user";

const OPENAI_API_TYPE = process.env.OPENAI_API_TYPE || 'openai';// auzre
const OPENAI_API_HOST = process.env.OPENAI_API_HOST || 'https://api.openai.com';
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const AZURE_API_HOST = process.env.AZURE_API_HOST || 'https://zhouqingai.openai.azure.com';
const AZURE_API_VERSION = process.env.AZURE_API_VERSION || '2023-03-15-preview';
const AZURE_DEPLOYMENT_ID = process.env.AZURE_DEPLOYMENT_ID || 'gpt-35-turbo';


export async function POST(req: NextRequest): Promise<Response> {
    const userId = await checkAuth();
    if (userId < 1) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }
    await UserVisitInc(userId)
    const payload: OpenAiChatCompletionReq = await req.json()

    let url = `${OPENAI_API_HOST}/v1/chat/completions`;
    if (OPENAI_API_TYPE === 'azure') {
        url = `${AZURE_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${AZURE_API_VERSION}`;
    }
    try {
        return await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'api-key': `${OPENAI_API_KEY}`,
                'OpenAI-Organization': OPENAI_ORGANIZATION,
            },
            method: 'POST',
            body: JSON.stringify(payload),
        })
    } catch (err) {
        const e = err as Error;
        console.error(e)
        return NextResponse.json({error: e.message}, {status: 500})
    }
}

