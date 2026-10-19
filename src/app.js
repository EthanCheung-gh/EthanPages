import './styles.css';
import github from './data/github-projects.json';
import { posts, findPost } from './content.js';
import { adminPage, initAdmin } from './admin.js';

// 部署基路径：本地为 ''，GitHub Pages 项目站点为 '/<repo>'
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const asset = p => `${BASE}/${p.replace(/^\//, '')}`;

const PROFILE = {
  name: 'Ethan', fullName: 'Ethan Cheung', cn: '易创',
  email: 'nirvana.zq@petalmail.com', github: `@${github.user}`, githubUrl: `https://github.com/${github.user}`,
  location: 'Shenzhen, China', focus: 'Full Stack Development',
};

const svg = {
  code: '<svg viewBox="0 0 24 24"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
  rocket: '<svg viewBox="0 0 24 24"><path d="M5 15c-1.2 2.8-1.2 4.2-1.2 4.2s1.4 0 4.2-1.2M9 15l-4.5-4.5C6.5 5.5 11 3 16.5 3 16.5 8.5 14 13 9 15Z"/><circle cx="14" cy="9.5" r="1.7"/><path d="M6 18c-1 1-1.5 2.5-1.5 2.5S6 20 7 19"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M21 20c0-2.8-1.8-5.1-4.5-5.8"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V6a3 3 0 0 1 6 0v2M3 13h18"/></svg>',
  activity: '<svg viewBox="0 0 24 24"><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>',
  user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  target: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21V3Z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 13.2A8.5 8.5 0 1 1 10.8 3 6.8 6.8 0 0 0 21 13.2Z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  github: '<svg viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.75 2.69 1.25 3.35.95.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.66.41.35.77 1.05.77 2.12 0 1.53-.01 2.76-.01 3.14 0 .3.21.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>',
};

// 项目数据来自 scripts/sync-github.mjs 生成的 src/data/github-projects.json
const projects = github.projects;
const featured = projects.filter(p => p.featured).slice(0, 3);

const spark = (slug, color) => `<svg class="spark" viewBox="0 0 96 32" fill="none" aria-hidden="true"><defs><linearGradient id="sp-${slug}" x1="0" y1="0" x2="96" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity=".35"/></linearGradient></defs><polyline points="1,26 15,19 29,23 43,11 57,16 71,6 95,10" stroke="url(#sp-${slug})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const logo = `<img src="${asset('brand-mark.svg')}" alt="">`;
const brandHTML = `<a class="brand" href="/" data-link aria-label="Ethan Cheung ${PROFILE.cn} — Home">${logo}<span class="brand-text">Ethan<em>${PROFILE.cn}</em></span></a>`;
const statusClass = s => ({ Active: 's-active', Experimental: 's-exp', Archived: 's-arch' })[s];

const portrait = (inline, card, anim = '') => `<div class="hero-portrait${inline ? ' inline' : ''}"${anim}>
  <img src="${asset('ethan-portrait.png')}" alt="Ethan — 长发圆框眼镜虚拟形象" fetchpriority="high">
  ${card ? `<div class="status-card">
    <div class="status-row">${svg.pin}<div><span>Location</span><b>${PROFILE.location}</b></div></div>
    <div class="status-row">${svg.briefcase}<div><span>Experience</span><b>5+ Years</b></div></div>
    <div class="status-row">${svg.activity}<div><span>Status</span><b><span class="live"></span>Available for work</b></div></div>
  </div>` : ''}
