import {
    SpeechConfig,
    AudioConfig,
    SpeechSynthesizer,
    ResultReason,
    PronunciationAssessmentConfig, SpeechRecognizer, SpeechRecognitionResult, PronunciationAssessmentResult, PropertyId
} from "microsoft-cognitiveservices-speech-sdk";
import {NextResponse} from "next/server";

//https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech?tabs=linux%2Cterminal&pivots=programming-language-javascript
function tts(jwt: string, region: string, audioFile: string, text: string) {
    // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
    const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
    const audioConfig = AudioConfig.fromAudioFileOutput(audioFile);
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

function pronunciationAssessment(jwt: string, region: string, text: string) {
    const cfgJSON = `{"referenceText":${text},"gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`
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
        },
        console.error);

}
