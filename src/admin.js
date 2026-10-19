/**
 * /admin — GitHub 提交版博客后台
 * 用 PAT + Contents API 把 Markdown 写入仓库，由 GitHub Actions 自动构建部署。
 * 本地离线备用：npm run admin → http://127.0.0.1:8787（写完即重建）
 */

const API = 'https://api.github.com';
const CFG_KEY = 'ethan-admin-config';
const TOKEN_KEY = 'ethan-admin-token';
const DIR = 'content/writing';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const b64encode = str => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
};
const b64decode = str => {
  const bin = atob(str.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const slugify = text => String(text).toLowerCase().trim()
  .replace(/\.[a-z0-9]+$/, '')
  .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  .replace(/^-+|-+$/g, '');

function readConfig() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch { saved = {}; }
  const token = sessionStorage.getItem(TOKEN_KEY) || (saved.remember ? localStorage.getItem(TOKEN_KEY) : '') || '';
  return { owner: saved.owner || '', repo: saved.repo || '', branch: saved.branch || 'main', remember: !!saved.remember, token };
}

function saveConfig({ owner, repo, branch, remember, token }) {
  localStorage.setItem(CFG_KEY, JSON.stringify({ owner, repo, branch, remember }));
  if (token) {
    if (remember) { localStorage.setItem(TOKEN_KEY, token); sessionStorage.removeItem(TOKEN_KEY); }
    else { sessionStorage.setItem(TOKEN_KEY, token); localStorage.removeItem(TOKEN_KEY); }
  }
}

const template = () => `---
title: Your title here
date: ${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}
tags: [Engineering, Notes]
summary: One sentence that earns the click.
---

## First section

Write the argument, not the announcement.
`;

export function adminPage(base, defaultOwner) {
  const cfg = readConfig();
  const actionsUrl = cfg.owner && cfg.repo ? `https://github.com/${cfg.owner}/${cfg.repo}/actions` : 'https://github.com';
  return `<main class="page">
    <section class="page-hero"><div class="container">
      <div class="page-index">ADMIN · GITHUB COMMIT</div>
      <h1 class="section-title">Blog Admin</h1>
      <p class="lede">用 GitHub Contents API 提交 Markdown：每次发布是一个 commit，GitHub Actions 自动构建并部署，约 1–2 分钟后线上生效。令牌只保存在你自己的浏览器里。</p>
      <div class="detail-links"><a class="chip" href="${actionsUrl}" target="_blank" rel="noreferrer">Actions ↗</a><span class="chip">本地备用：npm run admin</span></div>
    </div></section>

    <section class="container admin-section" id="admin-root">
      <div class="admin-grid">
        <div class="admin-col">
          <div class="card">
            <div class="card-top"><span>Connection</span><span id="conn-state">not connected</span></div>
            <div class="admin-fields">
              <label>Owner<input type="text" id="gh-owner" value="${esc(cfg.owner || defaultOwner)}" placeholder="EthanCheung-gh" spellcheck="false"></label>
              <label>Repo<input type="text" id="gh-repo" value="${esc(cfg.repo || 'EthanPages')}" placeholder="EthanPages" spellcheck="false"></label>
              <label>Branch<input type="text" id="gh-branch" value="${esc(cfg.branch)}" placeholder="main" spellcheck="false"></label>
              <label>PAT (Contents: Read and write)<input type="password" id="gh-token" value="${esc(cfg.token)}" placeholder="github_pat_…" spellcheck="false" autocomplete="off"></label>
            </div>
            <label class="admin-check"><input type="checkbox" id="gh-remember" ${cfg.remember ? 'checked' : ''}> 记住令牌（写入本机 localStorage，公共设备勿勾选）</label>
            <div class="admin-row">
              <button class="btn btn-primary" id="btn-connect" type="button">连接并读取</button>
              <button class="btn btn-glass" id="btn-forget" type="button">清除令牌</button>
            </div>
            <p class="admin-hint">令牌创建：GitHub → Settings → Developer settings → Fine-grained tokens，仅勾选该仓库的 <code>Contents: Read and write</code>。</p>
          </div>

          <div class="card">
            <div class="card-top"><span>Editor</span><span id="edit-state">new post</span></div>
            <div class="admin-fields">
              <label>文件名 / slug<input type="text" id="post-slug" placeholder="留空则按标题生成" spellcheck="false"></label>
            </div>
            <textarea id="post-body" class="admin-editor" spellcheck="false" placeholder="粘贴或书写 Markdown…"></textarea>
            <div class="admin-row">
              <button class="btn btn-glass" id="btn-template" type="button">插入模板</button>
              <button class="btn btn-glass" id="btn-load" type="button">从文件导入</button>
              <button class="btn btn-primary" id="btn-publish" type="button">提交到 GitHub →</button>
            </div>
            <div class="admin-log" id="admin-log">等待连接…</div>
          </div>
        </div>

        <div class="admin-col">
          <div class="card">
            <div class="card-top"><span>content/writing</span><span id="file-count">0 files</span></div>
            <div class="admin-files" id="admin-files"><p class="admin-hint">连接后列出仓库中的 Markdown 文件。</p></div>
          </div>
        </div>
      </div>
    </section>
  </main>`;
}

export function initAdmin({ base = '' } = {}) {
  const root = document.getElementById('admin-root');
  if (!root) return;

  const $ = sel => root.querySelector(sel);
  const log = (msg, cls = '') => { $('#admin-log').innerHTML = `<span class="${cls}">${esc(msg).replace(/\n/g, '<br>')}</span>`; };
  const state = { files: [], editing: null, connected: false };

  const cfg = () => ({
    owner: $('#gh-owner').value.trim(),
    repo: $('#gh-repo').value.trim(),
    branch: $('#gh-branch').value.trim() || 'main',
    remember: $('#gh-remember').checked,
    token: $('#gh-token').value.trim(),
  });

  async function api(pathname, { method = 'GET', body } = {}) {
    const { owner, repo, token } = cfg();
    if (!token) throw new Error('缺少 PAT：先填写令牌再连接');
    const res = await fetch(`${API}/repos/${owner}/${repo}${pathname}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) throw new Error('401 令牌无效或已过期');
    if (res.status === 403) throw new Error('403 权限不足（需要 Contents: Read and write）或触发限流');
    if (res.status === 404) throw new Error('404 仓库/分支/路径不存在，检查 owner、repo、branch');
    if (res.status === 409) throw new Error('409 该文件已被其他人修改（sha 冲突），重新读取后再提交');
    if (!res.ok) throw new Error(`${res.status} ${await res.text().then(t => t.slice(0, 200))}`);
    return res.status === 204 ? {} : res.json();
  }

  async function loadFiles() {
    const list = await api(`/contents/${DIR}?ref=${encodeURIComponent(cfg().branch)}`);
    state.files = (Array.isArray(list) ? list : []).filter(f => f.name.endsWith('.md')).sort((a, b) => a.name.localeCompare(b.name));
    $('#file-count').textContent = `${state.files.length} files`;
    $('#admin-files').innerHTML = state.files.map(f => `
      <div class="admin-file">
        <div><b>${esc(f.name)}</b><small>${(f.size / 1024).toFixed(1)} KB</small></div>
        <div class="admin-file-acts">
          <button class="chip" data-load="${esc(f.name)}" type="button">编辑</button>
          <button class="chip danger" data-del="${esc(f.name)}" type="button">删除</button>
        </div>
      </div>`).join('') || '<p class="admin-hint">目录为空。</p>';
  }

  async function connect() {
    try {
      log('连接中…');
      saveConfig(cfg());
      const repoInfo = await api('');
      state.connected = true;
      $('#conn-state').textContent = `${repoInfo.full_name}@${cfg().branch}`;
      await loadFiles();
      log(`✓ 已连接 ${repoInfo.full_name} · ${state.files.length} 篇文章`, 'ok');
      const { owner, repo } = cfg();
      const actions = root.querySelector('.detail-links a.chip');
      if (actions) actions.href = `https://github.com/${owner}/${repo}/actions`;
    } catch (e) {
      state.connected = false;
      $('#conn-state').textContent = 'not connected';
      log(`✗ ${e.message}`, 'err');
    }
  }

  async function openFile(name) {
    try {
      const data = await api(`/contents/${DIR}/${encodeURIComponent(name)}?ref=${encodeURIComponent(cfg().branch)}`);
      const md = b64decode(data.content || '');
      $('#post-body').value = md;
      $('#post-slug').value = name.replace(/\.md$/, '');
      state.editing = { name, sha: data.sha };
      $('#edit-state').textContent = `editing ${name}`;
      window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' });
      log(`已载入 ${name}（sha ${data.sha.slice(0, 7)}）`);
    } catch (e) { log(`✗ ${e.message}`, 'err'); }
  }

  async function publish() {
    const md = $('#post-body').value.trim();
    if (!md) return log('内容为空', 'err');
    const fm = md.match(/^---\r?\n[\s\S]*?\r?\n---/);
    const title = md.match(/^title:\s*(.+)$/m)?.[1]?.trim();
    if (!fm) return log('缺少 frontmatter（--- 包裹的头部）。点「插入模板」开始。', 'err');
    if (!title) return log('frontmatter 缺少 title 字段', 'err');

    const slug = slugify($('#post-slug').value.trim() || title);
    if (!slug) return log('无法生成 slug，请手动填写文件名', 'err');
    const name = `${slug}.md`;
    const { branch, remember, token } = cfg();
    saveConfig(cfg());

    $('#btn-publish').disabled = true;
    log(`提交 ${name} 到 ${cfg().owner}/${cfg().repo}@${branch}…`);
    try {
      let sha = state.editing?.name === name ? state.editing.sha : undefined;
      if (!sha && state.files.some(f => f.name === name)) {
        const existing = await api(`/contents/${DIR}/${name}?ref=${encodeURIComponent(branch)}`);
        sha = existing.sha;
      }
      const result = await api(`/contents/${DIR}/${name}`, {
        method: 'PUT',
        body: {
          message: `${sha ? 'post: update' : 'post: add'} ${slug}`,
          content: b64encode(md),
          branch,
          ...(sha ? { sha } : {}),
        },
      });
      const { owner, repo } = cfg();
      log(`✓ 已提交 ${name}\ncommit ${result.commit?.sha?.slice(0, 7) || ''} — ${sha ? '更新' : '新建'}\nActions 构建约 1–2 分钟后上线：github.com/${owner}/${repo}/actions`, 'ok');
      state.editing = { name, sha: result.content?.sha };
      $('#edit-state').textContent = `editing ${name}`;
      $('#post-slug').value = slug;
      await loadFiles();
    } catch (e) {
      log(`✗ ${e.message}`, 'err');
    } finally {
      $('#btn-publish').disabled = false;
    }
    if (remember !== $('#gh-remember').checked) saveConfig(cfg());
    void token;
  }

  async function remove(name) {
    if (!confirm(`从仓库删除 ${name}？`)) return;
    try {
      const { branch } = cfg();
      const data = await api(`/contents/${DIR}/${encodeURIComponent(name)}?ref=${encodeURIComponent(branch)}`);
      const res = await api(`/contents/${DIR}/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        body: { message: `post: delete ${name.replace(/\.md$/, '')}`, sha: data.sha, branch },
      });
      log(`✓ 已删除 ${name}（commit ${res.commit?.sha?.slice(0, 7) || ''}）`, 'ok');
      if (state.editing?.name === name) { state.editing = null; $('#edit-state').textContent = 'new post'; }
      await loadFiles();
    } catch (e) { log(`✗ ${e.message}`, 'err'); }
  }

  $('#btn-connect').addEventListener('click', connect);
  $('#btn-publish').addEventListener('click', publish);
  $('#btn-template').addEventListener('click', () => {
    if (!$('#post-body').value.trim()) $('#post-body').value = template();
    log('已插入 frontmatter 模板');
  });
  $('#btn-load').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,text/markdown';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        $('#post-body').value = reader.result;
        if (!$('#post-slug').value) $('#post-slug').value = file.name.replace(/\.md$/, '');
        log(`已载入 ${file.name} — 检查后提交`);
      };
      reader.readAsText(file);
    };
    input.click();
  });
  $('#btn-forget').addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    $('#gh-token').value = '';
    state.connected = false;
    $('#conn-state').textContent = 'not connected';
    log('已清除本机保存的令牌');
  });

  $('#admin-files').addEventListener('click', e => {
    const load = e.target.closest('[data-load]');
    const del = e.target.closest('[data-del]');
    if (load) openFile(load.dataset.load);
    if (del) remove(del.dataset.del);
  });

  if (cfg().token) {
    log(`检测到已保存令牌，点击「连接并读取」验证（站点路径 ${base || '/'}）`);
    connect();
  } else {
    log('填写 Owner / Repo / PAT 后点击「连接并读取」。本地离线备用：npm run admin');
  }
}
