export type AiActionType = 'explain' | 'summarize' | 'key-points' | 'simplify' | 'translate'

export interface AIProvider {
  runAction(text: string, action: AiActionType, language?: string): Promise<string>
}

export class GeminiProvider implements AIProvider {
  async runAction(text: string, action: AiActionType, language: string = 'en-US'): Promise<string> {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, action, language }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const status = response.status

        if (status === 401 || status === 403) {
          throw new Error('Invalid API Key or authorization error with Gemini.')
        } else if (status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please wait a moment before trying again.')
        } else if (status === 504) {
          throw new Error('Gemini request timed out. Please try again.')
        } else {
          throw new Error(errData.error || `Gemini API returned error code ${status}`)
        }
      }

      const data = await response.json()
      if (!data.response) {
        throw new Error('Received an empty response from Gemini AI.')
      }

      return data.response
    } catch (err: any) {
      console.error('AI provider error:', err)
      if (err.message?.includes('Failed to fetch')) {
        throw new Error('Network failure. Please check your internet connection and try again.')
      }
      throw err
    }
  }
}

// Default instance using the GeminiProvider
const defaultProvider: AIProvider = new GeminiProvider()

export const aiService = {
  async runAiAction(text: string, action: AiActionType, language: string = 'en-US'): Promise<string> {
    return defaultProvider.runAction(text, action, language)
  },
}
