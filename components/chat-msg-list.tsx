import {ChatMsg} from "@/components/chat-msg";
import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import {shallow} from 'zustand/shallow'
import {Message, useChatStore} from "@/store/chat";
import {UiStore, useUiStore} from "@/store/ui";


export default  function ChatMsgList() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedSessionId, sessions] = useChatStore(
        (state) => [state.selectedSessionId, state.sessions],
        shallow
    );
    const {
        isScrollBottom,
        isScrollTop,
        isScrollAuto,
        setIsScrollAuto
    }: UiStore = useUiStore();

    const scrollToBottomFn = () => {
        const dom = scrollRef.current;
        if (dom) {
            setTimeout(() => (dom.scrollTop = dom.scrollHeight + 10), 10);
        }
    };
    const scrollToTopFn = () => {
        const dom = scrollRef.current;
        if (dom) {
            setTimeout(() => (dom.scrollTop = 0), 10);
        }
    };

    //watch selectedSession
    useEffect(() => {
        const messages = sessions.find(s => s.id === selectedSessionId)?.messages;
        messages && setMessages(messages)
    }, [selectedSessionId, sessions]);

    useEffect(() => {
        // console.info("isScrollBottom", isScrollBottom)
        // console.info("isScrollTop", isScrollTop)
        isScrollBottom && scrollToBottomFn();
        isScrollTop && scrollToTopFn();
    }, [isScrollTop, isScrollBottom])


    useLayoutEffect(() => {
        isScrollAuto && scrollToBottomFn();
    })

    const [isHitBottom, setIsHitBottom] = useState(true);
    const onChatBodyScroll = (e: HTMLElement) => {
        const isTouchBottom = e.scrollTop + e.clientHeight >= e.scrollHeight - 10;
        setIsHitBottom(isTouchBottom);
    };
    const onWheelFn = (e: { deltaY: number; }) => {
        if (isHitBottom && e.deltaY > 0) {
            setIsScrollAuto(true);
        }
    }

    // @ts-ignore
    return (
        <section
            className="overflow-y-scroll overflow-x-hidden
            w-full
            chat-content-height
            flex-1
            relative
            overscroll-none
            px-4
            py-8
            space-y-4
            "
            ref={scrollRef}
            onScroll={(e) => onChatBodyScroll(e.currentTarget)}
            // onMouseDown={inputViewBlur}
            onWheel={onWheelFn}
            // onTouchStart={() => {
            //     setAutoScroll(false);
            // }}
        >

            {messages.filter(e => e.role != 'system').map((message: Message) => {
                //console.log(message)
                return (
                    <ChatMsg key={message.id} msg={message}/>
                );
            })}
        </section>
    );
}



