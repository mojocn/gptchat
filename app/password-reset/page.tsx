"use client";
import { useTransition } from "react";
import React from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/ui-lib";
import { doPasswordReset } from "./actions";
import { UserState, useUserStore } from "@/store/user";
import Image from "next/image";
import logoPng from "../apple-touch-icon.png";
import { Button } from "@/components/ui/button";
import { IconLoader } from "@tabler/icons-react";

export default function Login() {
  const { setUser }: UserState = useUserStore();
  let [isPending, startTransition] = useTransition();
  const router = useRouter();

  const doAction = async (formData: FormData) =>
    startTransition(() => {
      doPasswordReset(formData)
        .then((res) => {
          showToast(
            "Your password has been reset. please get your new password in your email.",
          );
          setTimeout(() => {
            router.push("/login");
          }, 100);
        })
        .catch((e) => {
          showToast("reset password failed :" + e?.message);
        });
    });

  return (
    <div className="bg-grey-lighter flex min-h-screen flex-col">
      <section className="bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto flex flex-col items-center justify-center px-6 py-8 md:h-screen lg:py-0">
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
          <div className=" rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md md:mt-0 xl:p-0">
            <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
                Reset your password
              </h1>
              <form className="w-96 space-y-4 md:space-y-3 " action={doAction}>
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

                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="newsletter"
                      aria-describedby="newsletter"
                      type="checkbox"
                      className="focus:ring-3 focus:ring-primary-300 dark:focus:ring-primary-600 h-4 w-4 rounded border border-gray-300 bg-gray-50
                                        dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
                      required
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="newsletter"
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
                    "Send password reset email"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
