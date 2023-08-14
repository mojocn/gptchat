import { Kysely, sql } from "kysely";

//https://kysely.dev/docs/migrations
// export async function up(db: Kysely<any>): Promise<void> {
//     // Migration code
//     await db.schema
//         .createTable('tts_recognitions')
//         .addColumn('id', 'serial', (col) => col.primaryKey())
//         .addColumn('content', 'varchar', (col) => col.notNull())
//         .addColumn('category', 'varchar', (col) => col.notNull())
//         .addColumn('user_id', 'integer')
//         .addColumn('score', 'integer')
//         .addColumn('created_at', 'timestamp', (col) =>
//             col.defaultTo(sql`now()`).notNull()
//         )
//         .execute()
//
//
// }

// export async function down(db: Kysely<any>): Promise<void> {
//     // Migration code
//     await db.schema.dropTable('tts_recognitions').execute()
// }

/*
*

*
*
CREATE TABLE tts_recognitions(
  id SERIAL PRIMARY KEY,
  content VARCHAR NOT NULL,
  score NUMERIC(3, 1),
  category VARCHAR(50),
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX tts_recognitions_user_id_idx ON tts_recognitions(user_id);


);
*
*
*
*
*
* */
