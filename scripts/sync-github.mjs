#!/usr/bin/env node
/**
 * 从 GitHub 拉取公开仓库，生成 src/data/github-projects.json
 *
 * 用法:
 *   node scripts/sync-github.mjs                 # 使用 project-overrides.json 里的 user
 *   GH_USER=someone node scripts/sync-github.mjs # 临时覆盖账号
 *   GITHUB_TOKEN=ghp_xxx node scripts/sync-github.mjs  # 提高限流额度(60/h -> 5000/h)
 *   INCLUDE_FORKS=1 node scripts/sync-github.mjs # 连 fork 一起收录
 *
 * 人工策展字段（文案、分类、精选、配色、在线预览）写在 src/data/project-overrides.json，
 * 这里只负责把 API 的真实数据（语言、star、license、创建/推送时间）并进去。
 */
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OVERRIDES_PATH = path.join(ROOT, 'src/data/project-overrides.json');
const OUT_PATH = path.join(ROOT, 'src/data/github-projects.json');

const override = JSON.parse(await fs.readFile(OVERRIDES_PATH, 'utf8'));
const USER = process.env.GH_USER || override.user;
const INCLUDE_FORKS = process.env.INCLUDE_FORKS === '1' || override.includeForks === true;
const TOKEN = process.env.GITHUB_TOKEN || '';

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ethan-pages-sync' };
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function api(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${url}\n${body.slice(0, 300)}`);
  }
  return res.json();
}

const YEAR = () => new Date().getFullYear();

const NOISE = new Set(['CSS', 'HTML', 'SCSS', 'Less', 'Shell', 'Dockerfile', 'Makefile', 'Batchfile']);

function pickStack(languages = {}, topics = [], limit = 4) {
  const names = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
    .filter(name => !NOISE.has(name));
  // TypeScript 项目不必再列 JavaScript
  const cleaned = names.includes('TypeScript') ? names.filter(n => n !== 'JavaScript') : names;
  return [...new Set([...cleaned, ...topics])].slice(0, limit);
}

const repos = await api(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`);
const selected = repos
  .filter(r => INCLUDE_FORKS || !r.fork)
  .sort((a, b) => {
    const oa = override.repos[a.name]?.order ?? 99;
    const ob = override.repos[b.name]?.order ?? 99;
    if (oa !== ob) return oa - ob;
    return new Date(b.pushed_at) - new Date(a.pushed_at);
  });

const projects = [];
for (const repo of selected) {
  const curated = override.repos[repo.name] || {};
  const languages = await api(`https://api.github.com/repos/${USER}/${repo.name}/languages`);
  const stack = curated.stack || pickStack(languages, repo.topics);
  projects.push({
    slug: (curated.slug || repo.name).toLowerCase(),
    name: curated.name || repo.name,
    repo: repo.name,
    desc: curated.desc || repo.description || `${repo.name} — ${stack.join(' · ')}`,
    category: curated.category || 'Open Source',
    status: curated.status || (repo.archived ? 'Archived' : 'Active'),
    year: String(new Date(repo.pushed_at).getFullYear() || YEAR()),
    role: curated.role || 'Creator',
    type: curated.type || (repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? 'Open Source' : 'Personal'),
    stack,
    languages,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : '—',
    created: repo.created_at.slice(0, 10),
    pushed: repo.pushed_at.slice(0, 10),
    repoUrl: repo.html_url,
    demoUrl: curated.demoUrl || repo.homepage || '',
    featured: curated.featured === true,
    accent: curated.accent || 'var(--blue)',
    accentHex: curated.accentHex || '#2870e8',
    icon: curated.icon || repo.name.slice(0, 1).toUpperCase(),
    overview: curated.overview || repo.description || '',
    highlights: curated.highlights || [],
    decisions: curated.decisions || '',
    next: curated.next || '',
    topics: repo.topics || [],
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  user: USER,
  includeForks: INCLUDE_FORKS,
  repos: selected.length,
  projects,
};

await fs.writeFile(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`✓ ${projects.length} 个项目 → src/data/github-projects.json  (user: ${USER}${TOKEN ? ', authenticated' : ''})`);
for (const p of projects) {
  console.log(`  ${p.featured ? '★' : '·'} ${p.name.padEnd(22)} ${p.stack.join('/').padEnd(28)} ★${p.stars} ${p.license} ${p.pushed}`);
}
