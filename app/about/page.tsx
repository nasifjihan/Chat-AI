export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">About</h1>
          <p className="mt-2 text-zinc-300">
            This project is a streaming AI chat UI powered by the Gemini API. It
            focuses on a clean UX: fast streaming, Markdown rendering, and a
            simple foundation you can extend.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm font-medium text-zinc-200">What it has</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>Streaming responses</li>
              <li>Markdown output formatting</li>
              <li>Reusable layout with header + footer</li>
              <li>Simple API route handler</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <p className="text-sm font-medium text-zinc-200">
              What to add next
            </p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-300">
              <li>Conversation memory (multi-turn)</li>
              <li>Stop / regenerate / edit message</li>
              <li>Prompt library + templates</li>
              <li>Auth + saved chat history</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-r from-fuchsia-500/10 via-sky-400/10 to-emerald-400/10 p-5">
          <p className="text-sm text-zinc-200">
            Tip: to make it feel like a “real app”, add identity (name, logo,
            accent colors), settings, saved chats, and a consistent navigation
            layout.
          </p>
        </div>
      </div>
    </main>
  );
}
