import type { VercelRequest, VercelResponse } from '@vercel/node'

interface GeminiErrorResponse {
  error?: {
    message?: string
  }
}

interface GeminiSuccessResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { text, action, language } = req.body || {}

  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'GEMINI_API_KEY is not defined in the server environment.' })
  }

  let prompt: string
  switch (action) {
    case 'explain':
      prompt = `You are a world-class educational AI assistant.
Explain the following text excerpt in a clear, highly educational, and engaging manner.
Instructions:
- If the text is a programming code snippet, wrap explanations with appropriate language-specific markdown code blocks (e.g. \`\`\`typescript) and explain the control flow.
- If the text is a single number, statistics, or isolated name, explain what this entity represents contextually or educational relevance.
- Break down the explanation using clean headers starting with ###:
  ### 🔑 Core Concepts
  ### 📖 Context & Relevance
  ### 💡 Practical Takeaways
- Use bold text, bullet points, and clean syntax tags. Maintain a professional, encouraging tone.

Text excerpt:
"${text}"`
      break
    case 'summarize':
      prompt = `You are a world-class research assistant.
Provide a concise, high-level summary of the following excerpt.
Instructions:
- Capture the main argument, core takeaways, and evidence/examples in a clean structured markdown format.
- Use bullet points and bold headers. Keep it compact, professional, and dense with information.
- If the text contains codes or tables, keep them intact within markdown syntax.

Text excerpt:
"${text}"`
      break
    case 'key-points':
      prompt = `You are an executive summary writer.
Extract the most important bullet points and key takeaways from the following text.
Instructions:
- List 3-7 core points.
- Use standard markdown list formatting (e.g. * **Key concept**: explanation).
- Keep each point brief, actionable, and independent.

Text excerpt:
"${text}"`
      break
    case 'simplify':
      prompt = `You are a master teacher who explains complex topics simply.
Simplify the language of the following excerpt so it is extremely easy to understand.
Instructions:
- Target a reading level of a beginner or child (e.g., explain it like I'm 5 years old).
- Use vivid analogies, everyday examples, and simple vocabulary.
- Keep structural layouts, tables, and codes formatted cleanly but demystified in simple terms.

Text excerpt:
"${text}"`
      break
    case 'translate':
      prompt = `You are a professional polyglot translator.
Translate the following text excerpt accurately into ${language || 'the active app language'}.
Instructions:
- Maintain the original tone, context, formatting, and markdown tags (e.g. bold, code snippets, lists, tables).
- Do not translate technical terms or variable names if translating programming code snippets.
- Ensure the output text flow is natural and grammatically correct in the target language.

Text excerpt:
"${text}"`
      break
    default:
      prompt = `Process this text excerpt using markdown formatting:\n"${text}"`
  }

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!response.ok) {
      const errData = (await response.json().catch(() => ({}))) as GeminiErrorResponse
      return res.status(response.status).json({
        error: errData.error?.message || `Gemini API returned error code ${response.status}`,
      })
    }

    const resData = (await response.json()) as GeminiSuccessResponse
    const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiText) {
      return res.status(502).json({ error: 'Empty response received from Gemini API' })
    }

    return res.status(200).json({ response: aiText })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({ error: errorMessage })
  }
}
