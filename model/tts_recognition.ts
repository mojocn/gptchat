import {ColumnType, Generated, Insertable, Selectable, Updateable} from "kysely/dist/esm";
import {UserInsert, UserTable} from "@/model/user";
import {database} from "@/model/database";


export interface TtsRecognitionTable {
    id: Generated<number>
    content: string
    category: 'word' | 'syllable' | 'phoneme'
    user_id: number
    score: number
    created_at: ColumnType<Date, string | undefined, never>
}

export type TtsRecognition = Selectable<TtsRecognitionTable>
export type TtsRecognitionInsert = Insertable<TtsRecognitionTable>
export type TtsRecognitionUpdate = Updateable<TtsRecognitionTable>


export async function doTtsRecognitionInsert(row: TtsRecognitionInsert) {
    return await database.insertInto('tts_recognitions')
        .values(row)
        .returningAll()
        .executeTakeFirst()
}
