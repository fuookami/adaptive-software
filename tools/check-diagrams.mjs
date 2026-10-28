import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { execSync } from 'node:child_process';

/**
 * check-diagrams.mjs —— 校验「字符画 → HTML 图示」重绘是否丢字。
 *
 *   node tools/check-diagrams.mjs                 # 与 ascii-baseline 标签对比
 *   node tools/check-diagrams.mjs --ref <ref>     # 指定基线（默认 ascii-baseline，退回 HEAD）
 *   node tools/check-diagrams.mjs --list          # 只列出各文件的图示转换进度
 *
 * 原理：从基线版本取出所有含制表符/箭头的 ```text 图示块，切出其中的文字标签；
 * 再取当前工作区文件里的可见文字（HTML 标签与 Markdown 标记都剥掉），
 * 要求每个标签都逐字出现。标签丢失 = 改写时漏掉了信息。
 */

const ROOT = path.resolve(import.meta.dirname, '..');
const DOCS_ROOT = path.join(ROOT, 'docs');
const BOX = /[┌┐└┘├┤┬┴┼─━│║▏▎▍▌▋▊▉█▁▂▃▄▅▆▇▲▼◄►←→↔↕⇒➤╭╮╰╯═╠╣╦╩╬]/;

const argv = process.argv.slice(2);
const getOpt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const listOnly = argv.includes('--list');

/** 保真校验针对某一语言书根（默认中文：只有它经历过「字符画 → HTML」的重绘） */
const LANG = getOpt('--lang', 'zh');
const DOCS = path.join(DOCS_ROOT, LANG);
const DOCS_REL = `docs/${LANG}`;
/** 结构自检覆盖所有语言书根（英文页以后也会有图） */
const ALL_LANG_DIRS = fs.existsSync(DOCS_ROOT)
  ? fs
      .readdirSync(DOCS_ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `docs/${d.name}`)
  : [];

function baseRef() {
  const wanted = getOpt('--ref', null);
  for (const candidate of [wanted, 'ascii-baseline', 'HEAD']) {
    if (!candidate) continue;
    try {
      execSync(`git rev-parse --verify ${candidate}`, { cwd: ROOT, stdio: 'ignore' });
      if (candidate !== 'ascii-baseline' && !wanted) {
        console.warn(`· 未找到 ascii-baseline 标签，改用 ${candidate} 作基线（git clone 默认会带标签；或用 --ref 指定）`);
      }
      return candidate;
    } catch {
      /* 继续尝试下一个 */
    }
  }
  throw new Error('找不到可用的对比基线（尝试过 --ref、ascii-baseline、HEAD）');
}

const REF = baseRef();

function gitShow(ref, rel) {
  try {
    return execSync(`git show ${ref}:${rel}`, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'], // 探测性读取，基线里没有该路径时不要刷屏
    });
  } catch {
    return null; // 基线里没有该文件
  }
}

/** 取出 fenced 块列表 */
function fences(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const state = { open: false, marker: null, len: 0 };
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (!state.open && m) {
      state.open = true;
      state.marker = m[1][0];
      state.len = m[1].length;
      current = { lang: m[2].trim(), start: i + 1, body: [] };
      continue;
    }
    if (state.open) {
      const close = new RegExp(`^ {0,3}${state.marker === '`' ? '`' : '~'}{3,}\\s*$`).test(line);
      if (close && line.trim()[0] === state.marker) {
        state.open = false;
        blocks.push(current);
        current = null;
        continue;
      }
      current.body.push(line);
    }
  }
  return blocks;
}

/** 图示块 = text 围栏且含制表符号，或含 3 个以上箭头串联 */
function isDiagram(block) {
  if (block.lang !== 'text') return false;
  const joined = block.body.join('\n');
  if (BOX.test(joined)) return true;
  return (joined.match(/──?[►➤]|─+>|=+>|-{2,}>|→/g) || []).length >= 2;
}

