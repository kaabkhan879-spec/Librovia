import React from 'react'

interface MarkdownRendererProps {
  text: string
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  if (!text) return null

  // Split content into blocks by double newlines
  const blocks = text.split(/\n\n+/)

  return (
    <div className="text-slate-850 dark:text-slate-150 space-y-4 font-sans text-[11px] leading-relaxed">
      {blocks.map((block, idx) => {
        const trimmed = block.trim()
        if (!trimmed) return null

        // 1. Code Block
        if (trimmed.startsWith('```')) {
          const lines = trimmed.split('\n')
          const language = lines[0].replace('```', '').trim()
          const code = lines
            .slice(1, lines.length - (lines[lines.length - 1] === '```' ? 1 : 0))
            .join('\n')
          return (
            <pre
              key={idx}
              className="my-2 overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950 p-4 font-mono text-[9.5px] text-slate-100 dark:bg-slate-900"
            >
              {language && (
                <div className="mb-2 text-[7.5px] font-black tracking-widest text-slate-500 uppercase">
                  {language}
                </div>
              )}
              <code>{code}</code>
            </pre>
          )
        }

        // 2. Table
        if (trimmed.startsWith('|') && trimmed.includes('\n|')) {
          const lines = trimmed
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean)
          const rows = lines.map((line) => {
            return line
              .split('|')
              .map((cell) => cell.trim())
              .filter((_, index, arr) => index > 0 && index < arr.length - 1)
          })
          if (rows.length > 0) {
            const headers = rows[0]
            const hasSeparator = rows[1] && rows[1].every((cell) => cell.startsWith('-'))
            const bodyRows = hasSeparator ? rows.slice(2) : rows.slice(1)

            return (
              <div
                key={idx}
                className="my-3 overflow-x-auto rounded-2xl border border-slate-100 shadow-xs dark:border-slate-800/60"
              >
                <table className="divide-slate-150 min-w-full border-collapse divide-y text-left dark:divide-slate-800">
                  <thead className="bg-slate-50 text-[8.5px] font-extrabold tracking-widest text-slate-400 uppercase dark:bg-slate-950/45">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="px-3.5 py-2.5 font-black">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-[10px] font-medium text-slate-700 dark:divide-slate-800/60 dark:bg-slate-900 dark:text-slate-300">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="dark:hover:bg-slate-850/40 hover:bg-slate-50/50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3.5 py-2.5 whitespace-pre-wrap">
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        }

        // 3. Headings
        if (trimmed.startsWith('#')) {
          const match = trimmed.match(/^(#{1,6})\s+(.*)$/)
          if (match) {
            const level = match[1].length
            const headingText = match[2]
            const parsed = parseInline(headingText)
            if (level === 1)
              return (
                <h1
                  key={idx}
                  className="border-b border-slate-100 pt-2.5 pb-1 text-sm font-black text-slate-900 dark:border-slate-800 dark:text-white"
                >
                  {parsed}
                </h1>
              )
            if (level === 2)
              return (
                <h2 key={idx} className="pt-2 text-xs font-black text-slate-900 dark:text-white">
                  {parsed}
                </h2>
              )
            return (
              <h3
                key={idx}
                className="pt-1 text-[11px] font-extrabold text-slate-900 dark:text-white"
              >
                {parsed}
              </h3>
            )
          }
        }

        // 4. Bullet List
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
          const items = trimmed.split(/\n(?:[*-•]\s+)/).map((item) => {
            return item.replace(/^[*-•]\s+/, '')
          })
          return (
            <ul
              key={idx}
              className="text-slate-755 my-1 list-disc space-y-1 pl-5 dark:text-slate-200"
            >
              {items.map((item, i) => (
                <li key={i}>{parseInline(item)}</li>
              ))}
            </ul>
          )
        }

        // 5. Numbered List
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split(/\n(?:\d+\.\s+)/).map((item) => {
            return item.replace(/^\d+\.\s+/, '')
          })
          return (
            <ol
              key={idx}
              className="text-slate-755 my-1 list-decimal space-y-1 pl-5 dark:text-slate-200"
            >
              {items.map((item, i) => (
                <li key={i}>{parseInline(item)}</li>
              ))}
            </ol>
          )
        }

        // 6. Normal Paragraph
        const lines = trimmed.split('\n')
        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {parseInline(line)}
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let currentText = text
  let index = 0

  while (currentText.length > 0) {
    const boldMatch = currentText.match(/^([^*]*)\*\*([^*]+)\*\*(.*)$/)
    const italicMatch = currentText.match(/^([^*]*)\*([^*]+)\*(.*)$/)
    const codeMatch = currentText.match(/^([^`]*)`([^`]+)`(.*)$/)

    const matches = [
      boldMatch ? { type: 'bold', index: boldMatch[1].length, match: boldMatch } : null,
      italicMatch ? { type: 'italic', index: italicMatch[1].length, match: italicMatch } : null,
      codeMatch ? { type: 'code', index: codeMatch[1].length, match: codeMatch } : null,
    ].filter(Boolean) as Array<{ type: string; index: number; match: RegExpMatchArray }>

    if (matches.length === 0) {
      parts.push(<span key={index}>{currentText}</span>)
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    if (first.type === 'bold') {
      const [, prefix, content, suffix] = first.match
      if (prefix) parts.push(<span key={index++}>{prefix}</span>)
      parts.push(
        <strong key={index++} className="font-extrabold text-slate-950 dark:text-white">
          {content}
        </strong>
      )
      currentText = suffix
    } else if (first.type === 'italic') {
      const [, prefix, content, suffix] = first.match
      if (prefix) parts.push(<span key={index++}>{prefix}</span>)
      parts.push(
        <em key={index++} className="italic">
          {content}
        </em>
      )
      currentText = suffix
    } else if (first.type === 'code') {
      const [, prefix, content, suffix] = first.match
      if (prefix) parts.push(<span key={index++}>{prefix}</span>)
      parts.push(
        <code
          key={index++}
          className="text-purple-650 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] dark:bg-slate-800 dark:text-purple-400"
        >
          {content}
        </code>
      )
      currentText = suffix
    }
  }

  return parts
}
