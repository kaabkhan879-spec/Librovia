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

  const { text } = req.body || {}

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

  const prompt = `Based on the following text excerpt, generate 2-4 high-quality, educational study Q&A flashcards.
Each flashcard should target definitions, concepts, comparisons, examples, or exam-focused questions.
Keep answers concise, clear, and easy to read.
Avoid duplicate concepts.
Output the result ONLY as a raw JSON array of objects matching the following typescript schema, without any markdown formatting wrappers or explanation text:
[{"question": "string", "answer": "string", "difficulty": "easy" | "medium" | "hard", "topic": "string"}]

Text excerpt:
"${text}"`

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
    let aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // Clean markdown wraps
    aiText = aiText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    let parsedCards = []
    try {
      parsedCards = JSON.parse(aiText)
    } catch {
      console.error('Failed to parse AI output as JSON:', aiText)
      return res.status(502).json({ error: 'AI response did not match JSON array structure' })
    }

    return res.status(200).json({ flashcards: parsedCards })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return res.status(500).json({ error: errorMessage })
  }
}
