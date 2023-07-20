'use server'
import {bcryptPasswordHash} from "@/pkg/bcrypt";
import {sql} from "@vercel/postgres";
import {sendMail, sendResetPasswordEmail} from "@/pkg/mail";


export async function doPasswordReset(formData: FormData): Promise<object> {
    const email = formData.get('email')?.toString().trim() || '';
    if (!email) {
        throw new Error('Email is required')
    }
    const newPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashedPassword = bcryptPasswordHash(newPassword);
    const res = await sql`UPDATE users SET password=${hashedPassword} WHERE email = ${email} RETURNING *`;
    if (res.rowCount > 0) {
        const user = res.rows[0];
        await sendMail(user.email, 'Password Reset', `Hi ${user.username},\n your new password is ${newPassword}. \n https://ai.mojotv.cn/login`);
        return user;
    } else {
        throw new Error('invalid email')
    }
}

