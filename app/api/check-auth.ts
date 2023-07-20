import {cookies} from "next/headers";
import {sql} from "@vercel/postgres";
import {NextRequest, NextResponse} from "next/server";


export async function checkAuth(req: NextRequest): Promise<boolean> {
    const token = cookies().get('token')?.value ?? ''
    const uid = cookies().get('uid')?.value ?? '-1'
    if (!token || !uid) {
        return false
    }
    const geo = `${req.geo?.country || ''}/${req.geo?.region || ''}/${req.geo?.country || ''}`
    console.info(geo)
    const {rowCount} = await sql`UPDATE tokens SET last_active_at = NOW() where user_id = ${parseInt(uid)} AND token = ${token.trim()}`;
    return rowCount >= 1;

}

export function jsonData(data: any, code?: number, msg?: string) {
    return NextResponse.json({
        code: code || 200,
        msg: msg || "ok",
        data: data
    }, {status: 200})
}
