import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Missing message" },
        { status: 400 },
      );
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: message,
    });

    const encoder = new TextEncoder();

    let lastText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            const chunkText = chunk.text ?? "";
            if (!chunkText) continue;

            const delta =
              chunkText.startsWith(lastText) && chunkText.length >= lastText.length
                ? chunkText.slice(lastText.length)
                : chunkText;

            lastText = chunkText;

            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      { status: 500 },
    );
  }
}
