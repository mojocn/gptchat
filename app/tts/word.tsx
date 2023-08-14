import { Word } from "@/pkg/tts-model";
import React from "react";

export function WordTag(props: Word) {
  function scoreColor(n: number): string {
    n = Math.round(n / 10) * 100;
    if (n < 500) {
      return ` text-red-${900 - n} `;
    } else if (n <= 900) {
      return ` text-green-${n + 500} font-semibold `;
    } else {
      return ` text-green-900 font-bold `;
    }
  }

  return (
    <div>
      <p
        className={`font-semibold ${
          props.PronunciationAssessment.ErrorType === "None"
            ? "text-indigo-800"
            : "text-red-800"
        }`}
        title={`${props.PronunciationAssessment.AccuracyScore}`}
      >
        {props.Word}
      </p>
      {/*<div className="flex justify-center">*/}
      {/*    {props.Syllables?.map((s, i) => {*/}
      {/*        return <span key={i}  className={scoreColor( s.PronunciationAssessment.AccuracyScore)}  title={`${s.PronunciationAssessment.AccuracyScore}`}  >{s.Syllable}</span>*/}
      {/*    })}*/}
      {/*</div>*/}
      <div className="flex justify-around">
        {props.Phonemes?.map((s, i) => {
          return (
            <span
              key={i}
              className={scoreColor(s.PronunciationAssessment.AccuracyScore)}
              title={`${s.PronunciationAssessment.AccuracyScore}`}
            >
              {s.Phoneme}
            </span>
          );
        })}
      </div>
    </div>
  );
}
