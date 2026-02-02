/**
 * Lightweight Markdown → HTML renderer.
 * Handles: headers, bold, italic, inline code, code blocks, links,
 * unordered lists, ordered lists, blockquotes, horizontal rules, and line breaks.
 * Output is safe (angle brackets in source text are escaped).
 */
export function renderMarkdown(src: string): string {
  /* Escape HTML entities first */
  let html = src
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  /* Fenced code blocks (``` ... ```) */
  html = html.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.slice(3, -3).replace(/^\n/, '').replace(/\n$/, '');
    return `<pre class="md-code-block">${code}</pre>`;
  });

  const lines = html.split('\n');
  const result: string[] = [];
  let inList: 'ul' | 'ol' | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    /* Skip if inside a pre block (already handled) */
    if (line.startsWith('<pre')) {
      /* Collect all lines until closing </pre> */
      let block = line;
      while (!line.includes('</pre>') && i + 1 < lines.length) {
        i++;
        line = lines[i];
        block += '\n' + line;
      }
      closeList();
      result.push(block);
      continue;
    }

    /* Horizontal rule */
    if (/^---+$/.test(line.trim())) {
      closeList();
      result.push('<hr class="md-hr" />');
      continue;
    }

    /* Headers */
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      closeList();
      const level = headerMatch[1].length;
      result.push(`<h${level} class="md-h${level}">${inlineFormat(headerMatch[2])}</h${level}>`);
      continue;
    }

    /* Blockquote */
    if (line.startsWith('&gt; ')) {
      closeList();
      result.push(`<blockquote class="md-quote">${inlineFormat(line.slice(5))}</blockquote>`);
      continue;
    }

    /* Unordered list item */
    const ulMatch = line.match(/^[\-*]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        closeList();
        result.push('<ul class="md-ul">');
        inList = 'ul';
      }
      result.push(`<li>${inlineFormat(ulMatch[1])}</li>`);
      continue;
    }

    /* Ordered list item */
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        closeList();
        result.push('<ol class="md-ol">');
        inList = 'ol';
      }
      result.push(`<li>${inlineFormat(olMatch[1])}</li>`);
      continue;
    }

    /* Close any open list before a regular paragraph */
    closeList();

    /* Empty line → spacing */
    if (line.trim() === '') {
      result.push('<br />');
      continue;
    }

    /* Regular paragraph */
    result.push(`<p class="md-p">${inlineFormat(line)}</p>`);
  }

  closeList();
  return result.join('\n');

  function closeList() {
    if (inList === 'ul') result.push('</ul>');
    if (inList === 'ol') result.push('</ol>');
    inList = null;
  }
}

/** Inline formatting: bold, italic, code, links, strikethrough */
function inlineFormat(text: string): string {
  return text
    /* Inline code (must go first to prevent inner formatting) */
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    /* Bold + italic */
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    /* Bold */
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    /* Italic */
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    /* Strikethrough */
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    /* Links [text](url) */
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
}
