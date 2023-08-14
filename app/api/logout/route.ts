import {cookies} from "next/headers";
import {jsonData} from "@/app/api/check-auth";
import {deleteTokenByIdToken} from "@/model/token";

export const dynamic = "force-dynamic"

export async function GET(req: Request): Promise<Response> {
    const uid = cookies().get('uid')?.value || '-1';
    const token = cookies().get('token')?.value || '';
    await deleteTokenByIdToken(token);

    const resp = jsonData(undefined, 200, 'logout success')
    cookies().getAll().forEach(v => {
        resp.cookies.delete(v.name)
    });
    return resp
}
