'use server'

import {bcryptPasswordCheck, getUUID} from "@/pkg/bcrypt";
import {sql} from "@vercel/postgres";
import {cookies} from "next/headers";

const tokenExpireSecond = 60 * 60 * 24 * 30;

export async function doUserLogin(formData: FormData): Promise<object> {
    const emailF = formData.get('email');
    if (!emailF) {
        throw new Error('Email is required')
    }
    const passwordF = formData.get('password');
    if (!passwordF) {
        throw new Error('Password is required')
    }
    const email = emailF as string;
    const password = passwordF as string;
    const token = crypto.randomUUID();
    const {
        rows,
        rowCount
    } = await sql`UPDATE users SET last_active_at = NOW() WHERE email = ${email.trim()} RETURNING *`;
    if (rowCount !== 1) {
        throw new Error('User not found')
    }
    const user = rows[0];
    if (!bcryptPasswordCheck(password.trim(), user.password)) {
        throw new Error('Password is incorrect')
    }

    await sql`INSERT INTO tokens (user_id, token, last_active_at,created_at) VALUES (${user.id}, ${token}, NOW(), NOW());`

    //expire in 1 day
    cookies().set('token', token, {
        maxAge: tokenExpireSecond,
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
    });
    cookies().set('uid', user.id, {
        maxAge: tokenExpireSecond,
        path: '/',
        httpOnly: true,
    })
    user.password = undefined;
    return user;
}