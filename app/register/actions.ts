'use server'

import {bcryptPasswordHash} from "@/pkg/bcrypt";
import {sql} from "@vercel/postgres";
import {sendMail} from "@/pkg/mail";


export async function doUserRegister(formData: FormData): Promise<boolean> {
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm_password = formData.get('confirm_password') as string;
    if (password !== confirm_password) {
        throw new Error('Password not match')
    }
    //todo:: handle duplicate error
    let hashedPassword = password && bcryptPasswordHash(password as string);

    const res = await sql`INSERT INTO users (username, email, password) VALUES (${username}, ${email}, ${hashedPassword})`;
    if (res.rowCount > 0) {
        await sendMail(email, "Welcome to MojoAI", `Hi ${username},\n welcome to ai.mojotv.cn. Thanks for registering. \n https://ai.mojotv.cn/login`);
        return true
    } else {
        throw new Error('Register failed')
    }
}