# 更新日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/) 约定。

## [未发布]

### 新增

- HTML 图示组件库 `styles/website.css`（`dg-*` 类名，由 `book.json` 的 `styles` 注入网站/PDF/EPUB）与规范 `tools/DIAGRAM-KIT.md`。
- `tools/check-diagrams.mjs`：图示重绘的三道闸——`（默认）`文字保真（对比 `ascii-baseline` 标签）、`--structure`（块闭合 / 无空行 / 顶格 / 无 Markdown 残留，CI 执行）、`--strict`（反向检查，拦截重绘时新增的表述）。
- `tools/preview-shot.ps1`：用无头 Edge/Chrome 把 `_book/` 页面截图，便于肉眼检查图示排版。

### 变更

- **全书 44 个字符画流程图 / 架构图重绘为语义化 HTML**（前言与大纲页无图），含第 9 章六支柱闭环、第 11 章 15 点依赖推演与列生成/Benders 闭环、第 15 章八步流水线、第 18 章全景总架构图。
- 图示中的箭头改为真实字符 `→ ↓ ↑ ↺`，保证无样式表时（GitHub 阅读 `.md`）内容仍可按行读出。
- 明确阅读入口：GitHub 作为源码仓库，带图阅读走 GitHub Pages / `npm run serve` / VS Code 预览。
- 新增 `.vscode/settings.json`：`markdown.styles` 指向 `styles/website.css`，让 VS Code Markdown 预览能显示图示排版
  （此前 `.md` 在预览里只有 `class` 名而无样式，图示退化成按行堆叠的文字）。README、CONTRIBUTING、
  `tools/DIAGRAM-KIT.md` 同步补上四种渲染环境的表现与排查顺序。

### 修复

- `docs/chapter-04.md` 正文日文残留「しかし，」→「然而，」。
- 补全三处被字符画框宽截断的词：`编译为查询/约束/流程`（第 3 章）、`符号引用`（第 14 章）、`沉入平台标准核心`（第 17 章）。
- `docs/chapter-17.md` 图示内繁体「基於」→「基于」。
- 以上四处原文修正均在 `tools/check-diagrams.mjs` 的 `CORRECTIONS` / `AUTHORIZED_ADDITIONS` 白名单中登记了理由，避免被保真校验误报，也防止“顺手加戏”混入。

## [0.1.0] - 2026-10-28

### 新增

- 仓库初始化为一本可发布的开源书籍：`README.md` 落地页、`SUMMARY.md` 导航、`book.json`（Honkit）与 `.gitbook.yaml`（GitBook.com Git 同步）。
- 正文结构：前言、全书大纲、5 个卷首页、18 个章节页、3 个本卷小结、全书结语，共 30 个页面（29 个进入导航），位于 `docs/`。
- `tools/split-book.mjs`：零依赖的手稿切分与结构校验脚本（代码围栏感知、标题层级自动升一级、`--check` 校验导航一致性）。
- `tools/bootstrap.ps1`：一键完成切分、校验与 `git init`。
- `.bookignore`：把手稿、脚本与依赖挡在站点输出之外，`_book/` 只包含 30 个正文页面。
- `.github/workflows/deploy.yml`：构建静态书并部署到 GitHub Pages（Node 24 + honkit@5.0.1，构建前先跑结构校验）。
- 许可：CC BY-SA 4.0（`LICENSE.md`）；贡献指南 `CONTRIBUTING.md`；Issue / PR 模板。

### 变更

- 原始手稿 `adaptive_software_book_*.md` 归档到 `manuscript/`，不再直接作为书籍页面。
