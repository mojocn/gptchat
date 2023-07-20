import {PromptTable} from "@/model/prompt";
import {createKysely} from '@vercel/postgres-kysely';

// https://github.com/vercel/storage/tree/main/packages/postgres-kysely
// https://kysely-org.github.io/kysely/classes/Kysely.html
interface Database {
    prompts: PromptTable;
}

export const db = createKysely<Database>();
