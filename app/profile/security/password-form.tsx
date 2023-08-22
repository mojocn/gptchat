"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn, toastErr, toastTxt } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import React, { useState } from "react";
import { IconLoader } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

const accountFormSchema = z.object({
  oldPassword: z
    .string()
    .min(6, {
      message: "Name must be at least 6 characters.",
    })
    .max(64, {
      message: "Name must not be longer than 64 characters.",
    }),
  newPassword: z
    .string()
    .min(6, {
      message: "Name must be at least 6 characters.",
    })
    .max(64, {
      message: "Name must not be longer than 64 characters.",
    }),
  newPassword2: z
    .string()
    .min(6, {
      message: "Name must be at least 6 characters.",
    })
    .max(64, {
      message: "Name must not be longer than 64 characters.",
    }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<AccountFormValues> = {
  oldPassword: "",
  newPassword: "",
  newPassword2: "",
};

export function PasswordForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
  });

  function onSubmit(data: AccountFormValues) {
    setLoading(true);
    if (data.newPassword !== data.newPassword2) {
      toastErr(new Error("两次输入的密码不一致"));
      return;
    }
    fetch("/api/users/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        toastTxt(res.msg);
      })
      .catch(toastErr)
      .finally(() => {
        setLoading(false);
      });
  }
  function doResetOldPassword() {
    router.push("/password-reset");
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="oldPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Old Password</FormLabel>
              <FormControl>
                <Input placeholder="password" {...field} />
              </FormControl>
              <FormDescription>Update your new password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input placeholder="Your name" {...field} />
              </FormControl>
              <FormDescription>Update your new password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comfirm New password</FormLabel>
              <FormControl>
                <Input placeholder="comfirm your password" {...field} />
              </FormControl>
              <FormDescription>comfirm your new password.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="text-foreground" disabled={loading}>
          {loading ? (
            <IconLoader
              size={16}
              className="animate-spin stroke-white font-semibold"
            />
          ) : (
            "Submit"
          )}
        </Button>

        <Button
          type="button"
          variant="destructive"
          className="ml-4 text-foreground"
          onClick={doResetOldPassword}
          disabled={loading}
        >
          {loading ? (
            <IconLoader
              size={16}
              className="animate-spin stroke-white font-semibold"
            />
          ) : (
            "Reset my old password"
          )}
        </Button>
      </form>
    </Form>
  );
}
