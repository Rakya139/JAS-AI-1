interface Env {
  GROQ_API_KEY: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export const onRequestPost = async ({
  request,
  env
}: {
  request: Request
  env: Env
}) => {
  if (!env.GROQ_API_KEY) {
    return Response.json({ error: "AI service is not configured yet." }, { status: 503 })
  }

  let body: { messages?: ChatMessage[] }

  try {
    body = await request.json() as { messages?: ChatMessage[] }
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const messages = body.messages

  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
    return Response.json({ error: "Please send between 1 and 30 messages." }, { status: 400 })
  }

  const safeMessages = messages
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map(m => ({ role: m.role, content: m.content.slice(0, 12000) }))

  if (safeMessages.length === 0 || safeMessages[safeMessages.length - 1].role !== "user") {
    return Response.json({ error: "Your latest message must be a user message." }, { status: 400 })
  }

  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: "You are JAS AI, a helpful, clear, and friendly AI assistant. Give accurate, useful answers. If unsure, say so."
          },
          ...safeMessages
        ],
        temperature: 0.7,
        max_completion_tokens: 2048
      })
    })

    const data = await upstream.json() as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!upstream.ok) {
      return Response.json(
        { error: data.error?.message || "The AI provider could not complete your request." },
        { status: upstream.status === 429 ? 429 : 502 }
      )
    }

    const reply = data.choices?.[0]?.message?.content

    if (!reply) {
      return Response.json({ error: "The AI returned an empty response." }, { status: 502 })
    }

    return Response.json({ reply })
  } catch {
    return Response.json({ error: "Could not reach the AI service." }, { status: 502 })
  }
}
