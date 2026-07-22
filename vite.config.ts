import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage } from 'http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import aiHandler from './api/ai.js'
import flashcardsHandler from './api/flashcards.js'

// Helper to parse POST request JSON body in Vite dev server
function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk: string) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(data))
      } catch {
        resolve({})
      }
    })
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Populate process.env so serverless functions can read them locally
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'vercel-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/ai')) {
              try {
                const body = await parseBody(req)
                const vercelReq = req as unknown as VercelRequest
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                vercelReq.body = body

                const vercelRes = res as unknown as VercelResponse
                vercelRes.status = function (code: number) {
                  res.statusCode = code
                  return this
                }
                vercelRes.json = function (payload: unknown) {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(payload))
                  return this
                }
                vercelRes.send = function (payload: unknown) {
                  res.end(payload)
                  return this
                }

                await aiHandler(vercelReq, vercelRes)
              } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : 'Internal dev server error'
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: errMsg }))
              }
              return
            }

            if (req.url?.startsWith('/api/flashcards')) {
              try {
                const body = await parseBody(req)
                const vercelReq = req as unknown as VercelRequest
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                vercelReq.body = body

                const vercelRes = res as unknown as VercelResponse
                vercelRes.status = function (code: number) {
                  res.statusCode = code
                  return this
                }
                vercelRes.json = function (payload: unknown) {
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify(payload))
                  return this
                }
                vercelRes.send = function (payload: unknown) {
                  res.end(payload)
                  return this
                }

                await flashcardsHandler(vercelReq, vercelRes)
              } catch (err: unknown) {
                const errMsg = err instanceof Error ? err.message : 'Internal dev server error'
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: errMsg }))
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
