import {db} from "@/model/pgdb";
import {OrderByDirection} from "kysely/dist/esm/parser/order-by-parser";

//https://kysely-org.github.io/kysely/index.html#select-queries
interface Pagination {
    page: number
    size: number
    query: Record<string, string | number>
    sort: Record<string, OrderByDirection>
}

export interface PaginationData extends Pagination {
    total: number
    list: object[]
    msg?: string
}

function toPagination(u: URLSearchParams): Pagination {
    const page = {
        page: parseInt(u.get('page') ?? '1'),
        size: parseInt(u.get('size') ?? '10'),
    } as Pagination
    u.forEach((v, k) => {
        if (k !== 'page' && k !== 'size' && k !== 'sort' && k !== 'order') {
            page.query[k] = v
        }
    })
    u.get('sort')?.split(',').forEach(s => {
        const [k, v] = s.split(':')
        if (k) {
            page.sort[k] = v ? v.toLocaleLowerCase() as OrderByDirection : 'desc'
        }
    })
    if (page.size < 1) {
        page.size = 10
    }
    if (page.page < 1) {
        page.page = 1
    }
    return page
}

export async function sqlPagination(u: URLSearchParams, tableName: string): Promise<PaginationData> {
    const p = toPagination(u);
    const {ref} = db.dynamic
    let tx = db.selectFrom(tableName as any);
    for (const col in p.query) {
        tx = tx.where(ref(col), "=", p.query[col])
    }
    const {count} = db.fn
    const res = {...p} as PaginationData
    try {
        res.list = []
        const {total} = await tx.select(count<number>('id').as('total')).executeTakeFirstOrThrow()
        res.total = total
        if (total <= 0) {
            return res
        }
        for (const col in p.sort) {
            tx = tx.orderBy(ref(col), p.sort[col])
        }
        res.list = await tx.clearSelect().selectAll().limit(p.size).offset((p.page - 1) * p.size).execute()
    } catch (err) {
        const e = err as Error
        res.msg = e.message
    }
    return res

}