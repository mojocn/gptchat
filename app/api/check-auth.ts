import {cookies} from "next/headers";
import {NextRequest, NextResponse} from "next/server";
import {findTokenByIdToken} from "@/model/token";


export async function checkAuth(req: NextRequest): Promise<boolean> {
    const token = cookies().get('token')?.value ?? ''
    const uid = cookies().get('uid')?.value ?? '-1'
    if (!token || !uid) {
        return false
    }
    try {
        const res = await findTokenByIdToken(parseInt(uid), token)
        if (!res) {
            return false
        }
    }catch (e) {
        console.error(e)
        return false

    }

    return true;

}

export function jsonData(data: any, code?: number, msg?: string) {
    return NextResponse.json({
        code: code || 200,
        msg: msg || "ok",
        data: data
    }, {status: 200})
}
