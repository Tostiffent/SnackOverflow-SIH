"use client";
import { useState, useEffect, useRef } from "react";
import {
  Send,
  Calendar,
  Tag,
  CreditCard,
  Sparkles,
  Sun,
  Moon,
  MicOff,
  Mic,
} from "lucide-react";
import { Socket, io } from "socket.io-client";
import Markdown from "react-markdown";
import Typewriter from "typewriter-effect";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PipecatWebSocketClient from "../voice/PipecatWebSocketClient";

function ChatbotPage() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      content: "Hello welcome to the museum, Say hello 👋 to get started ",
    },
  ]);
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isVoiceBotActive, setIsVoiceBotActive] = useState(false);
  const messagesEndRef = useRef(null);
  const [ws, setWs] = useState<Socket | null>(null);
  const [tickers, setTickers] = useState(0);
  const [maxTickets, setMaxTickets] = useState(0);
  const [bookingInfo, setBookingInfo] = useState({
    name: "",
    show: "",
    number_of_tickets: 0,
    total_amount: 0,
  });
  const bookingInfoRef = useRef(bookingInfo);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    bookingInfoRef.current = bookingInfo;
  }, [bookingInfo]);

  const connectWebSocket = () => {
    const socket = io(
      "https://fuzzy-space-guide-r5646xqvwpqcpqpx-5000.app.github.dev/",
      {
        transports: ["websocket"],
        upgrade: false,
      }
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
      let oldInfo = bookingInfoRef.current;
      newInfo.name =
        newInfo.name !== "" && oldInfo.name !== newInfo.name
          ? newInfo.name
          : oldInfo.name;
      newInfo.show =
        newInfo.show !== "" && oldInfo.show !== newInfo.show
          ? newInfo.show
          : oldInfo.show;
      newInfo.number_of_tickets =
        newInfo.number_of_tickets !== 0 &&
        oldInfo.number_of_tickets !== newInfo.number_of_tickets
          ? newInfo.number_of_tickets
          : oldInfo.number_of_tickets;
      newInfo.total_amount =
        newInfo.total_amount !== 0 &&
        oldInfo.total_amount !== newInfo.total_amount
          ? newInfo.total_amount
          : oldInfo.total_amount;
      setBookingInfo(newInfo);
      setMessages((oldArray) => [
        ...oldArray,
        { sender: "bot", content: data.res.msg, toolCall: data.res.toolCall },
      ]);

      // Update maxTickets if available in the response
      if (data.res.toolCall && data.res.toolCall.available_tickets) {
        setMaxTickets(data.res.toolCall.available_tickets);
      }
    });

    socket.on("voice_response", (data) => {
      console.log("Received response:", data);
      let newInfo = data.info;
      let oldInfo = bookingInfoRef.current;
      newInfo.name =
        newInfo.name !== "" && oldInfo.name !== newInfo.name
          ? newInfo.name
          : oldInfo.name;
      newInfo.show =
        newInfo.show !== "" && oldInfo.show !== newInfo.show
          ? newInfo.show
          : oldInfo.show;
      newInfo.number_of_tickets =
        newInfo.number_of_tickets !== 0 &&
        oldInfo.number_of_tickets !== newInfo.number_of_tickets
          ? newInfo.number_of_tickets
          : oldInfo.number_of_tickets;
      newInfo.total_amount =
        newInfo.total_amount !== 0 &&
        oldInfo.total_amount !== newInfo.total_amount
          ? newInfo.total_amount
          : oldInfo.total_amount;
      setBookingInfo(newInfo);
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "bot",
          content: data.res.msg[0],
          toolCall: data.res.toolCall,
        },
      ]);
      setMessages((oldArray) => [
        ...oldArray,
        {
          sender: "user",
          content: data.res.msg[1],
          toolCall: data.res.toolCall,
        },
      ]);

      // Update maxTickets if available in the response
      if (data.res.toolCall && data.res.toolCall.available_tickets) {
        setMaxTickets(data.res.toolCall.available_tickets);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scrollToBottom = () => {
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

  const sendMsg = (ms: string) => {
    if (ws && ws.connected) {
      ws.emit("send_message", { msg: ms, id: "1" });
      setMessages((oldArray) => [
        ...oldArray,
        { sender: "user", content: ms, toolCall: { type: "none" } },
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
        },
      ]);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleVoiceBot = () => {
    setIsVoiceBotActive(!isVoiceBotActive);
  };

  return (
    <div
      className={`flex h-screen w-full ${
        isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      } transition-colors duration-500`}
    >
      <ToastContainer
        position="top-right"
        theme={isDarkMode ? "dark" : "light"}
      />
      <div className="flex flex-col w-full max-w-screen-2xl mx-auto p-4 lg:p-6 h-full">
        <div
          className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl`}
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-white text-purple-600 flex items-center justify-center font-bold text-xl mr-3">
              TT
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Ticket Talash</h2>
              <p className="text-sm text-white opacity-75 flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                {ws && ws.connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleVoiceBot}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isVoiceBotActive ? "Deactivate voice bot" : "Activate voice bot"
              }
            >
              {isVoiceBotActive ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors duration-200 text-white"
              aria-label={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
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
                        message.toolCall.type === "events" ? (
                          <div>
                            <p>Select the event to book:</p>
                            <div className="mt-2">
                              {message.toolCall.events.map(
                                (event: string, eventIndex: number) => (
                                  <div
                                    key={eventIndex}
                                    className="bg-gray-600 p-3 rounded-md mb-2"
                                  >
                                    <input
                                      type="radio"
                                      id={event}
                                      name={event}
                                      onChange={() => sendMsg(event)}
                                    />
                                    <label htmlFor={event} className="ml-2">
                                      {event}
                                    </label>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : message.toolCall &&
                          message.toolCall.type === "tickets" ? (
                          <div className="flex flex-col items-start space-y-2">
                            <span className="text-white font-semibold">
                              Select number of tickets required (max:{" "}
                              {maxTickets})
                            </span>
                            <div className="flex items-center space-x-4 w-full">
                              <input
                                type="range"
                                min="0"
                                max={maxTickets}
                                value={tickers}
                                onChange={(e) =>
                                  setTickers(parseInt(e.target.value))
                                }
                                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              />
                              <span className="text-zinc-500 font-semibold min-w-[2ch]">
                                {tickers}
                              </span>
                            </div>
                            <button
                              onClick={() => sendMsg(tickers.toString())}
                              className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition duration-200"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <Markdown>{message.content}</Markdown>
                        )}
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
                          ? "text-black placeholder-gray-400"
                          : "text-gray-900 placeholder-gray-500"
                      }`}
                      disabled={isConnecting}
                    />
                    <button
                      onClick={handleSend}
                      className={`p-3 ${
                        isConnecting
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      }`}
                      disabled={isConnecting}
                    >
                      <Send size={20} />
                    </button>
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
                    {bookingInfo.name ? (
                      <Typewriter
                        options={{
                          strings: bookingInfo.name,
                          autoStart: true,
                          loop: false,
                        }}
                      />
                    ) : (
                      "User"
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
                  <Calendar size={16} className="mr-2 text-blue-500" /> Event
                </h4>
                <p>
                  {bookingInfo.show ? (
                    <Typewriter
                      options={{
                        strings: bookingInfo.show,
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
                  <Tag size={16} className="mr-2 text-green-500" /> Have a promo
                  code?
                </h4>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className={`flex-grow p-2 rounded-l-md ${
                      isDarkMode
                        ? "bg-gray-600 text-white"
                        : "bg-white text-gray-900"
                    } focus:outline-none`}
                  />
                  <button className="bg-purple-600 text-white px-3 py-2 rounded-r-md hover:bg-purple-700 transition duration-200">
                    Apply
                  </button>
                </div>
              </div>
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                }`}
              >
                <h4 className="font-semibold mb-2 flex items-center">
                  <CreditCard size={16} className="mr-2 text-purple-500" />{" "}
                  Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>
                      General ticket (x{bookingInfo.number_of_tickets})
                    </span>
                    <span>₹ {bookingInfo.total_amount}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Discount</span>
                    <span>₹ 0</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-gray-300 dark:border-gray-600">
                    <span>Total Amount</span>
                    <span className="text-green-600 dark:text-green-400">
                      ₹ {bookingInfo.total_amount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-md font-bold hover:from-purple-700 hover:to-pink-700 transition duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50">
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ChatbotPage;