"use server";

import { bcryptPasswordCheck } from "@/pkg/bcrypt";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/model/user";
import { doTokenInsert, TokenInsert } from "@/model/token";

const tokenExpireSecond = 60 * 60 * 24 * 30;

export async function doUserLogin(formData: FormData): Promise<object> {
  const emailF = formData.get("email");
  if (!emailF) {
    throw new Error("Email is required");
  }
  const passwordF = formData.get("password");
  if (!passwordF) {
    throw new Error("Password is required");
  }
  const email = emailF as string;
  const password = passwordF as string;
  const token = crypto.randomUUID();

  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  if (user && !bcryptPasswordCheck(password.trim(), user.password)) {
    throw new Error("Password is incorrect");
  }
  try {
    const t = await doTokenInsert({
      user_id: user.id,
      token,
    } as TokenInsert);
  } catch (e) {
    console.error(e);
    throw new Error("Login failed");
  }

  //expire in 1 day
  cookies().set("token", token, {
    maxAge: tokenExpireSecond,
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  cookies().set("uid", user.id.toString(), {
    maxAge: tokenExpireSecond,
    path: "/",
    httpOnly: true,
  });
  user.password = "";
  return user;
}
