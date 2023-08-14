"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import React from "react";

export default function Home() {
  return (
    <div className="relative flex w-full flex-col">
      <SiteHeader />
      <div className="flex items-center space-x-4 p-36">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
