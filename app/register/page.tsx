"use client";
import React, { useTransition } from "react";
import { doUserRegister } from "./actions";
import { useRouter } from "next/navigation";
import { CaButton, showToast } from "@/components/ui-lib";
import Image from "next/image";
import logoPng from "@/app/apple-touch-icon.png";
import { Button } from "@/components/ui/button";
import { IconLoader } from "@tabler/icons-react";

export default function Register() {
  let [isPending, startTransition] = useTransition();
  const router = useRouter();

  const doAction = async (formData: FormData) =>
    startTransition(() => {
      doUserRegister(formData)
        .then((res) => {
          if (res) {
            showToast("Register succeed " + res.email);
            setTimeout(() => {
              router.push("/login");
            }, 50);
          }
        })
        .catch((e) => {
          console.error(e);
          showToast("Register failed : email is already exist");
        });
    });

  return (
    <div className="bg-grey-lighter flex h-screen w-screen flex-col overflow-hidden">
      <section className="h-full bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto flex flex-col items-center  justify-center py-8">
          <a
            href="#"
            className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
          >
            <Image
              width={36}
              height={36}
              className="mr-2 h-8 w-8"
              src={logoPng}
              alt="logo"
            />
            MojoAI
          </a>
          <div className=" mx-auto rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800">
            <div className="mx-auto space-y-4 p-6 sm:space-y-4 sm:p-4">
              <h1 className=" text-center text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                Create an account
              </h1>
              <form
                className="w-full space-y-4  sm:w-96 sm:space-y-3"
                action={doAction}
              >
                <div>
                  <label
                    htmlFor="username"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Your user name
                  </label>
                  <input
                    type="username"
                    name="username"
                    id="username"
                    autoComplete="off"
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full
                                    rounded-lg
                                    border border-gray-300 bg-gray-50 p-2.5 text-gray-900  dark:border-gray-600 dark:bg-gray-700
                                    dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm"
                    placeholder="jimmy"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="focus:ring-primary-600 focus:border-primary-600 block w-full rounded-lg border
                                                                        border-gray-300

                                    bg-gray-50 p-2.5 text-gray-900  dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                                    dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm"
                    placeholder="name@company.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="••••••••"
                    className="focus:ring-primary-600 focus:border-primary-600 block
                                                                        w-full

                                    rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900  dark:border-gray-600 dark:bg-gray-700 dark:text-white
                                    dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirm_password"
                    className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Confirm password
                  </label>
                  <input
                    type="confirm_password"
                    name="confirm_password"
                    id="confirm_password"
                    placeholder="••••••••"
                    className="focus:ring-primary-600 focus:border-primary-600
                                                                        block

                                    w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-gray-900  dark:border-gray-600 dark:bg-gray-700
                                    dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm"
                    required
                  />
                </div>
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="terms"
                      aria-describedby="terms"
                      type="checkbox"
                      className="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 h-4 w-4 rounded border
                                                border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="terms"
                      className="font-light text-gray-500 dark:text-gray-300"
                    >
                      I accept the{" "}
                      <a
                        className="text-primary-600 dark:text-primary-500 font-medium hover:underline"
                        href="#"
                      >
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isPending}
                  className=" w-full px-5 py-2.5 text-foreground "
                >
                  {isPending ? (
                    <IconLoader
                      size={16}
                      className="animate-spin stroke-white font-semibold"
                    />
                  ) : (
                    "Create an account"
                  )}
                </Button>
                <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-primary-600 dark:text-primary-500 font-medium hover:underline"
                  >
                    Login here
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
