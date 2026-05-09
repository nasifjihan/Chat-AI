const PROMPTS: Array<{ title: string; prompt: string; tag: string }> = [
  {
    title: "Explain simply",
    tag: "Learning",
    prompt:
      "Explain {topic} like I'm 12, then give a 3-bullet summary and 3 quiz questions.",
  },
  {
    title: "Debug help",
    tag: "Coding",
    prompt:
      "I'm stuck. Ask me 5 clarifying questions first. Then propose 3 likely root causes and the exact steps to verify each.",
  },
  {
    title: "Refactor plan",
    tag: "Coding",
    prompt:
      "Given this code, propose a refactor with clear steps, trade-offs, and a final improved version:\n\n```ts\n{paste code}\n```",
  },
  {
    title: "Write content",
    tag: "Writing",
    prompt:
      "Write a concise, friendly announcement about {topic}. Give 3 variations: short, medium, and playful.",
  },
];

export default function PromptsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Prompts</h1>
          <p className="mt-2 text-sm text-zinc-300">
            Copy a template, paste into Chat, and fill in the placeholders.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {PROMPTS.map((p) => (
          <div
            key={p.title}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-400">{p.tag}</p>
                <h2 className="mt-1 text-lg font-medium text-white">
                  {p.title}
                </h2>
              </div>
            </div>

            <pre className="chat-scroll mt-4 max-h-56 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-[13px] leading-relaxed text-zinc-200">
              {p.prompt}
            </pre>
          </div>
        ))}
      </div>
    </main>
  );
}
