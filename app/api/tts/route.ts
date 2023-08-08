import {NextResponse, NextRequest} from "next/server";
import {checkAuth, jsonData} from "@/app/api/check-auth";
import {TtsResult} from "@/pkg/tts-model";
import {doTtsRecognitionInsert, TtsRecognitionInsert} from "@/model/tts_recognition";

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const ttsItems: TtsResult[] = await req.json()
        const user_id = await checkAuth();
        if (user_id < 1) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401})
        }
        const rows: TtsRecognitionInsert[] = []
        for (const tts of ttsItems) {
            for (const word of tts.Words) {
                const wt = {
                    content: word.Word,
                    category: 'word',
                    user_id: user_id,
                    score: word.PronunciationAssessment?.AccuracyScore
                } as TtsRecognitionInsert
                rows.push(wt)
                for (const syllable of word.Syllables) {
                    if (!syllable.Syllable || !syllable.PronunciationAssessment) continue;
                    const st = {
                        content: syllable.Syllable,
                        category: 'syllable',
                        user_id: user_id,
                        score: syllable.PronunciationAssessment?.AccuracyScore
                    } as TtsRecognitionInsert
                    rows.push(st)
                }
                for (const phoneme of word.Phonemes) {
                    if (!phoneme.Phoneme || !phoneme.PronunciationAssessment) continue;
                    const pt = {
                        content: phoneme.Phoneme,
                        category: 'phoneme',
                        user_id: user_id,
                        score: phoneme.PronunciationAssessment?.AccuracyScore
                    } as TtsRecognitionInsert
                    rows.push(pt)
                }
            }
        }
        console.error('rows', rows)
        const res = await doTtsRecognitionInsert(rows.filter(r => r.score <= 99))
        console.error('res', res)
        return jsonData(res, 200)
    } catch (err) {
        const e = err as Error;
        return jsonData(undefined, 500, e.message)
    }
}
