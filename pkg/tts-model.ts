import {PronunciationAssessmentResult} from "microsoft-cognitiveservices-speech-sdk";


export function toTtsResult(r: PronunciationAssessmentResult): TtsResult {
    return toWelcome(r).privPronJson

}

function toWelcome(r: PronunciationAssessmentResult): AssessmentResult {
    return JSON.parse(JSON.stringify(r))

}

export interface AssessmentResult {
    privPronJson: TtsResult;
}

export interface TtsResult {
    Confidence:              number;
    Lexical:                 string;
    ITN:                     string;
    MaskedITN:               string;
    Display:                 string;
    PronunciationAssessment: PrivPronJSONPronunciationAssessment;
    Words:                   Word[];
}

export interface PrivPronJSONPronunciationAssessment {
    AccuracyScore:     number;
    FluencyScore:      number;
    CompletenessScore: number;
    PronScore:         number;
}

export interface Word {
    Word:                    string;
    Offset:                  number;
    Duration:                number;
    PronunciationAssessment: WordPronunciationAssessment;
    Syllables:               Phoneme[];
    Phonemes:                Phoneme[];
}

export interface Phoneme {
    Phoneme?:                string;
    PronunciationAssessment: PhonemePronunciationAssessment;
    Offset:                  number;
    Duration:                number;
    Syllable?:               string;
}

export interface PhonemePronunciationAssessment {
    AccuracyScore: number;
}

export interface WordPronunciationAssessment {
    AccuracyScore: number;
    ErrorType:     string;
}
