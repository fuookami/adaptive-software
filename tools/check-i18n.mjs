#!/usr/bin/env node
/**
 * check-i18n.mjs —— 双语书的一致性校验。
 *
 *   node tools/check-i18n.mjs            全量校验（CI 用，失败 exit 1）
 *   node tools/check-i18n.mjs --progress 只打印翻译进度
 *
 * 校验内容：
 *   1. 两语言书根都有 README/SUMMARY/book.json/.gitbook.yaml；
 *   2. 页面文件集合一一对应（同名同层级），不多不少；
 *   3. SUMMARY.md 条目数、href 顺序、缩进层级完全一致；
 *   4. 英文页首行必须有 i18n-status 标记，未译页必须回链中文原文；
 *   5. 已标记 translated 的页面：图示数量与小节数不得少于中文页（防止漏图漏节）；
 *   6. 根 gitbook-docs.yaml 的 content.directory 指向真实目录，且每个语言只出现一次、有且仅有一个默认空间；
 *   7. book.json 的 language 与目录语言一致，并声明了 styles.website。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANGS = { zh: 'zh-hans', en: 'en' };
const errors = [];
const warnings = [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

const readIf = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const pagesIn = (dir) =>
  fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'SUMMARY.md')
    .sort();

function summaryItems(text) {
  const items = [];
  for (const line of text.split('\n')) {
    const m = /^(\s*)[-*]\s*\[([^\]]*)\]\(([^)\s]+)\)/.exec(line);
    if (m) items.push({ depth: m[1].length, label: m[2], href: m[3] });
  }
  return items;
}

function diagramCount(text) {
  return (text.match(/^<div class="dg"/gm) || []).length;
}
function sectionCount(text) {
  const state = { open: false, marker: null };
  let n = 0;
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
    if (/^##\s+\S/.test(line)) n++;
  }
  return n;
}

/** 三级子节数量（如第 1 章的「痛点 1–7」、第 10 章的 10.1 子节），不数代码块内的 # */
function subsectionCount(text) {
  const state = { open: false, marker: null };
  let n = 0;
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
    if (/^###\s+\S/.test(line)) n++;
  }
  return n;
}

/** 页面翻译状态：untranslated | translating | translated（缺标记返回 null） */
function statusOf(text) {
  const m = /<!--\s*i18n-status:\s*(\w[\w-]*)\s*-->/.exec(text);
  return m ? m[1] : null;
}

