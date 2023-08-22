import { NextRequest, NextResponse } from "next/server";
import { checkAuth, jsonData } from "@/app/api/check-auth";
import { doUpdateUser, findUserById, UserUpdate } from "@/model/user";
import { bcryptPasswordHash } from "@/pkg/bcrypt";

export async function GET(req: NextRequest): Promise<Response> {
  const userId = await checkAuth();
  if (userId < 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await findUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return jsonData(user, 200, "ok");
}

interface NewPassword {
  newPassword: string;
}

export async function PATCH(req: NextRequest): Promise<Response> {
  const userId = await checkAuth();
  if (userId < 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user: UserUpdate & NewPassword = await req.json();
  if (user.newPassword) {
    user.password = bcryptPasswordHash(user.newPassword);
  }
  const res = await doUpdateUser(userId, user);
  return jsonData(res, 200);
}
