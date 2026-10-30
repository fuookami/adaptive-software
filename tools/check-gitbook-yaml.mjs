#!/usr/bin/env node
/**
 * check-gitbook-yaml.mjs —— 按 GitBook 的官方 JSON Schema 校验根目录的 gitbook-docs.yaml。
 *
 *   node tools/check-gitbook-yaml.mjs
 *
 * 为什么需要它：GitBook 在 Git Sync 时只报**第一个**解析错误，而且报错发生在它那边
 * （例如 “site.structure.0.children.0.content.language: expected one of the enum value”），
 * 本地毫无感知。这里把 schema 的硬约束前移到 CI 与提交前：
 *
 *   · structure 节点类型与各类型的 required / additionalProperties
 *   · translation language 枚举（简体中文是 zh，不是 zh-Hans）
 *   · localizedTitle / localizedDescription 的键也必须是该枚举
 *   · site 仅允许 title / structure
 *   · 有 section 的站点必须恰好一个 section default，且顶层不再列 space；
 *     无 section 时顶层 space 恰好一个 default；每个 section 内恰好一个 space default
 *   · key 全局唯一；content.directory 不得含 ..，且目录必须真实存在
 *
 * 校验规则的来源：https://api.gitbook.com/gitbook-docs.yaml （2026-10-30 拉取）。
 * 规则若与线上不一致，以该 schema 为准，改这里而不是绕过校验。
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/** 默认校验根目录的 gitbook-docs.yaml；也可传一个路径用于验证（测试用副本） */
const FILE = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'gitbook-docs.yaml');

const SCHEMA_URL = 'https://api.gitbook.com/gitbook-docs.yaml';

/** schema 里 TranslationLanguage 的完整枚举（顺序与原文一致） */
const LANGUAGES = [
  'en', 'fr', 'de', 'es', 'it', 'pt', 'pt-br', 'ru', 'ja', 'zh', 'zh-tw', 'yue',
  'ko', 'ar', 'hi', 'nl', 'pl', 'tr', 'sv', 'no', 'da', 'fi', 'el', 'cs', 'hu',
  'ro', 'th', 'vi', 'id', 'ms', 'he', 'uk', 'sk', 'bg', 'hr', 'lt', 'lv', 'et',
  'sl', 'fr-ca', 'es-mx', 'es-419',
];

/** 各节点类型允许的字段（additionalProperties: false） */
const ALLOWED = {
  space: ['type', 'key', 'title', 'localizedTitle', 'path', 'default', 'hidden', 'draft', 'condition', 'content'],
  section: ['type', 'key', 'title', 'localizedTitle', 'description', 'localizedDescription', 'icon', 'default', 'path', 'condition', 'children'],
  'section-group': ['type', 'key', 'title', 'localizedTitle', 'icon', 'condition', 'draft', 'children'],
  'external-link': ['type', 'key', 'title', 'localizedTitle', 'description', 'localizedDescription', 'icon', 'url', 'draft', 'condition'],
};

/** 各节点类型的必填字段 */
const REQUIRED = {
  space: ['type', 'key', 'title', 'path', 'content'],
  section: ['type', 'key', 'title', 'path'],
  'section-group': ['type', 'key', 'title'],
  'external-link': ['type', 'key', 'title', 'url'],
};

/** 标题长度区间（schema 的 minLength / maxLength） */
const TITLE_LEN = {
  space: [1, Infinity],
  section: [2, 128],
  'section-group': [1, 100],
  'external-link': [2, 128],
};

const errors = [];
const warnings = [];
const seenKeys = new Map();

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function err(at, msg) {
  errors.push(`${at}: ${msg}`);
}

function checkLocalized(at, value, limit) {
  if (!isObj(value)) return err(at, '应为「语言 → 文本」的对象');
  for (const [lang, text] of Object.entries(value)) {
    if (!LANGUAGES.includes(lang)) {
      err(`${at}.${lang}`, `语言键不在枚举内（合法值见 ${SCHEMA_URL} 的 TranslationLanguage；简体中文是 zh，不是 zh-Hans）`);
    }
    if (typeof text !== 'string') err(`${at}.${lang}`, '值必须是字符串');
    else if (text.length > limit) err(`${at}.${lang}`, `长度 ${text.length} 超过上限 ${limit}`);
  }
}

