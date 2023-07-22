'use server'

import {bcryptPasswordHash} from "@/pkg/bcrypt";
import {UserInsert, doUserInsert, findUserByEmail} from "@/model/user";


export async function doUserRegister(formData: FormData) {
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirm_password = formData.get('confirm_password') as string;
    if (password !== confirm_password) {
        throw new Error('Password not match')
    }
    //todo:: handle duplicate error
    let hashedPassword = password && bcryptPasswordHash(password as string);

    const user = await findUserByEmail(email)
    if (user && user.id) {
        throw new Error('Email already exists')
    }

    const newUser: UserInsert = {
        username,
        email,
        password: hashedPassword,
    };
    return await doUserInsert(newUser);

}
