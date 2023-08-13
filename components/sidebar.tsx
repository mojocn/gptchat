import React from "react";
import {SessionList} from "./session-list";
import {useChatStore} from "@/store/chat";
import {useConfigStore} from "@/store/config";
import {IconMessageChatbot, IconRobot} from "@tabler/icons-react";
import {DialogConfig} from "@/components/dialog-config";
import {ShoppingCart} from "lucide-react";
import {Button} from "@/components/ui/button";

export default function SideBar() {
    const {addSession, sessions} = useChatStore();
    const {modelConfig} = useConfigStore();



    //

    // // drag side bar
    // const { onDragMouseDown, shouldNarrow } = useDragSideBar();
    // const navigate = useNavigate();
    // const config = useAppConfig();

    // const navigate = useNavigate();

    function doCreateNewSession() {
        const n = sessions.length + 1;
        addSession(modelConfig, 'New Session '+n, []);
        // navigate(Path.Chat);
    }



    // useHotKey();
    return (
        <div
            className=" w-80 hidden sm:flex sm:flex-col relative ease-in-out  py-2 px-3"
        >

            <div className="relative py-4 w-full">
                <div className="text-lg font-bold ">MojoAI</div>
                <p className="text-sm">
                    Transforming the Possible!
                </p>
                <div className="text-orange-600 absolute right-0 bottom-4">
                    <IconRobot size={42}></IconRobot>
                </div>
            </div>


            <SessionList/>

            <div className="flex justify-evenly items-center align-center  w-full my-4">

                <Button
                    variant="ghost"
                    title='add new session'
                    onClick={doCreateNewSession}
                    className={''}
                ><ShoppingCart/></Button>

                <DialogConfig/>

                <Button
                    variant="ghost"
                    title='add new session'
                    onClick={doCreateNewSession}
                    className={''}
                ><IconMessageChatbot/></Button>

            </div>

        </div>
    );
}
