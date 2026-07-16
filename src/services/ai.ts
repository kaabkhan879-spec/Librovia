export type AiActionType = 'explain' | 'summarize' | 'key-points' | 'simplify' | 'translate'

export const aiService = {
  async runAiAction(text: string, action: AiActionType, language: string = 'en-US'): Promise<string> {
    // Simulate real network delay (800ms - 1500ms) for high-fidelity Linear-style experience
    const delay = 800 + Math.random() * 700
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Handle failure simulation (1% rate or if string is empty)
    if (!text || text.trim().length === 0) {
      throw new Error('Empty text selected')
    }

    const cleanText = text.trim()
    const truncatedText = cleanText.length > 60 ? cleanText.substring(0, 57) + '...' : cleanText

    switch (action) {
      case 'explain':
        return `### 💡 Explanation

Here is a simplified explanation of: *"${truncatedText}"*

1. **Core Concept**: This passage highlights the fundamental process of habits formation. Repeating small tasks builds mental paths.
2. **Context**: In cognitive science, this relates directly to neural automation to conserve energy.
3. **Application**: Apply this concept by isolating the primary cue, simplifying your environment, and immediately rewarding the desired behavior.`

      case 'summarize':
        return `### 📝 Summary

The selected excerpt *"${truncatedText}"* emphasizes that small, incremental improvements lead to compounding long-term results. By understanding these cues, readers can construct self-reinforcing systems that automate focus.`

      case 'key-points':
        return `### 💡 Key Takeaways

* **Systemic Compounding**: Small shifts in habit structure yield exponential growth.
* **Environmental Cueing**: Redesigning spatial structures prompts positive reinforcement.
* **Friction Optimization**: Reducing starting friction is key to consistent daily practice.`

      case 'simplify':
        return `### 📚 Simplified (ELIF)

In simple terms:
When you want to build a new habit, make it as easy as possible to start. Focus on showing up every single day for just two minutes, rather than trying to do everything perfectly from day one. Repetition builds the path.`

      case 'translate':
        const targetLang = language.toLowerCase()
        if (targetLang.includes('es')) {
          return `### 🌍 Traducción (Spanish)

*"${cleanText}"*

**Explicación:** Este fragmento se centra en cómo las pequeñas acciones consistentes y la optimización del entorno conducen a hábitos automáticos duraderos.`
        } else if (targetLang.includes('fr')) {
          return `### 🌍 Traduction (French)

*"${cleanText}"*

**Explication:** Cet extrait souligne l'importance des petits changements réguliers et de la structure de l'environnement pour instaurer des habitudes durables.`
        } else if (targetLang.includes('de')) {
          return `### 🌍 Übersetzung (German)

*"${cleanText}"*

**Erklärung:** Dieser Auszug hebt hervor, wie kleine, beständige Gewohnheiten und die Optimierung der Umgebung zu dauerhaften automatischen Verhaltensweisen führen.`
        } else {
          return `### 🌍 Translation

*"${cleanText}"*

**Note:** Translated to your active application language setting (${language}). Small daily actions compound over time into powerful automation.`
        }

      default:
        throw new Error('Unsupported AI action')
    }
  }
}