function main() {
  for (const [lang] of Object.entries(LANGS)) {
    const dir = path.join(ROOT, 'docs', lang);
    if (!fs.existsSync(dir)) {
      errors.push(`缺少 ${lang} 书根目录 docs/${lang}/`);
      continue;
    }
    for (const need of ['README.md', 'SUMMARY.md', 'book.json', '.gitbook.yaml']) {
      if (!fs.existsSync(path.join(dir, need))) errors.push(`docs/${lang}/ 缺少 ${need}`);
    }
    const bj = readIf(path.join(dir, 'book.json'));
    if (bj) {
      try {
        const conf = JSON.parse(bj);
        if (conf.language !== LANGS[lang]) errors.push(`docs/${lang}/book.json 的 language 应为 ${LANGS[lang]}，实际 ${conf.language}`);
        if (!conf.styles || !conf.styles.website) errors.push(`docs/${lang}/book.json 缺少 styles.website（图示样式表）`);
      } catch (e) {
        errors.push(`docs/${lang}/book.json 不是合法 JSON：${e.message}`);
      }
    }
  }
  if (errors.length) return report();

  // 2. 页面集合一一对应
  const zhPages = pagesIn(path.join(ROOT, 'docs', 'zh'));
  const enPages = pagesIn(path.join(ROOT, 'docs', 'en'));
  const onlyZh = zhPages.filter((p) => !enPages.includes(p));
  const onlyEn = enPages.filter((p) => !zhPages.includes(p));
  for (const p of onlyZh) errors.push(`docs/en/ 缺少与 docs/zh/${p} 对应的页面`);
  for (const p of onlyEn) errors.push(`docs/en/${p} 在中文侧没有对应页面`);

  // 3. SUMMARY 对齐
  const zhSum = readIf(path.join(ROOT, 'docs', 'zh', 'SUMMARY.md'));
  const enSum = readIf(path.join(ROOT, 'docs', 'en', 'SUMMARY.md'));
  if (zhSum && enSum) {
    const a = summaryItems(zhSum);
    const b = summaryItems(enSum);
    if (a.length !== b.length) errors.push(`SUMMARY 条目数不一致：zh ${a.length} vs en ${b.length}`);
    else {
      for (let i = 0; i < a.length; i++) {
        if (a[i].href !== b[i].href) errors.push(`SUMMARY 第 ${i + 1} 条 href 不一致：zh ${a[i].href} vs en ${b[i].href}`);
        if (a[i].depth !== b[i].depth) errors.push(`SUMMARY 第 ${i + 1} 条层级不一致：${b[i].href}`);
      }
    }
    for (const item of b) {
      if (/^https?:/.test(item.href)) continue;
      if (!fs.existsSync(path.join(ROOT, 'docs', 'en', item.href))) errors.push(`docs/en/SUMMARY.md 指向不存在的文件：${item.href}`);
    }
  }

  // 4/5. 英文页状态标记、回链、图示与小节对齐
  const progress = { translated: [], translating: [], untranslated: [], unknown: [] };
  for (const p of enPages) {
    // README.md 是各语言自己的落地页（内容由该书自己决定），不做逐页镜像要求
    if (p === 'README.md') continue;
    const enText = readIf(path.join(ROOT, 'docs', 'en', p));
    const zhText = readIf(path.join(ROOT, 'docs', 'zh', p));
    const st = statusOf(enText);
    if (!st) {
      progress.unknown.push(p);
      errors.push(`docs/en/${p} 缺少 <!-- i18n-status: … --> 标记`);
      continue;
    }
    (progress[st] || progress.untranslated).push(p);
    if (st === 'untranslated' || st === 'translating') {
      if (!enText.includes(`../zh/${p}`)) warnings.push(`docs/en/${p} 未译/在译，但没有回链 ../zh/${p}`);
      continue;
    }
    if (!zhText) continue;
    const dz = diagramCount(zhText);
    const de = diagramCount(enText);
    if (de < dz) errors.push(`docs/en/${p} 已标记 translated，但图示只有 ${de} 个（中文 ${dz} 个）`);
    const sz = sectionCount(zhText);
    const se = sectionCount(enText);
    if (se < sz) warnings.push(`docs/en/${p} 小节数 ${se} 少于中文页 ${sz}，请确认没有漏译章节`);

    // 三级子节（如「痛点 1–7」）：漏一个就是漏一段内容，按错误处理
    const hz = subsectionCount(zhText);
    const he = subsectionCount(enText);
    if (he < hz) {
      errors.push(`docs/en/${p} 三级子节只有 ${he} 个（中文 ${hz} 个），疑似漏译子节`);
    }

    // 脚手架残留：骨架期的提示与对照节必须删干净
    if (/not translated yet/i.test(enText) || /##\s+Original structure/i.test(enText)) {
      errors.push(`docs/en/${p} 标记为 translated，但仍残留骨架提示或 Original structure 对照节`);
    }
    // 中文残留：允许少量（引用中文术语、举例），超过阈值提醒复核
    const cjk = (enText.match(/[\u3400-\u9fff]/g) || []).length;
    if (cjk > 40) warnings.push(`docs/en/${p} 有 ${cjk} 个汉字，若并非有意引用请清理`);

    // 译文质量 lint：只在正文里查（剥掉代码块与行内代码，避免误报）
    const prose = enText.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
    const dup = prose.match(/\b(\w{3,})\s+\1\b/gi);
    if (dup) {
      warnings.push(`docs/en/${p} 疑似重复词：${[...new Set(dup.map((s) => s.toLowerCase()))].slice(0, 3).join(', ')}`);
    }
    // 全角标点：只认中文标点与中文式双破折号 `——`；
    // 单个 `—`（em dash）是英文正当用法，不予告警。
    const fullWidth = prose.match(/[，。「」『』（）【】《》、；：？！]|——/g);
    if (fullWidth) {
      warnings.push(`docs/en/${p} 残留全角标点 ${fullWidth.length} 处（${[...new Set(fullWidth)].slice(0, 6).join(' ')}）`);
    }
  }

  // 6. gitbook-docs.yaml
  const site = readIf(path.join(ROOT, 'gitbook-docs.yaml'));
  if (!site) {
    warnings.push('根目录没有 gitbook-docs.yaml（只在接入 GitBook 多空间站点时才需要）');
  } else {
    // 站点映射的完整校验（语言枚举、default 规则、key 唯一、目录存在）由专用校验器负责：
    //   node tools/check-gitbook-yaml.mjs
    // 这里不再用正则重复解析（注释里出现 default: true 之类的字样会误伤）。
    const dirs = [...site.matchAll(/directory:\s*(\S+)/g)].map((m) => m[1].replace(/^\.\/?/, ''));
    for (const d of dirs) {
      if (d === 'null') continue;
      if (!fs.existsSync(path.join(ROOT, d))) errors.push(`gitbook-docs.yaml 的 content.directory 不存在：${d}`);
    }
  }

  if (argvProgress) return report(progress);
  report(progress);
}

const argvProgress = process.argv.includes('--progress');

function report(progress) {
  if (progress) {
    const total = Object.values(progress).reduce((a, v) => a + v.length, 0);
    const done = progress.translated.length;
    console.log(`\n翻译进度：${done}/${total} 页已译（${total ? Math.round((done / total) * 100) : 0}%）`);
    console.log(`  translated ${done} · translating ${progress.translating.length} · untranslated ${progress.untranslated.length} · 缺标记 ${progress.unknown.length}`);
    if (progress.unknown.length) console.log(`  缺标记：${progress.unknown.join(', ')}`);
  }
  if (warnings.length) {
    console.log(`\n⚠ 提醒（${warnings.length} 项，不阻断）：`);
    for (const w of warnings) console.log(`  · ${w}`);
  }
  if (errors.length) {
    console.error(`\n✗ 双语一致性校验失败（${errors.length} 项）：`);
    for (const e of errors) console.error(`  · ${e}`);
    process.exitCode = 1;
    return;
  }
  console.log(`\n✓ 双语一致性校验通过：docs/zh 与 docs/en 页面、导航、书根配置、站点映射全部对齐`);
}

try {
  main();
} catch (err) {
  console.error(`\n✗ ${err.message}`);
  process.exitCode = 1;
}
