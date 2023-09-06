import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import React from "react";
import { Post as Doc } from "contentlayer/generated";
import { TreeNode } from "@/types/TreeNode";
import { toast } from "@/components/ui/use-toast";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sluggifyTitle = (title: string) => {
  const re = /[^\w\s]/g;

  return title.trim().toLowerCase().replace(re, "").replace(/\s+/g, "-");
};

export const getNodeText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node;
  if (typeof node === "number") return node.toString();
  if (node instanceof Array) return node.map(getNodeText).join("");

  if (typeof node === "object" && (node as any)?.props?.children)
    return getNodeText((node as any).props.children);

  // console.log(node)
  // console.error(`Should be never reached`)
  // debugger

  return "";
};

function isPrefixArray(subArr: string[], arr: string[]): boolean {
  if (subArr.length + 1 != arr.length) return false;
  for (let i = 0; i < subArr.length; i++) {
    if (subArr[i] != arr[i]) return false;
  }
  return true;
}

export const buildDocsTree = (
  docs: Doc[],
  parentPathNames: string[] = [],
): TreeNode[] => {
  const level = parentPathNames.length;

  return docs
    .filter(
      (_) =>
        _.slug !== "" &&
        isPrefixArray(
          parentPathNames,
          _.pathSegments.map((_: PathSegment) => _.pathName),
        ),
    )
    .sort((a, b) => a.pathSegments[level].order - b.pathSegments[level].order)
    .map<TreeNode>((doc) => ({
      nav_title: doc.nav_title ?? null,
      title: doc.title,
      label: doc.label ?? null,
      excerpt: doc.excerpt ?? null,
      urlPath: "/posts/" + doc.slug,
      collapsible: doc.collapsible ?? null,
      collapsed: doc.collapsed ?? null,
      children: buildDocsTree(
        docs,
        doc.pathSegments.map((_: PathSegment) => _.pathName),
      ),
    }));
};

export function toastErr(e: any) {
  if (!e) return;
  toast({
    title: "Error",
    description: e.message + e.description,
  });
}

export function toastTxt(title: string, description?: string) {
  if (!title) return;
  toast({
    title: title,
    description: description,
  });
}
