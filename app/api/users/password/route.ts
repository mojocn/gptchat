import { NextRequest, NextResponse } from "next/server";
import { checkAuth, jsonData } from "@/app/api/check-auth";
import { doUpdateUser, findUserById, UserUpdate } from "@/model/user";
import { bcryptPasswordCheck, bcryptPasswordHash } from "@/pkg/bcrypt";

export async function PATCH(req: NextRequest): Promise<Response> {
  const userId = await checkAuth();
  if (userId < 1) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const arg: { newPassword: string; oldPassword: string } = await req.json();

  const theUser = await findUserById(userId);
  if (
    !arg.oldPassword ||
    !theUser ||
    !bcryptPasswordCheck(arg.oldPassword.trim(), theUser.password)
  ) {
    throw new Error("the old password is incorrect");
  }

  let password = "";
  if (arg.newPassword) {
    password = bcryptPasswordHash(arg.newPassword);
  }
  const res = await doUpdateUser(userId, { password });

  return jsonData(res, 200, "your password has been updated");
}
