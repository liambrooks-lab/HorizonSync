import OpenAI from "openai";
import { StreamingTextResponse } from "ai";
import { NextResponse } from "next/server";

import { buildAssistantSystemPrompt } from "@/modules/ai/utils/system-prompts";

export const maxDuration = 30;

const openAiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    context?: {
      draftRequest?: {
        excerpt?: string;
        title?: string;
      } | null;
      pathname?: string | null;
    };
    messages: Array<{
      content: string;
      role: "assistant" | "system" | "user";
    }>;
  };

  const response = await openAiClient.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    stream: true,
    messages: [
      {
        role: "system",
        content: buildAssistantSystemPrompt(body.context),
      },
      ...body.messages.map((message) => ({
        role: message.role === "system" ? "user" : message.role,
        content: message.content,
      })),
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content;

          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new StreamingTextResponse(stream);
}
