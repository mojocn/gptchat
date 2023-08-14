import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { findTokenByIdToken } from "@/model/token";

/*
 *
 * return user_id
 * */
export async function checkAuth(): Promise<number> {
  try {
    const res = await checkUserToken();
    if (res) return res.user_id;
  } catch (e) {
    console.error(e);
  }
  return 0;
}

export async function checkAdmin(): Promise<boolean> {
  try {
    const token = await checkUserToken();
    if (token && token.user_id === 1) {
      return true;
    }
  } catch (e) {
    console.error(e);
  }
  return false;
}

async function checkUserToken() {
  const token = cookies().get("token")?.value ?? "";
  const uid = cookies().get("uid")?.value ?? "-1";
  if (!token || !uid) {
    return undefined;
  }
  return await findTokenByIdToken(parseInt(uid), token);
}

export function jsonData(data: any, code?: number, msg?: string) {
  return NextResponse.json(
    {
      code: code || 200,
      msg: msg || "ok",
      data: data,
    },
    { status: 200 },
  );
}
