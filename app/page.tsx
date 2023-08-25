"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import React from "react";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="relative flex w-full flex-col">
      <SiteHeader />
      <Hero></Hero>

      <SiteFooter />
    </div>
  );
}
