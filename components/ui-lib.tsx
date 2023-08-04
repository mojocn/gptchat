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

export function LoadingIcon(props: { className?: string, size?: number }) {
    return (
        <div role="status"
             className={`${props.className || ''}`}>
            <svg aria-hidden="true"
                 className={"text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 stroke-blue-800 "}
                 style={{width: props.size || 24, height: props.size || 24, padding: '2px'}}
                 viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"/>
                <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    )
}

export function Toast(props: ToastProps) {
    return (
        <div className="fixed top-4 left-0 w-screen flex justify-center pointer-events-none">
            <div
                className="flex items-center max-w-3/4 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200
             rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800"
                role="alert">
                <div className="text-center text-sm font-normal">{props.content}</div>

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

export function CaSpinner({size}: { size?: number }) {
    const c = size ? `h-${size} w-${size} ` : 'w-6 h-6 '
    return (
        <div role="status" className={c + " absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2"}>
            <svg aria-hidden="true"
                 className="w-full h-full text-gray-200 animate-spin dark:text-gray-600 fill-blue-600 dark:fill-blue-100"
                 viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"/>
                <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
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
    isLoading?: boolean;
    title?: string;
    disabled?: boolean;
}) {
    let className = ` inline-flex items-center justify-center py-0.5 px-2 mb-2 mr-2 overflow-hidden 
    text-sm font-medium rounded-lg hover:text-gray-500 dark:text-white ${props.className || ''} `;
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
            type="button" className={`${className} ${props.className || ''}`}
            onClick={props.onClick}
            title={props.title}
            disabled={props.isLoading || props.disabled}
        >
            {props.isLoading ? <LoadingIcon/> : props.children}
        </button>
    );
}


export function showToast(
    content: string,
    delay = 500,
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

