"use client";
import React, { useEffect, useRef, useState } from "react";
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
import { toast, ToastContainer } from "react-toastify";
import {
  Send,
  Mic,
  BookOpen,
  GraduationCap,
  Building,
  IndianRupee,
  Users,
  Briefcase,
} from "lucide-react";
import { Socket, io } from "socket.io-client";

export default function Component() {
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hello! How can I assist you with information about technical education in Rajasthan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [ws, setWs] = useState<Socket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

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
      setMessages((oldArray) => [
        ...oldArray,
        { role: "bot", content: data.res.msg },
      ]);
    });

    socket.on("voice_response", (data) => {
      console.log("Received response:", data);
      setMessages((oldArray) => [
        ...oldArray,
        {
          role: "bot",
          content: data.res.msg[0],
        },
      ]);
      setMessages((oldArray) => [
        ...oldArray,
        {
          role: "user",
          content: data.res.msg[1],
        },
      ]);
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

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white p-6 shadow-md">
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
                    handleSend();
                  }}
                  className="flex w-full items-center space-x-2"
                >
                  <Input
                    id="message"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Send className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                  <Button type="button" size="icon" variant="outline">
                    <Mic className="h-4 w-4" />
                    <span className="sr-only">Voice input</span>
                  </Button>
                </form>
              </CardFooter>
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