/** 从字符画里切出文字片段（按制表符、竖线与空白断句） */
function labelsOf(block) {
  const out = [];
  for (const line of block.body) {
    const parts = line.split(BOX).join('\u0000').replace(/[│┃┆┇┊┋╎╏]/g, '\u0000').split('\u0000');
    for (let p of parts) {
      p = p
        .replace(/^[.\s]*[-─━=═►➤◄▲▼]+[.\s]*/g, '')
        .replace(/[-─━=═►➤◄▲▼]+[.\s]*$/g, '')
        .trim();
      if (!p) continue;
      // 再按空白与项目符号细分：多列排版的同一行会拆成若干独立片段
      for (let tok of p.split(/[\s\u3000•·]+/)) {
        tok = tok.trim();
        if (!tok) continue;
        if (!/[\w\u4e00-\u9fff]/.test(tok)) continue; // 纯符号
        out.push(tok);
      }
    }
  }
  return out;
}

/** 已授权错别字修正：比对时把基线文字先归一到修正后的写法 */
const CORRECTIONS = [
  { from: /基於/g, to: '基于', why: 'chapter-17 图示内繁体残留' },
  { from: /しかし/g, to: '然而', why: 'chapter-04 正文日文残留' },
];
const applyCorrections = (s) => CORRECTIONS.reduce((acc, c) => acc.replace(c.from, c.to), s);

/**
 * 已授权的“新增词元”白名单（--strict 用）。两类来源：
 *   1) 字符画把一句话按框宽折行 / 多列交错排版，HTML 里连成一句后，
 *      连接串在原文件里不连续出现 → 属于排版还原，不是新增表述；
 *   2) 原稿被框宽截断的词，重绘时补全（改这里必须同时改正文，并说明原委）。
 * 新增条目必须写清理由，防止“顺手加戏”混进来。
 */
const AUTHORIZED_ADDITIONS = [
  { tok: '任何机器学习校准或智能体适配均无权通过训练或提示词放宽硬约束', file: 'chapter-08.md', why: '原字符画两列交错折行，连句还原' },
  { tok: '罚系数转化为目标函数分项', file: 'chapter-08.md', why: '原字符画跨行折行，连句还原' },
  { tok: '新鲜度后激活为有效产能覆盖层', file: 'chapter-13.md', why: '原字符画框内折行，连句还原' },
  { tok: '基于冻结输入与当前参数版本产出运筹优化原始基准方案', file: 'chapter-13.md', why: '原字符画框内折行，连句还原' },
  { tok: '学习目标权重与软约束罚系数候选值', file: 'chapter-13.md', why: '原字符画框内折行，连句还原' },
  { tok: '使用批准冻结的新参数版本求解', file: 'chapter-13.md', why: '原字符画框内折行，连句还原' },
  { tok: '今天A和B线共用投料口', file: 'chapter-14.md', why: '原字符画框内折行，连句还原' },
  { tok: '结合元数据与上下文生成结构化候选方案', file: 'chapter-14.md', why: '原字符画框内折行，连句还原' },
  { tok: '符号引用', file: 'chapter-14.md', why: '原稿被框宽截断为“符号引”，重绘时补全' },
  { tok: '沉入平台标准核心', file: 'chapter-17.md', why: '原稿被框宽截断为“平台标准核”，重绘时补全' },
  { tok: '编译为查询/约束/流程', file: 'chapter-03.md', why: '原稿被框宽截断为“约束/流”，重绘时补全' },
];

