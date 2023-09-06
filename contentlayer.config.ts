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
import { spawn } from "node:child_process";

const contentDirPath = "_posts";
const ORDER_REGEX = /^\d\d\d\-/; // 444-foo-bar -> foo-bar

const getLastEditedDate = async (doc: DocumentGen): Promise<Date> => {
  const stats = await fs.stat(
    path.join(contentDirPath, doc._raw.sourceFilePath),
  );
  return stats.mtime;
};

function toSlug(doc: DocumentGen): string {
  // Remove preceding indexes from path segments
  return doc._raw.flattenedPath
    .split("/")
    .map((segment) => segment.replace(ORDER_REGEX, ""))
    .join("/");
}

export interface DocHeading {
  level: 1 | 2 | 3;
  title: string;
}

const gitUrl = "https://github.com/mojocn/contentant";
const retryCount = 3;

async function syncContentFromGit(contentDir: string) {
  const cmdLines = `
      if [ -d  "${contentDir}" ];
        then
          cd "${contentDir}"; git pull;
        else
          git clone --depth 1 --single-branch ${gitUrl} ${contentDir};
      fi
    `;
  for (let i = 0; i < retryCount; i++) {
    try {
      await runBashCommand(cmdLines);
      break;
    } catch (err) {
      console.error(err);
      console.log("retrying...");
    }
  }
}

async function runBashCommand(command: string) {
  new Promise((resolve, reject) => {
    const child = spawn(command, [], { shell: true });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => process.stderr.write(data));
    child.on("close", function (code) {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
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
    slug: {
      type: "string",
      description:
        'slug of this page relative to site root. For example, the site root page would be "/", and doc page would be "docs/getting-started/"',
      resolve: toSlug,
    },
    pathSegments: {
      type: "json",
      resolve: (doc) =>
        doc._raw.flattenedPath.split("/").map((dirName) => {
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
