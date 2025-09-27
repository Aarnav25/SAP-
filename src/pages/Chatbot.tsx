import React, { useState } from "react";
import "./Chatbot.css";
import { sendMessageToGemini } from "./sendMessageToGemini.ts";

interface Message {
  sender: "user" | "bot";
  text: string;
}

function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === "") return;

    const userMessage: Message = { sender: "user", text: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const botResponseText = await sendMessageToGemini(inputMessage);
      const botMessage: Message = { sender: "bot", text: botResponseText };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error("Failed to get response:", error);
      const errorMessage: Message = {
        sender: "bot",
        text: "Sorry, I'm having trouble connecting right now.",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chatbot-container${isMinimized ? " minimized" : ""}`}>
      <div
        className="chatbot-header"
        onClick={() => setIsMinimized(!isMinimized)}
        style={{ cursor: "pointer" }}
      >
        <span role="img" aria-label="AI">
          🤖
        </span>{" "}
        Hello World AI
        <span style={{ marginLeft: "auto", fontSize: "1.2em" }}>
          {isMinimized ? "▲" : "▼"}
        </span>
      </div>

      {!isMinimized && (
        <>
          <div className="chat-window">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <p>
                  <strong>
                    {msg.sender === "user" ? "You" : "Hello World AI"}:
                  </strong>{" "}
                  {msg.text}
                </p>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <p>
                  <strong>Hello World AI:</strong> Thinking...
                </p>
              </div>
            )}
          </div>

          <div className="message-input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button onClick={handleSendMessage} disabled={isLoading}>
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chatbot;