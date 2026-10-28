#!/usr/bin/env node
/**
 * init-en.mjs —— 从 docs/zh 生成 docs/en 的英文骨架（镜像同名文件，逐页标注翻译状态）。
 *
 *   node tools/init-en.mjs              只创建缺失的英文页（已存在的不动）
 *   node tools/init-en.mjs --dry-run    打印计划
 *   node tools/init-en.mjs --force      重新生成骨架（会覆盖已有译文，慎用）
 *   node tools/init-en.mjs --summary    只重建 docs/en/SUMMARY.md
 *
 * 骨架页里写三件事：英文标题、翻译状态注释、指向中文原文的链接 + 原文标题结构，
 * 让译者不用回中文文件就能对照层级。英文标题是翻译契约，集中在这里（EN_TITLES），
 * 改标题请同时改 docs/zh/SUMMARY.md 与本表，`npm run i18n:check` 会核对两侧一致。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ZH = path.join(ROOT, 'docs', 'zh');
const EN = path.join(ROOT, 'docs', 'en');

/** 英文书名（翻译契约的顶层） */
const BOOK = {
  title: 'From Code to Intent',
  subtitle: 'Building Software That Evolves — Domain-Driven Design, OSPF Optimization and the LLM as Runtime Architecture for the Software 3.0 Era',
};

/** 每页英文标题：key = 与中文同名文件名 */
const EN_TITLES = {
  'title.md': 'Title, Subtitle and Working Titles',
  'outline.md': 'Book Outline — Five Parts, Eighteen Chapters, Seventy-Two Sections',
  'preface.md': 'Preface: When Users Use Software, They Are Also Compiling It',
  'part-1.md': 'Part One: The Paradigm Shift — From Software 1.0 to LLM as Runtime',
  'part-2.md': 'Part Two: The Semantic Substrate — Formal Domain Models and the OSPF Framework',
  'part-3.md': 'Part Three: Engineering Pillars and the World Model — Remembering the Past, Simulating the Future',
  'part-4.md': 'Part Four: Three Natives in Concert — When LLMs and Machine Learning Meet Optimization',
  'part-5.md': 'Part Five: Runtime Evolution and the Full Picture — Toward the Adaptive DOP',
  'part-2-summary.md': 'Part Two Summary: From Divergent Black Boxes to a Provably Shared Substrate',
  'part-3-summary.md': 'Part Three Summary: The Engineering Skeleton and the Operating World Are in Place',
  'part-4-summary.md': 'Part Four Summary: A Safe Bridge from Open Intent to Controlled Capability',
  'chapter-01.md': 'Enterprise Software Trapped by CRUD and Bolt-on Black Boxes',
  'chapter-02.md': 'From Records to Intent — How Much Cognition Has Software Taken Over?',
  'chapter-03.md': 'Rereading Software 1.0, 2.0 and 3.0 — Two Orthogonal Axes of Evolution',
  'chapter-04.md': 'The Core Thesis: LLM as Runtime',
  'chapter-05.md': 'Unifying the Three Natives in a Formal Domain Model',
  'chapter-06.md': 'Meet OSPF — Algebraic Numbers and Dimensional Safety',
  'chapter-07.md': 'One Fish, Two Dishes — A Shared Expression IR with Two Entry Points',
  'chapter-08.md': 'Business as Building Blocks — Structured Functions, Logic Operators, Solver Decoupling',
  'chapter-09.md': 'The Six Engineering Pillars of Adaptive Software',
  'chapter-10.md': 'The Runtime World Model — Event Sourcing and the Computable Digital Twin',
  'chapter-11.md': 'Orchestrating Optimization Algorithms in the Open with DDD',
  'chapter-12.md': 'Beyond “Infeasible” — The Orthogonal SolveReport Protocol',
  'chapter-13.md': 'The Symphony of Three Natives — Bidirectional OR × ML Enhancements',
  'chapter-14.md': 'Agent Native and the Business Semantic Frontend',
  'chapter-15.md': 'The Trusted Execution Boundary — Eight Steps from Candidate to Production',
  'chapter-16.md': 'Semantic JIT — Profile-Driven Specialization and Invalidating Rebuilds',
  'chapter-17.md': 'Taming Complexity — The Mythical Man-Month, SPLE and Four-Tier Promotion',
  'chapter-18.md': 'The Full Picture in Practice — Building an Adaptive DOP from Scratch',
  'epilogue.md': 'Epilogue: Towards Software That Grows While It Is Used',
};

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

