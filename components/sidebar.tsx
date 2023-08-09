import React, {useEffect, useState} from "react";
import {CaButton, showToast} from "./ui-lib";
import {SessionList} from "./session-list";
import {useChatStore} from "@/store/chat";
import {useConfigStore} from "@/store/config";
import {useUserStore} from "@/store/user";
import {useRouter} from "next/navigation";
import {
    IconBrandAppstore,
    IconBugOff,
    IconMessageChatbot,
    IconRobot,
    IconSettings2,
    IconUserBolt
} from "@tabler/icons-react";
import {DialogConfig} from "@/components/dialog-config";
import {lemonCheckoutURL} from "@/types/lemon";

export default function SideBar() {
    const router = useRouter();
    const {addSession} = useChatStore();
    const {modelConfig} = useConfigStore();
    const {isAuthed, user} = useUserStore();
    const [isShowConfig, setIsShowConfig] = useState(false);
    const [userEmail, setUserEmail] = useState('')

    useEffect(() => {
        setUserEmail(user.email)
    }, [user])

    //

    // // drag side bar
    // const { onDragMouseDown, shouldNarrow } = useDragSideBar();
    // const navigate = useNavigate();
    // const config = useAppConfig();

    // const navigate = useNavigate();

    function doCreateNewSession() {
        addSession(modelConfig, 'New Session', []);
        // navigate(Path.Chat);
    }

    async function doLoginOrLogout() {
        if (isAuthed) {
            const res = await fetch('/api/logout');
            if (res.ok) {
                //remove local storage
                localStorage.clear();
                showToast('Clear local cache')
            }
        }
        // doLogin();
        router.push('/login')
    }

    // useHotKey();
    const REPO_URL = 'https://github.com/mojocn/gptchat/issues'
    return (
        <div
            className=" w-80 hidden sm:flex sm:flex-col border-gray-200 border-r relative ease-in-out  py-2 px-3"
        >
            {
                isShowConfig && <DialogConfig onClose={
                    () => {
                        setIsShowConfig(false)
                    }
                }/>
            }
            <div className="relative py-4 w-full">
                <div className="text-lg font-bold animate-bounce">MojoAI</div>
                <p className="text-sm">
                    chatGPT of
                    <span className="font-bold text-blue-600 mx-2">{userEmail}</span>
                </p>
                <div className="text-orange-600 absolute right-0 bottom-4">
                    <IconRobot size={42}></IconRobot>
                </div>
            </div>


            <SessionList/>

            <div className="flex justify-between my-4 align-center  w-full">
                <CaButton
                    loading={false}
                    title='Report bug'
                    className={''}
                    onClick={() => {
                        window.open(REPO_URL, '_blank')
                    }
                    }
                ><IconBugOff/></CaButton>

                <CaButton
                    loading={false}
                    title='Settings'
                    className={''}
                    onClick={e => {
                        e.stopPropagation();
                        setIsShowConfig(true)
                    }
                    }
                ><IconSettings2/></CaButton>

                <CaButton
                    loading={false}
                    title='Buy Membership'
                    className={''}
                    onClick={e => {
                        e.stopPropagation();
                        const url = lemonCheckoutURL(user.email, user.id);
                        window.open(url, '_blank')
                    }
                    }
                ><IconBrandAppstore/></CaButton>

                <CaButton
                    loading={false}
                    title='Login or logout'
                    onClick={doLoginOrLogout}
                    className={''}
                ><IconUserBolt/></CaButton>

                <CaButton
                    loading={false}
                    title='add new session'
                    onClick={doCreateNewSession}
                    className={''}
                ><IconMessageChatbot/></CaButton>


            </div>

        </div>
    );
}
