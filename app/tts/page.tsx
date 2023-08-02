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

const defText = "Former President Donald J. Trump was charged with four counts in connection with his efforts to subvert the will of voters in 2020.  “Despite having lost, the defendant was determined to remain in power,” prosecutors wrote."
const language = "en-US"

export default function Tts() {
    const [speechTxt, setSpeechTxt] = useState(defText)
    const [recognizing, setRecognizing] = useState(false)
    const [result, setResult] = useState<PronunciationAssessmentResult | null>(null)
    const recognizerRef = useRef<SpeechRecognizer>();
    const speechCfgRef = useRef<SpeechConfig>();
    const audioCfgRef = useRef<AudioConfig>();



    async function init() {
        const {jwt, region} = await fetchSpeechToken();
        const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region)
        speechConfig.speechRecognitionLanguage = language;
        const audioConfig = AudioConfig.fromDefaultMicrophoneInput();
        const cfgJSON = `{"referenceText":"${speechTxt}","gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`
        const pronunciationAssessmentConfig = PronunciationAssessmentConfig.fromJSON(cfgJSON);
        // setting the recognition language to English.
        // create the speech recognizer.
        const rec = new SpeechRecognizer(speechConfig, audioConfig);
        pronunciationAssessmentConfig.applyTo(rec);

        rec.recognized = (sender: Recognizer, event: SpeechRecognitionEventArgs) => {
            const r = event.result;
            const pronunciationAssessmentResult = PronunciationAssessmentResult.fromResult(r);
            setResult(pronunciationAssessmentResult)
            setRecognizing(false)
        }
        rec.recognizing= (sender: Recognizer, event: SpeechRecognitionEventArgs) => {
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
        audioCfgRef.current= undefined;
        recognizerRef.current = undefined;
    }

    async function doSpeak(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        const {jwt, region} = await fetchSpeechToken();

        text2speechMML(jwt, region, speechTxt, 'en-US-JaneNeural', 'cheerful')

    }

    return (
        <div>
            {
                recognizing ? <CaButton onClick={recognizerStop}> stop</CaButton> : <CaButton onClick={recognizerStart}> start</CaButton>
            }
            <CaButton onClick={recognizerStop}> STOP</CaButton>


            <CaButton onClick={doSpeak}> SPEAK</CaButton>

            <pre>
                {JSON.stringify(result, null, 4)}
            </pre>
        </div>
    )
}

