import {
  ColumnType,
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from "kysely";
import { database } from "@/model/database";
import { sql } from "@vercel/postgres";

/*
*
* CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_active_at timestamp without time zone
);

*
* */

export interface UserTable {
  id: Generated<number>;
  username: string;
  password: string;
  email: string;
  created_at: ColumnType<Date, string | undefined, never>;
  last_active_at: ColumnType<Date, string | undefined, never>;
  gpt_visit: number;
}

export type User = Selectable<UserTable>;
export type UserInsert = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export async function UserVisitInc(userId: number) {
  try {
    await sql`UPDATE users SET gpt_visit = gpt_visit + 1 where id = ${userId};`;
  } catch (e) {
    console.error("UserVisitInc error");
    console.error(e);
  }
}

export async function findUserByEmail(email: string) {
  return await database
    .selectFrom("users")
    .where("email", "=", email.trim())
    .selectAll()
    .executeTakeFirst();
}

export async function findPeople(criteria: Partial<User>) {
  let query = database.selectFrom("users");

  if (criteria.id) {
    query = query.where("id", "=", criteria.id); // Kysely is immutable, you must re-assign!
  }

  if (criteria.username) {
    query = query.where("username", "=", criteria.username);
  }

  // if (criteria.email !== undefined) {
  //     query = query.where(
  //         'last_name',
  //         criteria.last_name === null ? 'is' : '=',
  //         criteria.last_name
  //     )
  // }

  if (criteria.email) {
    query = query.where("email", "=", criteria.email);
  }

  if (criteria.created_at) {
    query = query.where("created_at", "=", criteria.created_at);
  }

  return await query.selectAll().execute();
}

export async function doUpdatePerson(id: number, updateWith: UserUpdate) {
  await database
    .updateTable("users")
    .set(updateWith)
    .where("id", "=", id)
    .execute();
}

export async function doUpdateUserByEmail(email: string, user: UserUpdate) {
  return await database
    .updateTable("users")
    .set(user)
    .where("email", "=", email)
    .executeTakeFirstOrThrow();
}

export async function doUserInsert(user: UserInsert) {
  return await database
    .insertInto("users")
    .values(user)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteUser(id: number) {
  return await database
    .deleteFrom("users")
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
}