</div>`;

function header(path) {
  const links = [['/', 'Home'], ['/about', 'About'], ['/projects', 'Projects'], ['/skills', 'Skills'], ['/experience', 'Experience'], ['/writing', 'Blog'], ['/contact', 'Contact']];
  return `<header class="site-nav"><div class="container nav-inner">
    ${brandHTML}
    <nav class="nav-links" id="nav-links">${links.map(([href, label]) => {
      const active = path === href || (href === '/projects' && path.startsWith('/projects/')) || (href === '/writing' && path.startsWith('/writing/')) || (href === '/experience' && path === '/resume');
      return `<a class="nav-link${active ? ' active' : ''}" href="${href}" data-link${active ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('')}</nav>
    <div class="nav-actions">
      <a class="icon-btn solid hide-s" href="${PROFILE.githubUrl}" target="_blank" rel="noreferrer" aria-label="GitHub">${svg.github}</a>
      <button class="icon-btn" data-theme-toggle type="button" aria-label="Toggle theme">${svg.moon}</button>
      <a class="nav-cta" href="/contact" data-link>Let’s Connect</a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav-links">MENU</button>
    </div>
  </div></header>`;
}

function footer() {
  const pages = [['/', 'Home'], ['/about', 'About'], ['/projects', 'Projects'], ['/skills', 'Skills'], ['/experience', 'Experience'], ['/writing', 'Blog'], ['/lab', 'Lab'], ['/now', 'Now'], ['/uses', 'Uses'], ['/contact', 'Contact']];
  return `<footer class="footer"><div class="container">
    <div class="footer-strip">
      <span class="footer-tag">Building the future, one commit at a time.</span>
      <div class="socials">
        <a class="icon-btn solid" href="${PROFILE.githubUrl}" target="_blank" rel="noreferrer" aria-label="GitHub">${svg.github}</a>
        <a class="icon-btn" href="mailto:${PROFILE.email}" aria-label="Email">${svg.mail}</a>
      </div>
    </div>
    <div class="footer-grid">
      <div class="footer-brand">${brandHTML}<p>Full stack developer crafting clean, scalable software and delightful digital experiences.</p></div>
      <div><h5>Pages</h5>${pages.map(([h, l]) => `<a href="${h}" data-link>${l}</a>`).join('')}</div>
      <div><h5>Contact</h5><a class="f-item" href="mailto:${PROFILE.email}">Email — ${PROFILE.email}</a><a class="f-item" href="${PROFILE.githubUrl}" target="_blank" rel="noreferrer">GitHub — ${PROFILE.github}</a><span class="f-item">Location — ${PROFILE.location}</span></div>
    </div>
    <div class="footer-bottom"><span>© 2026 ${PROFILE.fullName} ${PROFILE.cn}</span><span>Designed &amp; Built by ${PROFILE.name}</span></div>
  </div></footer>`;
}

const pageHero = (index, title, lede) => `<section class="page-hero"><div class="container"><div class="page-index">${index}</div><h1 class="section-title">${title}</h1><p class="lede">${lede}</p></div></section>`;

const miniCard = (p, i) => `<a class="mini-card${i === 0 ? ' accent' : ''}" style="--ac:${p.accent}" href="/projects/${p.slug}" data-link>
  <div class="mini-top"><span class="tile">${p.icon.length === 1 ? p.icon : svg[p.icon]}</span>${spark(p.slug, p.accentHex)}</div>
  <h3>${p.name}</h3>
  <div class="pill-row">${p.stack.slice(0, 3).map(t => `<span class="mini-pill">${t}</span>`).join('')}</div>
  <p>${p.desc}</p>
  <span class="card-link">View Project →</span>
</a>`;

const projectCard = p => `<a class="card project-card" href="/projects/${p.slug}" data-link>
  <div class="card-top"><span class="${statusClass(p.status)}"><span class="s-dot"></span>${p.status}</span><span>${p.stars > 0 ? `★ ${p.stars} · ` : ''}${p.category}</span></div>
  <h3>${p.name}</h3><p>${p.desc}</p>
  <div class="card-foot"><div class="pill-row">${p.stack.slice(0, 3).map(t => `<span class="mini-pill">${t}</span>`).join('')}</div><span class="card-link">Details →</span></div>
</a>`;

const projectCards = list => `<div class="cards">${list.map(projectCard).join('')}</div>`;

function home() {
  const traits = [
    ['code', 'Clean Code', 'Write readable, maintainable code'],
    ['rocket', 'High Performance', 'Optimize for speed and scale'],
    ['shield', 'Secure by Design', 'Security-first development'],
    ['users', 'Collaborative', 'Great ideas build great products'],
  ];
  const skills = ['TypeScript', 'JavaScript', 'Python', 'React', 'Next.js', 'Node.js', 'Go', 'Docker', 'PostgreSQL', 'AWS', 'TailwindCSS', 'GraphQL', 'Git', 'CI/CD', 'Linux'];
  const anim = d => ` data-anim style="--d:${d}s"`;
  return `<main class="page">
    <section class="hero">
      <div class="stars" aria-hidden="true"></div>
      <div class="watermark" aria-hidden="true">{ }</div>
      <div class="geo g1" aria-hidden="true"></div><div class="geo g2" aria-hidden="true"></div>
      <div class="hero-inner">
        <div class="hero-copy">
          <span class="eyebrow"${anim('.05')}>Software Engineer</span>
          <h1${anim('.12')}><span>Code. Build.</span><span class="grad-hero">Create Impact.</span></h1>
          <p class="hero-sub"${anim('.2')}>I craft clean, scalable software and delightful digital experiences. Focused on solving real problems with modern technologies.</p>
          <div class="hero-actions"${anim('.28')}><a class="btn btn-primary" href="/projects" data-link>View My Work →</a><a class="btn btn-glass" href="/experience" data-link>Download CV ↓</a></div>
        </div>
      </div>
      ${portrait(false, true, ' data-anim style="--d:.3s"')}
    </section>
    <section class="container"><div class="traits fade-up">${traits.map(([ic, t, d]) => `<div class="trait"><span class="t-ic">${svg[ic]}</span><div><h4>${t}</h4><p>${d}</p></div></div>`).join('')}</div></section>
    <section id="featured" class="container trio trio-section">
      <div class="trio-col fade-up">
        <div class="col-head"><span class="kicker">Featured Projects</span><a class="section-link" href="/projects" data-link>View all projects →</a></div>
        ${featured.map(miniCard).join('')}
      </div>
      <div class="trio-col fade-up">
        <div class="col-head"><span class="kicker">Skills</span><a class="section-link" href="/skills" data-link>View all</a></div>
        <div class="skill-cloud">${skills.map(s => `<span class="skill-pill">${s}</span>`).join('')}</div>
      </div>
      <div class="trio-col fade-up">
        <div class="col-head"><span class="kicker">About Me</span></div>
        <p class="about-blurb">I’m a software engineer passionate about building elegant solutions with clean architecture and modern tools.</p>
        <p class="about-blurb">I enjoy turning complex problems into simple, beautiful, and intuitive experiences.</p>
        <div class="meta-block">
          <div class="meta-row">${svg.user}<span class="k">Name</span><b>${PROFILE.fullName}</b></div>
          <div class="meta-row">${svg.mail}<span class="k">Email</span><b>${PROFILE.email}</b></div>
          <div class="meta-row">${svg.target}<span class="k">Focus</span><b>${PROFILE.focus}</b></div>
        </div>
      </div>
    </section>
  </main>`;
}

function projectsPage() {
  const cats = ['All', 'Developer Tools', 'Automation', 'AI', 'Visualization', 'Open Source', 'Experiments'];
  return `<main class="page">${pageHero('PROJECTS', 'Projects', 'Real repositories from my GitHub — tools, systems and experiments, synced from the source rather than typed by hand.')}
  <section class="container section">
    <div class="filters fade-up in">${cats.map((c, i) => `<button class="filter${i === 0 ? ' active' : ''}" data-cat="${c}" type="button">${c}</button>`).join('')}</div>
    <div id="project-results">${projectCards(projects)}</div>
    <p class="now-note">Synced from github.com/${github.user} · ${github.repos} public repos · ${github.generatedAt.slice(0, 10)} — run <code>npm run sync</code> to refresh.</p>
  </section></main>`;
}

function projectDetail(slug) {
  const p = projects.find(x => x.slug === slug);
  if (!p) return notFound();
  const toc = [['overview', 'Overview'], ['highlights', 'Highlights'], ['tech-stack', 'Tech Stack'], ['decisions', 'Design decisions'], ['repository', 'Repository']];
  return `<main class="page">
    <section class="container case-hero">
      <span class="eyebrow">${p.category} · ${p.type}</span>
      <h1 class="section-title" style="margin-top:22px">${p.name}</h1>
      <p class="lede">${p.desc}</p>
      <div class="case-meta">
        <div><span>Status</span><b class="${statusClass(p.status)}">${p.status}</b></div>
        <div><span>License</span><b>${p.license}</b></div>
        <div><span>Stars</span><b>${p.stars}</b></div>
        <div><span>Last push</span><b>${p.pushed}</b></div>
      </div>
      <div class="detail-links">
        <a class="chip" href="${p.repoUrl}" target="_blank" rel="noreferrer">GitHub ↗</a>
        ${p.demoUrl ? `<a class="chip" href="${p.demoUrl}" target="_blank" rel="noreferrer">Live Demo ↗</a>` : ''}
      </div>
    </section>
    <section class="container prose-layout">
      <article class="prose">
        ${p.overview ? `<p class="detail-overview" id="overview">${p.overview}</p>` : ''}
        ${p.highlights.length ? `<h2 id="highlights">Highlights</h2><ul>${p.highlights.map(h => `<li>${h}</li>`).join('')}</ul>` : ''}
        <h2 id="tech-stack">Tech Stack</h2>
        <div class="pills">${p.stack.map(s => `<span class="pill">${s}</span>`).join('')}</div>
        <p style="margin-top:18px;color:var(--muted);font-size:13px">Languages by bytes: ${Object.entries(p.languages).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k]) => k).join(' · ')}</p>
        ${p.decisions ? `<h2 id="decisions">Design decisions</h2><blockquote>${p.decisions}</blockquote>` : ''}
        <h2 id="repository">Repository</h2>
        <div class="flow"><span>Created ${p.created}</span><i>→</i><span>Pushed ${p.pushed}</span><i>→</i><span>★ ${p.stars} · ⑂ ${p.forks}</span></div>
        <p>Source of truth: <a href="${p.repoUrl}" target="_blank" rel="noreferrer">${p.repoUrl.replace('https://', '')}</a></p>
        ${p.next ? `<h2 id="next">Next</h2><p>${p.next}</p>` : ''}
      </article>
      <nav class="toc" aria-label="Sections">${toc.map(([id, label]) => `<span><a href="#${id}">${label}</a></span>`).join('')}${p.next ? '<span><a href="#next">Next</a></span>' : ''}</nav>
    </section>
  </main>`;
}

function lab() {
  const labItems = [
    { name: 'LLM Wiki', tag: 'Research', span: 'span-7', desc: 'A personal knowledge base where notes, embeddings and citations live in one queryable graph.' },
    { name: 'MCP Tools', tag: 'Prototype', span: 'span-5', desc: 'Small MCP servers that expose local files, scripts and sensors to AI agents — safely.' },
    { name: 'SCPI Parser', tag: 'Experiment', span: 'span-4', desc: 'A parser and simulator for SCPI instrument commands, born from lab-automation needs.' },
    { name: 'CPU Monitor', tag: 'Experiment', span: 'span-4', desc: 'A terminal dashboard for cores, thermals and load, rendered entirely in Unicode.' },
    { name: 'Plotly Lab', tag: 'Prototype', span: 'span-4', desc: 'Sketches from dashboard experiments: custom color scales, transitions, small multiples.' },
    { name: 'Terminal Tools', tag: 'Experiment', span: 'span-12', terminal: true, desc: 'Assorted zsh functions and TUI utilities that slowly automate the command line.' },
  ];
  return `<main class="page">${pageHero('ETHAN LAB', 'Experiments & prototypes', 'A public workbench for unfinished ideas — research notes, small tools and things that only half work, on purpose.')}
  <section class="container section"><div class="cards fade-up in">${labItems.map((x, i) => `
    <article class="card ${x.span}">
      <div class="card-top"><span class="lab-tag tag-${x.tag.toLowerCase()}">${x.tag}</span><span>LAB / 0${i + 1}</span></div>
      <h3>${x.name}</h3><p>${x.desc}</p>
      ${x.terminal ? `<div class="bento-term"><span class="p">$</span> eth lab list
  llm-wiki      research    active
  mcp-tools     prototype   active
  scpi-parser   experiment  archive
  cpu-monitor   experiment  active</div>` : ''}
    </article>`).join('')}</div></section></main>`;
}

const writingRow = p => `<a class="writing-item" href="/writing/${p.slug}" data-link><time>${p.date}</time><div><h3>${p.title}</h3><p>${p.summary}</p></div><span class="writing-side"><span>${p.tags[0]}</span><span class="arrow">→</span></span></a>`;

const writing = () => `<main class="page">${pageHero('BLOG', 'Notes on software & engineering', 'Markdown files rendered at build time — automation, tools, AI systems and the discipline of keeping things simple.')}
  <section class="container section"><div class="writing-list fade-up in">${posts.map(writingRow).join('')}</div>
  <p class="now-note">${posts.length} articles · written in Markdown under <code>content/writing/</code> · upload via <code>npm run admin</code></p></section></main>`;

function article(slug) {
  const p = findPost(slug);
  if (!p) return notFound();
  return `<main class="page">
    <section class="page-hero"><div class="container">
      <div class="page-index">${p.date} · ${p.read} read</div>
      <h1 class="section-title">${p.title}</h1>
      <p class="lede">${p.summary}</p>
      <div style="display:flex;gap:10px;margin-top:26px">${p.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div>
    </div></section>
    <section class="container prose-layout">
      <article class="prose">${p.html}</article>
      <nav class="toc" aria-label="Contents">${p.toc.map(h => `<span><a href="#${h.id}">${h.text}</a></span>`).join('')}</nav>
    </section>
  </main>`;
}

function about() {
  const journey = [
    ['01 · Origin', 'Started coding', 'First scripts to automate homework and small games — the hook was immediate.'],
    ['02', 'Automation', 'Discovered that boring, repeated work is a design problem waiting to be solved.'],
    ['03', 'Engineering', 'Learned to build systems that survive contact with real users and real data.'],
    ['04', 'Developer Tools', 'Fell for making other engineers faster: CLIs, pipelines and internal platforms.'],
    ['05 · Now', 'AI', 'Exploring agents and LLM tooling with a legibility-first mindset.', true],
  ];
  return `<main class="page">${pageHero('ABOUT', 'Hello, I’m Ethan.', 'A software engineer who enjoys building useful tools and solving real engineering problems.')}
  <section class="container section profile-grid">
    ${portrait(true, false)}
    <div>
      <p class="lead-copy">I build tools that make engineering work <em>simpler</em> — and I like the kind of complexity you can draw on a whiteboard.</p>
      <span class="kicker">Developer Journey</span>
      <div class="timeline" style="margin-top:24px">${journey.map(([era, t, d, now]) => `<div class="tl-item${now ? ' now' : ''}"><small>${era}</small><h3>${t}</h3><p>${d}</p></div>`).join('')}</div>
      <div class="hero-actions"><a class="btn btn-glass" href="/experience" data-link>Experience</a><a class="btn btn-glass" href="/skills" data-link>Skills</a><a class="btn btn-glass" href="/now" data-link>Now</a></div>
    </div>
  </section></main>`;
}

function skills() {
  const groups = [
    ['Languages', ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'SQL']],
    ['Frontend', ['React', 'Next.js', 'Vue', 'TailwindCSS', 'Plotly', 'ECharts']],
    ['Backend & Data', ['Node.js', 'FastAPI', 'Streamlit', 'PostgreSQL', 'GraphQL']],
    ['DevOps & Tools', ['Docker', 'AWS', 'Git', 'CI/CD', 'Linux', 'GitHub Actions']],
    ['AI & Automation', ['LLM', 'MCP', 'Agents', 'Workflow Automation', 'Prompt Engineering']],
  ];
  return `<main class="page">${pageHero('SKILLS', 'Skills & stack', 'The tools I reach for daily — organized by layer, kept honest by usage.')}
  <section class="container section">${groups.map(([t, items]) => `<div class="use-group fade-up"><h2>${t}</h2><div class="pills">${items.map(i => `<span class="pill">${i}</span>`).join('')}</div></div>`).join('')}</section></main>`;
}

function now() {
  const groups = [
    ['Building', [projects[0]?.name || 'MetricStudio', projects[1]?.name ? `${projects[1].name} — maintenance` : 'SecKeyBox']],
    ['Learning', ['AI Agents', 'MCP', 'LLM Tooling']],
    ['Exploring', ['Developer Productivity', 'Local-first tooling']],
    ['Reading', ['Distributed Systems', 'Software Engineering essays']],
  ];
  return `<main class="page">${pageHero('NOW', 'What I’m doing now', 'A live snapshot, not an archive. Last updated: August 2026 · Shenzhen.')}
  <section class="container section"><div class="now-grid fade-up in">${groups.map(([t, items]) => `<article class="card now-card"><div class="card-top"><span>${t}</span></div><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul></article>`).join('')}</div>
  <p class="now-note">Inspired by the /now page movement — tell people what you are actually up to.</p></section></main>`;
}

function uses() {
  const groups = [
    ['System', [['OS', 'Ubuntu (daily driver)'], ['Terminal', 'Ghostty'], ['Shell', 'Zsh + custom functions'], ['Editor', 'VS Code + Neovim']]],
    ['Development', [['Language', 'Python · TypeScript'], ['Formatting', 'Ruff · Prettier'], ['VCS & CI', 'Git + GitHub Actions'], ['Containers', 'Docker']]],
    ['AI Tools', [['Assistant', 'ChatGPT'], ['Pair Programming', 'Claude'], ['Autocomplete', 'Codex'], ['Research', 'Gemini']]],
    ['Hardware', [['Machine', 'MacBook Pro 14”'], ['Keyboard', 'Keychron Q1'], ['Display', '27” 4K'], ['Audio', 'Sony WH-1000XM5']]],
  ];
  return `<main class="page">${pageHero('USES', 'Tools of the trade', 'My current setup — a clean list, not a shopping window. Everything here earns its place.')}
  <section class="container section">${groups.map(([t, rows]) => `<div class="use-group fade-up"><h2>${t}</h2><div class="use-list">${rows.map(([n, d]) => `<div class="use-row"><b>${n}</b><span>${d}</span></div>`).join('')}</div></div>`).join('')}</section></main>`;
}

function experience() {
  const skills = ['TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Go', 'PostgreSQL', 'Docker', 'AWS', 'CI/CD', 'LLM', 'System Design'];
  return `<main class="page">
    <section class="page-hero"><div class="container resume-head">
      <div><div class="page-index">EXPERIENCE · CURRICULUM VITAE</div><h1 class="section-title">${PROFILE.fullName} ${PROFILE.cn}</h1><p class="lede">Full stack software engineer — ${PROFILE.focus.toLowerCase()}, automation and AI systems.</p></div>
      <button class="btn btn-glass" onclick="window.print()" type="button">Download PDF ↓</button>
    </div></section>
    <section class="container section">
      <div class="resume-section"><h2>Experience</h2><div>
        <div class="r-entry"><h3>Full Stack Software Engineer</h3><div class="meta">2023 — PRESENT · SHENZHEN</div><p>Building web platforms, automation systems and AI experiments — from first principles to production.</p></div>
        <div class="r-entry"><h3>Software Engineer</h3><div class="meta">2021 — 2023 · REMOTE</div><p>Owned internal platforms and automation; simplified complex operational workflows across teams.</p></div>
      </div></div>
      <div class="resume-section"><h2>Projects</h2><div>
        ${projects.slice(0, 4).map(p => `<div class="r-entry"><h3>${p.name}</h3><div class="meta">${p.year} · ${(p.type || '').toUpperCase()} · ${p.license}</div><p>${p.desc}</p></div>`).join('')}
      </div></div>
      <div class="resume-section"><h2>Skills</h2><div class="pills">${skills.map(s => `<span class="pill">${s}</span>`).join('')}</div></div>
      <div class="resume-section"><h2>Education</h2><div><div class="r-entry"><h3>Computer Science</h3><div class="meta">ENGINEERING · SYSTEMS · HCI</div><p>Continuing education through open source, independent research and shipping real systems.</p></div></div></div>
    </section>
  </main>`;
}

function contact() {
  return `<main class="page">${pageHero('CONTACT', 'Let’s build something.', 'Have an interesting idea, a hard problem or a tool worth existing? Tell me about it.')}
  <section class="container section contact-grid">
    <div class="fade-up">
      <span class="kicker">Direct channels</span>
      <div class="contact-links">
        <a class="contact-row" href="mailto:${PROFILE.email}"><span>Email</span><span>${PROFILE.email} →</span></a>
        <a class="contact-row" href="${PROFILE.githubUrl}" target="_blank" rel="noreferrer"><span>GitHub</span><span>${PROFILE.github} →</span></a>
        <div class="contact-row"><span>Location</span><span>${PROFILE.location}</span></div>
        <div class="contact-row"><span>Name</span><span>${PROFILE.fullName}</span></div>
      </div>
    </div>
    <form id="contact-form" class="fade-up in">
      <div class="field"><label for="cf-name">Name</label><input id="cf-name" name="name" required placeholder="Your name"></div>
      <div class="field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" required placeholder="you@company.com"></div>
      <div class="field"><label for="cf-msg">Message</label><textarea id="cf-msg" name="message" rows="7" required placeholder="What are you building?"></textarea></div>
      <button class="btn btn-primary" type="submit">Send Message →</button>
    </form>
  </section></main>`;
}

function notFound() {
  return `<main class="page"><section class="container not-found"><div>
    <strong>404</strong><h1>Signal Lost.</h1>
    <p>Looks like this route doesn’t exist.</p>
    <div class="term"><span class="p">$</span> cd /home</div><br>
    <a class="btn btn-primary" href="/" data-link>Return Home →</a>
  </div></section></main>`;
}

function resolve(path) {
  if (path === '/') return home();
  if (path === '/projects') return projectsPage();
  if (path.startsWith('/projects/')) return projectDetail(path.split('/')[2]);
  if (path === '/lab') return lab();
  if (path === '/writing') return writing();
  if (path.startsWith('/writing/')) return article(path.split('/')[2]);
  if (path === '/about') return about();
  if (path === '/skills') return skills();
  if (path === '/now') return now();
  if (path === '/uses') return uses();
  if (path === '/experience' || path === '/resume') return experience();
  if (path === '/contact') return contact();
  if (path === '/admin') return adminPage(BASE, github.user);
  return notFound();
}

if (localStorage.getItem('ethan-theme') === 'light') document.documentElement.dataset.theme = 'light';

const progressInit = () => {
  const bar = document.getElementById('progress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.width = `${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight) * 100}%`;
  }, { passive: true });
};

