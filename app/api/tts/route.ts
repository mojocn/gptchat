import {NextResponse, NextRequest} from "next/server";
import {checkAdmin, checkAuth, jsonData} from "@/app/api/check-auth";
import {sqlPagination} from "@/model/pagination";
import {TtsResult} from "@/pkg/tts-model";
import {doTtsRecognitionInsert} from "@/model/tts_recognition";
export async function POST(req: NextRequest): Promise<Response> {
    try {
        const ttsItems = await req.json() as TtsResult[];
        const user_id = await checkAuth();
        if (user_id<1) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }
        for (const tts of ttsItems) {
            for (const word of tts.Words) {
                const wt = await  doTtsRecognitionInsert({
                    content: word.Word,
                    category: 'word',
                    user_id: user_id,
                    score: word.PronunciationAssessment?.AccuracyScore
                })
                console.log(wt)
                for (const syllable of word.Syllables) {
                    if (!syllable.Syllable|| !syllable.PronunciationAssessment) continue;
                    const st = await  doTtsRecognitionInsert({
                        content: syllable.Syllable,
                        category: 'syllable',
                        user_id: user_id,
                        score: syllable.PronunciationAssessment?.AccuracyScore
                    })
                    console.log(st)
                }
                for (const phoneme of word.Phonemes) {
                    if (!phoneme.Phoneme || !phoneme.PronunciationAssessment) continue;
                    const st = await  doTtsRecognitionInsert({
                        content: phoneme.Phoneme,
                        category: 'phoneme',
                        user_id: user_id,
                        score: phoneme.PronunciationAssessment?.AccuracyScore
                    })
                    console.log(st)
                }
            }
        }
        return jsonData(undefined, 200)
    } catch (err) {
        const e = err as Error;
        return jsonData(undefined, 500, e.message)
    }
}
