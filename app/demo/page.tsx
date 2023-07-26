'use client'
import React from 'react'

import {useTheme} from "@/app/use-theme";
import {Loading, Loading2, showToast, CaSpinner, Toast} from "@/components/ui-lib";
import {useConfigStore} from "@/store/config";
import {Theme} from "@/types/const";
import AudioRecorder from "@/components/audio-recorder";

export default function Home() {
    const {theme, updateFn} = useConfigStore()

    useTheme();


    return (
        <div>
            {/*<section className="flex-row justify-between space-x-4 m-4">*/}
            {/*    <button onClick={e => {*/}
            {/*        updateFn(c => {*/}
            {/*            c.theme = 'dark' as Theme;*/}
            {/*            return c*/}
            {/*        })*/}
            {/*    }}>Theme Dark*/}
            {/*    </button>*/}

            {/*    <button onClick={e => {*/}
            {/*        updateFn(c => {*/}
            {/*            c.theme = 'light' as Theme;*/}
            {/*            return c*/}

            {/*        })*/}
            {/*    }}>Theme Light*/}
            {/*    </button>*/}

            {/*    <button onClick={e => {*/}
            {/*        showToast('aafadsfasdfasdfasdf', 50600)*/}
            {/*    }}>show toast*/}
            {/*    </button>*/}
            {/*</section>*/}


            {/*<CaSpinner size={5}></CaSpinner>*/}
            {/*<hr/>*/}

            <AudioRecorder/>
        </div>
    )
}

