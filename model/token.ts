
/*
*
* CREATE TABLE public.tokens (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone DEFAULT (now() + '1 day'::interval),
    last_active_at timestamp without time zone
);

*
*
* */


import {ColumnType, Generated, Insertable, Selectable, Updateable} from "kysely/dist/esm";
import {db} from "@/model/pgdb";

export interface TokenTable {
    id: Generated<number>
    token: string
    user_id: number
    created_at: ColumnType<Date, string | undefined, never>
    expires_at: ColumnType<Date, string | undefined, never>
    last_active_at: ColumnType<Date, string | undefined, never>
}

export type Token = Selectable<TokenTable>
export type TokenInsert = Insertable<TokenTable>
export type TokenUpdate = Updateable<TokenTable>


export async function doTokenInsert(token: TokenInsert) {
    return await db.insertInto('tokens')
        .values(token)
        .returningAll()
        .executeTakeFirstOrThrow()
}
export async function findTokenById(uid: number) {
    return await db.selectFrom('tokens')
        .where('user_id', '=', uid)
        .selectAll()
        .executeTakeFirstOrThrow()
}

export async function findTokenByIdToken(userId: number, token: string): Promise<Token | undefined> {
    return await db.selectFrom('tokens')
        .where('user_id', '=', userId)
        .where('token', '=', token.trim())
        .selectAll()
        .executeTakeFirst()
}
export async function deleteTokenByIdToken(token:string) {
    return await db.deleteFrom('tokens').where('token', '=', token.trim())
        .returningAll()
        .execute()
}