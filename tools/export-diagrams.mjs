// 把 Markdown 里的 dg-* 内联 HTML 图示导出为独立 SVG，并把正文替换为图片引用。
//
// 为什么需要它：GitBook 会剥掉 div/style，把整张图压成一行标签文字；GitHub 也只在
// 白名单内渲染 HTML。导出为 SVG 后，GitBook / GitHub / Pages / VS Code / PDF 都能正常显示。
//
// 与"截图"不同，这里导出的是**真矢量**：用 CDP 远程调试协议让无头 Edge 实测每个元素的
// 盒模型、边框、圆角与文本行盒，再生成 <rect>/<text>。文字可缩放、可搜索、可打印。
//
// 用法：
//   node tools/export-diagrams.mjs --extract   # 从 md 抽出图示源码 → figures/<lang>/<page>-<n>.html
//   node tools/export-diagrams.mjs --build     # figures/*.html → docs/<lang>/assets/diagrams/*.svg
//   node tools/export-diagrams.mjs --replace   # md 内的 HTML 块 → ![alt](assets/diagrams/*.svg)
//   node tools/export-diagrams.mjs --check     # 校验引用完整、无残留 HTML 块
//   node tools/export-diagrams.mjs --only chapter-05   # 只处理指定页（调试用）
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const LANGS = ['zh', 'en'];
const ROOT = process.cwd();
const FIG = (lang) => path.join(ROOT, 'figures', lang);
const ASSETS_REL = 'assets/diagrams';
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9411;
// 与线上正文区域实测值对齐（`.markdown-section` = 770px / 16px），
// 否则 .dg 内的 em 基准会偏小、文字换行位置与在线阅读不一致。
const WIDTH = 860;
const BODY_FONT = 16;
const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;

/* ------------------------------------------------------------------ 提取 */

/** 扫描 md，返回所有 dg 块的 {start, end, html}（含起止下标，便于替换） */
function dgBlocks(text) {
  const out = [];
  const open = /^<div class="dg"/gm;
  let m;
  while ((m = open.exec(text))) {
    let i = m.index;
    let depth = 0;
    while (i < text.length) {
      const nextOpen = text.indexOf('<div', i);
      const nextClose = text.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
        if (depth === 0) {
          out.push({ start: m.index, end: i, html: text.slice(m.index, i) });
          open.lastIndex = i;
          break;
        }
      }
    }
  }
  return out;
}

const pages = (lang) =>
  fs.readdirSync(path.join(ROOT, 'docs', lang))
    .filter((f) => f.endsWith('.md') && f !== 'SUMMARY.md')
    .filter((f) => !only || f === `${only}.md`)
    .sort();

function extract() {
  let total = 0;
  for (const lang of LANGS) {
    fs.mkdirSync(FIG(lang), { recursive: true });
    for (const page of pages(lang)) {
      const file = path.join(ROOT, 'docs', lang, page);
      const text = fs.readFileSync(file, 'utf8');
      const blocks = dgBlocks(text);
      const stem = page.replace(/\.md$/, '');
      blocks.forEach((b, i) => {
        fs.writeFileSync(path.join(FIG(lang), `${stem}-${i + 1}.html`), b.html + '\n', 'utf8');
        total++;
      });
      if (blocks.length === 0 && fs.existsSync(path.join(FIG(lang), `${stem}-1.html`))) {
        // 已经替换过、图示源码仍在 figures/：保持原样
      }
    }
    console.log(`✓ 提取 ${lang}：${fs.readdirSync(FIG(lang)).filter((f) => f.endsWith('.html')).length} 张图`);
  }
  console.log(`✓ 合计 ${total} 张图示源码 → figures/`);
}

/* --------------------------------------------------------------- 矢量渲染 */

