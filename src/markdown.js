/**
 * 极简 Markdown 渲染器（零依赖）
 * 支持: h1-h6 / 段落 / 无序&有序列表 / 引用 / 分隔线 / 围栏代码块(可带文件名) /
 *       行内代码 / 粗体 / 斜体 / 链接 / 图片
 * 代码围栏写法: ```python monitor.py  → 渲染成带文件名和复制按钮的代码卡
 */

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const slugify = text =>
  text.toLowerCase().trim().replace(/[^\w\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '') || 'section';

const inline = text => esc(text)
  .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy">')
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(—-])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  .replace(/(^|[\s(—-])_([^_\n]+)_/g, '$1<em>$2</em>');

function codeHtml(info, code) {
  const [lang = '', file = ''] = info.split(/\s+/).filter(Boolean);
  const body = `<pre><code class="lang-${esc(lang)}">${esc(code)}</code></pre>`;
  if (!file) return `<div class="code-plain">${body}</div>`;
  return `<figure class="code-block"><figcaption><b>${esc(file)}</b><button class="copy-btn" data-copy type="button">Copy</button></figcaption>${body}</figure>`;
}

export function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw.trim() };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      data[kv[1]] = value.slice(1, -1).split(',').map(v => v.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      data[kv[1]] = value.replace(/^["']|["']$/g, '');
    }
  }
  return { data, body: m[2].trim() };
}

const BLOCK_START = /^(#{1,6}\s|```|>\s?|[-*]\s+|\d+\.\s+)/;

export function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const headings = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    if (line.startsWith('```')) {
      const info = line.slice(3).trim();
      const code = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++; }
      i++;
      blocks.push(codeHtml(info, code.join('\n')));
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slugify(text);
      headings.push({ level, text, id });
      blocks.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push('<hr>'); i++; continue; }

    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, '')); i++; }
      blocks.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^[-*]\s+/, '')); i++; }
      blocks.push(`<ul>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++; }
      blocks.push(`<ol>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ol>`);
      continue;
    }

    const buf = [];
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i]) && !lines[i].startsWith('```')) {
      buf.push(lines[i].trim());
      i++;
    }
    if (buf.length) blocks.push(`<p>${inline(buf.join(' '))}</p>`);
  }

  return { html: blocks.join('\n'), headings };
}
