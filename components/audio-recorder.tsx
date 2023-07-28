// https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#example
import {useState, useRef} from "react";
import {CaButton} from "@/components/ui-lib";
import {IconPlayerPause, IconPlayerPlay, IconPlayerRecord, IconPlayerStop} from "@tabler/icons-react";
import {sleep} from "@/pkg/util";
import {
    AudioConfig,
    PronunciationAssessmentConfig, PronunciationAssessmentResult, PropertyId,
    SpeechConfig, SpeechRecognitionResult,
    SpeechRecognizer
} from "microsoft-cognitiveservices-speech-sdk";
import {NextResponse} from "next/server";

const constraints = {audio: true, video: false};

async function callXhr() {
    //https://github.com/Azure-Samples/cognitive-services-speech-sdk/blob/master/samples/js/node/pronunciationAssessmentContinue.js#LL37C4-L37C52
//https://github.com/Azure-Samples/cognitive-services-speech-sdk/blob/master/samples/js/browser/public/index.html

    const pronunciationAssessmentConfig0 = PronunciationAssessmentConfig.fromJSON("{\"referenceText\":\"good morning\",\"gradingSystem\":\"HundredMark\",\"granularity\":\"Phoneme\",\"EnableMiscue\":true}");
    const pronunciationAssessmentConfig = PronunciationAssessmentConfig.fromJSON("{\"referenceText\":\"good morning\",\"gradingSystem\":\"HundredMark\",\"granularity\":\"Phoneme\",\"phonemeAlphabet\":\"IPA\"}");
    const pronunciationAssessmentConfig2 = PronunciationAssessmentConfig.fromJSON("{\"referenceText\":\"good morning\",\"gradingSystem\":\"HundredMark\",\"granularity\":\"Phoneme\",\"EnableMiscue\":true}");
    const speechConfig = SpeechConfig.fromAuthorizationToken("", "");
    const audioConfig = AudioConfig.fromDefaultMicrophoneInput()


    // setting the recognition language to English.
    speechConfig.speechRecognitionLanguage = "en-US";

    // create the speech recognizer.
    const reco = new SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(reco);

    reco.recognizeOnceAsync((speechRecognitionResult: SpeechRecognitionResult) => {
            // The pronunciation assessment result as a Speech SDK object
            var pronunciationAssessmentResult = PronunciationAssessmentResult.fromResult(speechRecognitionResult);

            // The pronunciation assessment result as a JSON string
            var pronunciationAssessmentResultJson = speechRecognitionResult.properties.getProperty(PropertyId.SpeechServiceResponse_JsonResult);
        },
        console.error);


    return NextResponse.json({ok: true});
}


const AudioRecorder = () => {
    const [audioURL, setAudioURL] = useState<string>("");
    const [recorderState, setRecorderState] = useState<RecordingState>("inactive")
    const recorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioBlobRef = useRef<Blob | null>(null);

    async function recorderInit() {
        if (recorderRef.current) {
            return;
        }
        if (!navigator.mediaDevices) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.onerror = (e) => {
                console.error('Error: ', e);
            }
            mediaRecorder.ondataavailable = (e) => {
                debugger
                audioBlobRef.current = e.data;
            };
            mediaRecorder.onstop = (e) => {
                const blob = audioBlobRef.current;
                if (!blob) return;
                console.info(blob.type)
                const url = URL.createObjectURL(blob);
                setAudioURL(url);
                console.log(url)
            };
            recorderRef.current = mediaRecorder;
        } catch (e) {
            console.error(e)
        }

    }

    function recorderRm() {
        const r = recorderRef.current;
        if (r) {
            r.onstop = null;
            r.ondataavailable = null;
            r.onerror = null;
            recorderRef.current = null;
            streamRef.current = null;
        }
    }


    const startRecording = async () => {
        await recorderInit();
        const recorder = recorderRef.current;
        if (!recorder) return;
        debugger
        if (recorder.state === 'inactive') {
            audioBlobRef.current = null;
            recorder.start()
        } else if (recorder.state === 'paused') {
            recorder.resume()
        } else if (recorder.state === 'recording') {
            recorder.pause()
        } else {
            alert('unknown state: ' + recorder.state)
        }
        setRecorderState(recorder.state)
    };
    const stopRecording = async () => {
        const recorder = recorderRef.current;
        if (!recorder) return;
        debugger
        if (recorder.state === 'recording') {
            await sleep(100)
            recorder.stop();
            await sleep(500)
            setRecorderState(recorder.state)
            console.log(audioURL)
            recorderRm();
        }
    };
    return (
        <div className="flex-row gap-x-4">
            <CaButton
                className="text-gray-200 bg-green-800"
                onClick={startRecording}>
                {recorderState === 'inactive' ?
                    <IconPlayerRecord className="fill-red-900"/> : recorderState === 'recording' ?
                        <IconPlayerPause className="fill-blue-900"/> : <IconPlayerPlay className="fill-green-900"/>}
            </CaButton>
            {
                recorderState === 'recording' && <CaButton
                    className="text-gray-200 bg-red-800"
                    onClick={stopRecording}><IconPlayerStop/></CaButton>
            }
            {audioURL && <audio src={audioURL} controls/>}
        </div>
    );
};
export default AudioRecorder;


