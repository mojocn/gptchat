'use client';
import {useTransition} from "react";
import React from 'react';
import {useRouter} from "next/navigation";
import {showToast, Toast} from "@/components/ui-lib";
import {doUserLogin} from "@/app/login/actions";
import {UserModel, UserState, useUserStore} from "@/store/user";
import Image from 'next/image'

import logoPng from "../apple-touch-icon.png"
import {useTheme} from "@/app/use-theme";

export default function Login() {
    const {setUser}: UserState = useUserStore();
    let [isPending, startTransition] = useTransition()
    const router = useRouter();
    useTheme();

    const doAction = async (formData: FormData) => startTransition(() => {
        doUserLogin(formData).then(res => {
            setUser(res as UserModel)
            router.push('/')
        }).catch(e => {
            showToast('登录失败:' + e?.message)
        });
    })
    return (
        <div className="bg-grey-lighter h-screen w-screen flex flex-col overflow-hidden">
            <section className="bg-gray-50 h-full dark:bg-gray-900">
                <div className="flex flex-col items-center justify-center  py-8 mx-auto">
                    <a href="#" className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
                        <Image width={36} height={36} className="w-8 h-8 mr-2"
                               src={logoPng} alt="logo"/>
                        MojoAI
                    </a>
                    <div
                        className=" bg-white rounded-lg shadow dark:border mx-auto dark:bg-gray-800 dark:border-gray-700">
                        <div className="p-6 space-y-4 sm:space-y-4 sm:p-4 mx-auto">
                            <h1 className=" text-center text-xl font-bold leading-tight tracking-tight text-gray-900 sm:text-2xl dark:text-white">
                                Sign In to Your Account
                            </h1>
                            <form className="space-y-4 sm:space-y-3  sm:w-96 w-full" action={doAction}>
                                <div>
                                    <label htmlFor="email"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your
                                        email</label>
                                    <input type="email" name="email" id="email" className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg
                                                                        w-full

                                    focus:ring-primary-600 focus:border-primary-600 block  p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400
                                    dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                           placeholder="name@company.com" required/>
                                </div>
                                <div>
                                    <label htmlFor="password"
                                           className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                                    <input type="password" name="password" id="password" placeholder="••••••••"
                                           className="bg-gray-50 border border-gray-300
                                                                        w-full
                                    text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block  p-2.5 dark:bg-gray-700 dark:border-gray-600
                                    dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-400 dark:focus:border-blue-400"
                                           required/>
                                </div>

                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input id="terms" aria-describedby="terms" type="checkbox"
                                               className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3
                                                focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"/>
                                    </div>
                                    <div className="ml-3 text-sm">
                                        <label htmlFor="terms" className="font-light text-gray-500 dark:text-gray-300">I
                                            accept the <a
                                                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                                                href="#">Terms and Conditions</a></label>
                                    </div>
                                </div>
                                <button type="submit" className=" text-white bg-blue-400 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300
                                                                    w-full
                                font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-400 dark:hover:bg-blue-700 dark:focus:ring-primary-800">Login
                                    In
                                </button>
                                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                                    Does not have an account? <a href="/register"
                                                                 className="font-medium text-primary-600 hover:underline dark:text-primary-500 mr-4">Register
                                    here</a>
                                    Forget your password? <a href="/password-reset"
                                                             className="font-medium text-primary-600 hover:underline dark:text-primary-500">Password
                                    Reset</a>
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </div>


    )
}

