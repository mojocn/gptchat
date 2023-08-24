"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import React from "react";
import Hero from "@/components/Hero";
import { AnimatedCard } from "@/components/AnimatedCard";

export default function Home() {
  return (
    <div className="relative flex w-full flex-col">
      <SiteHeader />
      <AnimatedCard></AnimatedCard>
      <Hero></Hero>

      <SiteFooter />
    </div>
  );
}
