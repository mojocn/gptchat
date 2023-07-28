import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {findTokenByIdToken} from "@/model/token";


export async function checkAuth(req: NextRequest): Promise<boolean> {
    try {
        const res = await checkUser(req)
        if (res) return true;
    } catch (e) {
        console.error(e)
    }
    return false
}

export async function checkAdmin(req: NextRequest): Promise<boolean> {
    try {
        const res = await checkUser(req)
        if (res && res.user_id === 1) {
            return true
        }
    } catch (e) {
        console.error(e)
    }
    return false;
}

async function checkUser(req: NextRequest) {
    const token = cookies().get('token')?.value ?? ''
    const uid = cookies().get('uid')?.value ?? '-1'
    if (!token || !uid) {
        return undefined
    }
    return await findTokenByIdToken(parseInt(uid), token)
}

export function jsonData(data: any, code?: number, msg?: string) {
    return NextResponse.json({
        code: code || 200,
        msg: msg || "ok",
        data: data
    }, {status: 200})
}
