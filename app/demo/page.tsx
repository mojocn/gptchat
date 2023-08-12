'use client'
import React from 'react'

import {useConfigStore} from "@/store/config";
import AudioRecorder from "@/components/audio-recorder";

export default function Home() {
    const {updateFn} = useConfigStore()



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

