"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, Copy, MessageSquare, SendHorizonal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatContextSnapshot } from "@/lib/firestore";
import { formatDateTime, safeJsonParse } from "@/lib/utils";

export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [timestampLookup, setTimestampLookup] = useState<Record<string, string>>({});
  const timestampLookupRef = useRef<Record<string, string>>({});

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const refreshSnapshot = async () => {
    return getChatContextSnapshot();
  };

  useEffect(() => {
    const storedMessages = safeJsonParse<Array<{ id: string; role: "user" | "assistant" | "system"; createdAt: string; content: string }>>(
      localStorage.getItem("stockbot-history"),
      [],
    );

    if (storedMessages.length > 0) {
      queueMicrotask(() => {
        const nextLookup = Object.fromEntries(
          storedMessages.map((message) => [message.id, message.createdAt]),
        );
        timestampLookupRef.current = nextLookup;
        setTimestampLookup(nextLookup);
        setMessages(
          storedMessages.map((message) => ({
            id: message.id,
            role: message.role,
            parts: [{ type: "text", text: message.content }],
          })),
        );
      });
    }

    void getChatContextSnapshot();
  }, [setMessages]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void getChatContextSnapshot();
  }, [open]);

  useEffect(() => {
    const normalizedMessages = messages
      .map((message) => ({
        id: message.id,
        role: message.role,
        createdAt: timestampLookupRef.current[message.id] ?? new Date().toISOString(),
        content: message.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(""),
      }))
      .slice(-50);

    queueMicrotask(() => {
      timestampLookupRef.current = {
        ...timestampLookupRef.current,
        ...Object.fromEntries(normalizedMessages.map((message) => [message.id, message.createdAt])),
      };
      setTimestampLookup(timestampLookupRef.current);
      localStorage.setItem("stockbot-history", JSON.stringify(normalizedMessages));
    });
  }, [messages]);

  const renderedMessages = useMemo(
    () =>
      messages.map((message) => ({
        id: message.id,
        role: message.role,
        createdAt: timestampLookup[message.id] ?? new Date().toISOString(),
        content: message.parts
          .filter((part) => part.type === "text")
          .map((part) => ("text" in part ? part.text : ""))
          .join(""),
      })),
    [messages, timestampLookup],
  );

  return (
    <div className="fixed bottom-24 right-4 z-40 lg:bottom-6">
      {open ? (
        <div className="fixed inset-y-0 right-0 w-full max-w-[360px] animate-[drawer-in_180ms_ease-out] border-l border-line bg-surface">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-md border border-accent/20 bg-accent/10 p-2 text-accent">
                <Bot className="h-4 w-4 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">StockBot</p>
                <p className="text-xs text-muted">AI assistant ready</p>
              </div>
            </div>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-secondary transition duration-80 ease-out hover:bg-subtle hover:text-primary"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4 stroke-[1.5]" />
            </button>
          </div>
          <div className="flex h-[calc(100dvh-97px)] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {renderedMessages.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-center">
                <Bot className="h-10 w-10 text-muted stroke-[1.5]" />
                <div className="space-y-1">
                  <p className="text-base font-medium text-secondary">No messages yet</p>
                  <p className="mx-auto max-w-xs text-sm text-muted">
                Ask about low stock items, current quantities, reorder timing, or recent activity.
                  </p>
                </div>
              </div>
            ) : null}
            {renderedMessages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={`group max-w-[80%] px-3 py-2.5 text-sm ${
                    message.role === "user"
                      ? "rounded-lg rounded-tr-sm bg-accent/15 text-primary"
                      : "rounded-lg rounded-tl-sm bg-subtle text-primary"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-muted">
                    <span>{formatDateTime(message.createdAt)}</span>
                    {message.role !== "user" ? (
                      <button
                        className="inline-flex h-5 w-5 items-center justify-center rounded-md opacity-0 transition duration-80 ease-out hover:bg-elevated hover:text-primary group-hover:opacity-100"
                        onClick={() => void navigator.clipboard.writeText(message.content)}
                        aria-label="Copy response"
                      >
                        <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            {status === "streaming" || status === "submitted" ? (
              <div className="flex justify-start">
                <div className="inline-flex max-w-[80%] items-center gap-1 rounded-lg rounded-tl-sm bg-subtle px-3 py-2">
                  <span className="typing-dot h-1.5 w-1.5 rounded-sm bg-muted" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-sm bg-muted" />
                  <span className="typing-dot h-1.5 w-1.5 rounded-sm bg-muted" />
                </div>
              </div>
            ) : null}
            </div>
          <form
            className="border-t border-line p-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!input.trim()) {
                return;
              }

              const nextSnapshot = await refreshSnapshot();
              void sendMessage({ text: input }, { body: { snapshot: nextSnapshot } });
              setInput("");
            }}
          >
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                name="prompt"
                placeholder="Ask StockBot..."
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={status === "streaming" || status === "submitted"}
                className="h-9 w-9 px-0"
                aria-label="Send message"
              >
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>
          </form>
          </div>
        </div>
      ) : (
        <button
          aria-label="Open AI chatbot"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line bg-surface text-secondary transition duration-80 ease-out hover:bg-subtle hover:text-primary"
        >
          <MessageSquare className="h-4 w-4 stroke-[1.5]" />
        </button>
      )}
    </div>
  );
}
