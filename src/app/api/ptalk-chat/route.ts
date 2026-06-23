import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUsageStore, todayKey, remaining, DAILY_LIMIT } from "@/lib/ptalk-usage";

export const runtime = "nodejs";

const RAG_URL = process.env.PTALK_RAG_URL || "http://localhost:8888/v2/rag/retrieve";
const LLM_URL = process.env.PTALK_LLM_URL || "https://api.deepseek.com/chat/completions";
const LLM_KEY = process.env.PTALK_LLM_KEY || "";
const LLM_MODEL = process.env.PTALK_LLM_MODEL || "deepseek-chat";

function userIdOf(session: { user?: { id?: string; email?: string | null } } | null): string | null {
  const u = session?.user;
  if (!u) return null;
  return u.id || u.email || null;
}

export async function GET() {
  const session = await auth();
  const userId = userIdOf(session);
  if (!userId) return NextResponse.json({ authed: false, remaining: 0 });
  const count = getUsageStore().getUsage(userId, todayKey(new Date()));
  return NextResponse.json({ authed: true, remaining: remaining(count) });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = userIdOf(session);
  if (!userId) return NextResponse.json({ error: "auth" }, { status: 401 });

  let message = "";
  try {
    const body = await req.json();
    message = typeof body?.message === "string" ? body.message : "";
  } catch {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }
  if (!message.trim() || message.length > 1000) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const store = getUsageStore();
  const day = todayKey(new Date());
  if (store.getUsage(userId, day) >= DAILY_LIMIT) {
    return NextResponse.json({ error: "limit", remaining: 0 }, { status: 429 });
  }

  // 1) Retrieve local RAG context (graceful: empty context on failure).
  let context = "";
  try {
    const r = await fetch(RAG_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: message.trim(), session_id: userId }),
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      if (typeof d?.context === "string") context = d.context;
    }
  } catch {
    // proceed without context
  }

  // 2) Generate via DeepSeek (OpenAI-compatible).
  const system =
    "Bạn là PTalk — trợ lý AI giáo dục của CTS Lab cho học sinh Việt Nam. " +
    "Trả lời NGẮN GỌN, thân thiện, bằng tiếng Việt (hoặc theo ngôn ngữ người hỏi). " +
    "Ưu tiên dựa vào NGỮ CẢNH dưới đây; nếu ngữ cảnh không đủ, hãy nói bạn chưa có thông tin và gợi ý hỏi cách khác. Không bịa.\n\n" +
    "NGỮ CẢNH:\n" +
    (context || "(không có)");

  let answer = "";
  try {
    const r = await fetch(LLM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: message.trim() },
        ],
        temperature: 0.3,
        max_tokens: 320,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return NextResponse.json({ error: "upstream" }, { status: 502 });
    const d = await r.json();
    answer = (d?.choices?.[0]?.message?.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }

  if (!answer) return NextResponse.json({ error: "upstream" }, { status: 502 });

  const newCount = store.incrementUsage(userId, day);
  return NextResponse.json({ answer, remaining: remaining(newCount) });
}
