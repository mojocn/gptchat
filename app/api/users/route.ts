import {NextResponse, NextRequest} from "next/server";
import {jsonData} from "@/app/api/check-auth";
import {sqlPagination} from "@/model/pagination";
export const dynamic = "force-dynamic"
export async function GET(req: NextRequest): Promise<Response> {
    req.nextUrl
    try {
        const data = await sqlPagination(req.nextUrl.searchParams, 'users')
        data.list.forEach(e => {
            // @ts-ignore
            e['password'] = undefined
        })
        return jsonData(data, 200)
    } catch (err) {
        const e = err as Error;
        return jsonData(undefined, 500, e.message)
    }
}