function checkCommon(at, node) {
  if (typeof node.key !== 'string' || node.key.length < 1) err(`${at}.key`, '必填且不能为空');
  else if (seenKeys.has(node.key)) err(`${at}.key`, `key「${node.key}」重复出现在 ${seenKeys.get(node.key)}（key 必须全局唯一）`);
  else seenKeys.set(node.key, at);

  const [min, max] = TITLE_LEN[node.type] || [1, Infinity];
  if (typeof node.title !== 'string') err(`${at}.title`, '必填');
  else if (node.title.length < min) err(`${at}.title`, `长度 ${node.title.length} 小于下限 ${min}`);
  else if (node.title.length > max) err(`${at}.title`, `长度 ${node.title.length} 超过上限 ${max}`);

  if (node.localizedTitle !== undefined) checkLocalized(`${at}.localizedTitle`, node.localizedTitle, 128);
  if (node.localizedDescription !== undefined) checkLocalized(`${at}.localizedDescription`, node.localizedDescription, 256);
}

function checkPath(at, node) {
  if (typeof node.path !== 'string') return err(`${at}.path`, '必填');
  if (node.path.length < 1 || node.path.length > 100) err(`${at}.path`, '长度须在 1..100 之间');
  if (node.path.includes('/')) warnings.push(`${at}.path 含斜杠，URL 会被当成多级路径`);
}

function checkSpace(at, node) {
  checkPath(at, node);
  const c = node.content;
  if (!isObj(c)) return err(`${at}.content`, '必填，且应为对象');
  for (const k of Object.keys(c)) if (!['directory', 'language'].includes(k)) err(`${at}.content.${k}`, 'content 只允许 directory 与 language');
  if (c.directory === undefined) err(`${at}.content.directory`, '必填');
  else if (c.directory !== null) {
    if (typeof c.directory !== 'string' || c.directory.length < 1) err(`${at}.content.directory`, '应为非空字符串或 null');
    else {
      const segs = c.directory.split('/');
      if (segs.includes('..')) err(`${at}.content.directory`, '不允许出现 .. 段');
      const abs = path.resolve(ROOT, c.directory);
      if (!fs.existsSync(abs)) err(`${at}.content.directory`, `目录不存在：${c.directory}（相对仓库根，因为站点根目录就是仓库根）`);
      else if (!fs.existsSync(path.join(abs, 'SUMMARY.md'))) warnings.push(`${at}.content.directory` + ` 下没有 SUMMARY.md，GitBook 可能读不到导航`);
    }
  }
  if (c.language !== undefined && !LANGUAGES.includes(c.language)) {
    err(`${at}.content.language`, `「${c.language}」不在枚举内；简体中文用 zh，繁体用 zh-tw（完整列表见 ${SCHEMA_URL}）`);
  }
}

/** 检查一组同级节点的 default 规则 */
function checkDefaults(at, nodes, kind) {
  const flag = nodes.filter((n) => n && n.default === true);
  if (flag.length !== 1) {
    err(at, `${kind}应恰好有一个 default: true，实际 ${flag.length} 个${flag.length ? '（' + flag.map((n) => n.key).join(', ') + '）' : ''}`);
  }
  for (const n of nodes) {
    if (n && n.default !== undefined && typeof n.default !== 'boolean') err(`${at}.default`, '应为布尔值');
  }
}

