// https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder#example
import {useState, useRef, useEffect} from "react";
import {CaButton} from "@/components/ui-lib";
import {IconPlayerPause, IconPlayerPlay, IconPlayerRecord, IconPlayerStop} from "@tabler/icons-react";


const AudioRecorder = () => {
    const [audio, setAudio] = useState<string>("");
    const [chunks, setChucks] = useState<Blob[]>([])
    const [recorder, setRecorder] = useState<MediaRecorder | undefined>(undefined);
    const [recorderState, setRecorderState] = useState<RecordingState>(recorder?.state || "inactive")
    let audioCtx = new AudioContext();
    const constraints = {audio: true};
    const canvasRef = useRef<HTMLCanvasElement>(null)

    function visualize(stream: MediaStream) {
        audioCtx = new AudioContext();

        const source = audioCtx.createMediaStreamSource(stream);

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);
        //analyser.connect(audioCtx.destination);

        draw()

        function draw() {
            const canvas = canvasRef.current
            if (!canvas) return;
            const canvasCtx = canvas.getContext("2d");
            if (!canvasCtx) return;
            const WIDTH = canvas.width
            const HEIGHT = canvas.height;

            requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            let sliceWidth = WIDTH * 1.0 / bufferLength;
            let x = 0;


            for (let i = 0; i < bufferLength; i++) {

                let v = dataArray[i] / 128.0;
                let y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();

        }
    }

    function initAudioRecorder() {
        setRecorder(undefined)
        setChucks([]);
        if (!navigator.mediaDevices) return;
        navigator.mediaDevices.getUserMedia(constraints).then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            visualize(stream);
            mediaRecorder.onstop = (e) => {
                const blob = new Blob(chunks, {type: "audio/ogg; codecs=opus"});
                const audioURL = URL.createObjectURL(blob);
                setAudio(audioURL);
                setChucks([])
            };
            mediaRecorder.onerror = (e) => {
                console.log('Error: ', e);
            }
            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };
            setRecorder(mediaRecorder)
        }).catch(e => {
            // @ts-ignore
            alert("The following error occurred: " + e.message)
        }).finally(() => {
            // @ts-ignore
            console.log("finally")
        });


    }

    useEffect(() => {
        initAudioRecorder()
    }, []);


    const startRecording = async () => {
        if (!recorder) return;
        debugger
        if (recorder.state === 'inactive') {
            setChucks([])
            recorder.start()
        } else if (recorder.state === 'paused') {
            recorder.resume()
        } else if (recorder.state === 'recording') {
            recorder.pause()
        } else {
            alert('unknown state: ' + recorder.state)
        }
        setRecorderState(recorder.state)
    };
    const stopRecording = () => {
        if (!recorder) return;
        if (recorder.state === 'recording') {
            setTimeout(() => {
                recorder.stop();
                setRecorderState(recorder.state)
            }, 200)
        }
    };
    return (
        <div>
            <h2>Audio Recorder</h2>
            <canvas ref={canvasRef}></canvas>
            <div className="flex-row gap-x-4">

                <CaButton
                    className="text-gray-200 bg-green-800"
                    onClick={startRecording}>
                    {recorderState === 'inactive' ? <IconPlayerRecord className="fill-red-900"/> : recorderState === 'recording' ? <IconPlayerPause className="fill-blue-900"/> : <IconPlayerPlay className="fill-green-900"/>}
                </CaButton>

                {
                    recorderState === 'recording' && <CaButton
                        className="text-gray-200 bg-red-800"
                        onClick={stopRecording}><IconPlayerStop/></CaButton>
                }


            </div>

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

