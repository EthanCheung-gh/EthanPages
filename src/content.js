import { parseFrontmatter, renderMarkdown } from './markdown.js';

// 构建时把 content/writing/*.md 全部打进打包产物；新增/修改 md 后重新构建即可生效
const files = import.meta.glob('../content/writing/*.md', { query: '?raw', import: 'default', eager: true });

const readingTime = body => {
  const words = body.replace(/```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
};

export const posts = Object.entries(files)
  .map(([file, raw]) => {
    const { data, body } = parseFrontmatter(raw);
    const { html, headings } = renderMarkdown(body);
    const slug = data.slug || file.split('/').pop().replace(/\.md$/, '');
    return {
      slug,
      title: data.title || slug,
      date: data.date || '2026.01.01',
      tags: data.tags?.length ? data.tags : ['Notes'],
      summary: data.summary || '',
      read: data.read || readingTime(body),
      html,
      toc: headings.filter(h => h.level === 2),
      file,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export const findPost = slug => posts.find(p => p.slug === slug);
