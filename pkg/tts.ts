import {
  SpeechConfig,
  AudioConfig,
  SpeechSynthesizer,
  ResultReason,
  PronunciationAssessmentConfig,
  SpeechRecognizer,
  SpeechRecognitionResult,
  PronunciationAssessmentResult,
  PropertyId,
} from "microsoft-cognitiveservices-speech-sdk";

interface Token {
  jwt: string;
  region: string;
}

function parseJwt(token: string) {
  let parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }
  let base64Url = token.split(".")[1];
  if (!base64Url) return null;
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  let jsonPayload = decodeURIComponent(
    window
      .atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join(""),
  );
  return JSON.parse(jsonPayload);
}

export async function fetchSpeechToken(): Promise<Token> {
  const TTS_TOKEN_REGION_KEY = "TTS_TOKEN_REGION_KEY";
  let cachedToken: Token = JSON.parse(
    localStorage.getItem(TTS_TOKEN_REGION_KEY) || `{"jwt":"","region":""}`,
  );
  try {
    let obj = parseJwt(cachedToken.jwt);
    if (obj && obj.exp && obj.exp * 1000 > Date.now()) {
      return Promise.resolve(cachedToken);
    }
  } catch (e) {
    console.error(e);
  }
  cachedToken = await fetch("/api/speech-token").then((res) => res.json());
  localStorage.setItem(TTS_TOKEN_REGION_KEY, JSON.stringify(cachedToken));
  return cachedToken;
}

// character voice https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#prebuilt-neural-voices
type VoiceName =
  | "en-US-JennyNeural"
  | "en-US-JaneNeural"
  | "en-US-AriaNeural"
  | "en-US-DavisNeural"
  | "en-US-JasonNeural";
type VoiceStyle = "cheerful" | "excited" | "friendly" | "hopeful";

//https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech?tabs=linux%2Cterminal&pivots=programming-language-javascript
export function text2speech(jwt: string, region: string, text: string) {
  // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
  const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
  const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
  // The language of the voice that speaks.
  speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; //"en-US-JennyNeural";

  if (text.match(/[\u3400-\u9FBF]/)) {
    speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; //"en-US-JennyNeural";
  } else {
    speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
  }

  // Create the speech synthesizer.
  let synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  // Start the synthesizer and wait for a result.
  synthesizer.speakTextAsync(
    text,
    (result) => {
      if (result.reason === ResultReason.SynthesizingAudioCompleted) {
        console.log("synthesis finished.");
      } else {
        console.error(
          "Speech synthesis canceled, " +
            result.errorDetails +
            "\nDid you set the speech resource key and region values?",
        );
      }
      synthesizer.close();
      //synthesizer = undefined ;
    },
    console.error,
  );
}

export function speech2text(jwt: string, region: string, text: string) {
  // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
  const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
  const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
  // The language of the voice that speaks.
  speechConfig.speechRecognitionLanguage = "zh-CN"; //"en-US";
  // Create the speech rec.
  let rec = new SpeechRecognizer(speechConfig, audioConfig);

  // Start the rec and wait for a result.
  rec.recognizeOnceAsync((result) => {
    console.log(`RECOGNIZED: Text=${result.text}`);
    rec.close();
  });
}

export function text2speechMML(
  jwt: string,
  region: string,
  text: string,
  voiceName: VoiceName,
  voiceStyle: VoiceStyle,
) {
  const mmt = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
    <voice name="${voiceName}">
        <mstts:express-as style="${voiceStyle}" styledegree="2">
            ${text}
        </mstts:express-as>
    </voice>
</speak>`;
  // This example requires environment variables named "SPEECH_KEY" and "SPEECH_REGION"
  const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
  const audioConfig = AudioConfig.fromDefaultSpeakerOutput();
  // The language of the voice that speaks.
  speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural";
  // Create the speech synthesizer.
  let synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  // Start the synthesizer and wait for a result.
  synthesizer.speakSsmlAsync(
    mmt,
    (result) => {
      if (result.reason === ResultReason.SynthesizingAudioCompleted) {
        console.log("synthesis finished.");
      } else {
        console.error(
          "Speech synthesis canceled, " +
            result.errorDetails +
            "\nDid you set the speech resource key and region values?",
        );
      }
      synthesizer.close();
      //synthesizer = undefined ;
    },
    console.error,
  );
}

function pronunciationAssessment(jwt: string, region: string, text: string) {
  const cfgJSON0 = `{"referenceText":${text},"gradingSystem":"HundredMark","granularity":"Phoneme","phonemeAlphabet":"IPA"}`;
  const cfgJSON = `{"referenceText":${text},"gradingSystem":"HundredMark","granularity":"Syllable","phonemeAlphabet":"IPA"}`;
  const pronunciationAssessmentConfig =
    PronunciationAssessmentConfig.fromJSON(cfgJSON);
  const speechConfig = SpeechConfig.fromAuthorizationToken(jwt, region);
  speechConfig.speechRecognitionLanguage = "en-US";

  const audioConfig = AudioConfig.fromDefaultMicrophoneInput();

  // setting the recognition language to English.

  // create the speech recognizer.
  const reco = new SpeechRecognizer(speechConfig, audioConfig);
  pronunciationAssessmentConfig.applyTo(reco);

  reco.recognizeOnceAsync(
    (speechRecognitionResult: SpeechRecognitionResult) => {
      // The pronunciation assessment result as a Speech SDK object
      const pronunciationAssessmentResult =
        PronunciationAssessmentResult.fromResult(speechRecognitionResult);

      // The pronunciation assessment result as a JSON string
      const pronunciationAssessmentResultJson =
        speechRecognitionResult.properties.getProperty(
          PropertyId.SpeechServiceResponse_JsonResult,
        );
    },
    console.error,
  );
}
