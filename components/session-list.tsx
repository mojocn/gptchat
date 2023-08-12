import {ChatState, Session, useChatStore} from "@/store/chat";
import {IconCheck, IconDatabaseExport, IconPencilMinus, IconTrash, IconX} from "@tabler/icons-react";
import {useEffect, useState} from "react";
import {Card} from "./ui/card";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";

export function SessionList() {
    //https://github.com/shadcn-ui/ui/blob/main/apps/www/app/examples/cards/components/payment-method.tsx
    const {sessions, selectedSessionId}: ChatState = useChatStore();

    return (
        <div className="flex-1 overflow-x-hidden overflow-y-auto w-full">
            <RadioGroup value={selectedSessionId}>

                {sessions.map((item, i) => (
                    <SessionItem session={item} key={item.id}/>
                ))}
            </RadioGroup>

        </div>


    );
}


function SessionItem({session}: { session: Session }) {
    // const navigate = useNavigate();
    const {deleteSession, setSelectedSessionId, selectedSessionId, renameSession, getSelectedSession} = useChatStore();
    const [title, setTitle] = useState(session.title);
    const [isRename, setIsRename] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const isSelect = selectedSessionId === session.id;
    useEffect(() => {
        !isSelect && setIsRename(false);
    }, [isSelect])


    function doExport() {
        const markdownTxt = session.messages.map(e => e.content + '\n\n');
        const file = new Blob(markdownTxt, {type: 'text/plain'});
        const url = URL.createObjectURL(file);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${session.title}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    }

    function doSelectSession() {
        setSelectedSessionId(session.id);
        getSelectedSession();
        // setTimeout(() => {
        //     navigate(Path.Chat);
        // }, 50)
    }


    return (
        <Label onClick={doSelectSession}
               className={"max-w-sm p-4 cursor-pointer mt-2 relative group/session  w-full h-24 " +
                   "rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary "
               }
        >
            <RadioGroupItem value={session.id} id={session.id} className="sr-only"/>


            {


                isRename ?
                    <div className="flex space-x-2 h-5 items-center ">
                        <input
                            className="text-sm flex-1"
                            onKeyDown={e => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    renameSession(session.id, title);
                                    setIsRename(false)
                                }
                            }}
                            placeholder="change the session name"
                            onInput={e => {
                                e.stopPropagation();
                                setTitle(e.currentTarget.value);
                            }}
                            value={title}
                        />
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                renameSession(session.id, title);
                                setIsRename(false)
                            }}
                        >
                            <IconCheck className="text-green-500"/>

                        </button>
                        <button
                            onClick={e => {
                                e.stopPropagation();
                                setIsRename(false)
                            }}
                        >
                            <IconX className="text-red-500 "/>
                        </button>
                    </div>

                    :

                    <h3
                        onClick={doSelectSession}
                        className="text-sm
                         cursor-pointer
                         h-5
                         overflow-hidden
                         text-gray-900
                         dark:text-gray-100
                         overflow-ellipsis
                         whitespace-nowrap
                         font-semibold">{session.title}</h3>
            }


            <div className="flex justify-between mt-6 text-xs text-gray-900 dark:text-white">
                <div
                    onClick={doSelectSession}
                    className="overflow-hidden overflow-ellipsis whitespace-nowrap cursor-pointer">
                    {new Date(session.time).toLocaleString()}
                </div>

                <div
                    className="
                    flex
                    gap-3
                    text-blue-400
                    dark:text-blue-200
                    transition duration-150 ease-out
                    group-hover/session:visible
                    invisible
                    [&>*]:text-blue-400
                    dark:[&>*]:text-blue-200

                "

                >
                    <button
                        title="rename the session"
                        onClick={e => {
                            e.stopPropagation();
                            setIsRename(true)
                            setTitle(session.title)
                        }}>
                        <IconPencilMinus size={20}/>
                    </button>
                    <button
                        title="export the session"
                        onClick={doExport}>
                        <IconDatabaseExport size={20}/>
                    </button>

                    {
                        isDelete ?
                            <button
                                title="delete the session"
                                onClick={() => {
                                    setIsDelete(false)
                                    deleteSession(session.id);
                                }}>
                                <IconCheck size={20} className="text-green-500"/>
                            </button>
                            :
                            <button
                                title="delete the session"
                                onClick={() => setIsDelete(true)}>
                                <IconTrash size={20}/>
                            </button>
                    }


                </div>


            </div>


        </Label>


    );
}