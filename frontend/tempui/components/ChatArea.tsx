"use client";
import { io } from "socket.io-client";
import Markdown from "react-markdown";
import React, { useEffect, useRef } from "react";
export default function ChatArea({
  bookingInfo,
  setBookingInfo,
  setCall,
}: {
  bookingInfo: any;
  setBookingInfo: any;
  setCall: any;
}) {
  const [ws, setWs] = React.useState<any>(null);
  const [messages, setMessages] = React.useState<any>([
    {
      msg: "Hello welcome to the museum, Say hello 👋 to get started ",
      id: "2",
    },
  ]);
  const [message, setMessage] = React.useState("");
  const [tickers, setTickers] = React.useState(0);
  const AlwaysScrollToBottom = () => {
    const elementRef = useRef<any>();
    //@ts-ignore
    useEffect(() => elementRef.current.scrollIntoView());
    return <div ref={elementRef} />;
  };

  const bookingInfoRef = useRef(bookingInfo);

  useEffect(() => {
    bookingInfoRef.current = bookingInfo;
  }, [bookingInfo]);

  useEffect(() => {
    const socket = io(
      "https://fuzzy-space-guide-r5646xqvwpqcpqpx-5000.app.github.dev/"
    );
    socket.on("connect", () => {
      console.log("connected to server");
      setWs(socket);
    });

    socket.on("response", (data: any) => {
      console.log(data);
      let newInfo = data.info;
      let oldInfo = bookingInfoRef.current;
      console.log(newInfo, oldInfo);
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
        newInfo.total_amount != 0 &&
        oldInfo.total_amount != newInfo.total_amount
          ? newInfo.total_amount
          : oldInfo.total_amount;
      setBookingInfo(newInfo);
      setMessages((oldArray: any) => [
        ...oldArray,
        { msg: data.res.msg, toolCall: data.res.toolCall, id: "2" },
      ]);
    });

    return () => {
      socket.off("connect");
      socket.off("response");
      socket.disconnect();
    };
  }, []);

  async function sendMsg(ms?: string) {
    if (ws) {
      ws.emit("send_message", { msg: ms ? ms : message, id: "1" });
      setMessages((oldArray: any) => [
        ...oldArray,
        { msg: ms ? ms : message, toolCall: { type: "none" }, id: "1" },
      ]);
      setMessage("");
    }
  }

  return (
    <div className="w-1/2 p-6">
      <div
        style={{
          minWidth: "70vw",
          maxWidth: "70vw",
          minHeight: "93vh",
          maxHeight: "93vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
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
              <h2 className="text-2xl font-bold">Ticket Talash</h2>
              <p className="text-sm text-gray-400">🟢 Always active</p>
            </div>
          </div>
          <img
            onClick={() => setCall(true)}
            alt="callbt"
            src="https://iili.io/dOnCIbp.png"
            style={{ cursor: "pointer", width: "50px", height: "50px" }}
          />
        </div>
        <div
          style={{
            width: "100%",
            height: "100vh",
            overflowX: "hidden",
            overflowY: "auto",
          }}
          className="space-y-6 no-scrollbar"
        >
          {messages
            ? messages.map((msg: any, index: any) => {
                return (
                  <>
                    {msg?.toolCall && msg?.toolCall?.type == "events" ? (
                      <div className="bg-gray-700 rounded-lg p-4 max-w-xl">
                        <p>Select the event to book:</p>
                        <div className="mt-2">
                          {msg?.toolCall?.events.map(
                            (event: any, index: any) => {
                              return (
                                <div
                                  key={index}
                                  className="bg-gray-600 p-3 rounded-md"
                                >
                                  <input
                                    type="radio"
                                    id={event}
                                    name={event}
                                    onChange={(e) => {
                                      setMessage(event);
                                      sendMsg(event);
                                    }}
                                  />
                                  <label htmlFor={event} className="ml-2">
                                    {event}
                                  </label>
                                  <p className="text-gray-400 text-sm">
                                    {event}
                                  </p>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ) : msg?.toolCall && msg?.toolCall?.price ? (
                      <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-lg">
                        <span className="text-white font-semibold">
                          Select Number of tickets required
                        </span>
                        <input
                          type="range"
                          onMouseUp={() => sendMsg(tickers.toString())}
                          min="0"
                          max={msg?.toolCall?.available_tickets}
                          value={tickers}
                          onChange={(e) => setTickers(parseInt(e.target.value))}
                          className="w-64 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6, #4b5563, #4b5563 100%)`,
                          }}
                        />
                        <span className="text-white font-semibold">
                          {tickers}
                        </span>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className={`${
                          msg.id === "2"
                            ? "bg-blue-600 rounded-lg p-4 max-w-max"
                            : "bg-gray-700 rounded-lg p-4 max-w-max ml-auto text-white"
                        } `}
                      >
                        <Markdown>{msg.msg}</Markdown>
                      </div>
                    )}
                  </>
                );
              })
            : null}
          <AlwaysScrollToBottom />

          {/* <div className="bg-gray-700 rounded-lg p-4 max-w-max">
              <p>How many tickets would you like?</p>
            </div>
            <div className="bg-blue-600 rounded-lg p-4 max-w-max ml-auto text-white">
              <p>Seven.</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 max-w-max">
              <p>Okay, and what is your name?</p>
            </div>
            <div className="bg-blue-600 rounded-lg p-4 ml-auto max-w-max text-white">
              <p>ABC.</p>
            </div> */}
          {/* <div className="bg-gray-700 rounded-lg p-4 max-w-xl">
              <p>Select the type of ticket:</p>
              <div className="mt-2">
                <div className="bg-gray-600 p-3 rounded-md mb-2">
                  <input
                    type="radio"
                    id="general"
                    name="ticket"
                    defaultChecked
                  />
                  <label htmlFor="general" className="ml-2">
                    General Ticket
                  </label>
                  <p className="text-gray-400 text-sm">
                    Access to all exhibits
                  </p>
                </div>
                <div className="bg-gray-600 p-3 rounded-md">
                  <input type="radio" id="student" name="ticket" />
                  <label htmlFor="student" className="ml-2">
                    Student Ticket
                  </label>
                  <p className="text-gray-400 text-sm">
                    Discounted rate for students
                  </p>
                </div>
              </div>
            </div> */}
        </div>
        <div className="flex items-center border-t border-gray-700 pt-4 mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 p-3 rounded-md border-none text-gray-200 mr-3"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMsg();
              }
            }}
          />
          {/* <button
              className="text-gray-400 text-2xl"
              
            >
              <img
                src="data:image/png;base64,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"
                alt="Call"
                className="w-10 h-10 rounded-full"
              ></img>
            </button> */}
          <button className="text-gray-400 text-2xl ml-3">
            <img
              src="https://cdn-icons-png.freepik.com/512/4414/4414831.png"
              alt="Send"
              className="w-10 h-10 rounded-full"
              onClick={() => sendMsg()}
            ></img>
          </button>
        </div>
      </div>
    </div>
  );
}
