import {NextResponse} from 'next/server';
import {PronunciationAssessmentConfig, SpeechConfig, SpeechRecognizer, SpeechRecognitionResult, AutoDetectSourceLanguageConfig, PronunciationAssessmentResult, PropertyId, AudioStreamFormat, AudioConfig} from 'microsoft-cognitiveservices-speech-sdk';

//https://github.com/Azure-Samples/cognitive-services-speech-sdk/blob/master/samples/js/node/pronunciationAssessmentContinue.js#LL37C4-L37C52
//https://github.com/Azure-Samples/cognitive-services-speech-sdk/blob/master/samples/js/browser/public/index.html
export async function POST() {
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



export async function GET() {
    const speechKey = process.env.SPEECH_KEY || "";
    const region = process.env.SPEECH_REGION || "";
    const jwt = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
    }).then(res =>{
        if (res.ok){
            return res.text()
        }
        return ""
    }).catch(console.error)
    return NextResponse.json({jwt,region});
}