function walk(at, nodes, depthKind) {
  if (!Array.isArray(nodes)) return err(at, '应为数组');
  nodes.forEach((node, i) => {
    const here = `${at}.${i}`;
    if (!isObj(node)) return err(here, '应为对象');
    const type = node.type;
    if (!Object.keys(ALLOWED).includes(type)) {
      return err(`${here}.type`, `未知节点类型「${type}」，只允许 space / section / section-group / external-link`);
    }
    for (const k of Object.keys(node)) {
      if (!ALLOWED[type].includes(k)) err(`${here}.${k}`, `${type} 不允许该字段`);
    }
    for (const k of REQUIRED[type]) {
      if (node[k] === undefined) err(`${here}.${k}`, `${type} 的必填字段缺失`);
    }
    checkCommon(here, node);

    if (type === 'space') checkSpace(here, node);
    if (type === 'external-link') {
      if (typeof node.url !== 'string' || !/^https?:\/\//i.test(node.url)) err(`${here}.url`, '必填，且必须是 http(s) 绝对地址');
      if (depthKind === 'section') err(here, 'external-link 不能放在 section 里，只能放在站点根部或 section-group 下');
    }
    if (type === 'section' || type === 'section-group') {
      if (node.children !== undefined) {
        if (type === 'section') {
          const kids = node.children;
          if (!Array.isArray(kids)) err(`${here}.children`, '应为数组');
          else {
            kids.forEach((k, j) => {
              if (!isObj(k) || k.type !== 'space') err(`${here}.children.${j}.type`, 'section 的 children 只能是 space');
            });
            walk(`${here}.children`, kids, 'section');
            checkDefaults(`${here}.children`, kids, '每个 section 内的 space ');
          }
        } else {
          const kids = node.children;
          if (!Array.isArray(kids)) err(`${here}.children`, '应为数组');
          else {
            if (depthKind === 'section-group') {
              kids.forEach((k, j) => {
                if (isObj(k) && k.type === 'section-group') err(`${here}.children.${j}`, 'section-group 只允许再嵌套一层');
              });
            }
            walk(`${here}.children`, kids, 'section-group');
          }
        }
      }
    }
  });
}

function main() {
  if (!fs.existsSync(FILE)) {
    console.log('· 没有 gitbook-docs.yaml，跳过 GitBook 站点配置校验（仅在接入 GitBook 多空间站点时需要）');
    return;
  }

  let yaml;
  try {
    yaml = require('js-yaml');
  } catch {
    console.error('✗ 需要 js-yaml（随 honkit 安装）：先 npm install');
    process.exitCode = 1;
    return;
  }

  let doc;
  try {
    doc = yaml.load(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    console.error(`✗ gitbook-docs.yaml 不是合法 YAML：${e.message}`);
    process.exitCode = 1;
    return;
  }

  if (!isObj(doc)) {
    console.error('✗ gitbook-docs.yaml 顶层应为对象');
    process.exitCode = 1;
    return;
  }

  for (const k of Object.keys(doc)) {
    if (!['$schema', 'version', 'site'].includes(k)) err(k, '根级只允许 $schema / version / site');
  }
  if (doc.$schema !== undefined && doc.$schema !== SCHEMA_URL) {
    warnings.push(`$schema 是 ${doc.$schema}，建议写 ${SCHEMA_URL}（编辑器据此提示）`);
  }
  if (doc.version !== undefined && doc.version !== 1) err('version', '目前只支持 1');

  const site = doc.site;
  if (!isObj(site)) {
    err('site', '必填');
  } else {
    for (const k of Object.keys(site)) {
      if (!['title', 'structure'].includes(k)) {
        err(`site.${k}`, 'site 只允许 title 与 structure（additionalProperties: false）；站点描述请写在 GitBook 后台');
      }
    }
    if (typeof site.title !== 'string' || site.title.length < 1) err('site.title', '必填，且不能为空');
    if (!Array.isArray(site.structure) || site.structure.length === 0) err('site.structure', '必填，且不能为空数组');
    else {
      walk('site.structure', site.structure, 'root');
      const top = site.structure.filter((n) => isObj(n));
      const sections = top.filter((n) => n.type === 'section');
      const topSpaces = top.filter((n) => n.type === 'space');
      if (sections.length) {
        if (topSpaces.length) err('site.structure', '一旦声明了 section，顶层就不能再直接列 space');
        checkDefaults('site.structure（section 之间）', sections, '站点级 section ');
      } else if (topSpaces.length) {
        checkDefaults('site.structure（顶层 space 之间）', topSpaces, '顶层 space ');
      }
    }
  }

  if (warnings.length) {
    console.log(`⚠ 提醒（${warnings.length} 项，不阻断）：`);
    for (const w of warnings) console.log(`  · ${w}`);
  }
  if (errors.length) {
    console.error(`\n✗ gitbook-docs.yaml 不符合 GitBook schema（${errors.length} 项）：`);
    for (const e of errors) console.error(`  · ${e}`);
    console.error(`\n对照契约：${SCHEMA_URL}`);
    process.exitCode = 1;
    return;
  }

  const parts = (doc.site.structure || []).flatMap(function collect(n) {
    if (n.type === 'space') return [{ lang: n.content && n.content.language, dir: n.content && n.content.directory, key: n.key }];
    return (n.children || []).flatMap(collect);
  });
  console.log(`✓ gitbook-docs.yaml 符合 GitBook schema：${parts.length} 个 space`);
  for (const p of parts) console.log(`   · ${p.key} → ${p.dir}（language: ${p.lang || '未声明'}）`);
}

try {
  main();
} catch (e) {
  console.error(`\n✗ ${e.message}`);
  process.exitCode = 1;
}
