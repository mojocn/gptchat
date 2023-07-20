import {NextResponse} from "next/server";
import {cookies} from "next/headers";
import {sql} from "@vercel/postgres";
import {jsonData} from "@/app/api/check-auth";

export async function GET(req: Request): Promise<Response> {
    const uid = cookies().get('uid')?.value || '-1';
    const token = cookies().get('token')?.value || '';
    await sql`DELETE FROM tokens WHERE user_id = ${parseInt(uid)} AND token = ${token}`;

    const resp = jsonData(undefined, 200, 'logout success')

    cookies().getAll().forEach(v => {
        resp.cookies.delete(v.name)
    });
    return resp
}
