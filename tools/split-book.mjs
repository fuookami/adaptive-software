#!/usr/bin/env node
/**
 * split-book.mjs — 把手稿（仓库根目录下 adaptive_software_book_*.md）切分成
 * GitBook / Honkit 友好的「一章一文件」结构，输出到 docs/。
 *
 * 用法：
 *   node tools/split-book.mjs                 切分并写入 docs/
 *   node tools/split-book.mjs --dry-run       只打印计划，不写文件
 *   node tools/split-book.mjs --move-sources  切分后把手稿归档到 manuscript/
 *   node tools/split-book.mjs --force         允许覆盖 docs/ 下已存在的页面
 *   node tools/split-book.mjs --check         校验 SUMMARY.md 与 docs/ 的一致性
 *
 * 设计约束：
 *   - 代码围栏（``` 或 ~~~）内的 “#” 行不是标题，切分与层级调整都会跳过围栏内容；
 *   - 只按已知标题模式（卷 / 章 / 前言 / 大纲 / 本卷小结 / 结语 / 书名）切块，
 *     未知 H2 会保留在当前块中并给出警告，绝不静默丢内容；
 *   - 每个输出块只调整标题层级（H2 块整体升一级），不改动正文文字。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 中文版书根（SUMMARY.md 里的链接相对本书根解析） */
const LANG = 'zh';
const DOCS = path.join(ROOT, 'docs', LANG);
const DOCS_REL = `docs/${LANG}`;
const MANUSCRIPT = path.join(ROOT, 'manuscript');

/** 卷 → 章节范围（18 章 5 卷） */
const VOLUME_OF_CHAPTER = new Map();
for (const [from, to, vol] of [
  [1, 4, 1],
  [5, 8, 2],
  [9, 12, 3],
  [13, 15, 4],
  [16, 18, 5],
]) {
  for (let n = from; n <= to; n++) VOLUME_OF_CHAPTER.set(n, vol);
}

const CN_DIGITS = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };

/** 允许不出现在 SUMMARY.md 中的页面（前置材料，不参与正文导航） */
const KNOWN_ORPHANS = new Set([`${DOCS_REL}/title.md`]);

const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);

// ---------------------------------------------------------------------------
// 1. 找到手稿文件，按文件名中的第一个数字排序（ch1, ch2~ch4, ch5~ch8, ...）
// ---------------------------------------------------------------------------
function findSources() {
  const scan = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && /^adaptive_software_book_.*\.md$/i.test(e.name))
      .map((e) => ({ name: e.name, abs: path.join(dir, e.name), atRoot: dir === ROOT }))
      .sort((a, b) => {
        const na = Number(a.name.match(/(\d+)/)?.[1] ?? 0);
        const nb = Number(b.name.match(/(\d+)/)?.[1] ?? 0);
        return na - nb || a.name.localeCompare(b.name);
      });

  const atRoot = scan(ROOT);
  if (atRoot.length) return atRoot;

  // 手稿可能已被上一次运行归档到 manuscript/
  if (fs.existsSync(MANUSCRIPT)) {
    const archived = scan(MANUSCRIPT);
    if (archived.length) {
      console.log(`（手稿位于 manuscript/，共 ${archived.length} 个文件）`);
      return archived;
    }
  }
  throw new Error(
    `${ROOT} 与 ${MANUSCRIPT} 下都找不到 adaptive_software_book_*.md 手稿，无法切分。`,
  );
}

