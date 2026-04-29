import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your GenAI Park Assistant. I can help you find your vehicle, summarize feedback, or answer parking questions.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Mock GenAI Response (Azure OpenAI structure)
    setTimeout(() => {
      let botResponse = "I'm sorry, I didn't understand that.";
      const lower = userMsg.content.toLowerCase();

      // USE CASE 1: Parking Assistant Chatbot (Context-Aware Navigation)
      if (lower.includes("car") || lower.includes("find")) {
        botResponse = "Based on your active session context, your car (Sedan) is safely parked on Ground Floor, Slot F1-A1. Would you like me to draw a path to the nearest exit?";
      } 
      // USE CASE 2: GenAI Slot Recommendation
      else if (lower.includes("recommend") || lower.includes("best") || lower.includes("slot")) {
        botResponse = `Analysing real-time data... I recommend you park at **Slot F1-A5**. 
        Reasoning: This slot avoids the high-traffic Lane B, and is heavily optimized for your Sedan dimensions based on historical exit-flow efficiency.`;
      } 
      // USE CASE 3: Feedback Analyzer
      else if (lower.includes("feedback") || lower.includes("summarize") || lower.includes("report")) {
        botResponse = `**Admin Daily Summary:** 
        - 🟢 80% positive feedback on the new smart navigation feature.
        - 🔴 Priority alert: 3 users reported extreme lag on the boom barrier at Entry A. Generating maintenance ticket #4492.`;
      } 
      // Fallback
      else if (lower.includes("hello") || lower.includes("hi")) {
        botResponse = "Hi there! I'm your AI guide. Try asking me to **recommend a slot**, **find my car**, or **summarize feedback**.";
      } else {
        botResponse = "I am an AI assistant powered by Azure OpenAI. I specialize in: \n1) Chatbot navigation\n2) Optimal slot reasoning\n3) NLP Feedback extraction.";
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: botResponse },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-background border border-border shadow-2xl rounded-2xl w-[350px] overflow-hidden flex flex-col h-[500px] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary/5 border-b p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg text-primary-foreground">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Azure AI Assistant</h3>
                <p className="text-xs text-muted-foreground">GPT-4o Powered</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </Button>
          </div>

          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-2xl p-3 text-sm flex gap-2 items-start",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"
                )}>
                  {msg.role === "assistant" && <Bot size={16} className="mt-0.5 shrink-0" />}
                  <span>{msg.content}</span>
                  {msg.role === "user" && <User size={16} className="mt-0.5 shrink-0" />}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-sm p-4 text-sm flex gap-2 items-center">
                  <Bot size={16} className="text-muted-foreground" />
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t bg-background">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask me anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="w-full bg-muted border-none rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Send size={14} />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-0 p-0 animate-bounce transition-all hover:scale-110"
        >
          <Sparkles size={24} />
        </Button>
      )}
    </div>
  );
}
