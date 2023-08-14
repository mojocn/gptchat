import React, { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function PostLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
