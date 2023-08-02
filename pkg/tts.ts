import {
    SpeechConfig,
    AudioConfig,
    SpeechSynthesizer,
    ResultReason,
    PronunciationAssessmentConfig, SpeechRecognizer, SpeechRecognitionResult, PronunciationAssessmentResult, PropertyId
} from "microsoft-cognitiveservices-speech-sdk";

interface Token {
    jwt: string
    region: string
}

export async function fetchSpeechToken(): Promise<Token> {
    const res = await fetch("/api/speech-token").then(res => res.json())
    return res
}

// character voice https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#prebuilt-neural-voices
type VoiceName =
    "en-US-JennyNeural"
    | 'en-US-JaneNeural'
    | 'en-US-AriaNeural'
    | 'en-US-DavisNeural'
    | 'en-US-JasonNeural'
type VoiceStyle = 'cheerful' | 'excited' | 'friendly' | 'hopeful'

//https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech?tabs=linux%2Cterminal&pivots=programming-language-javascript
export function text2speech(jwt: string, region: string, text: string) {
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
    const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
    // Create the speech synthesizer.
    let synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    // Start the synthesizer and wait for a result.
    synthesizer.speakTextAsync(text, result => {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            console.log("synthesis finished.");
        } else {
            console.error("Speech synthesis canceled, " + result.errorDetails +
                "\nDid you set the speech resource key and region values?");
        }
        synthesizer.close();
        //synthesizer = undefined ;
    }, console.error);

}

export function text2speechMML(jwt: string, region: string, text: string, voiceName: VoiceName, voiceStyle: VoiceStyle) {

    const mmt = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="${voiceName}">
        <mstts:express-as style="${voiceStyle}" styledegree="2">
            ${text}
        </mstts:express-as>
    </voice>
</speak>`
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
    const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
    // The language of the voice that speaks.
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
    // Create the speech synthesizer.
    let synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

    // Start the synthesizer and wait for a result.
    synthesizer.speakSsmlAsync(mmt, result => {
        if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            console.log("synthesis finished.");
        } else {
            console.error("Speech synthesis canceled, " + result.errorDetails +
                "\nDid you set the speech resource key and region values?");
        }
        synthesizer.close();
        //synthesizer = undefined ;
    }, console.error);

}


function pronunciationAssessment(jwt: string, region: string, text: string) {
    const cfgJSON0 = `{"referenceText":${text},"gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`
    const cfgJSON = `{"referenceText":${text},"gradingSystem":"HundredMark","granularity":"Syllable","phonemeAlphabet":"IPA"}`
    const pronunciationAssessmentConfig = PronunciationAssessmentConfig.fromJSON(cfgJSON);
    const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
    speechConfig.speechRecognitionLanguage = "en-US";

    const audioConfig = AudioConfig.fromDefaultMicrophoneInput()


    // setting the recognition language to English.

    // create the speech recognizer.
    const reco = new SpeechRecognizer(speechConfig, audioConfig);
    pronunciationAssessmentConfig.applyTo(reco);

    reco.recognizeOnceAsync((speechRecognitionResult: SpeechRecognitionResult) => {
            // The pronunciation assessment result as a Speech SDK object
            const pronunciationAssessmentResult = PronunciationAssessmentResult.fromResult(speechRecognitionResult);

            // The pronunciation assessment result as a JSON string
            const pronunciationAssessmentResultJson = speechRecognitionResult.properties.getProperty(PropertyId.SpeechServiceResponse_JsonResult);
            debugger
        },
        console.error);

}
