#!/usr/bin/env node
/**
 * build-site.mjs —— 双语站点的构建编排。
 *
 *   node tools/build-site.mjs              同步样式 → 构建 zh 与 en → 生成根语言选择页
 *   node tools/build-site.mjs --sync       只把 styles/website.css 同步到两个书根
 *   node tools/build-site.mjs --serve zh   本地预览某一语言（honkit serve，:4000）
 *   node tools/build-site.mjs --lang en    只构建英文
 *   node tools/build-site.mjs --no-index   不写 _book/index.html
 *
 * 为什么需要同步：Honkit 的 book.json 里 `styles.website` 只能是书根内的相对路径，
 * 而样式表的唯一真源在仓库根 `styles/website.css`（VS Code 预览、GitHub 也用它）。
 * 所以构建前把真源复制进 `docs/<lang>/styles/`（该目录已 gitignore，不入库）。
 *
 * 输出布局（GitHub Pages 直接发布 _book）：
 *   _book/index.html      语言选择页
 *   _book/zh/**           中文版站点
 *   _book/en/**           英文版站点
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_book');
const LANGS = ['zh', 'en'];
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const valueOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const bookDir = (lang) => path.join(ROOT, 'docs', lang);

/** 1) 同步样式表真源到各书根 */
function sync() {
  const src = path.join(ROOT, 'styles', 'website.css');
  if (!fs.existsSync(src)) throw new Error(`找不到样式真源 ${rel(src)}`);
  const css = fs.readFileSync(src);
  let changed = 0;
  for (const lang of LANGS) {
    const dir = path.join(bookDir(lang), 'styles');
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, 'website.css');
    if (fs.existsSync(target) && fs.readFileSync(target).equals(css)) continue;
    fs.writeFileSync(target, css);
    changed++;
  }
  console.log(`✓ 样式表已同步到 ${changed} 个书根（其余为最新）`);
}

/** 2) 调用 honkit 构建一本书 */
function build(lang) {
  const dest = path.join(OUT, lang);
  fs.rmSync(dest, { recursive: true, force: true }); // 先清空旧输出，避免残留页面上线
  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  console.log(`\n▶ honkit build ${rel(bookDir(lang))} → ${rel(dest)}`);
  const r = spawnSync(npx, ['honkit', 'build', bookDir(lang), dest], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) throw new Error(`honkit 构建 ${lang} 失败（exit ${r.status ?? 'null'}）`);
}

/** 3) 根语言选择页 */
function landing() {
  const meta = {};
  for (const lang of LANGS) {
    try {
      meta[lang] = JSON.parse(fs.readFileSync(path.join(bookDir(lang), 'book.json'), 'utf8'));
    } catch {
      meta[lang] = { title: lang, description: '' };
    }
  }
  const card = (lang, label, note) => `      <a class="card" href="./${lang}/">
        <h2>${escapeHtml(meta[lang].title || label)}</h2>
        <p>${escapeHtml(meta[lang].description || '')}</p>
        <span class="go">${label}${note ? ` · ${note}` : ''}</span>
      </a>`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>从代码到意图 · From Code to Intent</title>
  <meta name="description" content="Choose a language: 中文版 / English edition.">
  <link rel="canonical" href="./">
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: grid; place-items: center;
      font-family: "Noto Sans SC", "Segoe UI", -apple-system, system-ui, sans-serif;
      background: #f6f8fb; color: #22303c; line-height: 1.6;
    }
    main { width: min(760px, 92vw); padding: 2.5rem 0; }
    h1 { margin: 0 0 .2rem; font-size: clamp(1.5rem, 4vw, 2.1rem); color: #1d3557; }
    .sub { margin: 0 0 2rem; color: #5b6b7b; font-size: .95rem; }
    .cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card {
      display: block; text-decoration: none; color: inherit; background: #fff;
      border: 1.5px solid #4b7bec; border-radius: 12px; padding: 1.1rem 1.2rem;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(31,58,95,.12); }
    .card h2 { margin: 0 0 .4rem; font-size: 1.05rem; color: #1d3557; }
    .card p { margin: 0 0 .6rem; font-size: .85rem; color: #5b6b7b; }
    .go { font-weight: 600; color: #4b7bec; font-size: .9rem; }
    footer { margin-top: 2rem; font-size: .8rem; color: #7b8794; }
    footer a { color: #4b7bec; }
    @media (prefers-color-scheme: dark) {
      body { background: #14181d; color: #dfe6ec; }
      .card { background: #1b222a; border-color: #5b8ef0; }
      .card h2 { color: #e8eef5; } .card p, .sub { color: #9fb0c0; } footer { color: #8494a4; }
    }
  </style>
</head>
<body>
  <main>
    <h1>从代码到意图 · From Code to Intent</h1>
    <p class="sub">构建会进化的自适应软件 —— Software 3.0 时代的领域驱动设计、OSPF 运筹优化与大语言模型运行时架构。<br>
    Building software that evolves: domain-driven design, OSPF optimization and the LLM as Runtime.</p>
    <div class="cards">
${card('zh', '中文（简体）', '完整 18 章')}
${card('en', 'English', 'translation in progress')}
    </div>
    <footer>
      源码与贡献方式见 <a href="https://github.com/fuookami/adaptive-software">GitHub</a> ·
      CC BY-SA 4.0 · 由 <a href="https://github.com/honkit/honkit">Honkit</a> 构建
    </footer>
  </main>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '', 'utf8');
  console.log(`✓ 已生成语言选择页 ${rel(OUT)}/index.html`);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function main() {
  sync();

  if (has('--serve')) {
    const lang = valueOf('--serve', 'zh');
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    console.log(`▶ honkit serve ${lang}（Ctrl+C 退出）`);
    const r = spawnSync(npx, ['honkit', 'serve', bookDir(lang), path.join(OUT, lang), '--port', valueOf('--port', '4000')], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    process.exitCode = r.status ?? 1;
    return;
  }

  if (has('--sync')) return;

  const only = valueOf('--lang', null);
  const list = only ? [only] : LANGS;
  if (has('--clean-all') || !has('--lang')) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const lang of list) build(lang);
  if (!has('--no-index') && list.length === LANGS.length) landing();
  console.log(`\n✓ 站点输出：${rel(OUT)}（${list.map((l) => `${l}/`).join(' ')}${list.length === LANGS.length ? ' index.html' : ''}）`);
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exitCode = 1;
}
