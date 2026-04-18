import MarkdownIt from 'markdown-it';

const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: false,
});

function preprocessMarkdown(content: string): string {
  if (!content) return '';

  let text = content.replace(/\r\n/g, '\n').trim();

  // Unwrap markdown code block if the entire content is wrapped
  if (text.startsWith('```markdown') && text.endsWith('```')) {
    text = text.substring(11, text.length - 3).trim();
  }

  const lines = text.split('\n');
  const result: string[] = [];

  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (!inCodeBlock) {
      // Ensure block elements have empty line above
      if (trimmed.startsWith('|') || trimmed.startsWith('#') || !!trimmed.match(/^([*-]|\d+\.) /)) {
        if (result.length > 0) {
          const last = result[result.length - 1].trim();
          if (last !== '' && !last.startsWith('|') && !last.startsWith('#') && !last.match(/^([*-]|\d+\.) /)) {
            result.push('');
          }
        }
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

export function renderMarkdown(content: string): string {
  if (!content) return '';
  const cleanContent = preprocessMarkdown(content);
  return md.render(cleanContent);
}
