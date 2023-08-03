import {PrivPronJSONPronunciationAssessment} from "@/pkg/tts-model";

export function PronounceScore(props: { score: PrivPronJSONPronunciationAssessment, className?: string }) {
    return (
        <div className={"gap-8 sm:grid sm:grid-cols-2 " + props.className}>
            <PronounceScoreItem score={props.score.CompletenessScore} name="CompletenessScore"/>
            <PronounceScoreItem score={props.score.FluencyScore} name="FluencyScore"/>
            <PronounceScoreItem score={props.score.PronScore} name="PronScore"/>
            <PronounceScoreItem score={props.score.AccuracyScore} name="AccuracyScore"/>
        </div>

    )
}

function PronounceScoreItem(props: { score: number, name: string }) {
    return (
        <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{props.name}</dt>
            <dd className="flex items-center mb-3">
                <div className="w-full bg-gray-200 rounded h-2.5 dark:bg-gray-700 mr-2">
                    <div className="bg-blue-600 h-2.5 rounded dark:bg-blue-500"
                         style={{'width': `${props.score}%`}}></div>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{props.score}</span>
            </dd>
        </dl>
    )
}