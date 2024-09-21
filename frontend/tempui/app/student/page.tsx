"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Mic,
  BookOpen,
  GraduationCap,
  Building,
  IndianRupee,
  Users,
  Briefcase,
  Mic2,
} from "lucide-react";
import { Socket, io } from "socket.io-client";

declare global {
  interface Window {
    protobuf: any;
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

type Message = {
  role: "user" | "bot";
  content: string;
};

const SAMPLE_RATE = 16000;
const NUM_CHANNELS = 1;
const PLAY_TIME_RESET_THRESHOLD_MS = 1.0;

export default function VoiceActivatedChatbot() {
  const [ws, setWs] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hello! How can I assist you with information about technical education in Rajasthan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isWebSocketReady, setIsWebSocketReady] = useState(false);
  const [Frame, setFrame] = useState<any>(null);
  const [isProtobufLoaded, setIsProtobufLoaded] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playTimeRef = useRef(0);
  const lastMessageTimeRef = useRef(0);

  const connectWebSocket = () => {
    const socket = io(
      "https://super-engine-694vvjp9qjw73rq6-5000.app.github.dev/",
      {
        transports: ["websocket"],
        upgrade: false,
      }
    );

    socket.on("connect", () => {
      console.log("Connected to server");
      setWs(socket);
      setIsConnecting(false);
    });

    socket.on("response", (data) => {
      console.log("Received response:", data);
      setMessages((oldArray) => [
        ...oldArray,
        { role: "bot", content: data.res.msg },
      ]);
    });

    socket.on("voice_response", (data) => {
      console.log("Received voice response:", data);
      setMessages((oldArray) => [
        ...oldArray,
        {
          role: "bot",
          content: data.res.msg[0],
        },
        {
          role: "user",
          content: data.res.msg[1],
        },
      ]);
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnecting(false);
      setTimeout(connectWebSocket, 5000);
    });

    return socket;
  };

  useEffect(() => {
    const socket = connectWebSocket();

    return () => {
      socket.off("connect");
      socket.off("response");
      socket.off("voice_response");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = "en-US";

        recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript(transcript);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  useEffect(() => {
    const loadProtobuf = () => {
      if (window.protobuf) {
        window.protobuf.load("/frames.proto", (err: any, root: any) => {
          if (err) {
            console.error("Error loading protobuf:", err);
            throw err;
          }
          setFrame(root.lookupType("pipecat.Frame"));
          setIsProtobufLoaded(true);
        });
      }
    };

    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/protobufjs@7.X.X/dist/protobuf.min.js";
      script.onload = loadProtobuf;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const handleSendMessage = () => {
    if (input.trim()) {
      if (ws && ws.connected) {
        sendMsg(input);
      } else {
        connectWebSocket();
      }
    }
  };

  const sendMsg = (ms: string) => {
    if (ws && ws.connected) {
      ws.emit("send_message", { msg: ms, id: "1" });
      setMessages((oldArray) => [...oldArray, { role: "user", content: ms }]);
      setInput("");
    } else {
      console.error("WebSocket is not connected");
      setMessages((oldArray) => [
        ...oldArray,
        {
          role: "bot",
          content:
            "Sorry, I'm having trouble connecting. Please try again in a moment.",
        },
      ]);
    }
  };

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening]);

  const startListening = useCallback(() => {
    setIsListening(true);
    setTranscript("");
    if (recognition) {
      recognition.start();
    }
    startAudio();
  }, [recognition]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognition) {
      recognition.stop();
    }
    if (transcript) {
      sendMsg(transcript);
    }
    stopAudio();
  }, [recognition, transcript]);

  const initWebSocket = () => {
    console.log("Initializing WebSocket...");
    wsRef.current = new WebSocket(
      "https://super-engine-694vvjp9qjw73rq6-8765.app.github.dev/"
    );
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

  const handleWebSocketMessage = async (event: MessageEvent) => {
    console.log("WebSocket message received");
    if (!isProtobufLoaded) {
      console.log("Protobuf not loaded yet, skipping message");
      return;
    }
    const arrayBuffer = await event.data.arrayBuffer();
    enqueueAudioFromProto(arrayBuffer);
  };

  const enqueueAudioFromProto = (arrayBuffer: ArrayBuffer) => {
    console.log("Enqueuing audio from proto...");
    if (!Frame || !isProtobufLoaded) {
      console.error("Frame is not set or protobuf is not loaded");
      return;
    }

    const parsedFrame = Frame.decode(new Uint8Array(arrayBuffer));
    if (!parsedFrame?.audio) return false;

    const diffTime =
      audioContextRef.current?.currentTime! - lastMessageTimeRef.current;
    if (playTimeRef.current === 0 || diffTime > PLAY_TIME_RESET_THRESHOLD_MS) {
      playTimeRef.current = audioContextRef.current?.currentTime!;
    }
    lastMessageTimeRef.current = audioContextRef.current?.currentTime!;

    const audioVector = Array.from(parsedFrame.audio.audio);
    const audioArray = new Uint8Array(new ArrayBuffer(audioVector.length));
    audioVector.forEach((value, index) => {
      audioArray[index] = value as number;
    });

    if (audioContextRef.current) {
      audioContextRef.current.decodeAudioData(
        audioArray.buffer,
        (buffer) => {
          const source = new AudioBufferSourceNode(audioContextRef.current!);
          source.buffer = buffer;
          source.start(playTimeRef.current);
          source.connect(audioContextRef.current!.destination);
          playTimeRef.current = playTimeRef.current + buffer.duration;
          console.log("Audio enqueued successfully");
        },
        (error) => {
          console.error("Error decoding audio data:", error);
        }
      );
    } else {
      console.error("audioContextRef.current is null");
    }
  };

  const convertFloat32ToS16PCM = (float32Array: Float32Array) => {
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
      (window as any).webkitAudioContext ||
      window.AudioContext)({
      latencyHint: "interactive",
      sampleRate: SAMPLE_RATE,
    });

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

      scriptProcessorRef.current.onaudioprocess = (event) => {
        if (!wsRef.current || !isWebSocketReady) return;

        const audioData = event.inputBuffer.getChannelData(0);

        let sum = 0.0;
        for (let i = 0; i < audioData.length; i++) {
          sum += Math.abs(audioData[i]);
        }
        const avgLevel = sum / audioData.length;

        const scaledLevel = Math.min(100, avgLevel * 20000);
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
        wsRef.current.send(encodedFrame);
      };

      console.log("Audio processing set up successfully");
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopAudio = (closeWebsocket = true) => {
    console.log("Stopping audio...");
    playTimeRef.current = 0;
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
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white p-6 shadow-md text-black">
        <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
        <nav className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <BookOpen className="mr-2 h-4 w-4" />
            Admission Process
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <GraduationCap className="mr-2 h-4 w-4" />
            Courses
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Building className="mr-2 h-4 w-4" />
            Colleges
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <IndianRupee className="mr-2 h-4 w-4" />
            Fee Structure
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Scholarships
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Briefcase className="mr-2 h-4 w-4" />
            Placements
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Card className="w-full h-full flex flex-col">
          <CardHeader>
            <CardTitle>AI Student Assistant</CardTitle>
            <CardDescription>
              Department of Technical Education, Government of Rajasthan
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="info">College Info</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    <div
                      className={`flex items-start ${
                        message.role === "user" ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.role === "user" ? "U" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`mx-2 p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <CardFooter className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    id="message"
                    placeholder={
                      isListening ? "Listening..." : "Type your message..."
                    }
                    value={isListening ? transcript : input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                    disabled={isListening}
                  />
                  <Button type="submit" size="icon" disabled={isListening}>
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={toggleListening}
                  >
                    {isListening ? (
                      <Mic2 className="h-4 w-4 animate-pulse text-black " />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {isListening ? "Stop listening" : "Start listening"}
                    </span>
                  </Button>
                </form>
              </CardFooter>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${audioLevel}%` }}
                ></div>
              </div>
            </TabsContent>
            <TabsContent value="info" className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-4 p-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Engineering Colleges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>List of top engineering colleges in Rajasthan...</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Polytechnic Institutes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>List of polytechnic institutes in Rajasthan...</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Admission Process</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Step-by-step guide to the admission process...</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Scholarships</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Available scholarships and eligibility criteria...</p>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
}
