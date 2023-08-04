import React, {useRef, useState} from "react";
import {fetchSpeechToken} from "@/pkg/tts";
import {
    AudioConfig, CancellationReason,
    PronunciationAssessmentConfig, PronunciationAssessmentResult, ResultReason,
    SpeechConfig,
    SpeechRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {
    Recognizer, SpeechRecognitionCanceledEventArgs,
    SpeechRecognitionEventArgs
} from "microsoft-cognitiveservices-speech-sdk/distrib/lib/src/sdk/Exports";
import {toTtsResult} from "@/pkg/tts-model";


export function useSpeech2txt() {
    const [loading, setLoading] = useState(false)
    const [recognizing, setRecognizing] = useState(false)
    const [recTxt, setRecText] = useState("");
    const recognizerRef = useRef<SpeechRecognizer>();
    const speechCfgRef = useRef<SpeechConfig>();
    const audioCfgRef = useRef<AudioConfig>();

    async function init() {
        setLoading(true)
        const {jwt, region} = await fetchSpeechToken();
        const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region)
        const audioConfig = AudioConfig.fromDefaultSpeakerOutput()
        // The language of the voice that speaks.
        speechConfig.speechRecognitionLanguage = "zh-CN";//"en-US"; todo
        let rec = new SpeechRecognizer(speechConfig, audioConfig);

        // setting the recognition language to English.
        // create the speech recognizer.
        setRecognizing(true)
        rec.recognized = (sender: Recognizer, e: SpeechRecognitionEventArgs) => {
            if (e.result.reason == ResultReason.RecognizedSpeech) {
                console.log(`RECOGNIZED: Text=${e.result.text}`);
                setRecText(e.result.text)
            } else if (e.result.reason == ResultReason.NoMatch) {
                console.log("NOMATCH: Speech could not be recognized.");
            }
            setRecognizing(false)
        }
        rec.recognizing = (sender: Recognizer, e: SpeechRecognitionEventArgs) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
        }
        rec.canceled = (sender: Recognizer, e: SpeechRecognitionCanceledEventArgs) => {
            console.log(`CANCELED: Reason=${e.reason}`);

            if (e.reason == CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you set the speech resource key and region values?");
            }
            rec.stopContinuousRecognitionAsync();
            setRecognizing(false)
        }

        recognizerRef.current = rec;
        speechCfgRef.current = speechConfig;
        audioCfgRef.current = audioConfig;
    }

    async function recognizerStart() {
        await init();
        setRecognizing(true)
        recognizerRef.current?.startContinuousRecognitionAsync();
    }

    async function recognizerStop() {
        setRecognizing(false)
        setLoading(false)
        audioCfgRef.current?.close();
        recognizerRef.current?.stopContinuousRecognitionAsync();
        console.info("stop")
        recognizerRef.current?.close()
        audioCfgRef.current = undefined;
        recognizerRef.current = undefined;
    }

    return {recognizerStart, recognizerStop, loading, recognizing, recTxt}
}