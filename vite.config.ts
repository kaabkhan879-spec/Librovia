import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'gemini-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/ai')) {
              if (req.method === 'POST') {
                try {
                  const body = await new Promise<any>((resolve, reject) => {
                    let data = ''
                    req.on('data', (chunk) => {
                      data += chunk
                    })
                    req.on('end', () => {
                      try {
                        resolve(JSON.parse(data))
                      } catch (err) {
                        reject(err)
                      }
                    })
                  })

                  const { text, action, language } = body
                  if (!text) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Missing text parameter' }))
                    return
                  }

                  let prompt = ''
                  const truncatedText = text.length > 300 ? text.substring(0, 300) + '...' : text

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

                  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
                  const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'

                  if (!apiKey) {
                    console.warn('GEMINI_API_KEY is not defined. Using mock AI response fallback.')

                    const delay = 800 + Math.random() * 500
                    await new Promise((resolve) => setTimeout(resolve, delay))

                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.end(
                      JSON.stringify({
                        response: `### 💡 Simulated response for ${action}\n\nThis is a simulation because the **GEMINI_API_KEY** was not configured. To enable live Gemini 2.5 Flash responses, please add your key to the \`.env\` file.\n\n* **Text:** "${truncatedText}"`,
                      })
                    )
                    return
                  }

                  // Request Gemini API
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
                    const errData = (await response.json().catch(() => ({}))) as any
                    res.statusCode = response.status
                    res.setHeader('Content-Type', 'application/json')
                    res.end(
                      JSON.stringify({
                        error:
                          errData.error?.message ||
                          `Gemini API returned error code ${response.status}`,
                      })
                    )
                    return
                  }

                  const resData = (await response.json()) as any
                  const aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text

                  if (!aiText) {
                    res.statusCode = 502
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Empty response received from Gemini API' }))
                    return
                  }

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ response: aiText }))
                } catch (error: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message || 'Internal server error' }))
                }
              }
              return
            }

            if (req.url?.startsWith('/api/flashcards')) {
              if (req.method === 'POST') {
                try {
                  const body = await new Promise<any>((resolve, reject) => {
                    let data = ''
                    req.on('data', (chunk) => {
                      data += chunk
                    })
                    req.on('end', () => {
                      try {
                        resolve(JSON.parse(data))
                      } catch (err) {
                        reject(err)
                      }
                    })
                  })

                  const { text } = body
                  if (!text) {
                    res.statusCode = 400
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'Missing text parameter' }))
                    return
                  }

                  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
                  const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'

                  const prompt = `Based on the following text excerpt, generate 2-4 high-quality, educational study Q&A flashcards.
Each flashcard should target definitions, concepts, comparisons, examples, or exam-focused questions.
Keep answers concise, clear, and easy to read.
Avoid duplicate concepts.
Output the result ONLY as a raw JSON array of objects matching the following typescript schema, without any markdown formatting wrappers or explanation text:
[{"question": "string", "answer": "string", "difficulty": "easy" | "medium" | "hard", "topic": "string"}]

Text excerpt:
"${text}"`

                  if (!apiKey) {
                    const delay = 800 + Math.random() * 500
                    await new Promise((resolve) => setTimeout(resolve, delay))

                    res.statusCode = 200
                    res.setHeader('Content-Type', 'application/json')
                    res.end(
                      JSON.stringify({
                        flashcards: [
                          {
                            question: "What is the subject of this excerpt?",
                            answer: "The excerpt discusses basic concepts: " + (text.length > 60 ? text.substring(0, 60) + "..." : text),
                            difficulty: "easy",
                            topic: "General Reading"
                          },
                          {
                            question: "Why is this text excerpt important?",
                            answer: "It introduces structural parameters and key definitions to the reader.",
                            difficulty: "medium",
                            topic: "Context"
                          }
                        ]
                      })
                    )
                    return
                  }

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
                    const errData = (await response.json().catch(() => ({}))) as any
                    res.statusCode = response.status
                    res.setHeader('Content-Type', 'application/json')
                    res.end(
                      JSON.stringify({
                        error:
                          errData.error?.message ||
                          `Gemini API returned error code ${response.status}`,
                      })
                    )
                    return
                  }

                  const resData = (await response.json()) as any
                  let aiText = resData.candidates?.[0]?.content?.parts?.[0]?.text || ''

                  // Clean markdown wraps
                  aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim()

                  let parsedCards = []
                  try {
                    parsedCards = JSON.parse(aiText)
                  } catch (parseErr) {
                    console.error('Failed to parse AI output as JSON:', aiText)
                    res.statusCode = 502
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: 'AI response did not match JSON array structure' }))
                    return
                  }

                  res.statusCode = 200
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ flashcards: parsedCards }))
                } catch (error: any) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message || 'Internal server error' }))
                }
              }
              return
            }
            next()
          })
        },
      },
    ],
  }
})
