import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  viewport:
    "width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, target-densityDpi=device-dpi",
  title: "OpenAI ChatGPT",
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
