import {NextRequest, NextResponse} from 'next/server';
import {checkAdmin} from "@/app/api/check-auth";

export const dynamic = "force-dynamic"
const speechKey = process.env.SPEECH_KEY || "";
const region = process.env.SPEECH_REGION || "";
export async function GET(req: NextRequest) {
    const isAuth = await checkAdmin(req);
    if (!isAuth) {
        return NextResponse.json({error: 'Unauthorized'}, {status: 401})
    }
    const jwt = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
    }).then(res =>{
        if (res.ok){
            return res.text()
        }
        return ""
    }).catch(console.error)
    return NextResponse.json({jwt,region});
}
