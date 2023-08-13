import ReactMarkdown from "react-markdown";
import "katex/dist/katex.min.css";
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import RemarkGfm from "remark-gfm";
import RehypeHighlight from "rehype-highlight";
import React, {RefObject, useEffect, useRef, useState} from "react";
import mermaid from "mermaid";
import {IconCopy, IconFileCheck} from '@tabler/icons-react';
import {cn} from "@/lib/utils";

export function Mermaid(props: { code: string; onError: () => void }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (props.code && ref.current) {
            mermaid
                .run({
                    nodes: [ref.current],
                })
                .catch((e) => {
                    props.onError();
                    console.error("[Mermaid] ", e.message);
                });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.code]);

    function viewSvgInNewWindow() {
        const svg = ref.current?.querySelector("svg");
        if (!svg) return;
        const text = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([text], {type: "image/svg+xml"});
        const url = URL.createObjectURL(blob);
        const win = window.open(url);
        if (win) {
            win.onload = () => URL.revokeObjectURL(url);
        }
    }

    return (
        <div
            className="no-dark"
            style={{cursor: "pointer", overflow: "auto"}}
            ref={ref}
            onClick={() => viewSvgInNewWindow()}
        >
            {props.code}
        </div>
    );
}

function PreCode(props: { children: any }) {
    const ref = useRef<HTMLPreElement>(null);
    const [mermaidCode, setMermaidCode] = useState("");
    const [isCopied, setIsCopied] = useState<Boolean>(false);
    const copyToClipboard = (code: string) => {
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            return;
        }
        navigator.clipboard.writeText(code).then(() => {
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 2000);
        });
    };
    useEffect(() => {
        if (!ref.current) return;
        const mermaidDom = ref.current.querySelector("code.language-mermaid");
        if (mermaidDom) {
            setMermaidCode((mermaidDom as HTMLElement).innerText);
        }
    }, [props.children]);

    if (mermaidCode) {
        return <Mermaid code={mermaidCode} onError={() => setMermaidCode("")}/>;
    }

    return (
        <pre ref={ref} className="group/pre relative">
          <button
              className="
            items-center bg-none  text-xs
            bg-gray-800
            group-hover/pre:visible
            hover:pointer-events-auto
            invisible
            absolute
            right-2 top-2
            "
              onClick={async () => {
                  if (ref.current) {
                      const code = ref.current.innerText;
                      await copyToClipboard(code);
                  }
              }}
          >
                        {isCopied ? <IconFileCheck size={24} stroke={2} className="text-green-400"/> :
                            <IconCopy size={24} className="text-white"/>}


          </button>
            {props.children}
    </pre>
    );
}

function _MarkDownContent(props: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[RemarkMath, RemarkGfm, RemarkBreaks]}
            rehypePlugins={[
                RehypeKatex,
                [
                    RehypeHighlight,
                    {
                        detect: true,
                        ignoreMissing: true,
                    },
                ],
            ]}
            components={{
                pre: PreCode,
                a: (aProps) => {
                    const href = aProps.href || "";
                    const isInternal = /^\/#/i.test(href);
                    const target = isInternal ? "_self" : aProps.target ?? "_blank";
                    return <a {...aProps} target={target}/>;
                },
            }}
        >
            {props.content}
        </ReactMarkdown>
    );
}

export const MarkdownContent = React.memo(_MarkDownContent);

export function Markdown(
    props: {
        content: string;
        miniWidth: string;
        loading?: boolean;
        fontSize?: number;
        parentRef?: RefObject<HTMLDivElement>;
        defaultShow?: boolean;
        className?: string;
    } & React.DOMAttributes<HTMLDivElement>,
) {
    const mdRef = useRef<HTMLDivElement>(null);
    const renderedHeight = useRef(0);
    const inView = useRef(!!props.defaultShow);

    const parent = props.parentRef?.current;
    const md = mdRef.current;


    if (!props.content) return (
        <div role="status" className="max-w-sm animate-pulse">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            <span className="sr-only">Loading...</span>
        </div>

    )

    const checkInView = () => {
        if (parent && md) {
            const parentBounds = parent.getBoundingClientRect();
            const twoScreenHeight = Math.max(500, parentBounds.height * 2);
            const mdBounds = md.getBoundingClientRect();
            const parentTop = parentBounds.top - twoScreenHeight;
            const parentBottom = parentBounds.bottom + twoScreenHeight;
            inView.current = Math.max(parentTop, mdBounds.top) <= Math.min(parentBottom, mdBounds.bottom);
        }

        if (inView.current && md) {
            renderedHeight.current = Math.max(
                renderedHeight.current,
                md.getBoundingClientRect().height,
            );
        }
    };

    setTimeout(() => checkInView(), 1);

    return (
        <div
            className={cn("markdown-body ", props.className || "")}
            style={{
                minWidth: props.miniWidth,
                fontSize: `${props.fontSize ?? 14}px`,
                height:
                    !inView.current && renderedHeight.current > 0
                        ? renderedHeight.current
                        : "auto",
            }}
            ref={mdRef}
            onContextMenu={props.onContextMenu}
            onDoubleClickCapture={props.onDoubleClickCapture}
        >
            {inView.current &&
                (props.loading ? (
                    <span>todo loading</span>
                ) : (
                    <MarkdownContent content={props.content}/>
                ))}
        </div>
    );
}