// ---------------------------------------------------------------------------
// 2. 块（block）识别：标题层级 + 代码围栏感知
// ---------------------------------------------------------------------------
function fenceToggle(line, state) {
  const m = /^ {0,3}(`{3,}|~{3,})/.exec(line);
  if (!m) return false;
  const marker = m[1][0];
  if (!state.open) {
    state.open = true;
    state.marker = marker;
    state.len = m[1].length;
    return true;
  }
  if (marker === state.marker && m[1].length >= state.len) {
    state.open = false;
    state.marker = null;
    return true;
  }
  return false;
}

/**
 * 判断一个标题行是否是新页面的边界。
 * @returns {null | {type, num?, title}}
 */
function classify(heading) {
  const body = heading.text;
  let m;

  // 《书名》—— 书名块（仅在文件首个 H1 出现）
  if (heading.level === 1 && /^#\s*《/.test(body)) {
    return { type: 'title', title: body.replace(/^#\s*/, '') };
  }
  // 卷首：# 第三卷：工程支柱与世界模型篇 —— ...
  if (heading.level === 1 && (m = /^#\s*第\s*([一二三四五六七八九十]+)\s*卷/.exec(body))) {
    return { type: 'part', num: CN_DIGITS[m[1]] ?? Number(m[1]), title: body.replace(/^#\s*/, '') };
  }
  // 章：## 第 9 章：自适应软件的六大工程支柱 —— ...
  if ((m = /^#{2}\s*第\s*(\d+)\s*章/.exec(body))) {
    return { type: 'chapter', num: Number(m[1]), title: body.replace(/^#{2}\s*/, '') };
  }
  if ((m = /^#{2}\s*(前言[^\n]*|导读[^\n]*)$/.exec(body))) {
    return { type: 'preface', title: body.replace(/^#{2}\s*/, '') };
  }
  if ((m = /^#{2}\s*(目录与全书大纲[^\n]*|全书大纲[^\n]*|大纲[^\n]*)$/.exec(body))) {
    return { type: 'outline', title: body.replace(/^#{2}\s*/, '') };
  }
  if ((m = /^#{2}\s*本卷小结(.*)$/.exec(body))) {
    return { type: 'part-summary', title: body.replace(/^#{2}\s*/, '') };
  }
  if ((m = /^#{2}\s*(全书结语|结语)(.*)$/.exec(body))) {
    return { type: 'epilogue', title: body.replace(/^#{2}\s*/, '') };
  }
  return null;
}

function splitIntoBlocks(lines, sourceFile) {
  const state = { open: false, marker: null, len: 0 };
  const blocks = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isFenceLine = /^[ ]{0,3}(`{3,}|~{3,})/.test(line);

    if (!state.open) {
      const hm = /^(#{1,6})\s+(.*)$/.exec(line);
      if (hm && !isFenceLine) {
        const heading = { level: hm[1].length, text: line };
        const kind = classify(heading);
        if (kind) {
          current = { ...kind, level: heading.level, lines: [line], source: sourceFile, startLine: i + 1 };
          blocks.push(current);
          fenceToggle(line, state); // 保证围栏状态一致（标题行不会开启围栏）
          continue;
        }
        if (heading.level === 2) {
          console.warn(`  ! ${sourceFile}:${i + 1} 未识别的二级标题，保留在当前页中：${heading.text}`);
        }
      }
    }
    if (!current) {
      // 边界之前的内容（空行等）忽略；有实质文字则告警
      if (line.trim()) console.warn(`  ! ${sourceFile}:${i + 1} 位于任何标题之前的正文，已忽略：${line.slice(0, 40)}`);
      fenceToggle(line, state);
      continue;
    }
    current.lines.push(line);
    fenceToggle(line, state);
  }
  if (state.open) console.warn(`  ! ${sourceFile} 文件结束时仍处于代码围栏中，请检查未闭合的代码围栏。`);
  return blocks;
}

