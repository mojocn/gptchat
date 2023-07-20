import {createRoot} from "react-dom/client";
import React, {MouseEventHandler, ReactNode, useEffect,} from "react";
import {OptionItem} from "@/types/item";


export function Loading() {
    return (
        <div role="status" className="max-w-sm animate-pulse">
            <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
            <span className="sr-only">Loading...</span>
        </div>

    );
}


export type ToastProps = {
    content: string;
    action?: {
        text: string;
        onClick: () => void;
    };
    onClose?: () => void;
};

export function Toast(props: ToastProps) {
    return (
        <div className="fixed top-4 left-0 w-screen flex justify-center pointer-events-none">
            <div
                className="flex align-center pointer-events-auto  max-w-4/5 break-words text-md bg-white shadow border border-gray-200 p-4 rounded-lg mb-4">
                <span>{props.content}</span>
                {props.action && (
                    <button
                        onClick={() => {
                            props.action?.onClick?.();
                            props.onClose?.();
                        }}
                        className="pl-6 text-blue-400 border-0 opacity-80 bg-none cursor-pointer hover:opacity-100"
                    >
                        {props.action.text}
                    </button>
                )}
            </div>
        </div>
    );
}


export function CaSelect(props: {
    name: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string
    options: OptionItem[]
}) {
    return (
        <div className="flex my-2 justify-between">
            <label htmlFor={props.name}
                   className="mr-3 text-sm text-gray-900 dark:text-white align-middle">{props.name}</label>
            <select id={props.name}
                    name={props.name}
                    value={props.value}
                    onChange={e => {
                        e.stopPropagation();
                        props.onChange(e.target.value)
                    }
                    }
                    placeholder={props.placeholder}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block
                            w-64 p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                {props.options.map(v => (
                    <option value={v.value} key={v.value} disabled={v.disabled || false}>
                        {v.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export function CaInput(props: {
    name: string,
    value: any,
    onChange: (value: any) => void,
    type: 'string' | 'number' | 'password' | 'email' | 'tel' | 'url',
    placeholder: string,
    min?: number,
    max?: number,
    step?: number,
    className?: string
}) {
    const inputClass = `bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg  focus:ring-primary-600 focus:border-primary-600 block w-64 p-1 dark:bg-gray-700 dark:border-gray-600      dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500  `
    return (
        <div className="flex my-2 justify-between">
            <label htmlFor={props.name}
                   className="mr-3 text-sm text-gray-900 dark:text-white align-middle">{props.name}</label>
            <input type={props.type}
                   name={props.name}
                   id={props.name}
                   value={props.value}
                   min={props.min}
                   max={props.max}
                   step={props.step}
                   onChange={e => {
                       e.stopPropagation()
                       props.onChange(e.target.value)
                   }}
                   className={`${inputClass} ${props.className}`}
                   placeholder={props.placeholder}/>
        </div>
    );
}


export function CaButton(props: {
    children?: ReactNode | ReactNode[];
    type?: 'primary' | 'success' | 'danger';
    onClick?: MouseEventHandler<HTMLButtonElement>;
    className?: string;
    title?: string;
    disabled?: boolean;
}) {
    let className = `inline-flex items-center justify-center py-0.5 px-2 mb-2 mr-2 overflow-hidden 
    text-sm font-medium rounded-lg hover:text-gray-500 dark:text-white`
    switch (props.type) {
        case 'primary':
            className += ' text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700'
            break;
        case 'success':
            className += ' text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700'
            break;
        case 'danger':
            className += ' text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700'
            break;
        default:
            className += ' text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
            break;

    }
    return (
        <button
            type="button" className={`${className} ${props.className}`}
            onClick={props.onClick}
            title={props.title}
            disabled={props.disabled}
        >
            {props.children}
        </button>
    );
}


export function showToast(
    content: string,
    delay = 3000,
    action?: ToastProps["action"],
) {
    const div = document.createElement("div");
    div.className = "opacity-100 fixed top-0 left-0";
    document.body.appendChild(div);

    const root = createRoot(div);
    const close = () => {
        div.classList.add("opacity-0")

        setTimeout(() => {
            root.unmount();
            div.remove();
        }, 300);
    };

    setTimeout(() => {
        close();
    }, delay);

    root.render(<Toast content={content} action={action} onClose={close}/>);
}

