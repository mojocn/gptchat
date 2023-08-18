import { useRef, useState } from "react";
import { CaButton } from "@/components/ui-lib";
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerRecord,
  IconPlayerStop,
} from "@tabler/icons-react";
import { sleep } from "@/pkg/util";

const constraints = { audio: true, video: false };

const AudioRecorder = () => {
  const [audioURL, setAudioURL] = useState<string>("");
  const [recorderState, setRecorderState] =
    useState<RecordingState>("inactive");
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
        console.error("Error: ", e);
      };
      mediaRecorder.ondataavailable = (e) => {
        debugger;
        audioBlobRef.current = e.data;
      };
      mediaRecorder.onstop = (e) => {
        const blob = audioBlobRef.current;
        if (!blob) return;
        console.info(blob.type);
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        console.log(url);
      };
      recorderRef.current = mediaRecorder;
    } catch (e) {
      console.error(e);
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
    debugger;
    if (recorder.state === "inactive") {
      audioBlobRef.current = null;
      recorder.start();
    } else if (recorder.state === "paused") {
      recorder.resume();
    } else if (recorder.state === "recording") {
      recorder.pause();
    } else {
      alert("unknown state: " + recorder.state);
    }
    setRecorderState(recorder.state);
  };
  const stopRecording = async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    debugger;
    if (recorder.state === "recording") {
      await sleep(100);
      recorder.stop();
      await sleep(500);
      setRecorderState(recorder.state);
      console.log(audioURL);
      recorderRm();
    }
  };
  return (
    <div className="flex-row gap-x-4">
      <CaButton
        loading={recorderState === "inactive"}
        className="bg-green-800 text-gray-200"
        onClick={startRecording}
      >
        {recorderState === "inactive" ? (
          <IconPlayerRecord className="fill-red-900" />
        ) : recorderState === "recording" ? (
          <IconPlayerPause className="fill-blue-900" />
        ) : (
          <IconPlayerPlay className="fill-green-900" />
        )}
      </CaButton>
      {recorderState === "recording" && (
        <CaButton
          loading={recorderState === "recording"}
          className="bg-red-800 text-gray-200"
          onClick={stopRecording}
        >
          <IconPlayerStop />
        </CaButton>
      )}
      {audioURL && <audio src={audioURL} controls />}
    </div>
  );
};
export default AudioRecorder;
