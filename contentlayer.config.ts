import { defineDocumentType, makeSource } from "contentlayer/source-files";
import type { DocumentGen } from "contentlayer/core";
import { bundleMDX } from "mdx-bundler";
import { toMarkdown } from "mdast-util-to-markdown";
import { mdxToMarkdown } from "mdast-util-mdx";
import fs from "node:fs/promises";
import path from "node:path";
import type * as unified from "unified";
import highlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

const contentDirPath = "_posts";

const getLastEditedDate = async (doc: DocumentGen): Promise<Date> => {
  const stats = await fs.stat(
    path.join(contentDirPath, doc._raw.sourceFilePath),
  );
  return stats.mtime;
};

const urlFromFilePath = (doc: DocumentGen): string => {
  let urlPath = doc._raw.flattenedPath.replace(/^pages\/?/, "/") as string;
  if (!urlPath.startsWith("/")) urlPath = `/${urlPath}`;
  if ("global_id" in doc) urlPath += `-${doc.global_id}`;
  // Remove preceding indexes from path segments
  urlPath = urlPath
    .split("/")
    .map((segment) => segment.replace(/^\d\d\d\-/, ""))
    .join("/");
  return urlPath;
};

export interface DocHeading {
  level: 1 | 2 | 3;
  title: string;
}

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `**/*.mdx`,
  contentType: "mdx",
  fields: {
    global_id: {
      type: "string",
      description:
        "Random ID to uniquely identify this doc, even after it moves",
      required: true,
    },
    title: {
      type: "string",
      description: "The title of the page",
      required: true,
    },
    nav_title: {
      type: "string",
      description: "Override the title for display in nav",
    },
    label: {
      type: "string",
    },
    excerpt: {
      type: "string",
      required: true,
    },
    show_child_cards: {
      type: "boolean",
      default: false,
    },
    collapsible: {
      type: "boolean",
      required: false,
      default: false,
    },
    collapsed: {
      type: "boolean",
      required: false,
      default: false,
    },
    // seo: { type: 'nested', of: SEO },
  },
  computedFields: {
    url_path: {
      type: "string",
      description:
        'The URL path of this page relative to site root. For example, the site root page would be "/", and doc page would be "docs/getting-started/"',
      resolve: (doc) => {
        if (doc._id.startsWith("posts/index.mdx")) return "/posts";
        return urlFromFilePath(doc);
      },
    },
    url_path_without_id: {
      type: "string",
      description:
        'The URL path of this page relative to site root. For example, the site root page would be "/", and doc page would be "docs/getting-started/"',
      resolve: (doc) =>
        urlFromFilePath(doc).replace(new RegExp(`-${doc.global_id}$`), ""),
    },
    pathSegments: {
      type: "json",
      resolve: (doc) =>
        urlFromFilePath(doc)
          .split("/")
          // skip `/docs` prefix
          .slice(1)
          .map((dirName) => {
            const re = /^((\d+)-)?(.*)$/;
            const [, , orderStr, pathName] = dirName.match(re) ?? [];
            const order = orderStr ? parseInt(orderStr) : 0;
            return { order, pathName };
          }),
    },
    headings: {
      type: "json",
      resolve: async (doc) => {
        const headings: DocHeading[] = [];

        await bundleMDX({
          source: doc.body.raw,
          mdxOptions: (opts) => {
            opts.remarkPlugins = [
              ...(opts.remarkPlugins ?? []),
              tocPlugin(headings),
            ];
            return opts;
          },
        });

        return [{ level: 1, title: doc.title }, ...headings];
      },
    },
    last_edited: { type: "date", resolve: getLastEditedDate },
  },
  extensions: {},
}));

export default makeSource({
  contentDirPath: contentDirPath,
  documentTypes: [Post],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [highlight],
  },
});

const tocPlugin =
  (headings: DocHeading[]): unified.Plugin =>
  () => {
    return (node: any) => {
      for (const element of node.children.filter(
        (_: any) => _.type === "heading" || _.name === "OptionsTable",
      )) {
        if (element.type === "heading") {
          const title = toMarkdown(
            { type: "paragraph", children: element.children },
            { extensions: [mdxToMarkdown()] },
          )
            .trim()
            .replace(/<.*$/g, "")
            .replace(/\\/g, "")
            .trim();
          headings.push({ level: element.depth, title });
        } else if (element.name === "OptionsTable") {
          element.children
            .filter((_: any) => _.name === "OptionTitle")
            .forEach((optionTitle: any) => {
              optionTitle.children
                .filter((_: any) => _.type === "heading")
                .forEach((heading: any) => {
                  const title = toMarkdown(
                    { type: "paragraph", children: heading.children },
                    { extensions: [mdxToMarkdown()] },
                  )
                    .trim()
                    .replace(/<.*$/g, "")
                    .replace(/\\/g, "")
                    .trim();
                  headings.push({ level: heading.depth, title });
                });
            });
        }
      }
    };
  };