//https://cloud.tencent.com/developer/article/1768938
import {useState, useRef, useEffect} from "react";

const AudioRecorder = () => {
    const [audio, setAudio] = useState<string>("");
    let chunks: Blob[] = [];
    let media: MediaRecorder | undefined;

    async function initRecorder() {
        media = undefined;
        chunks = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({audio: true, video: false});
            media = new MediaRecorder(stream);
            media.ondataavailable = (event) => {
                if (typeof event.data === "undefined") return;
                if (event.data.size === 0) return;
                debugger
                chunks.push(event.data);
            };
            media.onstop = () => {
                const audioBlob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                //creates a playable URL from the blob file.
                const audioUrl = URL.createObjectURL(audioBlob);
                debugger
                setAudio(audioUrl);
                chunks = [];
            }
        } catch (err) {
            // @ts-ignore
            alert(err.message);
        }
    }

    const startRecording = async () => {
        await initRecorder()
        media && media.start()
    };
    const stopRecording = () => {
        setTimeout(() => {
            media && media.stop();
        }, 200)
    };
    return (
        <div>
            <h2>Audio Recorder</h2>
            <main>
                <div className="audio-controls">

                    <button onClick={startRecording} type="button">
                        Start Recording
                    </button>

                    <button onClick={stopRecording} type="button">
                        Stop Recording
                    </button>
                </div>
            </main>

            {audio ? (
                <div className="audio-container">
                    <audio src={audio} controls></audio>
                    <a download href={audio}>
                        Download Recording
                    </a>
                </div>
            ) : null}
        </div>
    );
};
export default AudioRecorder;
