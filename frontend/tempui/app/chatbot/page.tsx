"use client";
import styles from "./page.module.css";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  Calendar,
  GraduationCap,
  CircleDollarSign,
  Scissors,
  Sparkles,
  Sun,
  Moon,
  MicOff,
  Mic,
  Heart,
} from "lucide-react";
import { Button } from "@nextui-org/button";
import { Socket, io } from "socket.io-client";
import Markdown from "react-markdown";
import Typewriter from "typewriter-effect";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PipecatWebSocketClient from "../voice/PipecatWebSocketClient";
import Dropdown from "react-dropdown";
import "react-dropdown/style.css";
//@ts-ignore
import { JsonToTable } from "react-json-to-table";
import CourseComparison from "./CourseComparison"; // Adjust the import path as necessary

function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      content: "Hello welcome to EduMitra, Say hello 👋 to get started ",
      toolCall: { type: "none", events: [] },
      options: ["hello", "engineering", "polytechnic"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isVoiceBotActive, setIsVoiceBotActive] = useState(false);
  const messagesEndRef = useRef(null);
  const [ws, setWs] = useState<Socket | null>(null);

  const [collegeInfo, setCollegeInfo] = useState({
    name: "",
    course: "",
    fees: "",
    cutoff: "",
    scholarships: "",
    details: "",
  });
  const collegeInfoRef = useRef(collegeInfo);
  const [isConnecting, setIsConnecting] = useState(true);
  const [responseState, setResponseState] = useState([]);

  useEffect(() => {
    collegeInfoRef.current = collegeInfo;
  }, [collegeInfo]);

  const connectWebSocket = () => {
    const socket = io(
      "http://127.0.0.1:5000",
      { transports: ["websocket"] }
    );

    socket.on("connect", () => {
      console.log("Connected to server");
      setWs(socket);
      setIsConnecting(false);
      toast.success("Connected to server");
    });

    socket.on("response", (data) => {
      console.log("Received response:", data);
      let newInfo = data.info;
      let oldInfo = collegeInfoRef.current;
      newInfo.name =
        newInfo.name !== "" &&
        oldInfo.name !== newInfo.name &&
        typeof newInfo.name === "string"
          ? newInfo.name
          : oldInfo.name;
      newInfo.course =
        newInfo.course !== "" &&
        oldInfo.course !== newInfo.course &&
        typeof newInfo.course === "string"
          ? newInfo.course
          : oldInfo.course;
      newInfo.fees =
        newInfo.fees !== "" &&
        oldInfo.fees !== newInfo.fees &&
        typeof newInfo.fees !== undefined
          ? newInfo.fees
          : oldInfo.fees;
      newInfo.scholarships =
        newInfo.scholarships !== "" &&
        oldInfo.scholarships !== newInfo.scholarships &&
        typeof newInfo.scholarships !== undefined
          ? newInfo.scholarships
          : oldInfo.scholarships;
      newInfo.cutoff =
        newInfo.cutoff !== "" &&
        oldInfo.cutoff !== newInfo.cutoff &&
        typeof newInfo.cutoff !== undefined
          ? newInfo.cutoff
          : oldInfo.cutoff;
      newInfo.details =
        newInfo.details !== "" &&
        oldInfo.details !== newInfo.details &&
        typeof newInfo.details === "string"
          ? newInfo.details
          : oldInfo.details;

      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: data.res.msg,
          toolCall: data.res.toolCall,
          options: newInfo?.options,
        },
      ]);
    });

    socket.on("voice_response", (data) => {
      console.log("Received response:", data);
      let newInfo = data.info;
      setCollegeInfo(newInfo);
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: data.res.msg[0],
          toolCall: data.res.toolCall,
          options: [],
        },
      ]);
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "user",
          content: data.res.msg[1],
          toolCall: data.res.toolCall,
          options: [],
        },
      ]);

      // Update maxTickets if available in the response
      if (data.res.toolCall && data.res.toolCall.available_tickets) {
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      setIsConnecting(false);
      toast.error("Failed to connect. Retrying in 5 seconds...");
      setTimeout(connectWebSocket, 5000);
    });

    return socket;
  };

  useEffect(() => {
    const socket = connectWebSocket();

    return () => {
      socket.off("connect");
      socket.off("response");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    //@ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToBottom = () => {
    //@ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);  
  const handleSend = () => {
    if (input.trim()) {
      if (ws && ws.connected) {
        sendMsg(input);
      } else {
        toast.error("Not connected to server. Please wait...");
        connectWebSocket();
      }
    }
  };
  const loadScript = (src: any) => {
    return new Promise((resolve) => {
      const script = document.createElement("script");

      script.src = src;

      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };

      document.body.appendChild(script);
    });
  };
  const sendMsg = (ms: string) => {
    if (ws && ws.connected) {
      ws.emit("send_message", { msg: ms, id: "1" });
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "user",
          content: ms,
          toolCall: { type: "none", events: [] },
          options: [],
        },
      ]);
      setInput("");
    } else {
      console.error("WebSocket is not connected");
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content:
            "Sorry, I'm having trouble connecting. Please try again in a moment.",
          toolCall: { type: "none", events: [] },
          options: [],
        },
      ]);
    }
  };
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  const handleOpenComparison = () => {
    setIsComparisonOpen(true);
  };

  const handleCloseComparison = () => {
    setIsComparisonOpen(false);
  };
  const handleDownloadSummary = async () => {
    try {
      const response = await fetch("http://127.0.0.1:5000/generate_summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate summary");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "chat_summary.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Summary downloaded successfully!");
    } catch (error) {
      console.error("Error downloading summary:", error);
      toast.error("Failed to download summary. Please try again.");
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleVoiceBot = () => {
    setIsVoiceBotActive(!isVoiceBotActive);
  };

  const options = ["one", "two", "three"];

  return (
    <div
      className={`flex h-screen w-full ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } transition-colors duration-500`}
    >
      <div className="flex flex-col w-full max-w-screen-2xl mx-auto p-4 lg:p-6 h-full">
        <div
          className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl`}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-xl mr-3">
              TT
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EduMitra</h2>
              <p className="text-sm text-white opacity-75 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {ws && ws.connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleVoiceBot}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isVoiceBotActive ? "Deactivate voice bot" : "Activate voice bot"
              }
            >
              {isVoiceBotActive ? <Mic size={20} /> : <MicOff size={20} />}
            </Button>
            <Button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </Button>
          </div>
        </div>
        <div
          className={`flex flex-1 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          } rounded-b-xl overflow-hidden transition-colors duration-500`}
        >
          <div className="flex flex-col w-2/3 border-r border-gray-200 dark:bg-gray-900">
            {isVoiceBotActive ? (
              <div className="flex-1 overflow-auto p-4">
                <PipecatWebSocketClient
                  setCall={() => setIsVoiceBotActive(false)}
                  isDarkMode={isDarkMode}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-purple-600 text-white"
                            : isDarkMode
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {message.toolCall &&
                        message.toolCall.type === "college_list" ? (
                          <div>
                            <Markdown>{message.content}</Markdown>
                            <div className="mt-2">
                              <Dropdown
                                //@ts-ignore
                                options={message.toolCall.colleges.map(
                                  (college: any) => college.name
                                )}
                                onChange={(e) => sendMsg(e.value)}
                                value={
                                  //@ts-ignore
                                  message.toolCall.colleges.map(
                                    (college: any) => college.name
                                  )[0]
                                }
                                placeholder="Select a college"
                              />
                            </div>
                          </div>
                        ) : message.toolCall && "cutoff" in message.toolCall ? (
                          <div>
                            <h2>Engineering Admission Ranks</h2>
                            <table border={1} cellPadding={10}>
                              <thead>
                                <tr
                                  className={`${
                                    isDarkMode
                                      ? "text-black bg-transparent"
                                      : "text-black"
                                  }`}
                                >
                                  <th className="bg-transparent">Branch</th>
                                  <th className="bg-transparent">Category</th>
                                  <th className="bg-transparent">
                                    Opening Rank
                                  </th>
                                  <th className="bg-transparent">
                                    Closing Rank
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(collegeInfo?.cutoff).map(
                                  ([branch, categories]) =>
                                    Object.entries(categories).map(
                                      ([category, ranks], index) => (
                                        <tr key={`${branch}-${category}`}>
                                          {index === 0 && (
                                            <td
                                              rowSpan={
                                                Object.keys(categories).length
                                              }
                                            >
                                              {branch}
                                            </td>
                                          )}
                                          <td>{category}</td>
                                          <td>
                                            {
                                              (
                                                ranks as unknown as Record<
                                                  string,
                                                  any
                                                >
                                              )["Opening Rank"]
                                            }
                                          </td>
                                          <td>
                                            {
                                              (
                                                ranks as unknown as Record<
                                                  string,
                                                  any
                                                >
                                              )["Closing Rank"]
                                            }
                                          </td>
                                        </tr>
                                      )
                                    )
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <Markdown>{message.content}</Markdown>
                        )}
                        <div>
                          {message?.options?.map((option) => (
                            <Button
                              key={option}
                              onClick={() => sendMsg(option)}
                              className={styles["custom-button"]}
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const g = handleSend();
                        }
                      }}
                      placeholder={
                        isConnecting ? "Connecting..." : "Type a message..."
                      }
                      className={`flex-grow p-3 bg-transparent focus:outline-none ${
                        isDarkMode
                          ? "text-white placeholder-gray-400"
                          : "text-gray-900 placeholder-gray-500"
                      }`}
                      disabled={isConnecting}
                    />
                    <Button
                      onClick={handleSend}
                      className={`p-3 ${
                        isConnecting
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      }`}
                      disabled={isConnecting}
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="w-1/3 p-4 overflow-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Sparkles className="mr-2 text-yellow-500" /> Information
            </h3>
            <div className="space-y-4">
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div className="flex items-center mb-2">
                  <img
                    src="/placeholder.svg?height=40&width=40"
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <span className="font-semibold">
                    {collegeInfo.name ? (
                      <Typewriter
                        options={{
                          strings: collegeInfo.name,
                          autoStart: true,
                          loop: false,
                        }}
                      />
                    ) : (
                      "College Name"
                    )}
                  </span>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <GraduationCap size={25} className="mr-2 text-green-500" />{" "}
                  Course
                </h4>
                <p>
                  {collegeInfo.course ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.course,
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <CircleDollarSign
                    size={25}
                    className="mr-2 text-yellow-500"
                  />{" "}
                  Fees
                </h4>
                <p>
                  {collegeInfo.fees && collegeInfo.fees != "0" ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.fees.toString(),
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <div
                  className={`p-0 rounded-lg ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}
                >
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Scissors size={25} className="mr-2 text-red-500" /> Cutoff
                  </h4>

                  {collegeInfo.cutoff &&
                  typeof collegeInfo.cutoff === "object" &&
                  Object.keys(collegeInfo.cutoff).length > 0 ? (
                    <div>
                      {Object.entries(collegeInfo.cutoff).map(
                        ([key, value]) => (
                          <p key={key}>{`${key}: ${value}`}</p>
                        )
                      )}
                    </div>
                  ) : collegeInfo.cutoff ? (
                    <p>
                      <Typewriter
                        options={{
                          strings: collegeInfo.cutoff.toString(),
                          autoStart: false,
                          loop: false,
                        }}
                      />
                    </p>
                  ) : (
                    <p>No cutoff information available</p>
                  )}
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <Heart size={25} className="mr-2 text-pink-500" /> Scholarship
                </h4>
                <p>
                  {collegeInfo.scholarships &&
                  collegeInfo.scholarships != "0" ? (
                    <Typewriter
                      options={{
                        strings: collegeInfo.fees.toString(),
                        autoStart: true,
                        loop: false,
                      }}
                    />
                  ) : (
                    "Not selected"
                  )}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {" "}
              {/* Added vertical spacing */}
              <div className="mt-4">
                {" "}
                {/* Margin-top for gap above the first button */}
                <Button
                  onClick={handleDownloadSummary}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  Download Summary
                </Button>
              </div>
              <div className="flex space-x-2">
                {" "}
                {/* Flex container for horizontal spacing */}
                  <Button
                  
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                  >
                    Take Course Selection Quiz
                  </Button>
                <Button
                  onClick={handleOpenComparison}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                >
                  Course Vs Course
                </Button>
              </div>
              <div className="mb-4"></div>{" "}
              {/* Margin-bottom for gap below the last button */}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
      {isComparisonOpen && (
        <CourseComparison onClose={handleCloseComparison} />
      )}{" "}
      {/* Render the CourseComparison popup */}
    </div>
  );
}
export default ChatbotPage;
