//@ts-nocheck
"use client";
import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import styles from "./PipecatWebSocketClient.module.css";

const SAMPLE_RATE = 16000;
const NUM_CHANNELS = 1;
const PLAY_TIME_RESET_THRESHOLD_MS = 1.0;

interface PipecatWebSocketClientProps {
  setCall: any;
  isDarkMode: boolean;
}

// Rename the const declaration to avoid conflict
const PipecatWebSocketClientComponent: React.FC<
  PipecatWebSocketClientProps
> = ({ setCall, isDarkMode }) => {
  // Component implementation
};

export default function PipecatWebSocketClient({ setCall }: { setCall: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [Frame, setFrame] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const analyserRef = useRef(null);
  const playTimeRef = useRef(0);
  const lastMessageTimeRef = useRef(0);

  useEffect(() => {
    const loadProtobuf = () => {
      if (typeof window !== "undefined" && window.protobuf) {
        window.protobuf.load("/frames.proto", (err: any, root: any) => {
          if (err) {
            console.error("Error loading protobuf:", err);
            throw err;
          }
          setFrame(root.lookupType("pipecat.Frame"));
          setIsLoading(false);
        });
      }
    };

    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/protobufjs@7.X.X/dist/protobuf.min.js";
      script.onload = loadProtobuf;
      document.body.appendChild(script);
    }
  }, []);

  const initWebSocket = () => {
    console.log("Initializing WebSocket...");
    wsRef.current = new WebSocket("http://127.0.0.1:5000/");
    wsRef.current.addEventListener("open", () => {
      console.log("WebSocket connection established.");
      setIsWebSocketReady(true);
    });
    wsRef.current.addEventListener("message", handleWebSocketMessage);
    wsRef.current.addEventListener("close", (event) => {
      console.log("WebSocket connection closed.", event.code, event.reason);
      setIsWebSocketReady(false);
      stopAudio(false);
    });
    wsRef.current.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      setIsWebSocketReady(false);
    });
  };

  const handleWebSocketMessage = async (event) => {
    console.log("WebSocket message received");
    const arrayBuffer = await event.data.arrayBuffer();
    enqueueAudioFromProto(arrayBuffer);
  };

  const enqueueAudioFromProto = (arrayBuffer) => {
    console.log("Enqueuing audio from proto...");
    const parsedFrame = Frame.decode(new Uint8Array(arrayBuffer));
    if (!parsedFrame?.audio) return false;

    const diffTime =
      audioContextRef.current.currentTime - lastMessageTimeRef.current;
    if (playTimeRef.current == 0 || diffTime > PLAY_TIME_RESET_THRESHOLD_MS) {
      playTimeRef.current = audioContextRef.current.currentTime;
    }
    lastMessageTimeRef.current = audioContextRef.current.currentTime;

    const audioVector = Array.from(parsedFrame.audio.audio);
    const audioArray = new Uint8Array(audioVector);

    audioContextRef.current.decodeAudioData(
      audioArray.buffer,
      function (buffer) {
        const source = new AudioBufferSourceNode(audioContextRef.current);
        source.buffer = buffer;
        source.start(playTimeRef.current);
        source.connect(audioContextRef.current.destination);
        playTimeRef.current = playTimeRef.current + buffer.duration;
        console.log("Audio enqueued successfully");
      }
    );
  };

  const convertFloat32ToS16PCM = (float32Array) => {
    let int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let clampedValue = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] =
        clampedValue < 0 ? clampedValue * 32768 : clampedValue * 32767;
    }
    return int16Array;
  };

  const startAudio = async () => {
    console.log("Starting audio...");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("getUserMedia is not supported in your browser.");
      return;
    }

    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)({
      latencyHint: "interactive",
      sampleRate: SAMPLE_RATE,
    });

    setIsPlaying(true);
    initWebSocket();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: NUM_CHANNELS,
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      console.log("Microphone stream obtained:", stream);
      microphoneStreamRef.current = stream;
      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      sourceRef.current.connect(analyserRef.current);

      scriptProcessorRef.current =
        audioContextRef.current.createScriptProcessor(512, 1, 1);
      sourceRef.current.connect(scriptProcessorRef.current);
      scriptProcessorRef.current.connect(audioContextRef.current.destination);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      scriptProcessorRef.current.onaudioprocess = (event) => {
        console.log("Audio processing event triggered");
        if (!wsRef.current || !isWebSocketReady) return;

        // Get the raw audio data from the microphone
        const audioData = event.inputBuffer.getChannelData(0);
        console.log("Raw audio data:", audioData);

        // Calculate the average of the absolute values to represent audio level
        let sum = 0.0;
        for (let i = 0; i < audioData.length; i++) {
          sum += Math.abs(audioData[i]);
        }
        const avgLevel = sum / audioData.length;

        // Scale the audio level to a percentage (0-100)
        const scaledLevel = Math.min(100, avgLevel * 20000);
        console.log("Calculated audio level:", scaledLevel);
        setAudioLevel(scaledLevel);

        const pcmS16Array = convertFloat32ToS16PCM(audioData);
        const pcmByteArray = new Uint8Array(pcmS16Array.buffer);
        const frame = Frame.create({
          audio: {
            audio: Array.from(pcmByteArray),
            sampleRate: SAMPLE_RATE,
            numChannels: NUM_CHANNELS,
          },
        });
        const encodedFrame = new Uint8Array(Frame.encode(frame).finish());
        console.log("Encoded frame:", encodedFrame);
        wsRef.current.send(encodedFrame);
        console.log("Audio frame sent, size:", encodedFrame.length, "bytes");
      };

      console.log("Audio processing set up successfully");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudio = (closeWebsocket) => {
    console.log("Stopping audio...");
    playTimeRef.current = 0;
    setIsPlaying(false);
    setIsWebSocketReady(false);
    setAudioLevel(0);

    if (wsRef.current && closeWebsocket) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    console.log("Audio stopped and resources cleaned up");
  };

  return (
    <div
      style={{
        minWidth: "70vw",
        maxWidth: "70vw",
        minHeight: "93vh",
        maxHeight: "93vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginTop: "25px",
        marginLeft: "20px",
      }}
      className="bg-gray-800 rounded-lg p-6"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
        className="flex items-center border-b border-gray-700 pb-4 mb-4"
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div className="mr-3">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_7KdTr0xYwdNwnnSKZoZqp3BWqs2wbpQB5Q&s"
              alt="Avatar"
              className="w-14 h-14 rounded-full"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold">EduMitra</h2>
          </div>
        </div>
        <img
          onClick={() => setCall(false)}
          alt="callbt"
          src="https://cdn-icons-png.freepik.com/512/4414/4414831.png"
          style={{ cursor: "pointer", width: "50px", height: "50px" }}
        />
      </div>

      <Script
        src="https://cdn.jsdelivr.net/npm/protobufjs@7.X.X/dist/protobuf.min.js"
        strategy="beforeInteractive"
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          className={styles.subtitle}
          alt="bot"
          src="https://cdn3d.iconscout.com/3d/premium/thumb/cute-robot-on-call-6374844-5272690.png"
        />
      </div>
      <div className={styles.buttonContainer}>
        <img
          style={{
            cursor: "pointer",
            width: "70px",
            height: "70px",
            borderRadius: "50px",
            display: `${isLoading ? "none" : "block"}`,
          }}
          onClick={startAudio}
          disabled={isLoading || isPlaying}
          alt="call button"
          src={
            isPlaying
              ? "https://freepngimg.com/download/icon/communication/3158-end-call.png"
              : "https://cdn-icons-png.freepik.com/256/4436/4436746.png?semt=ais_hybrid"
          }
        />
      </div>
    </div>
  );
}
