"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("chat.messages");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (m): m is Message =>
          typeof m === "object" &&
          m !== null &&
          (m as { role?: unknown }).role !== undefined &&
          ((m as { role?: unknown }).role === "user" ||
            (m as { role?: unknown }).role === "assistant") &&
          typeof (m as { content?: unknown }).content === "string",
      );
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldStickToBottomRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < 120;
      shouldStickToBottomRef.current = isNearBottom;
      setShowJump(!isNearBottom && el.scrollHeight > el.clientHeight + 40);
    };

    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (shouldStickToBottomRef.current) {
      scrollToBottom("auto");
    }
  }, [messages, loading]);

  useEffect(() => {
    try {
      window.localStorage.setItem("chat.messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    if (loading) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    requestAnimationFrame(() => scrollToBottom("smooth"));

    const currentMessage = message;

    setMessage("");
    setLoading(true);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const conversation = [...messages, userMessage]
        .filter((m) => m.content.trim() !== "")
        .slice(-20)
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

      const res = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          message: currentMessage,
          contents: conversation,
        }),
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const payload = (await res.json().catch(() => null)) as {
            message?: string;
          } | null;
          throw new Error(payload?.message || "Request failed");
        }

        const text = await res.text().catch(() => "");
        throw new Error(text || "Request failed");
      }

      if (contentType.includes("application/json")) {
        const payload = (await res.json().catch(() => null)) as {
          response?: string;
          message?: string;
        } | null;
        throw new Error(payload?.message || "Unexpected JSON response");
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role !== "assistant") return next;
          next[next.length - 1] = {
            ...last,
            content: last.content + chunkText,
          };
          return next;
        });
      }
    } catch (error) {
      const isAborted =
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof Error && error.name === "AbortError") ||
        (error instanceof Error &&
          typeof error.message === "string" &&
          error.message.toLowerCase().includes("aborted"));

      if (isAborted) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant" && last.content === "") {
            next[next.length - 1] = { role: "assistant", content: "Stopped." };
            return next;
          }
          return [...next, { role: "assistant", content: "Stopped." }];
        });
        return;
      }

      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          next[next.length - 1] = {
            role: "assistant",
            content: `Error: ${errorMessage}`,
          };
          return next;
        }
        return [
          ...next,
          { role: "assistant", content: `Error: ${errorMessage}` },
        ];
      });
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setMessages([]);
    try {
      window.localStorage.removeItem("chat.messages");
    } catch {}
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Chat workspace
            </h1>
            <p className="mt-1 text-sm text-zinc-300">
              Model:{" "}
              <span className="text-zinc-100">gemini-3-flash-preview</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {loading ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-100 hover:bg-black/40"
              >
                Stop
              </button>
            ) : null}
            <button
              type="button"
              onClick={clearChat}
              className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-zinc-100 hover:bg-black/40"
              disabled={loading || messages.length === 0}
            >
              New chat
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Summarize this topic in bullets",
            "Write a professional email",
            "Help me debug this error",
            "Give me a study plan",
          ].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMessage(p)}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-zinc-200 hover:bg-black/30"
              disabled={loading}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div
          ref={listRef}
          className="chat-scroll h-[calc(100vh-410px)] space-y-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
        >
          {messages.length === 0 && (
            <div className="mx-auto mt-10 max-w-md rounded-3xl border border-white/10 bg-black/30 p-5 text-sm text-zinc-300">
              Type a message, press Enter, and the response will stream in.
            </div>
          )}

          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const isLast = index === messages.length - 1;
            const showThinking =
              !isUser && isLast && loading && msg.content === "";

            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 text-white"
                      : "bg-black/35 text-zinc-100 border border-white/10"
                  }`}
                >
                  {showThinking ? (
                    <span className="text-zinc-300 animate-pulse">
                      Thinking...
                    </span>
                  ) : (
                    <>
                      {isUser ? (
                        <span className="whitespace-pre-wrap">
                          {msg.content}
                        </span>
                      ) : (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkBreaks]}
                          components={{
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0 whitespace-pre-wrap">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="mb-3 list-disc pl-6 last:mb-0">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="mb-3 list-decimal pl-6 last:mb-0">
                                {children}
                              </ol>
                            ),
                            table: ({ children }) => (
                              <div className="mb-3 overflow-x-auto last:mb-0">
                                <table className="w-full border-collapse text-left text-[14px]">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="border-b border-zinc-800">
                                {children}
                              </thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="divide-y divide-zinc-900">
                                {children}
                              </tbody>
                            ),
                            th: ({ children }) => (
                              <th className="whitespace-nowrap px-3 py-2 font-medium text-zinc-200">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 align-top text-zinc-100">
                                {children}
                              </td>
                            ),
                            li: ({ children }) => (
                              <li className="mb-1 last:mb-0">{children}</li>
                            ),
                            a: ({ children, href }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-300 underline underline-offset-2 hover:text-blue-200"
                              >
                                {children}
                              </a>
                            ),
                            code: ({ children, className }) => {
                              const isBlock = typeof className === "string";
                              const value = String(children).replace(/\n$/, "");

                              if (isBlock) {
                                return (
                                  <code className="text-zinc-100">{value}</code>
                                );
                              }

                              return (
                                <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-[0.9em] text-zinc-100">
                                  {value}
                                </code>
                              );
                            },
                            pre: ({ children }) => (
                              <pre className="mb-3 overflow-x-auto rounded-xl border border-zinc-800 bg-black/40 p-3 font-mono text-[13px] leading-relaxed last:mb-0">
                                {children}
                              </pre>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="mb-3 border-l-2 border-zinc-700 pl-3 text-zinc-200 last:mb-0">
                                {children}
                              </blockquote>
                            ),
                            hr: () => <hr className="my-3 border-zinc-800" />,
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        {showJump ? (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-sm text-zinc-100 shadow-lg backdrop-blur hover:bg-black/60"
          >
            Jump to latest
          </button>
        ) : null}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
      >
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message…"
          disabled={loading}
          className="flex-1 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] outline-none placeholder:text-zinc-500 focus:border-white/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="rounded-2xl bg-white px-6 py-2 font-bold text-black disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </main>
  );
}
