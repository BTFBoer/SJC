import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SARAH_SYSTEM_PROMPT } from "@/lib/persona";

const BodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).min(1).max(24),
});

const HISTORY_LIMIT = 24;
const MAX_USER_CHARS = 1400;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) return Response.json({ error: "offline" }, { status: 503 });
        let json: unknown;
        try { json = await request.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
        const parsed = BodySchema.safeParse(json);
        if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
        const last = parsed.data.messages.at(-1);
        if (!last || last.role !== "user" || !last.content.trim()) return Response.json({ error: "bad_request" }, { status: 400 });

        const history = parsed.data.messages.slice(-HISTORY_LIMIT).map((m) => ({
          role: m.role,
          content: m.role === "user" ? m.content.slice(0, MAX_USER_CHARS) : m.content.slice(0, 4000),
        }));

        const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "grok-4.5",
            stream: true,
            max_tokens: 650,
            temperature: 0.9,
            reasoning: { effort: "low" },
            messages: [{ role: "system", content: SARAH_SYSTEM_PROMPT }, ...history],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const status = upstream.status;
          const error = status === 429 ? "busy" : status === 402 || status === 403 ? "quota" : "upstream";
          return Response.json({ error }, { status: status === 429 ? 429 : 502 });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const payload = JSON.parse(data) as { choices?: { delta?: { content?: string | null } }[] };
                    const delta = payload.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\\n\\n`));
                  } catch { /* ignore malformed chunks */ }
                }
              }
              controller.enqueue(encoder.encode("data: [DONE]\\n\\n"));
            } catch {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "stream" })}\\n\\n`));
            } finally { controller.close(); }
          },
          cancel() { void reader.cancel(); },
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
      },
    },
  },
});