const norm = (s) =>
  s
    .replace(/【|】|\[|\]|\*\*|`/g, '')
    .replace(/[\s\u00a0\u3000]/g, '')
    .replace(/[。，、；：！？（）()「」『』“”‘’—…·,.:;!?"'()\[\]{}]/g, '')
    .replace(/[─-◿]/g, '')
    .replace(/►|➤|◄|→|←|↑|↓|↺|>|<|＝|=|\+/g, '');

/** 只剥离真正的 HTML 标签（白名单），避免把 `Ret<Quantity<Flt64>>` 这类泛型误当成标签吃掉 */
const HTML_TAG =
  /<\/?(?:div|span|p|br|wbr|small|strong|em|b|i|u|s|code|kbd|pre|samp|var|sub|sup|ul|ol|li|dl|dt|dd|table|thead|tbody|tfoot|tr|td|th|caption|col|colgroup|figure|figcaption|details|summary|mark|abbr|blockquote|q|section|article|header|footer|aside|nav|main|h[1-6]|a|img|hr|sup)\b[^<>]*>/gi;

/** 页面可见文字：先还原 HTML 实体，再剥掉白名单标签与 Markdown 记号 */
function visible(text) {
  return norm(
    text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/&(lt|gt|amp|nbsp|rarr|larr|darr|uarr|#\d+);/gi, (_, e) => {
        const map = { lt: '<', gt: '>', amp: '&', nbsp: ' ', rarr: '→', larr: '←', darr: '↓', uarr: '↑' };
        return map[String(e).toLowerCase()] || '';
      })
      .replace(HTML_TAG, '\n')
      .replace(/!/g, ''),
  );
}

/** 抽取可见词元（先剥标签，再还原实体，避免 aria-label 里的 &lt; 打断标签匹配） */
function tokensOf(text) {
  const set = new Set();
  const strip = (s) => s.replace(HTML_TAG, ' ').replace(/&(lt|gt|amp|nbsp|rarr|larr|darr|uarr);/gi, (_, e) => {
    const map = { lt: '<', gt: '>', amp: '&', nbsp: ' ', rarr: '→', larr: '←', darr: '↓', uarr: '↑' };
    return map[String(e).toLowerCase()];
  });
  for (const block of fences(text)) {
    if (['kotlin', 'java', 'python', 'json', 'sql', 'bash', 'sh', 'yaml', 'xml', 'ts', 'js'].includes(block.lang)) continue;
    for (const tok of labelsOf(block)) {
      const k = norm(strip(tok));
      if (k.length >= 2) set.add(k);
    }
  }
  for (const tok of text.split('\n')) {
    const clean = strip(tok);
    for (const part of clean.split(/[\s\u3000•·，。；：、！？（）()\[\]【】|/\\─━│►➤◄▲▼→←↑↓↺<>=+*&;._"'`-]+/)) {
      const k = norm(part);
      if (k.length >= 2) set.add(k);
    }
  }
  return set;
}

/**
 * 图示 HTML 结构自检：
 *   - `<div class="dg"` 必须顶格（缩进会被 Markdown 当成代码块）
 *   - 块内 div 必须配平闭合
 *   - 块内不能有空行（CommonMark 会切断 HTML 块，后半截漏成正文）
 *   - 块内不写 Markdown 记号（HTML 块里 ** 不会生效）
 */