// 在页面里执行的序列化器：实测几何 → SVG
const SERIALIZER = String.raw`
(() => {
  const root = document.querySelector('.dg');
  if (!root) return JSON.stringify({ error: 'no .dg' });
  const o = root.getBoundingClientRect();
  const P = [];
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const num = (v) => Math.round(v * 100) / 100;
  const sides = (cs) => ({
    t: parseFloat(cs.borderTopWidth) || 0, r: parseFloat(cs.borderRightWidth) || 0,
    b: parseFloat(cs.borderBottomWidth) || 0, l: parseFloat(cs.borderLeftWidth) || 0,
  });
  const radius = (cs) => parseFloat(cs.borderTopLeftRadius) || 0;

  const paintBox = (el) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const s = sides(cs);
    const bg = cs.backgroundColor;
    const hasBg = bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent';
    const allSame = s.t > 0 && s.t === s.r && s.r === s.b && s.b === s.l &&
      cs.borderTopStyle === cs.borderRightStyle && cs.borderRightStyle === cs.borderBottomStyle &&
      cs.borderBottomStyle === cs.borderLeftStyle &&
      cs.borderTopColor === cs.borderRightColor && cs.borderRightColor === cs.borderBottomColor &&
      cs.borderBottomColor === cs.borderLeftColor;
    if (!hasBg && !(s.t || s.r || s.b || s.l)) return;
    const x = num(r.left - o.left), y = num(r.top - o.top);
    const w = num(r.width), h = num(r.height);
    if (w <= 0 || h <= 0) return;

    if (allSame) {
      const dash = cs.borderTopStyle === 'dashed' ? ' stroke-dasharray="5 4"' : '';
      const op = bg.startsWith('rgba') ? ' fill-opacity="' + parseFloat(bg.split(',')[3]) + '"' : '';
      P.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
        '" rx="' + num(radius(cs)) + '" fill="' + (hasBg ? bg : 'none') + '"' + op +
        ' stroke="' + cs.borderTopColor + '" stroke-width="' + s.t + '"' + dash + '/>');
      return;
    }
    // 背景（无边框）或单边线
    if (hasBg) {
      const op = bg.startsWith('rgba') ? ' fill-opacity="' + parseFloat(bg.split(',')[3]) + '"' : '';
      P.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h +
        '" rx="' + num(radius(cs)) + '" fill="' + bg + '"' + op + '/>');
    }
    const line = (x1, y1, x2, y2, color, wd, style) => {
      const dash = style === 'dashed' ? ' stroke-dasharray="5 4"' : '';
      P.push('<line x1="' + num(x1) + '" y1="' + num(y1) + '" x2="' + num(x2) + '" y2="' + num(y2) +
        '" stroke="' + color + '" stroke-width="' + wd + '"' + dash + '/>');
    };
    if (s.t) line(x, y + s.t / 2, x + w, y + s.t / 2, cs.borderTopColor, s.t, cs.borderTopStyle);
    if (s.b) line(x, y + h - s.b / 2, x + w, y + h - s.b / 2, cs.borderBottomColor, s.b, cs.borderBottomStyle);
    if (s.l) line(x + s.l / 2, y, x + s.l / 2, y + h, cs.borderLeftColor, s.l, cs.borderLeftStyle);
    if (s.r) line(x + w - s.r / 2, y, x + w - s.r / 2, y + h, cs.borderRightColor, s.r, cs.borderRightStyle);
  };

  // 文本可能折行：逐字符量测，按几何行分组后**分行**输出，
  // 否则同一个文本节点会在每个行盒上各画一遍整句（重复且错位）。
  const paintText = (el) => {
    const cs = getComputedStyle(el);
    for (const n of el.childNodes) {
      if (n.nodeType !== 3) continue;
      const raw = n.textContent;
      if (!raw.trim()) continue;
      const lines = [];
      for (let i = 0; i < raw.length; i++) {
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        const cr = r.getBoundingClientRect();
        if (cr.width === 0 && cr.height === 0) continue; // 换行符/零宽字符没有盒
        const top = Math.round(cr.top);
        let line = lines.find((l) => Math.abs(l.top - top) <= 2);
        if (!line) {
          line = { top, bottom: cr.bottom, left: cr.left, right: cr.right, text: '' };
          lines.push(line);
        }
        line.text += raw[i];
        line.left = Math.min(line.left, cr.left);
        line.right = Math.max(line.right, cr.right);
        line.bottom = Math.max(line.bottom, cr.bottom);
      }
      const center = cs.textAlign === 'center';
      for (const line of lines) {
        const txt = line.text.replace(/\s+/g, ' ').trim();
        if (!txt) continue;
        const h = line.bottom - line.top;
        const x = center ? (line.left + line.right) / 2 - o.left : line.left - o.left;
        const y = line.top - o.top + h * 0.76;
        const anchor = center ? 'middle' : 'start';
        P.push('<text x="' + num(x) + '" y="' + num(y) + '" font-family="' + cs.fontFamily.replace(/"/g, "'") +
          '" font-size="' + cs.fontSize + '" font-weight="' + cs.fontWeight +
          '" fill="' + cs.color + '" text-anchor="' + anchor + '">' + esc(txt) + '</text>');
      }
    }
  };

  const walk = (el) => {
    paintBox(el);
    paintText(el);
    for (const c of el.children) walk(c);
  };
  walk(root);

  const w = Math.ceil(o.width), h = Math.ceil(o.height);
  return JSON.stringify({
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + ' ' + h + '" role="img">' + P.join('') + '</svg>',
    w, h,
  });
})()
`;

function figurePage(html, css) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<style>${css}</style>
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  body { width: ${WIDTH}px; font-size: ${BODY_FONT}px; }
  .dg { margin: 0 !important; page-break-inside: auto; }