// ---------------------------------------------------------------------------
// 3. 规范化：标题层级平移、去掉首尾分隔线
// ---------------------------------------------------------------------------
function normalize(block) {
  const shift = block.level === 2 ? -1 : 0; // H2 打头的页面整体升一级
  const state = { open: false, marker: null, len: 0 };
  const out = [];

  for (const line of block.lines) {
    if (fenceToggle(line, state)) {
      out.push(line);
      continue;
    }
    if (!state.open) {
      const hm = /^(#{1,6})(\s+)(.*)$/.exec(line);
      if (hm) {
        const level = Math.min(6, Math.max(1, hm[1].length + shift));
        out.push('#'.repeat(level) + hm[2] + hm[3]);
        continue;
      }
    }
    out.push(line);
  }

  // 去掉开头的空行与孤立的 --- / *** 分隔线（避免被当作 YAML front matter）
  while (out.length && !out[0].trim()) out.shift();
  while (out.length && /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(out[0])) {
    out.shift();
    while (out.length && !out[0].trim()) out.shift();
  }
  // 去掉尾部分隔线与空行
  while (out.length && !out[out.length - 1].trim()) out.pop();
  while (out.length && /^ {0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(out[out.length - 1])) {
    out.pop();
    while (out.length && !out[out.length - 1].trim()) out.pop();
  }
  return out.join('\n').trimEnd() + '\n';
}

// ---------------------------------------------------------------------------
// 4. 输出文件名
// ---------------------------------------------------------------------------
function outPathFor(block, currentVolume) {
  const p = (n) => String(n).padStart(2, '0');
  switch (block.type) {
    case 'title':
      return `${DOCS_REL}/title.md`;
    case 'outline':
      return `${DOCS_REL}/outline.md`;
    case 'preface':
      return `${DOCS_REL}/preface.md`;
    case 'epilogue':
      return `${DOCS_REL}/epilogue.md`;
    case 'chapter':
      return `${DOCS_REL}/chapter-${p(block.num)}.md`;
    case 'part':
      return `${DOCS_REL}/part-${block.num}.md`;
    case 'part-summary': {
      const vol = currentVolume;
      if (!vol) throw new Error(`无法判定“${block.title}”所属卷，请检查它前面是否有章或卷标题。`);
      return `${DOCS_REL}/part-${vol}-summary.md`;
    }
    default:
      throw new Error(`未知块类型：${block.type}`);
  }
}

/** 第一卷没有卷首正文：用大纲里的卷标题 + 该卷目录生成导航页 */
function synthesizePart1(outlineText) {
  const lines = outlineText.split('\n');
  const start = lines.findIndex((l) => /^#{2,3}\s*第一卷[：:]/.test(l));
  if (start === -1) throw new Error('大纲中找不到“第一卷：…”，无法生成 docs/part-1.md');
  const title = lines[start].replace(/^#{1,6}\s*/, '').trim();
  const body = [];
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^#{1,3}\s/.test(l) || /^ {0,3}-{3,}\s*$/.test(l)) break;
    body.push(l);
  }
  if (!body.length) throw new Error('大纲中第一卷条目为空，无法生成 docs/part-1.md');
  return `# ${title}\n\n${body.join('\n').trim()}\n`;
}

/**
 * 5. --check：书根的 SUMMARY.md 与页面一致性
 *    SUMMARY.md 里的链接相对书根解析（docs/zh/chapter-01.md → 链接写 chapter-01.md）。
 */
function check() {
  const problems = [];
  const summaryPath = path.join(DOCS, 'SUMMARY.md');
  if (!fs.existsSync(summaryPath)) problems.push(`${DOCS_REL}/SUMMARY.md 不存在`);
  if (!fs.existsSync(DOCS)) problems.push(`${DOCS_REL}/ 目录不存在，请先运行 node tools/split-book.mjs`);
  if (!fs.existsSync(path.join(DOCS, 'README.md'))) problems.push(`${DOCS_REL}/README.md 缺失（book.json 的 structure.readme 指向它）`);

  const referenced = new Set();
  if (fs.existsSync(summaryPath)) {
    const summary = fs.readFileSync(summaryPath, 'utf8');
    for (const m of summary.matchAll(/\[([^\]]*)\]\(([^)\s]+)\)/g)) {
      const target = m[2];
      if (/^(https?:|#|mailto:)/i.test(target)) continue;
      const abs = path.resolve(DOCS, decodeURI(target));
      if (!fs.existsSync(abs)) {
        problems.push(`${DOCS_REL}/SUMMARY.md 链接指向不存在的文件：${target}`);
        continue;
      }
      referenced.add(path.relative(ROOT, abs).split(path.sep).join('/'));
    }
  }

  const pages = fs.existsSync(DOCS)
    ? fs
        .readdirSync(DOCS)
        .filter((f) => f.endsWith('.md') && f !== 'SUMMARY.md')
        .map((f) => `${DOCS_REL}/${f}`)
    : [];

  for (const p of pages) {
    // README.md 是书的空间落地页，由 book.json 指定，不必出现在导航里
    if (!referenced.has(p) && !KNOWN_ORPHANS.has(p) && path.basename(p) !== 'README.md') {
      problems.push(`${p} 未被 SUMMARY.md 引用`);
    }
    const text = fs.readFileSync(path.join(ROOT, p), 'utf8');
    const state = { open: false, marker: null, len: 0 };
    let h1 = 0;
    for (const line of text.split('\n')) {
      if (fenceToggle(line, state)) continue;
      if (!state.open && /^#\s+\S/.test(line)) h1++;
    }
    if (h1 !== 1) problems.push(`${p} 应恰好有 1 个一级标题，实际 ${h1} 个`);
    if (!text.startsWith('#') && !text.startsWith('<!--')) problems.push(`${p} 未以标题开头`);
    if (text.trimEnd().endsWith('---')) problems.push(`${p} 结尾残留 --- 分隔线`);
  }

  // 章文件完整性：chapter-01 … chapter-18
  for (let n = 1; n <= 18; n++) {
    const f = `${DOCS_REL}/chapter-${String(n).padStart(2, '0')}.md`;
    if (!pages.includes(f)) problems.push(`缺少章节页 ${f}`);
  }

  if (problems.length) {
    console.error(`\n✗ 结构校验未通过（${problems.length} 项）：`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n✓ 结构校验通过：${DOCS_REL} 下 ${pages.length} 个页面全部被 SUMMARY.md 引用，且各含 1 个一级标题。`);
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------
function main() {
  if (has('--check')) {
    check();
    return;
  }

  const sources = findSources();
  console.log(`手稿文件（${sources.length} 个）：`);
  for (const s of sources) console.log(`  · ${s.atRoot ? '' : 'manuscript/'}${s.name}`);

  const dryRun = has('--dry-run');
  const planned = new Map(); // relPath -> text
  let currentVolume = null;
  let outlineText = null;
  const order = [];

  for (const src of sources) {
    const raw = fs.readFileSync(src.abs, 'utf8');
    const blocks = splitIntoBlocks(raw.replace(/\r\n/g, '\n').split('\n'), src.name);
    console.log(`\n→ ${src.name}：${blocks.length} 个页面块`);
    for (const block of blocks) {
      if (block.type === 'part') currentVolume = block.num;
      if (block.type === 'chapter') currentVolume = VOLUME_OF_CHAPTER.get(block.num) ?? currentVolume;
      const rel = outPathFor(block, currentVolume);
      const text = normalize(block);
      if (planned.has(rel)) throw new Error(`目标页面重复：${rel}（来自 ${src.name}）`);
      planned.set(rel, text);
      order.push({ rel, type: block.type, title: block.title, from: `${src.name}:${block.startLine}` });
      if (block.type === 'outline') outlineText = text;
    }
  }

  // 第一卷导航页（手稿中第一卷没有独立卷首正文）
  if (!planned.has(`${DOCS_REL}/part-1.md`)) {
    if (!outlineText) throw new Error(`缺少大纲块，无法生成 ${DOCS_REL}/part-1.md`);
    planned.set(`${DOCS_REL}/part-1.md`, synthesizePart1(outlineText));
    order.unshift({ rel: `${DOCS_REL}/part-1.md`, type: 'part', title: '第一卷（由大纲自动生成）', from: 'generated' });
    console.log(`\n→ 生成 ${DOCS_REL}/part-1.md（第一卷无卷首正文，用大纲中的卷标题与该卷目录）`);
  }

  if (dryRun) {
    console.log(`\n[dry-run] 将写入 ${planned.size} 个文件：`);
    for (const { rel, from } of order) console.log(`  ${rel.padEnd(28)} ← ${from}`);
    return;
  }

  // 保护：正文一旦被编辑（含图示重绘、英文译稿），重新切分会覆盖手工修订，必须显式 --force
  if (!has('--force')) {
    const existing = [...planned.keys()].filter((rel) => fs.existsSync(path.join(ROOT, rel)));
    if (existing.length) {
      console.error(
        `\n✗ ${DOCS_REL} 下已有 ${existing.length} 个页面会被覆盖，例如：\n` +
          existing.slice(0, 5).map((r) => `    ${r}`).join('\n') +
          `\n确认要用 manuscript/ 手稿重置正文，请加 --force（注意：会一并回退已重绘的 HTML 图示）。`,
      );
      process.exitCode = 1;
      return;
    }
  }

  fs.mkdirSync(DOCS, { recursive: true });
  let bytes = 0;
  for (const [rel, text] of planned) {
    fs.writeFileSync(path.join(ROOT, rel), text, 'utf8');
    bytes += Buffer.byteLength(text);
  }
  console.log(`\n✓ 已写入 ${planned.size} 个页面到 ${DOCS_REL}/（约 ${(bytes / 1024).toFixed(1)} KB）`);

  if (has('--move-sources')) {
    fs.mkdirSync(MANUSCRIPT, { recursive: true });
    let moved = 0;
    for (const src of sources) {
      if (!src.atRoot) continue; // 已经在 manuscript/ 下
      fs.copyFileSync(src.abs, path.join(MANUSCRIPT, src.name));
      fs.unlinkSync(src.abs);
      moved++;
    }
    console.log(
      moved
        ? `✓ ${moved} 个手稿已归档到 manuscript/（保留原始行文，便于 --force 重新生成）`
        : '· 手稿已在 manuscript/ 下，无需归档',
    );
  }

  console.log('\n下一步：');
  console.log('  1. node tools/split-book.mjs --check   # 校验 SUMMARY.md 与 docs/ 是否一致');
  console.log('  2. npm install                          # 安装 honkit');
  console.log('  3. npm run serve                        # 本地预览 http://localhost:4000');
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exitCode = 1;
}
