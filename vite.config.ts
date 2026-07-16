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
                      prompt = `Explain the following text excerpt in a clear, educational, and engaging manner. Break it down into Core Concepts, Context/Relevance, and Practical Takeaways. Use bold text, lists, and headings starting with ###.\n\nText:\n"${text}"`
                      break
                    case 'summarize':
                      prompt = `Provide a concise, high-level summary of the following excerpt. Capture the main ideas and core takeaways in markdown.\n\nText:\n"${text}"`
                      break
                    case 'key-points':
                      prompt = `Extract the most important bullet points and key takeaways from the following text using markdown list formatting.\n\nText:\n"${text}"`
                      break
                    case 'simplify':
                      prompt = `Simplify the language of the following excerpt so it's extremely easy to understand, similar to explaining it to a beginner or child. Use analogies if appropriate.\n\nText:\n"${text}"`
                      break
                    case 'translate':
                      prompt = `Translate the following text excerpt accurately into ${language || 'the active app languageSetting'}. Maintain the original tone and context.\n\nText:\n"${text}"`
                      break
                    default:
                      prompt = `Process this text excerpt:\n"${text}"`
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
            next()
          })
        },
      },
    ],
  }
})
