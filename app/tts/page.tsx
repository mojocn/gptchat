'use client'
import React, { useRef} from 'react'
import {WordTag} from "./word";
import {CaButton} from "@/components/ui-lib";

import {
    AudioConfig,
    PronunciationAssessmentConfig,
    PronunciationAssessmentResult,
    SpeechConfig,
    SpeechRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {fetchSpeechToken,  text2speechMML} from "@/pkg/tts";
import {
    Recognizer,
    SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs
} from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/sdk/Exports";
import {
    IconBrandTelegram,
    IconChevronLeft,
    IconChevronRight,
    IconEar,
    IconMicrophone,
    IconVolume,
    IconWaveSine
} from "@tabler/icons-react";
import {toTtsResult, TtsResult, Word} from "@/pkg/tts-model";
import {PronounceScore} from "./score";
import {create} from 'zustand'
import {persist} from 'zustand/middleware'

const language = "en-US"

interface TextStore {
    result?: TtsResult,
    resultAll: TtsResult[],
    setResult: (v: TtsResult) => void

    lines: string[]
    setLines: (v: string[]) => void
    idx: number
    idxInc: () => void
    idxDec: () => void
    speechTxt: () => string
    loading: boolean
    setLoading: (v: boolean) => void
    recognizing: boolean
    setRecognizing: (v: boolean) => void

}

const rawText = `
What kind of music do you enjoy listening to?
Can you tell me about your favorite movie and why you like it?
If you could travel anywhere in the world, where would you go and why?
What do you like to do in your free time?
How is the weather in your country during different seasons?
What are some traditional dishes from your culture?
Could you describe a memorable trip or vacation you have taken?
What are your hobbies and how did you develop an interest in them?
Tell me about a book you recently read and what you found interesting about it.
What are some popular tourist attractions in your city or country?
Describe a typical day in your life.
Do you think learning a second language is important? Why or why not?
`

const useTextStore = create<TextStore>()(persist(
    (set, get) => ({
            result: undefined,
            resultAll: [],
            setResult: (v: TtsResult) => set({resultAll: [...get().resultAll, v], result: v}),

            lines: rawText.split("\n").map(s => s.trim()).filter(s => s.length > 0),
            setLines: (v: string[]) => set({lines: v}),
            idx: 0,
            idxInc: () => {
                if (get().idx >= get().lines.length - 1) {
                    set({idx: 0})
                } else {
                    set({idx: get().idx + 1})
                }
            }
            ,
            idxDec: () => {
                if (get().idx <= 0) {
                    set({idx: get().lines.length - 1})
                } else {
                    set({idx: get().idx - 1})
                }
            },
            speechTxt: () => get().lines[get().idx],
            loading: false,
            setLoading: (v: boolean) => set({loading: v}),
            recognizing: false,
            setRecognizing: (v: boolean) => set({recognizing: v}),
        } as TextStore
    ), {
        name: 'tts-data', // name of the item in the storage (must be unique)

    })
)


export default function Tts() {
    const {
        lines, idx, speechTxt, idxInc, idxDec,
        result, resultAll, setResult,
        loading, setLoading, recognizing, setRecognizing
    } = useTextStore();


    const recognizerRef = useRef<SpeechRecognizer>();
    const speechCfgRef = useRef<SpeechConfig>();
    const audioCfgRef = useRef<AudioConfig>();


    async function doIndxInc() {
        idxInc()
        await doSpeak()
    }

    async function doIndxDesc() {
        idxDec()
        await doSpeak()
    }


    async function init() {
        setLoading(true)
        const {jwt, region} = await fetchSpeechToken();
        const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region)
        speechConfig.speechRecognitionLanguage = language;
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const cfgJSON = `{"referenceText":"${speechTxt()}","gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`
        const pronunciationAssessmentConfig = PronunciationAssessmentConfig.fromJSON(cfgJSON);
        // setting the recognition language to English.
        // create the speech recognizer.
        const rec = new SpeechRecognizer(speechConfig, audioConfig);
        setLoading(false)
        pronunciationAssessmentConfig.applyTo(rec);
        setRecognizing(true)
        rec.recognized = (sender: Recognizer, event: SpeechRecognitionEventArgs) => {
            const r = event.result;
            const pronunciationAssessmentResult = toTtsResult(PronunciationAssessmentResult.fromResult(r));
            console.error(JSON.stringify(pronunciationAssessmentResult))
            setResult(pronunciationAssessmentResult)
            setRecognizing(false)
        }
        rec.recognizing = (sender: Recognizer, event: SpeechRecognitionEventArgs) => {
            console.log(event.result.text)
            console.info("recognizing")
        }
        rec.canceled = (sender: Recognizer, event: SpeechRecognitionCanceledEventArgs) => {
            setRecognizing(false)
        }

        recognizerRef.current = rec;
        speechCfgRef.current = speechConfig;
        audioCfgRef.current = audioConfig;
    }


    async function recognizerStart(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        await init();
        recognizerRef.current?.startContinuousRecognitionAsync(() => {
            setRecognizing(true)

        }, console.error);
        setRecognizing(true)
    }

    async function recognizerStop(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        setRecognizing(false)
        audioCfgRef.current?.close();
        recognizerRef.current?.stopContinuousRecognitionAsync(() => {
            setRecognizing(false)
            recognizerRef.current?.close()
            audioCfgRef.current = undefined;
            recognizerRef.current = undefined;
        }, console.error);
    }

    async function doSpeak() {
        setLoading(true)
        const {jwt, region} = await fetchSpeechToken();
        setLoading(false)
        text2speechMML(jwt, region, speechTxt(), 'en-US-JaneNeural', 'cheerful')
        setRecognizing(false)

    }

    async function doSendResultToCloud() {
        //do http post request by fetch
        setLoading(true)
        const response = await fetch('/api/tts', {
            method: 'POST',
            body: JSON.stringify(resultAll),
        })
        if (response.status !== 200) {
            const txt = await response.text()
            console.error(txt)
        }
        setLoading(false)
    }

    return (
        <div className="mx-auto max-w-[36rem] overflow-hidden">
            <h3 className="text-center my-2">{`${idx + 1}/${lines.length}`}</h3>
            <p className="text-center my-4 text-gray-400 dark:text-gray-200 font-mono text-center">{speechTxt()}</p>
            <p className="text-center my-4 text-gray-400 dark:text-gray-200 font-mono">{result?.Lexical}</p>
            {/*<p className="my-4 text-gray-400 dark:text-gray-200 font-mono">{result?.ITN}</p>*/}
            {/*<p className="my-4 text-gray-400 dark:text-gray-200 font-mono">{result?.Display}</p>*/}


            {
                result && result.PronunciationAssessment && <PronounceScore score={result?.PronunciationAssessment}/>
            }


            <div className="flex gap-2">

                {
                    result?.Words?.map((w, i) => {
                        const ww = w as Word
                        return <WordTag key={i} {...w}/>
                    })

                }
            </div>

            <div className="absolute left-0 bottom-0 right-0 m-4  flex align-center items-center gap-4 justify-center">

                <CaButton onClick={doIndxDesc} loading={loading} theme="primary"> <IconChevronLeft/></CaButton>

                {
                    recognizing ?
                        <CaButton onClick={recognizerStop} theme="danger" loading={false}> <IconWaveSine
                            className="animate-ping "/></CaButton>
                        :
                        <CaButton onClick={recognizerStart} loading={loading} theme="success">
                            <IconMicrophone/></CaButton>
                }
                {/*<CaButton onClick={() => {*/}
                {/*    alert('todo')*/}
                {/*}}*/}
                {/*          type="warning"*/}
                {/*> <IconEar/></CaButton>*/}
                <CaButton onClick={doSpeak} loading={loading} theme="primary"> <IconVolume/></CaButton>


                <CaButton onClick={doSendResultToCloud}
                          loading={loading}
                          title="send recognition score to cloud"
                          theme="warning"
                > <IconBrandTelegram/></CaButton>

                <CaButton onClick={doIndxInc} loading={loading} theme="primary"> <IconChevronRight/></CaButton>

            </div>
        </div>
    )
}

