"use server";
import { bcryptPasswordHash } from "@/pkg/bcrypt";
import { sendResetPasswordEmail } from "@/pkg/mail";
import { doUpdateUserByEmail, findUserByEmail } from "@/model/user";

export async function doPasswordReset(formData: FormData): Promise<object> {
  const email = formData.get("email")?.toString().trim() || "";
  if (!email) {
    throw new Error("Email is required");
  }
  const newPassword =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  const hashedPassword = bcryptPasswordHash(newPassword);
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error("User not found");
  }
  const res = await doUpdateUserByEmail(email, { password: hashedPassword });
  if (res.numUpdatedRows > 0) {
    await sendResetPasswordEmail(user.email, user.username, newPassword);
    return user;
  } else {
    throw new Error("invalid email");
  }
}
