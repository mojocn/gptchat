import { FC, PropsWithChildren, ReactNode } from "react";
import {
  IconChevronRight,
  IconExclamationMark,
  IconExternalLink,
  IconIcons,
} from "@tabler/icons-react";
import NextLink from "next/link";
import Image from "next/image";
import { getNodeText, sluggifyTitle } from "@/lib/utils";

export const isExternalUrl = (link: string): boolean => !link.startsWith("/");

export const ChevronLink: FC<{ label: string; url: string }> = ({
  label,
  url,
}) => {
  if (isExternalUrl(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center space-x-1.5 text-violet-600 no-underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <span className="font-semibold">{label}</span>
        <IconChevronRight className="block" size={14} />
      </a>
    );
  } else {
    return (
      <NextLink
        href={url}
        className="inline-flex items-center space-x-1.5 text-violet-600 no-underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <span className="font-semibold">{label}</span>
        <IconChevronRight className="block" size={14} />
      </NextLink>
    );
  }
};

export const OptionsTable: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="options-table grid grid-cols-1 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 md:grid-cols-4 lg:grid-cols-1 xl:grid-cols-4">
      {children}
    </div>
  );
};

export const OptionTitle: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="option-title hyphens not-prose -mt-px border-t border-gray-200 bg-gray-50 p-4 pt-5 dark:border-gray-800 dark:bg-gray-900/75 md:border-r lg:border-r-0 xl:border-r">
      {children}
    </div>
  );
};

export const OptionDescription: FC<{ children: ReactNode }> = ({
  children,
}) => {
  return (
    <div className="-mt-px border-t border-gray-200 px-4 pb-2 dark:border-gray-800 md:col-span-3 lg:col-span-1 xl:col-span-3">
      {children}
    </div>
  );
};

export const Callout: FC<{ children: ReactNode; className?: string | "" }> = ({
  children,
  className,
}) => {
  return (
    <div
      className={`rounded-lg border border-violet-100 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-900/20 ${className}`}
    >
      <div className="flex space-x-4 p-6 py-4 text-violet-600 dark:text-violet-300">
        <div className="mt-1 w-5 shrink-0 text-violet-500 dark:text-violet-400">
          <IconExclamationMark name="exclamation" />
        </div>
        <div className="font-semibold">{children}</div>
      </div>
    </div>
  );
};

export const Link: FC<{ href: string; children: ReactNode }> = ({
  href,
  children,
}) => {
  const isExternalUrl = !(href.startsWith("/") || href.startsWith("#"));

  return (
    <NextLink
      href={href}
      className="m-0 inline-flex items-center space-x-1"
      target={isExternalUrl ? "_blank" : undefined}
      rel={isExternalUrl ? "noreferrer" : undefined}
    >
      <span>{children}</span>
      {isExternalUrl && <IconExternalLink className="block w-4" />}
    </NextLink>
  );
};
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
export const Card: FC<
  PropsWithChildren<{
    title: string;
    icon?: string | null;
    label?: string | null;
    subtitle?: string | null;
    link?: { url: string; label: string };
  }>
> = ({ title, icon, label, subtitle, children, link }) => {
  return (
    <div className="flex flex-col">
      <div
        className={`grow border border-gray-100 bg-gray-50 p-6 py-4 dark:border-gray-800 dark:bg-gray-900 
        ${link ? "rounded-t-2xl border-b-0" : "rounded-2xl"} ${
          icon ? "mt-6" : "mt-0"
        }`}
      >
        {icon && (
          <div className="-mt-10 mb-4 block w-12 rounded-full bg-white dark:bg-gray-950">
            <div className="h-12 w-12 rounded-full border border-violet-200 bg-violet-100 p-2.5 text-violet-600 dark:border-violet-900 dark:bg-violet-900/50 dark:text-violet-500">
              <IconIcons name={icon} />
            </div>
          </div>
        )}
        <h3 className="mt-0">{title}</h3>
        {label && <Label text={label} />}
        {subtitle && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>{subtitle}</p>
          </div>
        )}
        {children && <div className="text-sm">{children}</div>}
      </div>
      {link && (
        <div className="rounded-b-2xl border border-violet-100 bg-violet-50 p-6 py-4 dark:border-violet-900/50 dark:bg-violet-900/20">
          <ChevronLink {...link} />
        </div>
      )}
    </div>
  );
};

const H2: FC<PropsWithChildren<{}>> = ({ children }) => {
  const slug = sluggifyTitle(getNodeText(children));
  return (
    <h2 id={slug} className="group cursor-pointer scroll-mt-32">
      <span className="absolute left-8 hidden text-slate-400 dark:text-slate-600 lg:group-hover:inline">
        #
      </span>
      <Link href={`#${slug}`}>{children}</Link>
    </h2>
  );
};

const H3: FC<PropsWithChildren<{}>> = ({ children }) => {
  const slug = sluggifyTitle(getNodeText(children));
  return (
    <h3 id={slug} className="group cursor-pointer scroll-mt-32">
      <span className="absolute left-8 hidden text-slate-400 dark:text-slate-600 lg:group-hover:inline">
        #
      </span>
      {children}
    </h3>
  );
};

const H4: FC<PropsWithChildren<{}>> = ({ children }) => {
  const slug = sluggifyTitle(getNodeText(children));
  return (
    <h4 id={slug} className="group cursor-pointer  scroll-mt-32">
      <span className="absolute left-8 hidden text-slate-400 dark:text-slate-600 lg:group-hover:inline">
        #
      </span>
      {children}
    </h4>
  );
};

function HR() {
  return <hr className="my-4" />;
}

export const mdxComponents = {
  hr: HR,
  Callout,
  Card,
  Image,
  Link,
  ChevronLink,
  Label,
  h2: H2,
  h3: H3,
  h4: H4,
  a: NextLink,
  OptionsTable,
  OptionTitle,
  OptionDescription,
};