function structureProblems(text, rel) {
  const bad = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s+<div class="dg"/.test(lines[i])) bad.push(`${rel}:${i + 1} 起始 div 有缩进，会被当成代码块`);
    if (!/^<div class="dg["\s]/.test(lines[i])) continue;
    let depth = 0;
    let j = i;
    for (; j < lines.length; j++) {
      depth += (lines[j].match(/<div\b/g) || []).length;
      depth -= (lines[j].match(/<\/div>/g) || []).length;
      if (depth === 0) break;
      if (depth < 0) break;
      if (!lines[j].trim()) bad.push(`${rel}:${j + 1} 图示块内有空行（HTML 块会被切断）`);
      if (/(\*\*|(^|[^`])`[^`]+)/.test(lines[j])) bad.push(`${rel}:${j + 1} 图示块内残留 Markdown 记号`);
    }
    if (depth !== 0) bad.push(`${rel}:${i + 1} 图示块 div 未配平（depth=${depth}）`);
    i = j;
  }
  return bad;
}

/** 同一页在基线里的历史路径（正文曾从 docs/ 迁到 docs/zh/） */
function baselineText(ref, name) {
  for (const cand of [`docs/${LANG}/${name}`, `docs/${name}`]) {
    const t = gitShow(ref, cand);
    if (t != null) return t;
  }
  return null;
}

function structureOnly() {
  const bad = [];
  let pages = 0;
  for (const dirRel of ALL_LANG_DIRS) {
    const dir = path.join(ROOT, dirRel);
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      pages++;
      bad.push(...structureProblems(text, `${dirRel}/${f}`));
    }
  }
  if (bad.length) {
    console.error(`✗ 图示 HTML 结构问题（${bad.length} 处）：`);
    for (const b of bad) console.error(`  · ${b}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ 图示 HTML 结构自检通过（${ALL_LANG_DIRS.length} 个语言书根、${pages} 个页面：块闭合、无空行、顶格、无 Markdown 残留）`);
}

function main() {
  if (argv.includes('--structure')) {
    structureOnly();
    return;
  }
  const files = fs.readdirSync(DOCS).filter((f) => f.endsWith('.md')).sort();
  const problems = [];
  let diagrams = 0;
  let converted = 0;
  const progress = [];

  for (const f of files) {
    const rel = `${DOCS_REL}/${f}`;
    const oldText = baselineText(REF, f);
    if (oldText == null) continue;
    const newText = fs.readFileSync(path.join(DOCS, f), 'utf8');
    const newVisible = visible(newText);

    const srcDiagrams = fences(oldText).filter(isDiagram);
    if (!srcDiagrams.length) continue;

    const stillAscii = fences(newText).filter(isDiagram).length;
    const done = Math.max(0, srcDiagrams.length - stillAscii);
    diagrams += srcDiagrams.length;
    converted += done;
    progress.push({ f, total: srcDiagrams.length, done });

    if (listOnly) continue;

    for (const block of srcDiagrams) {
      for (const label of labelsOf(block)) {
        const key = norm(applyCorrections(label));
        if (key.length < 2) continue;
        if (!newVisible.includes(key)) {
          problems.push({ file: rel, line: block.start, label });
        }
      }
    }
  }

  if (listOnly) {
    console.log(`基线：${REF}`);
    for (const p of progress) {
      console.log(`  ${p.done === p.total ? '✓' : '·'} ${p.f.padEnd(18)} ${p.done}/${p.total}`);
    }
    console.log(`\n合计 ${converted}/${diagrams} 个图示已转为 HTML`);
    process.exitCode = converted === diagrams ? 0 : 2;
    return;
  }

  if (problems.length) {
    console.error(`\n✗ 重绘丢字（${problems.length} 处，基线 ${REF}）：`);
    const byFile = {};
    for (const p of problems) (byFile[p.file] ||= []).push(p);
    for (const [file, list] of Object.entries(byFile)) {
      console.error(`  ${file}`);
      for (const p of list.slice(0, 12)) console.error(`    · 原文图示第 ${p.line} 行的标签未出现：${p.label}`);
      if (list.length > 12) console.error(`    … 另有 ${list.length - 12} 处`);
    }
    process.exitCode = 1;
    return;
  }

  // 结构自检（与丢字校验同级，始终执行，覆盖所有语言书根）
  const structural = [];
  for (const dirRel of ALL_LANG_DIRS) {
    const dir = path.join(ROOT, dirRel);
    for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
      const text = fs.readFileSync(path.join(dir, f), 'utf8');
      structural.push(...structureProblems(text, `${dirRel}/${f}`));
    }
  }
  if (structural.length) {
    console.error(`\n✗ 图示 HTML 结构问题（${structural.length} 处）：`);
    for (const s of structural.slice(0, 30)) console.error(`  · ${s}`);
    if (structural.length > 30) console.error(`  … 另有 ${structural.length - 30} 处`);
    process.exitCode = 1;
    return;
  }

  if (argv.includes('--strict')) {
    const allowed = new Map(); // 基线文件名（basename）-> Set<归一化词元>
    for (const a of AUTHORIZED_ADDITIONS) {
      if (!allowed.has(a.file)) allowed.set(a.file, new Set());
      allowed.get(a.file).add(norm(a.tok));
    }
    const added = [];
    for (const f of files) {
      const rel = `${DOCS_REL}/${f}`;
      const oldText = baselineText(REF, f);
      if (oldText == null) continue;
      const newText = fs.readFileSync(path.join(DOCS, f), 'utf8');
      // 基线的“可见文字大海”：词元只要能在其中作为连续片段找到，就不算新增
      // （字符画里一行常被折成两行、多列交错排版，连句后在原文件里本就不连续）
      const oldBlob = visible(applyCorrections(oldText));
      const whitelist = allowed.get(f) || new Set();
      for (const tok of tokensOf(newText)) {
        if (oldBlob.includes(tok) || whitelist.has(tok)) continue;
        added.push({ file: rel, tok });
      }
    }
    if (added.length) {
      console.error(`\n⚠ 反向检查：出现基线里没有的词元（可能是重绘时新增的表述，${added.length} 处）：`);
      for (const a of added.slice(0, 40)) console.error(`  ${a.file}: ${a.tok}`);
      if (added.length > 40) console.error(`  … 另有 ${added.length - 40} 处`);
      process.exitCode = 3;
      return;
    }
    console.log('  反向检查：未发现新增表述。');
  }

  console.log(`✓ 图示文字保真校验通过（基线 ${REF}，${converted}/${diagrams} 个图示已重绘，无标签丢失）`);
}

main();
