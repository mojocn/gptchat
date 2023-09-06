"use client";
import { FC, Fragment, ReactNode, useEffect, useState } from "react";
import { cn, getNodeText, sluggifyTitle } from "@/lib/utils";
import Link from "next/link";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Post } from "contentlayer/generated";
import {
  IconBrandGithub,
  IconChevronDown,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { DocHeading } from "@/contentlayer.config";
import { TreeNode } from "@/types/TreeNode";

export const Label: FC<{ text: string; theme?: "default" | "primary" }> = ({
  text,
  theme = "default",
}) => {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 align-middle font-medium leading-4 tracking-wide [font-size:10px] ${
        theme === "default"
          ? "border border-slate-400/70 text-slate-500 dark:border-slate-600 dark:text-slate-400"
          : "border border-purple-300 text-purple-400 dark:border-purple-800 dark:text-purple-600"
      }`}
    >
      {text}
    </span>
  );
};
export const NavLink: FC<{
  title: string;
  label?: string;
  url: string;
  level: number;
  activePath: string;
  collapsible: boolean;
  collapsed: boolean;
  toggleCollapsed: () => void;
}> = ({
  title,
  label,
  url,
  level,
  activePath,
  collapsible,
  collapsed,
  toggleCollapsed,
}) => {
  return (
    <div
      className={cn(
        "group flex h-8 items-center justify-between space-x-2 whitespace-nowrap rounded-md px-3 text-sm leading-none",
        url == activePath
          ? `${
              level == 0 ? "font-medium" : "font-normal"
            } bg-violet-50 text-violet-900 dark:bg-violet-500/20 dark:text-violet-50`
          : `hover:bg-gray-50 dark:hover:bg-gray-900 ${
              level == 0
                ? "font-medium text-slate-600 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200"
                : "font-normal hover:text-slate-600 dark:hover:text-slate-300"
            }`,
      )}
    >
      <NextLink href={url} className="flex h-full grow items-center space-x-2">
        <span>{title}</span>
        {label && <Label text={label} />}
      </NextLink>
      {collapsible && (
        <button
          aria-label="Toggle children"
          onClick={toggleCollapsed}
          className="mr-2 shrink-0 px-2 py-1"
        >
          <IconChevronDown
            size={14}
            className={`block w-2.5 ${collapsed ? "-rotate-90 transform" : ""}`}
          />
        </button>
      )}
    </div>
  );
};

export const Node: FC<{
  node: TreeNode;
  level: number;
  activePath: string;
}> = ({ node, level, activePath }) => {
  const [collapsed, setCollapsed] = useState<boolean>(node.collapsed ?? false);
  const toggleCollapsed = () => setCollapsed(!collapsed);

  useEffect(() => {
    if (
      activePath == node.urlPath ||
      node.children.map((_) => _.urlPath).includes(activePath)
    ) {
      setCollapsed(false);
    }
  }, [activePath, node.children, node.urlPath]);

  return (
    <>
      <NavLink
        title={node.nav_title || node.title}
        label={node.label || undefined}
        url={node.urlPath}
        level={level}
        activePath={activePath}
        collapsible={node.collapsible ?? false}
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
      />
      {node.children.length > 0 && !collapsed && (
        <Tree tree={node.children} level={level + 1} activePath={activePath} />
      )}
    </>
  );
};

export const DocsNavigation: FC<{ tree: TreeNode[] }> = ({ tree }) => {
  const pathname = usePathname();

  return (
    <aside className="-ml-6 w-80">
      <div>
        <Tree tree={tree} level={0} activePath={pathname} />
      </div>
    </aside>
  );
};
export const Tree: FC<{
  tree: TreeNode[];
  level: number;
  activePath: string;
}> = ({ tree, level, activePath }) => {
  return (
    <div
      className={cn(
        "ml-3 space-y-2 pl-3",
        level > 0 ? "border-l border-gray-200 dark:border-gray-800" : "",
      )}
    >
      {tree.map((treeNode, index) => (
        <Node
          key={index}
          node={treeNode}
          level={level}
          activePath={activePath}
        />
      ))}
    </div>
  );
};

const githubBranch = "main";
const githubBaseUrl = `https://github.com/mojocn/gptchat/blob/${githubBranch}/_posts/`;

export const DocsFooter: FC<{ doc: Post }> = ({ doc }) => {
  return (
    <>
      <hr className="my-6" />
      <div className="space-y-4 text-sm sm:flex sm:justify-between sm:space-y-0">
        <p className="m-0">
          Was this article helpful to you? <br />{" "}
          <Link
            href="https://github.com/contentlayerdev/contentlayer/issues"
            className="inline-flex items-center space-x-1"
            target="_blank"
            rel="noreferrer"
          >
            <IconBrandGithub
              name="github"
              className="inline-block w-4"
              size={14}
            />
            <span>Provide feedback</span>
          </Link>
        </p>
        <p className="m-0 text-right">
          Last edited on {format(new Date(doc.last_edited), "MMMM dd, yyyy")}.
          <br />
          <Link
            href={githubBaseUrl + doc._raw.sourceFilePath}
            className="inline-flex items-center space-x-1"
            target="_blank"
            rel="noreferrer"
          >
            <IconBrandGithub
              name="github"
              className="inline-block w-4"
              size={14}
            />
            <span>Edit this page</span>
          </Link>
        </p>
      </div>
    </>
  );
};

export const ArticleNav: FC<{ headings: DocHeading[] }> = ({ headings }) => {
  const [activeHeading, setActiveHeading] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      let current = "";
      for (const heading of headings) {
        const slug = sluggifyTitle(getNodeText(heading.title));
        const element = document.getElementById(slug);
        if (element && element.getBoundingClientRect().top < 240)
          current = slug;
      }
      setActiveHeading(current);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [headings]);

  const headingsToRender = headings.filter((_) => _.level > 1);

  if ((headingsToRender ?? []).length === 0) return null;

  return (
    <div className="mt-8 text-sm">
      <h4 className="mb-4 font-medium text-slate-600">On this page</h4>
      <ul className="space-y-2">
        {headingsToRender.map(({ title, level }, index) => (
          <li key={index}>
            <a
              href={`#${sluggifyTitle(getNodeText(title))}`}
              style={{ marginLeft: (level - 2) * 16 }}
              className={`flex items-center gap-x-2 ${
                sluggifyTitle(getNodeText(title)) == activeHeading
                  ? "text-violet-600 dark:text-violet-400"
                  : "hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              <IconChevronRight size={14} />
              <span
                dangerouslySetInnerHTML={{
                  __html: title
                    .replace("`", '<code style="font-size: 0.75rem;">')
                    .replace("`", "</code>"),
                }}
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface ChildCardPops {
  children: ReactNode;
  url: string;
  className?: string;
  shadow?: boolean;
  dark?: boolean;
}

export function ChildCard({
  children,
  url,
  className,
  shadow = false,
  dark = false,
}: ChildCardPops) {
  const router = useRouter();
  return (
    <div
      onClick={() => router.push(url)}
      className={cn(
        "cursor-pointer overflow-hidden rounded-2xl border",
        dark
          ? "border-gray-800 bg-gray-900"
          : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900",
        shadow &&
          `shadow-lg ${
            dark ? "shadow-gray-900" : "shadow-gray-100 dark:shadow-gray-900"
          }`,
        className,
      )}
    >
      {children}
    </div>
  );
}

export const DocsHeader: FC<{
  tree: TreeNode[];
  breadcrumbs: any[];
  title: string;
}> = ({ tree, breadcrumbs, title }) => {
  const pathname = usePathname();

  const [open, setOpen] = useState<boolean>(false);
  const [top, setTop] = useState<boolean>(true);

  useEffect(() => {
    const handleScroll = () => setTop(window.scrollY <= 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="relative w-full ">
        <div className="mx-auto w-full max-w-3xl select-text space-y-2 px-4 py-8 md:px-8 lg:max-w-full lg:px-16">
          <ul className="flex flex-wrap items-center text-sm">
            {breadcrumbs.map(({ path, title }, index) => (
              <Fragment key={index}>
                {index < breadcrumbs.length - 1 && (
                  <li className="mx-1 flex items-center space-x-2">
                    <Link
                      href={path}
                      className="inline whitespace-nowrap hover:text-slate-600"
                    >
                      {title}
                    </Link>
                    <IconChevronRight
                      className="inline-block text-slate-400"
                      size={14}
                    />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
          <h1 className="sr-only  lg:not-sr-only lg:text-4xl">{title}</h1>
          <div className="lg:hidden">
            <button
              aria-label="Show docs navigation"
              onClick={() => setOpen(true)}
              className="flex space-x-2 text-left text-2xl font-semibold text-slate-800 dark:text-slate-200 md:space-x-3 md:text-3xl lg:text-4xl"
            >
              <IconChevronDown
                className="mt-1.5 inline-block w-4 flex-shrink-0 md:w-5"
                size={14}
              />
              <span className="inline-block flex-shrink">{title}</span>
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 h-screen bg-gray-950/10 pb-20 backdrop-blur-lg backdrop-filter dark:bg-gray-950/50">
          <div className="absolute left-0 h-full divide-y divide-gray-200 overflow-y-scroll border-l border-gray-200 bg-white p-4 dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between pb-2">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Documentation
              </h2>
              <button
                type="button"
                aria-label="Close docs navigation"
                onClick={() => setOpen(!open)}
                className="flex h-8 w-8 items-center justify-end text-slate-600 dark:text-slate-300"
              >
                <IconX className="inline-block w-4" size={14} />
              </button>
            </div>
            <div className="pt-4">
              <DocsNavigation tree={tree} />
            </div>
          </div>
        </div>
      )}
      <div
        className={`fixed top-14 z-10 hidden h-16 w-full border-b border-gray-200 bg-white bg-opacity-90 backdrop-blur backdrop-filter transition-opacity duration-200 dark:border-gray-800 dark:bg-gray-950 lg:block ${
          top ? "opacity-0" : "opacity-100"
        }`}
      >
        <ul className="flex h-full items-center space-x-2 px-16 text-sm">
          {breadcrumbs.map(({ path, title }, index) => (
            <Fragment key={index}>
              {index < breadcrumbs.length - 1 && (
                <li className="flex items-center space-x-2">
                  <Link
                    href={path}
                    className="inline whitespace-nowrap hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {title}
                  </Link>
                  <IconChevronRight
                    className="inline-block w-1.5 text-slate-400 dark:text-slate-500"
                    size={14}
                  />
                </li>
              )}
            </Fragment>
          ))}
          <li className="hidden text-slate-800 dark:text-slate-200 xl:block">
            {title}
          </li>
        </ul>
      </div>
    </>
  );
};
