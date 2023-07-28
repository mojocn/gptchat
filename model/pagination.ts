import {db} from "@/model/pgdb";
import {OrderByDirection} from "kysely/dist/esm/parser/order-by-parser";

//https://kysely-org.github.io/kysely/index.html#select-queries
interface Pagination {
    page: number
    size: number
    query: Map<string, string | number>
    sort: Map<string, OrderByDirection>
}

export interface PaginationData extends Pagination {
    total: number
    list: object[]
    msg?: string
}

function toPagination(u: URLSearchParams): Pagination {
    const page = {
        page: parseInt(u.get('_page') ?? '1'),
        size: parseInt(u.get('_size') ?? '15'),
        sort: new Map<string, OrderByDirection>(),
        query: new Map<string, string | number>(),
    } as Pagination
    u.forEach((v, k) => {
        if (k !== '_page' && k !== '_size' && k !== '_sort') {
            page.query.set(k, v)
        }
    })
    u.get('_sort')?.split(',').forEach(s => {
        const [k, v] = s.split(':')
        if (k) {
            page.sort.set(k, v ? v.toLocaleLowerCase() as OrderByDirection : 'desc')
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

    p.query.forEach((v, k) => {
        if (k) tx = tx.where(ref(k), "=", v);
    });
    const {count} = db.fn
    const res = {...p} as PaginationData
    try {
        res.list = []
        const {total} = await tx.select(count<number>('id').as('total')).executeTakeFirstOrThrow()
        res.total = total
        if (total <= 0) {
            return res
        }
        p.sort.forEach((v, k) => {
            if (!k) return;
            tx = tx.orderBy(ref(k), v)
        });
        res.list = await tx.clearSelect().selectAll().limit(p.size).offset((p.page - 1) * p.size).execute()
    } catch (err) {
        const e = err as Error
        res.msg = e.message
    }
    return res

}