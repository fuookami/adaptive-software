# 更新日志

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 与 [语义化版本](https://semver.org/lang/zh-CN/) 约定。

## [未发布]

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
