'use client'
import React, {useRef, useState} from 'react'

import {CaButton} from "@/components/ui-lib";

import {
    AudioConfig,
    PronunciationAssessmentConfig,
    PronunciationAssessmentResult,
    SpeechConfig,
    SpeechRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {fetchSpeechToken, text2speech, text2speechMML} from "@/pkg/tts";
import {Recognizer, SpeechRecognitionCanceledEventArgs, SpeechRecognitionEventArgs} from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/sdk/Exports";
import {IconEar, IconMicrophone, IconPlayerStop, IconPlayerStopFilled, IconVolume} from "@tabler/icons-react";
import {toTtsResult, TtsResult, Word} from "@/pkg/tts-model";

const defText = " This will give you a foundation to build upon."
const language = "en-US"


function WordTag(props: Word) {
    return (<div>
        <p className="text-orange font-semibold">{props.Word}</p>
        <div className="flex gap-2 text-indigo">
            {props.Syllables?.map((s, i) => {
                return <span key={i}>{s.Syllable}</span>
            })}
        </div>
        <div className="flex gap-2 text-blue">
            {props.Phonemes?.map((s, i) => {
                return <span key={i}>{s.Phoneme}</span>
            })}
        </div>

    </div>)
}


export default function Tts() {
    const [speechTxt, setSpeechTxt] = useState(defText)
    const [preparing, setPreparing] = useState(false)
    const [recognizing, setRecognizing] = useState(false)
    const [result, setResult] = useState<TtsResult | null>(null)
    const recognizerRef = useRef<SpeechRecognizer>();
    const speechCfgRef = useRef<SpeechConfig>();
    const audioCfgRef = useRef<AudioConfig>();


    async function init() {
        setPreparing(true)
        const {jwt, region} = await fetchSpeechToken();
        const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region)
        speechConfig.speechRecognitionLanguage = language;
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const cfgJSON = `{"referenceText":"${speechTxt}","gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`
        const pronunciationAssessmentConfig = PronunciationAssessmentConfig.fromJSON(cfgJSON);
        // setting the recognition language to English.
        // create the speech recognizer.
        const rec = new SpeechRecognizer(speechConfig, audioConfig);
        setPreparing(false)
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
        recognizerRef.current?.startContinuousRecognitionAsync();
        setRecognizing(true)
    }

    async function recognizerStop(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        setRecognizing(false)
        audioCfgRef.current?.close();
        recognizerRef.current?.stopContinuousRecognitionAsync();
        console.info("stop")
        recognizerRef.current?.close()
        audioCfgRef.current = undefined;
        recognizerRef.current = undefined;
    }

    async function doSpeak(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const {jwt, region} = await fetchSpeechToken();

        text2speechMML(jwt, region, speechTxt, 'en-US-JaneNeural', 'cheerful')

    }

    return (
        <div className="mx-auto max-w-[24rem]">
            <p className="my-4 text-gray-400 dark:text-gray-200 font-mono">{speechTxt}</p>
            <div className="flex align-center items-center gap-4 justify-center">
                <CaButton onClick={recognizerStart}> <IconMicrophone/></CaButton>
                <CaButton onClick={recognizerStop}> <IconPlayerStopFilled/></CaButton>
                <CaButton onClick={doSpeak}> <IconEar/></CaButton>
                <CaButton onClick={doSpeak}> <IconVolume/></CaButton>
            </div>


            <div className="flex gap-2">

                {
                    result?.Words?.map((w, i) => {
                        const ww = w as Word
                        return <WordTag key={i} {...w}/>
                    })

                }
            </div>
        </div>
    )
}