</style></head>
<body>${html}</body></html>`;
}

async function cdpSession() {
  const profile = path.join(ROOT, '.shots', 'edge-profile-diag');
  const edge = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let target = null;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (target) break;
    } catch { /* 未就绪 */ }
    await sleep(200);
  }
  if (!target) throw new Error('CDP 端口未就绪');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) events.push(msg);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const close = () => { try { ws.close(); } catch {} edge.kill(); };
  return { send, sleep, close };
}

async function build() {
  const css = fs.readFileSync(path.join(ROOT, 'styles', 'website.css'), 'utf8');
  const { send, sleep, close } = await cdpSession();
  const tmp = path.join(ROOT, '.shots', 'figure-render.html');
  let n = 0;

  try {
    await send('Page.enable');
    await send('Runtime.enable');
    for (const lang of LANGS) {
      const dir = FIG(lang);
      if (!fs.existsSync(dir)) continue;
      const outDir = path.join(ROOT, 'docs', lang, ASSETS_REL);
      fs.mkdirSync(outDir, { recursive: true });
      const files = fs.readdirSync(dir)
        .filter((f) => f.endsWith('.html'))
        .filter((f) => !only || f.startsWith(`${only}-`))
        .sort();
      for (const f of files) {
        const html = fs.readFileSync(path.join(dir, f), 'utf8');
        fs.writeFileSync(tmp, figurePage(html, css), 'utf8');
        const url = 'file:///' + tmp.replace(/\\/g, '/');
        await send('Page.navigate', { url });
        await sleep(320);
        const res = await send('Runtime.evaluate', {
          expression: SERIALIZER, returnByValue: true, awaitPromise: true,
        });
        if (res.exceptionDetails) throw new Error(`${f}: ${res.exceptionDetails.text}`);
        const payload = JSON.parse(res.result.value);
        if (payload.error) throw new Error(`${f}: ${payload.error}`);
        const svgPath = path.join(outDir, f.replace(/\.html$/, '.svg'));
        fs.writeFileSync(svgPath, payload.svg.replace(/></g, '>\n<') + '\n', 'utf8');
        n++;
      }
    }
    console.log(`✓ 导出 ${n} 个 SVG → docs/<lang>/${ASSETS_REL}/`);
  } finally {
    close();
  }
}

/* ------------------------------------------------------------------ 替换 */

const escAlt = (s) => s.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();

function replace() {
  let changed = 0;
  for (const lang of LANGS) {
    for (const page of pages(lang)) {
      const file = path.join(ROOT, 'docs', lang, page);
      let text = fs.readFileSync(file, 'utf8');
      const blocks = dgBlocks(text);
      if (!blocks.length) continue;
      const stem = page.replace(/\.md$/, '');
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        const alt = /aria-label="([^"]*)"/.exec(b.html);
        const label = alt ? escAlt(alt[1]) : `${stem} figure ${i + 1}`;
        const ref = `![${label}](${ASSETS_REL}/${stem}-${i + 1}.svg)`;
        text = text.slice(0, b.start) + ref + text.slice(b.end);
        changed++;
      }
      fs.writeFileSync(file, text, 'utf8');
    }
  }
  console.log(`✓ 替换 ${changed} 处 HTML 图示为 SVG 图片引用`);
}

/* ------------------------------------------------------------------ 校验 */

function check() {
  const problems = [];
  for (const lang of LANGS) {
    for (const page of pages(lang)) {
      const file = path.join(ROOT, 'docs', lang, page);
      const text = fs.readFileSync(file, 'utf8');
      const stem = page.replace(/\.md$/, '');
      const blocks = dgBlocks(text);
      if (blocks.length) problems.push(`${lang}/${page}: 仍残留 ${blocks.length} 个内联 HTML 图示块`);
      const refs = [...text.matchAll(/!\[[^\]]*\]\((assets\/diagrams\/[^)\s]+)\)/g)].map((m) => m[1]);
      for (const ref of refs) {
        const p = path.join(ROOT, 'docs', lang, ref);
        if (!fs.existsSync(p)) problems.push(`${lang}/${page}: 引用缺失 ${ref}`);
      }
      // 图数一致性：figures/ 里有多少图，正文就该有多少引用
      const figCount = fs.existsSync(FIG(lang))
        ? fs.readdirSync(FIG(lang)).filter((f) => f.startsWith(`${stem}-`) && f.endsWith('.html')).length
        : 0;
      if (figCount !== refs.length) {
        problems.push(`${lang}/${page}: 图示源码 ${figCount} 张，正文引用 ${refs.length} 处`);
      }
    }
  }
  if (problems.length) {
    console.error('✗ 图示导出校验失败：');
    problems.slice(0, 30).forEach((p) => console.error('  · ' + p));
    console.error(`  共 ${problems.length} 个问题`);
    process.exit(1);
  }
  const total = LANGS.reduce(
    (a, l) => a + (fs.existsSync(path.join(ROOT, 'docs', l, ASSETS_REL))
      ? fs.readdirSync(path.join(ROOT, 'docs', l, ASSETS_REL)).filter((f) => f.endsWith('.svg')).length : 0), 0);
  console.log(`✓ 图示导出校验通过：${total} 个 SVG，正文无残留 HTML 块，引用全部存在`);
}

/* -------------------------------------------------------------------- 入口 */

if (has('--extract')) extract();
else if (has('--build')) await build();
else if (has('--replace')) replace();
else if (has('--check')) check();
else {
  console.log('用法：--extract | --build | --replace | --check（可加 --only <page>）');
  process.exit(1);
}
