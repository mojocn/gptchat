import { PromptTable } from "./prompt";
import { createKysely } from "@vercel/postgres-kysely";
import { UserTable } from "./user";
import { TokenTable } from "./token";
import { TtsRecognitionTable } from "./tts_recognition";

// https://github.com/vercel/storage/tree/main/packages/postgres-kysely
// https://kysely-org.github.io/kysely/classes/Kysely.html
interface Database {
  prompts: PromptTable;
  users: UserTable;
  tokens: TokenTable;
  tts_recognitions: TtsRecognitionTable;
}

export const database = createKysely<Database>();
