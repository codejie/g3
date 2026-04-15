import MarkdownIt from 'markdown-it'
import { createHighlighter } from 'shiki'
import { normalizeLanguage, isSupportedLanguage } from './languageUtils'

let highlighter: any = null

async function initHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['javascript', 'typescript', 'vue', 'css', 'html', 'json', 'markdown', 'bash', 'python', 'go', 'rust', 'yaml']
    })
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
  highlight: (str: string, lang: string): string => {
    const l = normalizeLanguage(lang)
    if (highlighter) {
      if (highlighter.getLoadedLanguages().includes(l)) {
        try {
          return highlighter.codeToHtml(str, {
            lang: l,
            theme: 'github-light'
          })
        } catch (e) {
          console.error('Shiki highlight error:', e)
        }
      } else if (isSupportedLanguage(l)) {
        highlighter.loadLanguage(l).catch(() => {})
      }
    }
    return `<pre class="shiki" data-lang="${l}"><code>${escapeHtml(str)}</code></pre>`
  }
})

initHighlighter().catch(console.error)

/**
 * 健壮的预处理：
 * 1. 自动解开模型全包裹的 markdown 代码块。
 * 2. 确保表格、列表、标题等块级元素与周围文字有空行隔离。
 */
function preprocessMarkdown(content: string): string {
  if (!content) return ''

  let text = content.replace(/\r\n/g, '\n').trim()

  // 1. 仅在整个内容被 ```markdown 完全包裹时才进行解包
  // 此时模型回复中可能不仅包含表格，还可能包含普通的文字和其他内容
  if (text.startsWith('```markdown') && text.endsWith('```')) {
    text = text.substring(11, text.length - 3).trim()
  }

  const lines = text.split('\n')
  const result: string[] = []

  let inCodeBlock = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // 跟踪代码块状态，避免在代码块内部错误地插入空行
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock
      result.push(line)
      continue
    }

    if (!inCodeBlock) {
      // 核心修复：确保块级元素与上方文字之间有空行
      if (trimmed.startsWith('|') || trimmed.startsWith('#') || !!trimmed.match(/^([*-]|\d+\.) /)) {
        if (result.length > 0) {
          const last = result[result.length - 1].trim()
          // 如果上一行是非空且非同类型的行，则插入空行
          if (last !== '' && !last.startsWith('|') && !last.startsWith('#') && !last.match(/^([*-]|\d+\.) /)) {
            result.push('')
          }
        }
      }

      // 核心修复：确保块级元素与下方文字之间有空行（如果下方不是同类型的块）
      // ... 逻辑已由上方的“向上看”覆盖
    }

    result.push(line)
  }

  return result.join('\n')
}

export function renderMarkdown(content: string): string {
  if (!content) return ''
  const cleanContent = preprocessMarkdown(content)
  return md.render(cleanContent)
}