function initPage() {
  document.querySelector('.menu-btn')?.addEventListener('click', e => {
    const menu = document.querySelector('.nav-links');
    menu.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', menu.classList.contains('open'));
  });

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('ethan-theme', next);
    const btn = document.querySelector('[data-theme-toggle]');
    if (btn) btn.innerHTML = next === 'light' ? svg.sun : svg.moon;
  });

  document.querySelectorAll('[data-cat]').forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    const list = cat === 'All' ? projects : projects.filter(p => p.category === cat);
    document.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelector('#project-results').innerHTML = projectCards(list);
  }));

  document.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? '';
    navigator.clipboard?.writeText(code).then(() => {
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
    });
  }));

  document.querySelector('#contact-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const btn = e.currentTarget.querySelector('button');
    btn.textContent = 'Opening your mail app…';
    setTimeout(() => { window.location.href = `mailto:${PROFILE.email}`; btn.textContent = 'Send Message →'; }, 400);
  });

  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.fade-up:not(.in)').forEach(el => io.observe(el));
}

let booted = false;

function currentPath() {
  const raw = window.location.pathname;
  const rel = BASE && raw.startsWith(BASE) ? raw.slice(BASE.length) : raw;
  return (rel.replace(/\/$/, '') || '/');
}

function render() {
  const path = currentPath();
  document.querySelector('#app').innerHTML = `<div class="shell${booted ? '' : ' boot'}">${header(path)}${resolve(path)}${footer()}</div>`;
  // 站内链接补上部署基路径（中键/复制链接也需要正确路径）
  if (BASE) {
    document.querySelectorAll('a[data-link]').forEach(a => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith(`${BASE}/`)) a.setAttribute('href', BASE + href);
    });
  }
  window.scrollTo(0, 0);
  booted = true;
  const themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) themeBtn.innerHTML = document.documentElement.dataset.theme === 'light' ? svg.sun : svg.moon;
  initPage();
  initAdmin({ base: BASE });
  document.querySelector('meta[name="robots"]')?.remove();
  if (path === '/admin') {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
  }
}

// GitHub Pages 深链接回退：404.html 把原路径暂存到 sessionStorage
(() => {
  try {
    const saved = sessionStorage.getItem('ethan-spa-route');
    if (saved) {
      sessionStorage.removeItem('ethan-spa-route');
      history.replaceState({}, '', BASE + (saved.startsWith('/') ? saved : `/${saved}`));
    }
  } catch { /* ignore */ }
})();

document.addEventListener('click', e => {
  const link = e.target.closest('a[data-link]');
  if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault();
  history.pushState({}, '', link.href);
  render();
});
window.addEventListener('popstate', render);
progressInit();
render();
