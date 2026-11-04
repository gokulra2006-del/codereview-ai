import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { MessageSquare, Send, X } from "lucide-react";

const QUICK_PROMPTS = [
  "Explain this code",
  "Find bugs & edge cases",
  "Optimize time complexity",
  "Add docstrings & types",
  "Convert to Python",
];

export default function AIChatPanel({
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  onSendChat,
  onClearChat,
  onClose,
  language,
  t,
}) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  return (
    <div
      style={{
        width: "360px",
        flexShrink: 0,
        background: t.chatBg,
        borderRadius: "16px",
        border: `1px solid ${t.chatBorder}`,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${t.chatBorder}`,
          background: t.chatSurface,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: "700", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", color: t.text }}>
            <MessageSquare size={16} /> AI Chat Assistant
          </div>
          <div style={{ fontSize: "12px", color: t.muted, marginTop: "2px" }}>
            Ask about your {language} code
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onClearChat}
            style={{
              background: "transparent",
              color: t.muted,
              border: `1px solid ${t.chatBorder}`,
              borderRadius: "6px",
              fontSize: "11px",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: t.muted, cursor: "pointer", padding: "4px" }}
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Quick Prompts */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: `1px solid ${t.chatBorder}`,
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => onSendChat(p)}
            disabled={chatLoading}
            style={{
              background: t.card,
              color: t.text,
              border: `1px solid ${t.border}`,
              borderRadius: "20px",
              padding: "4px 10px",
              fontSize: "11px",
              cursor: chatLoading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              opacity: chatLoading ? 0.6 : 1,
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className="chat-msg"
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              className="markdown-body"
              style={{
                maxWidth: "88%",
                background: msg.role === "user" ? t.chatUser : t.chatAI,
                color: msg.role === "user" ? "white" : t.text,
                borderRadius:
                  msg.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                padding: "10px 14px",
                fontSize: "13px",
                lineHeight: "1.6",
                border: msg.role === "assistant" ? `1px solid ${t.chatBorder}` : "none",
              }}
            >
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {chatLoading && (
          <div className="chat-msg" style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                background: t.chatAI,
                border: `1px solid ${t.chatBorder}`,
                borderRadius: "14px 14px 14px 4px",
                padding: "12px 18px",
                display: "flex",
                gap: "5px",
                alignItems: "center",
              }}
            >
              <span className="dot1" style={{ width: "7px", height: "7px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
              <span className="dot2" style={{ width: "7px", height: "7px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
              <span className="dot3" style={{ width: "7px", height: "7px", background: t.muted, borderRadius: "50%", display: "inline-block" }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: `1px solid ${t.chatBorder}`,
          display: "flex",
          gap: "8px",
          background: t.chatSurface,
        }}
      >
        <input
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendChat();
            }
          }}
          placeholder="Ask anything about your code…"
          disabled={chatLoading}
          style={{
            flex: 1,
            background: t.chatBg,
            color: t.text,
            border: `1px solid ${t.chatBorder}`,
            borderRadius: "10px",
            padding: "8px 12px",
            fontSize: "13px",
            fontFamily: "inherit",
            outline: "none",
            opacity: chatLoading ? 0.7 : 1,
          }}
        />
        <button
          onClick={() => onSendChat()}
          disabled={chatLoading || !chatInput.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#4f46e5",
            color: "white",
            border: "none",
            borderRadius: "10px",
            padding: "8px 14px",
            cursor: chatLoading || !chatInput.trim() ? "not-allowed" : "pointer",
            opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
          }}
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
