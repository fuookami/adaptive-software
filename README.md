# 从代码到意图：构建会进化的自适应软件 · From Code to Intent

**Software 3.0 时代的领域驱动设计、OSPF 运筹优化与大语言模型运行时架构**
**Domain-Driven Design, OSPF optimization modeling and the LLM as Runtime architecture for the Software 3.0 era**

[![Deploy book to GitHub Pages](https://github.com/fuookami/adaptive-software/actions/workflows/deploy.yml/badge.svg)](https://github.com/fuookami/adaptive-software/actions/workflows/deploy.yml)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)
[![简体中文](https://img.shields.io/badge/语言-简体中文-blue)](docs/zh/README.md)
[![English](https://img.shields.io/badge/language-English-yellowgreen)](docs/en/README.md)

一本关于**自适应软件（Adaptive Software）**的开源书：当大语言模型进入企业运行现场，软件能力第一次
从“发布之前制造”延伸到“使用之中形成”。全书五卷 18 章 72 节。

## 阅读入口 / Reading entry

| 语言 | 在线阅读 | 源码位置 | 状态 |
| :--- | :--- | :--- | :--- |
| 简体中文 | <https://fuookami.github.io/adaptive-software/zh/> | [docs/zh/](docs/zh/) | ✅ 完整（18 章 + 前言 + 大纲 + 结语） |
| English | <https://fuookami.github.io/adaptive-software/en/> | [docs/en/](docs/en/) | 🚧 骨架就绪，逐页翻译中（`npm run i18n:check` 看进度） |
| GitBook | <https://YOUR-SPACE.gitbook.io/adaptive-software/>（TODO） | 两个 space：`docs/zh`、`docs/en` | 见下文接入说明 |

站点根路径 `/` 是语言选择页；两语言各自是独立的一本书（独立 `book.json` / `SUMMARY.md` / `README.md`）。

## 这本书在讲什么

> 过去，用户使用程序；未来，用户在使用程序的同时，也在持续 **“编译”** 程序——把运行时的开放意图转化为可验证、可版本化、可回退的确定性软件能力。

| 卷 | 主题 | 章节 |
| :--- | :--- | :--- |
| [一](docs/zh/part-1.md) | 范式革命：从 Software 1.0 到 LLM as Runtime | [1](docs/zh/chapter-01.md)–[4](docs/zh/chapter-04.md) |
| [二](docs/zh/part-2.md) | 语义底座：形式化领域模型与 OSPF 运筹建模框架 | [5](docs/zh/chapter-05.md)–[8](docs/zh/chapter-08.md) |
| [三](docs/zh/part-3.md) | 工程支柱与世界模型：事件溯源、数字孪生、白盒编排 | [9](docs/zh/chapter-09.md)–[12](docs/zh/chapter-12.md) |
| [四](docs/zh/part-4.md) | 三原生协同与意图转化：OR × ML × Agent、Semantic IR | [13](docs/zh/chapter-13.md)–[15](docs/zh/chapter-15.md) |
| [五](docs/zh/part-5.md) | 运行时进化与全景实战：Semantic JIT、SPLE、自适应 DOP | [16](docs/zh/chapter-16.md)–[18](docs/zh/chapter-18.md) |

## 仓库结构

```text
.
├── README.md              # 本文件：项目首页（双语入口）
├── gitbook-docs.yaml      # GitBook 站点结构：一个站点、两个 space（zh / en）
├── docs/
│   ├── zh/                # 中文版＝独立书根：book.json / SUMMARY.md / README.md / 30 个页面
│   └── en/                # 英文版＝独立书根：与中文侧同名同序，逐页标注 i18n-status
├── styles/website.css     # 图示组件库（dg-*）与站点样式的唯一真源
├── i18n/
│   ├── glossary.md        # 中英术语对照表（97 条，翻译契约；术语靠 PR 评审把关）
│   └── README.md          # 翻译流程与页面状态约定
├── manuscript/            # 原始手稿（按卷合并），用于重新生成中文正文
├── tools/                 # split-book / check-diagrams / check-i18n / init-en / build-site …
└── .github/workflows/     # 校验 + 双语言构建 + GitHub Pages 部署
```

## 本地预览与构建

前置：Node.js 18+（已在 Node 24 + honkit@5.0.1 验证）。

```bash
npm install
npm run serve          # 中文站 http://localhost:4000
npm run serve:en       # 英文站 http://localhost:4000
npm run build          # 双语构建 → _book/{zh,en} + _book/index.html 语言选择页
npm run check          # 书稿结构 + 图示 HTML 结构 + 双语一致性，三道闸一起跑
npm run i18n           # 只看翻译进度
```

`npm run build` 会先把 `styles/website.css` 同步到 `docs/<lang>/styles/`（该目录已 gitignore），
因为 Honkit 的 `styles.website` 只能指向书根内部路径。

### 各环境阅读图示的表现

图中的流程图/架构图是**语义化 HTML + 共用样式表**绘制的（44 张，见 [docs/zh/](docs/zh/)）：

| 环境 | 效果 |
| :--- | :--- |
| `_book/` / GitHub Pages / `npm run serve` | ✅ 完整渲染（构建时注入样式表） |
| VS Code Markdown 预览 | ✅ 完整渲染（[.vscode/settings.json](.vscode/settings.json) 的 `markdown.styles` 已指向样式表；改过 CSS 要重开预览页） |
| GitHub 上直接看 `.md` | ⚠️ 有结构无样式，图示退化为按行排列的标签 + 真实箭头字符（`→ ↓ ↺`），内容仍可读 |
| GitBook.com | ❓ 待实测：GitBook 官方 Markdown 能力清单不含原始 HTML 块，接入后请先看任意图示页；排错顺序见 [tools/DIAGRAM-KIT.md](tools/DIAGRAM-KIT.md) |

## 参与翻译

先读 [i18n/README.md](i18n/README.md) 与术语表 [i18n/glossary.md](i18n/glossary.md)：
一页一 PR，文件名与导航槽位不动，翻完把页面首行的 `i18n-status` 从 `untranslated` 改成 `translated`，
`npm run check` 会核对两侧页面、导航、图示数量与小节数是否对齐。

其余贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 发布到 GitHub Pages

工作流 [.github/workflows/deploy.yml](.github/workflows/deploy.yml) 发布的是 **构建产物（artifact）**，
因此仓库的 Pages 来源必须是 “GitHub Actions”，不能是 “Deploy from a branch”。

**首次启用（只需一次）**

1. 打开 `https://github.com/fuookami/adaptive-software/settings/pages`
2. **Build and deployment → Source** 选 **GitHub Actions**，保存（不需要选分支、不需要建 `gh-pages` 分支）
3. 回到 **Actions** → 选最近一次失败的 “Deploy book to GitHub Pages” → 右上 **Re-run all jobs**

地址形如 `https://fuookami.github.io/adaptive-software/`：根是语言选择页，中文在 `/zh/`，英文在 `/en/`。

**两种典型失败及含义**

| 报错 | 真实原因 | 处理 |
| :--- | :--- | :--- |
| `Failed to create deployment (status: 404) … Ensure GitHub Pages has been enabled` | 仓库还没有 Pages 站点 | 按上面三步启用；**书稿与构建是好的**，不用改代码 |
| `Get Pages site failed … must be configured to use GitHub Actions` | Pages 已启用，但 Source 是分支而非 Actions | 把 Source 改成 “GitHub Actions” 后重跑 |

工作流的部署作业现在带一道**预检**：先查 `GET /repos/{owner}/{repo}/pages`，把上述情况直接翻译成
“该点哪个设置页”，并在日志里明确写出“构建已成功、无需重新提交”。若预检因权限读不到配置（401/403），
只告警不阻断。

## 在 GitBook 上发布（双语）

1. 推到 GitHub；
2. 站点级用 [gitbook-docs.yaml](gitbook-docs.yaml) 描述两个 space（`docs/zh` → `language: zh`、`docs/en` → `language: en`），
   形态是**顶层平铺 space**（不套 section），因此站点 URL 就是 `/zh` 与 `/en`；每个 space 目录内的 `.gitbook.yaml`
   指定 `readme` 与 `summary`；
3. 在 GitBook 里开启 Git Sync 后，**首次映射会由 GitBook 回写这个文件**（`key` 一旦上线就不要再改，改了会新建 space）；
4. 发布后把站点地址回填到本文件与 [docs/zh/README.md](docs/zh/README.md) 的 TODO 处。

### 这个 YAML 有两个容易踩的坑

| 坑 | 说明 |
| :--- | :--- |
| `content.language` 是**封闭枚举** | 简体中文是 `zh`，**不是** `zh-Hans`；繁体是 `zh-tw`。`localizedTitle` 的**键**也取自同一枚举。写错会被拒：`expected one of the enum value` |
| `site` 只能有 `title` 与 `structure` | 站点描述要写在 GitBook 后台，写进 YAML 会被 `additionalProperties: false` 拒掉 |

这两类错误以前只能在 Git Sync 时被 GitBook 一条条报出来（它还只报第一个）。
现在 [tools/check-gitbook-yaml.mjs](tools/check-gitbook-yaml.mjs) 按[官方 schema](https://api.gitbook.com/gitbook-docs.yaml)
在本地与 CI 校验：枚举成员、各节点必填与多余字段、`key` 全局唯一、`default` 规则（有 section 时顶层不得再列 space）、
`content.directory` 真实存在且不含 `..`。报错路径与 GitBook 一致，例如
`site.structure.0.content.language`。`npm run check` 与 `npm run gitbook` 都会跑它。

## 许可

本书文字与图示采用 **[CC BY-SA 4.0](LICENSE.md)** 授权，代码示例同样适用；贡献即视为以同许可授权自己的改动。

Made with [Honkit](https://github.com/honkit/honkit) · Powered by [GitBook](https://www.gitbook.com)
