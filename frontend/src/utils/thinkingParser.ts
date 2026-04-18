/**
 * 解析消息文本中的 <think>...</think> 或 <thinking>...</thinking> 标签
 * 将其转换为 reasoning 类型的 part
 */
export function parseThinkingTags(text: string): Array<{ type: 'text' | 'reasoning'; text: string }> {
  if (!text) return [{ type: 'text', text: '' }];

  const results: Array<{ type: 'text' | 'reasoning'; text: string }> = [];
  
  // 匹配 <think>...</think> 或 <thinking>...</thinking> 标签
  const thinkRegex = /<(think|thinking)>([\s\S]*?)<\/\1>/gi;
  
  let lastIndex = 0;
  let match;

  while ((match = thinkRegex.exec(text)) !== null) {
    // 添加标签前的普通文本
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index).trim();
      if (beforeText) {
        results.push({ type: 'text', text: beforeText });
      }
    }

    // 添加 thinking 内容
    const thinkContent = match[2].trim();
    if (thinkContent) {
      results.push({ type: 'reasoning', text: thinkContent });
    }

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的普通文本
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      results.push({ type: 'text', text: remainingText });
    }
  }

  // 如果没有匹配到任何标签，返回原始文本
  if (results.length === 0 && text.trim()) {
    results.push({ type: 'text', text: text.trim() });
  }

  return results;
}

/**
 * 处理 part 文本，解析其中的 thinking 标签
 */
export function processPartText(part: { type: string; text: string }): Array<{ type: string; text: string }> {
  if (part.type !== 'text' || !part.text) {
    return [part];
  }

  const parsed = parseThinkingTags(part.text);
  
  // 如果解析后只有一个 text 类型的结果，直接返回原 part
  if (parsed.length === 1 && parsed[0].type === 'text') {
    return [part];
  }

  return parsed;
}
