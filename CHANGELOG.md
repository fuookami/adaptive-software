# 更新日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/) 约定。

## [未发布]

### 修复

- CI 部署作业前增加 GitHub Pages 预检：先请求 `GET /repos/{owner}/{repo}/pages`，把
  `Failed to create deployment (status: 404)` 翻译成可执行指引（去 Settings → Pages 把 Source 设为
  “GitHub Actions” 再 Re-run），并识别 `build_type` 不是 `workflow` 的 legacy 模式；401/403 等读不到配置时
  只告警、不阻断部署。此前该错误只抛一句 404，看不出问题出在仓库设置而不是书稿。

## [0.2.0] - 2026-10-29

### 新增（图示与编辑器预览）

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

### 新增（双语与工具链）

- **中英双语**：`docs/zh/` 与 `docs/en/` 各为一本完整的书（独立 `book.json` / `SUMMARY.md` / `README.md` / `.gitbook.yaml`），
  页面文件名与导航顺序一一对应。英文侧 30 个骨架页已就位，逐页用 `<!-- i18n-status: … -->` 标注翻译进度。
- [gitbook-docs.yaml](gitbook-docs.yaml)：按 GitBook 官方 docs-as-code 规范声明“一个站点、两个语言空间”
  （`content.directory` + `language`，`key` 上线后不可改）。
- [i18n/glossary.md](i18n/glossary.md)：中英术语对照表（97 条，含“不要译成”负例），作为翻译契约；
  [i18n/README.md](i18n/README.md)：页面状态约定与翻译流程。
- `tools/init-en.mjs`：从中文侧生成/更新英文骨架页与英文 `SUMMARY.md`（不覆盖已有译文，`--force` 才重写）。
- `tools/check-i18n.mjs`：双语一致性闸（页面集合、导航条目与层级、书根配置、站点映射；已标记 `translated`
  的页面还要求图示数量不少于中文页）与进度统计。
- `tools/build-site.mjs`：双语构建编排——同步样式真源到两个书根、分别 honkit 构建、生成根语言选择页 `_book/index.html`，
  并在构建前清空旧输出。
- npm 脚本：`serve` / `serve:en` / `build` / `check` / `sync` / `pdf` / `pdf:en` / `i18n` / `i18n:check` / `i18n:init`。

### 变更

- **正文从 `docs/` 迁到 `docs/zh/`**（`git mv` 保留历史）；`SUMMARY.md`、`book.json`、`.gitbook.yaml`、`.bookignore` 随书根下沉，
  导航链接改为书根相对路径。`tools/split-book.mjs`、`tools/check-diagrams.mjs` 同步适配（保真校验仍能从
  `ascii-baseline` 的旧路径 `docs/<name>` 读取基线）。
- 站点输出改为 `_book/{zh,en}/` + 根语言选择页；CI 依次跑书稿结构、图示结构、双语一致性，再双语构建。
- 英文拼写统一为美式（`optimization` / `modeling` / `Specialization` / `Frontend`），写进术语表。

### 修复

- `tools/build-site.mjs` 构建前清空 `_book`，否则旧版单语言产物会残留并被一起发布。
- 各书根 `.bookignore` 补上 `.gitbook.yaml` / `.bookignore` / `.vscode/`，不再把它们当站点资源打进输出。
- `tools/check-diagrams.mjs` 的 git 基线探测改为静默失败，不再刷屏；结构自检覆盖两个语言书根。

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
