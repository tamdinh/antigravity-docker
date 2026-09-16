---
name: vercel-ai-sdk
description: >-
  Build AI-powered applications with the Vercel AI SDK. Use when creating chatbots, generative UI, streaming completions, structured JSON generation, tool calling, multi-agent loops, or integrating LLM providers with Next.js.
---

# Vercel AI SDK Guide

Comprehensive guide to building production AI applications using the Vercel AI SDK (`ai` package).

## Installation
```bash
npm install ai @ai-sdk/google @ai-sdk/openai @ai-sdk/anthropic
```

---

## 1. Streaming Text & Chat (Next.js Route Handler)

```ts
// app/api/chat/route.ts
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages,
    system: 'You are an expert full-stack developer assistant.',
  });

  return result.toDataStreamResponse();
}
```

On the frontend:
```tsx
// app/chat/page.tsx
'use client';
import { useChat } from 'ai/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block p-2 rounded bg-muted">{m.content}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input value={input} onChange={handleInputChange} className="border p-2 flex-1 rounded" />
        <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Send</button>
      </form>
    </div>
  );
}
```

---

## 2. Tool Calling & Multi-Step Agent Execution
Enable autonomous tools and agent loops using `maxSteps`:

```ts
import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const weatherTool = tool({
  description: 'Get weather for a location',
  parameters: z.object({ city: z.string() }),
  execute: async ({ city }) => {
    return { temperature: 22, condition: 'Sunny in ' + city };
  },
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.5-flash'),
    messages,
    tools: { weather: weatherTool },
    maxSteps: 5, // Automatically invokes tools and feeds results back to the model
  });

  return result.toDataStreamResponse();
}
```

---

## 3. Structured Data Generation (`generateObject`)

```ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const TaskSchema = z.object({
  title: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  estimatedHours: z.number(),
  tags: z.array(z.string()),
});

export async function summarizeTask(description: string) {
  const { object } = await generateObject({
    model: google('gemini-2.5-flash'),
    schema: TaskSchema,
    prompt: `Analyze this user request: "${description}"`,
  });

  return object; // Type-safe validated object
}
```
