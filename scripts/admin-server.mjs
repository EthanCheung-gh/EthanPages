#!/usr/bin/env node
/**
 * 博客后台（零依赖）：上传 / 删除 Markdown，自动解析 frontmatter 并触发构建
 *
 *   npm run admin            → http://127.0.0.1:8787
 *   PORT=9000 npm run admin  → 换端口
 *   ADMIN_TOKEN=xxx          → 启用 token 校验（远程访问时建议开启）
 *
 * 设计取舍：文章是 content/writing/*.md 文件，构建时由 Vite 打进产物。
 * 所以「上传」= 写文件 + 自动 npm run build；站点保持纯静态，随时可托管到任意静态主机。
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'content/writing');
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const TOKEN = process.env.ADMIN_TOKEN || '';

const slugify = text => text.toLowerCase().trim()
  .replace(/\.[a-z0-9]+$/, '')
  .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
  .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw.trim() };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    const v = kv[2].trim();
    data[kv[1]] = v.startsWith('[') && v.endsWith(']')
      ? v.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : v.replace(/^["']|["']$/g, '');
  }
  return { data, body: m[2].trim() };
}

async function listPosts() {
  const files = (await fs.readdir(CONTENT)).filter(f => f.endsWith('.md'));
  const out = [];
  for (const file of files) {
    const raw = await fs.readFile(path.join(CONTENT, file), 'utf8');
    const { data } = parseFrontmatter(raw);
    out.push({ slug: file.replace(/\.md$/, ''), file, title: data.title || file, date: data.date || '', tags: data.tags || [], summary: data.summary || '', bytes: raw.length });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

let building = null;
function rebuild() {
  if (building) return building;
  building = new Promise(resolve => {
    const child = spawn('npm', ['run', 'build'], { cwd: ROOT, env: process.env });
    let out = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    child.on('close', code => {
      building = null;
      resolve({ ok: code === 0, code, tail: out.trim().split('\n').slice(-4).join('\n') });
    });
  });
  return building;
}

const json = (res, code, data) => {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
};

const page = `<!doctype html>
<html lang="zh-CN" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Blog Admin · Ethan</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  :root { --bg:#050b12; --surface:#0b1622; --surface2:#101d2b; --line:rgba(255,255,255,.1); --text:#f5f7fa; --text2:#9ba7b4; --muted:#647180; --blue:#2870e8; --green:#28e898; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; background: radial-gradient(circle at 70% 0%, rgba(40,112,232,.16), transparent 42%), var(--bg); color:var(--text); font:400 15px/1.6 Inter, system-ui, sans-serif; }
  .wrap { max-width: 1040px; margin: 0 auto; padding: 40px 24px 80px; }
  header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom: 34px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .brand img { width: 34px; height: 34px; }
  .brand b { font-size: 18px; letter-spacing:-.01em; }
  .brand small { display:block; color:var(--muted); font:500 9px/1 'JetBrains Mono', monospace; letter-spacing:.3em; text-transform:uppercase; margin-top:4px; }
  .pill { padding: 8px 14px; border:1px solid var(--line); border-radius: 10px; color:var(--text2); font:500 11px 'JetBrains Mono', monospace; text-decoration:none; }
  .pill:hover { border-color: var(--blue); color: var(--text); }
  .grid { display:grid; grid-template-columns: 1.15fr .85fr; gap: 20px; align-items:start; }
  @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  .card { border:1px solid var(--line); border-radius: 16px; background: rgba(15,28,42,.6); padding: 22px; }
  .card h2 { margin:0 0 16px; font-size: 14px; letter-spacing:.14em; text-transform: uppercase; color: var(--text2); font-family:'JetBrains Mono',monospace; font-weight:500; }
  .drop { border:1px dashed rgba(255,255,255,.22); border-radius: 12px; padding: 26px 18px; text-align:center; color: var(--text2); transition:.18s; cursor:pointer; }
  .drop.over { border-color: var(--green); background: rgba(40,232,152,.06); color: var(--text); }
  .drop b { color: var(--text); }
  .drop small { display:block; margin-top:6px; color:var(--muted); font-size:12px; }
  .row { display:flex; gap:10px; margin-top: 14px; }
  input[type=text], textarea { width:100%; background:#08111c; border:1px solid var(--line); color:var(--text); border-radius:10px; padding:12px 14px; font-family:'JetBrains Mono', monospace; font-size: 13px; outline:none; }
  input[type=text]:focus, textarea:focus { border-color: var(--blue); }
  textarea { margin-top: 12px; min-height: 300px; line-height:1.7; resize: vertical; }
  button { cursor:pointer; border-radius:10px; border:1px solid transparent; padding:12px 18px; font:600 13px Inter, sans-serif; transition:.18s; }
  .primary { background: linear-gradient(135deg,#3d8bfd,#2870e8); color:#fff; box-shadow:0 6px 22px rgba(40,112,232,.3); width:100%; margin-top: 14px; }
  .primary:hover { transform: translateY(-1px); }
  .primary:disabled { opacity:.6; cursor: default; transform:none; }
  .ghost { background: transparent; border-color: var(--line); color: var(--text2); }
  .ghost:hover { border-color: var(--blue); color: var(--text); }
  .list { display:flex; flex-direction:column; gap: 10px; max-height: 560px; overflow:auto; }
  .item { border:1px solid var(--line); border-radius: 12px; padding: 14px; background: rgba(8,17,28,.6); }
  .item h3 { margin:0 0 6px; font-size: 14.5px; font-weight: 600; }
  .item .meta { color: var(--muted); font:400 10.5px 'JetBrains Mono', monospace; letter-spacing:.04em; display:flex; gap:10px; flex-wrap:wrap; }
  .item .acts { display:flex; gap:8px; margin-top:10px; }
  .item .acts a, .item .acts button { font-size:11px; padding:6px 10px; }
  .danger { color: #ff8f8f; border-color: rgba(255,143,143,.3); background: transparent; }
  .danger:hover { border-color:#ff8f8f; }
  #log { margin-top: 16px; font:400 12px/1.7 'JetBrains Mono', monospace; color: var(--text2); white-space: pre-wrap; min-height: 40px; }
  #log .ok { color: var(--green); } #log .err { color:#ff8f8f; }
  .hint { color: var(--muted); font-size: 12px; margin-top: 10px; line-height: 1.6; }
  code { color: var(--green); font-family:'JetBrains Mono', monospace; font-size: .92em; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="brand"><img src="/brand-mark.svg" alt=""><div><b>Blog Admin</b><small>Ethan Cheung · markdown</small></div></div>
    <a class="pill" href="http://localhost:4173/" target="_blank" rel="noreferrer">Open site →</a>
  </header>
  <div class="grid">
    <section class="card">
      <h2>上传 Markdown</h2>
      <div class="drop" id="drop">
        <b>拖拽 .md 文件到这里</b>
        <small>或点击选择文件 · 支持直接粘贴正文</small>
      </div>
      <div class="row"><input type="text" id="name" placeholder="文件名（可选，留空自动用标题生成）"></div>
      <textarea id="md" spellcheck="false"></textarea>
      <div class="row" style="margin-top:12px">
        <button class="ghost" id="tpl">插入模板</button>
        <button class="ghost" id="clear">清空</button>
      </div>
      <button class="primary" id="publish">发布并构建 →</button>
      <div id="log"></div>
      <p class="hint">frontmatter 必填 <code>title</code>，可选 <code>date</code> / <code>tags</code> / <code>summary</code> / <code>read</code>。<br>上传后会自动执行 <code>npm run build</code>，页面立即生效。</p>
    </section>
    <section class="card">
      <h2>已有文章 (<span id="count">0</span>)</h2>
      <div class="list" id="list"></div>
    </section>
  </div>
</div>
<script>
const $ = s => document.querySelector(s);
const log = (msg, cls = '') => { $('#log').innerHTML = '<span class="' + cls + '">' + msg + '</span>'; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const tpl = '---\\ntitle: Your title here\\ndate: ' + new Date().toISOString().slice(0,10).replace(/-/g,'.') + '\\ntags: [Engineering, Notes]\\nsummary: One sentence that earns the click.\\n---\\n\\n## First section\\n\\nWrite the argument, not the announcement.\\n';

async function load() {
  const posts = await (await fetch('/api/posts')).json();
  $('#count').textContent = posts.length;
  $('#list').innerHTML = posts.map(p => \`
    <div class="item">
      <h3>\${esc(p.title)}</h3>
      <div class="meta"><span>\${esc(p.date || 'no date')}</span><span>\${esc(p.slug)}.md</span><span>\${(p.tags||[]).join(' · ')}</span></div>
      <div class="acts">
        <a class="pill" href="http://localhost:4173/writing/\${encodeURIComponent(p.slug)}" target="_blank" rel="noreferrer">预览</a>
        <button class="ghost" data-edit="\${esc(p.slug)}">编辑</button>
        <button class="danger" data-del="\${esc(p.slug)}">删除</button>
      </div>
    </div>\`).join('') || '<p class="hint">还没有文章。</p>';
}

async function publish() {
  const md = $('#md').value.trim();
  if (!md) return log('请先选择文件或粘贴内容', 'err');
  $('#publish').disabled = true;
  log('上传中…');
  try {
    const name = $('#name').value.trim();
    const overwrite = editing && name === editing ? '&overwrite=1' : '';
    const res = await fetch('/api/posts?name=' + encodeURIComponent(name) + overwrite, { method: 'POST', headers: { 'Content-Type': 'text/markdown' }, body: md });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '上传失败');
    log('✓ 已保存 content/writing/' + data.slug + '.md\\n' + (data.build.ok ? '✓ 构建成功\\n' : '✗ 构建失败\\n') + data.build.tail, data.build.ok ? 'ok' : 'err');
    $('#md').value = ''; $('#name').value = ''; editing = null;
    load();
  } catch (e) { log('✗ ' + e.message, 'err'); }
  finally { $('#publish').disabled = false; }
}

document.addEventListener('click', async e => {
  const del = e.target.dataset?.del;
  const edit = e.target.dataset?.edit;
  if (edit) {
    try {
      const { md } = await (await fetch('/api/post/' + encodeURIComponent(edit))).json();
      $('#md').value = md;
      $('#name').value = edit;
      editing = edit;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      log('已载入 ' + edit + '.md — 修改后点击发布即可覆盖');
    } catch (err) { log('✗ 读取失败: ' + err.message, 'err'); }
    return;
  }
  if (del) {
    if (!confirm('删除 ' + del + '.md ?')) return;
    log('删除中…');
    const res = await fetch('/api/posts/' + encodeURIComponent(del), { method: 'DELETE' });
    const data = await res.json();
    log(res.ok ? '✓ 已删除，构建' + (data.build.ok ? '成功' : '失败') : '✗ ' + data.error, res.ok && data.build.ok ? 'ok' : 'err');
    if (editing === del) editing = null;
    load();
  }
});

let editing = null;
$('#tpl').onclick = () => { $('#md').value = tpl; };
$('#clear').onclick = () => { $('#md').value = ''; $('#name').value = ''; editing = null; log(''); };
$('#publish').onclick = publish;

const drop = $('#drop');
drop.onclick = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = '.md,.markdown,text/markdown'; i.onchange = () => readFile(i.files[0]); i.click(); };
drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); readFile(e.dataTransfer.files[0]); };
function readFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { $('#md').value = reader.result; if (!$('#name').value) $('#name').value = file.name.replace(/\\.md$/, ''); log('已载入 ' + file.name + ' — 检查后点击发布'); };
  reader.readAsText(file);
}
load();
</script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const remote = req.socket.remoteAddress || '';

  if (TOKEN && req.headers['x-admin-token'] !== TOKEN) {
    res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('需要 ADMIN_TOKEN（请求头 x-admin-token）');
  }
  if (!TOKEN && !remote.includes('127.0.0.1') && !remote.includes('::1')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('仅允许本机访问；远程请设置 ADMIN_TOKEN');
  }

  try {
    if (req.method === 'GET' && ['/brand-mark.svg', '/logo-mark-512.png', '/logo-mark-1024.png', '/favicon.svg'].includes(url.pathname)) {
      const file = path.join(ROOT, 'public', path.basename(url.pathname));
      const data = await fs.readFile(file);
      const type = url.pathname.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' });
      return res.end(data);
    }
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(page);
    }
    if (req.method === 'GET' && url.pathname === '/api/posts') {
      return json(res, 200, await listPosts());
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/post/')) {
      const slug = slugify(decodeURIComponent(url.pathname.split('/').pop()));
      return json(res, 200, { md: await fs.readFile(path.join(CONTENT, `${slug}.md`), 'utf8') });
    }
    if (req.method === 'POST' && url.pathname === '/api/posts') {
      let body = '';
      for await (const chunk of req) body += chunk;
      if (!body.trim()) return json(res, 400, { error: '内容为空' });

      let { data } = parseFrontmatter(body);
      let slug = slugify(url.searchParams.get('name') || data.title || '');
      if (!data.title) {
        const h1 = body.match(/^#\s+(.+)$/m);
        if (h1) {
          const titleLine = `title: ${h1[1].trim()}`;
          body = body.startsWith('---')
            ? body.replace(/^---\r?\n/, `---\ntitle: ${h1[1].trim()}\n`)
            : `---\n${titleLine}\n---\n\n${body}`;
          ({ data } = parseFrontmatter(body));
        } else {
          return json(res, 400, { error: '缺少 title：请加上 frontmatter 或在正文首行写 # 标题' });
        }
      }
      if (!slug) slug = `post-${Date.now()}`;
      await fs.mkdir(CONTENT, { recursive: true });
      let file = `${slug}.md`;
      const overwrite = url.searchParams.get('overwrite') === '1';
      if (!overwrite) {
        let n = 2;
        while (await fs.stat(path.join(CONTENT, file)).catch(() => null)) file = `${slug}-${n++}.md`;
      }
      await fs.writeFile(path.join(CONTENT, file), body.endsWith('\n') ? body : `${body}\n`, 'utf8');
      const build = await rebuild();
      return json(res, 200, { ok: true, slug: file.replace(/\.md$/, ''), build });
    }
    if (req.method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const slug = slugify(decodeURIComponent(url.pathname.split('/').pop()));
      await fs.unlink(path.join(CONTENT, `${slug}.md`));
      const build = await rebuild();
      return json(res, 200, { ok: true, build });
    }
    json(res, 404, { error: 'not found' });
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Blog Admin → http://${HOST}:${PORT}`);
  console.log(`  文章目录   → content/writing/*.md`);
  console.log(`  上传后自动执行 npm run build${TOKEN ? ' · 已启用 ADMIN_TOKEN 校验' : ' · 仅本机可访问'}\n`);
});