/** 章号 → “Chapter N: ” 前缀 */
function headingFor(name) {
  const m = /^chapter-(\d+)\.md$/.exec(name);
  const t = EN_TITLES[name];
  if (!t) return null;
  return m ? `Chapter ${Number(m[1])}: ${t}` : t;
}

/** 逐页取中文标题结构（代码围栏与 HTML 图块内的 # 不算标题） */
function zhOutline(text) {
  const state = { open: false, marker: null };
  const out = [];
  for (const line of text.split('\n')) {
    const fm = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fm && !state.open) {
      state.open = true;
      state.marker = fm[1][0];
      continue;
    }
    if (state.open) {
      if (new RegExp(`^ {0,3}${state.marker === '`' ? '`' : '~'}{3,}\\s*$`).test(line)) state.open = false;
      continue;
    }
    const hm = /^(#{1,4})\s+(.*)$/.exec(line);
    if (hm) out.push({ level: hm[1].length, text: hm[2].trim() });
  }
  return out;
}

function skeleton(name, zhText) {
  const head = headingFor(name);
  if (!head) {
    console.warn(`  ! ${name}: EN_TITLES 里没有英文标题，跳过（请补充）`);
    return null;
  }
  const outline = zhOutline(zhText)
    .filter((h, i) => i > 0)
    .map((h) => `${'  '.repeat(h.level - 2)}- ${h.text}`)
    .join('\n');
  const diagramCount = (zhText.match(/^<div class="dg"/gm) || []).length;

  return `<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/${name} -->
# ${head}

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/${name})
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> \`i18n-status\` 改为 \`translated\`（\`npm run i18n:check\` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

${outline || '- （本页无子标题）'}

${diagramCount ? `> 本页含 ${diagramCount} 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 \`dg-*\` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。\n` : ''}`;
}

function summaryFromZh() {
  const zh = fs.readFileSync(path.join(ZH, 'SUMMARY.md'), 'utf8');
  const lines = zh.split('\n').map((line) => {
    const m = /^(\s*[-*]\s*)\[([^\]]*)\]\(([^)\s]+)\)(\s*"(?:[^"]*)")?\s*$/.exec(line);
    if (!m) return line; // 空行、# Summary 等原样保留
    const name = path.basename(m[3]);
    if (name === 'README.md') return line;
    const head = headingFor(name);
    const label = head ? head : m[2];
    return `${m[1]}[${label}](${m[3]})`;
  });
  return lines.join('\n');
}

function main() {
  if (!fs.existsSync(ZH)) throw new Error(`找不到中文书根 ${rel(ZH)}`);

  fs.mkdirSync(EN, { recursive: true });

  if (has('--summary')) {
    const s = summaryFromZh();
    if (has('--dry-run')) return console.log(s);
    fs.writeFileSync(path.join(EN, 'SUMMARY.md'), s, 'utf8');
    console.log(`✓ 已生成 ${rel(EN)}/SUMMARY.md`);
    return;
  }

  const pages = fs.readdirSync(ZH).filter((f) => f.endsWith('.md') && f !== 'SUMMARY.md').sort();
  const created = [];
  const skipped = [];

  for (const name of pages) {
    const target = path.join(EN, name);
    const exists = fs.existsSync(target);
    if (exists && !has('--force')) {
      skipped.push(name);
      continue;
    }
    const zhText = fs.readFileSync(path.join(ZH, name), 'utf8');
    const body = skeleton(name, zhText);
    if (!body) {
      skipped.push(name);
      continue;
    }
    if (has('--dry-run')) {
      created.push(name);
      continue;
    }
    fs.writeFileSync(target, body, 'utf8');
    created.push(name);
  }

  const s = summaryFromZh();
  if (!has('--dry-run')) fs.writeFileSync(path.join(EN, 'SUMMARY.md'), s, 'utf8');

  console.log(`${has('--dry-run') ? '[dry-run] ' : ''}✓ 英文骨架：新建 ${created.length} 页，保留已存在 ${skipped.length} 页`);
  console.log(`✓ ${rel(EN)}/SUMMARY.md 已按中文导航顺序生成（${(s.match(/^\s*[-*]\s*\[/gm) || []).length} 个条目）`);
  if (!has('--dry-run')) {
    console.log('\n下一步：');
    console.log('  npm run i18n:check     # 核对两语言页面/导航/图示是否对齐');
    console.log('  翻译时把页面首行 i18n-status 改为 translated');
  }
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exitCode = 1;
}
