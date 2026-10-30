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

| 语言 | 在线阅读 | 源码 |
| :--- | :--- | :--- |
| 简体中文 | [GitHub Pages](https://fuookami.github.io/adaptive-software/zh/) · [GitBook](https://fuookami.gitbook.io/adaptive-software/) | [docs/zh/](docs/zh/) |
| English | [GitHub Pages](https://fuookami.github.io/adaptive-software/en/) · [GitBook](https://fuookami.gitbook.io/adaptive-software/en/) | [docs/en/](docs/en/) |

**任一入口都能看到完整图示**：流程图与架构图已导出为独立 SVG（`docs/<lang>/assets/diagrams/`），
正文只留图片引用，因此 GitHub Pages、GitBook、GitHub 仓库页、VS Code 预览与 PDF 的呈现一致。
图示源码是 `figures/<lang>/*.html` 里的 HTML 组件，改完跑 `npm run figures` 重新导出即可，
规范与导出流程见 [tools/DIAGRAM-KIT.md](tools/DIAGRAM-KIT.md)。

两语言各自是独立的一本书（独立 `book.json` / `SUMMARY.md` / `README.md`）。

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
├── docs/zh/               # 中文版＝独立书根：book.json / SUMMARY.md / README.md / 30 个页面
├── docs/en/               # 英文版＝独立书根：与中文侧同名同序，逐页标注 i18n-status
├── docs/*/assets/diagrams/# 导出的 SVG 图示（正文以图片引用，各平台一致）
├── figures/               # 图示源码：HTML 组件（dg-*），改完 npm run figures 重新导出
├── styles/website.css     # 图示组件库（dg-*）与站点样式的唯一真源
├── i18n/                  # 术语对照表与翻译流程
├── gitbook-docs.yaml      # GitBook 站点结构：一个站点、两个语言空间
├── tools/                 # 切分 / 校验 / 图示导出 / 构建 / 截图脚本
├── manuscript/            # 原始手稿（按卷合并），用于重新生成中文正文
└── .github/workflows/     # 校验 + 双语言构建 + GitHub Pages 部署
```

## 本地预览与构建

前置：Node.js 18+（Honkit 5.x）。

```bash
npm install
npm run serve          # 中文站 http://localhost:4000
npm run serve:en       # 英文站
npm run build          # 双语构建 → _book/{zh,en} + 根语言选择页
npm run check          # 书稿结构 + 图示源码 + 图示导出 + 双语一致性 + GitBook 配置
npm run i18n:check     # 同上中的双语一致性部分
```

## 参与审校

英文版与中文版保持文件名、导航槽位、图示数量一一对应。现在最需要的是**审校**：
发现措辞生硬、术语不一致或漏译，一页一 PR 即可，文件名与导航槽位不动、不删并不小节。

术语以 [i18n/glossary.md](i18n/glossary.md) 为准，改译法请同时改术语表；流程与状态标记见
[i18n/README.md](i18n/README.md)，逐条作业规范见 [i18n/translator-brief.md](i18n/translator-brief.md)。
`npm run check` 会核对两侧页面、导航、图示数与三级子节数是否对齐。两版分歧时**以中文版为准**。
其余贡献方式（正文修订、图示规范、提交流程）见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 发布

- **GitHub Pages**：工作流发布构建产物，仓库 Pages 的 Source 需设为 **GitHub Actions**（不能是分支）。
- **GitBook**：由根目录 [gitbook-docs.yaml](gitbook-docs.yaml) 声明两个语言空间，各空间目录内用 `.gitbook.yaml`
  指定 `readme` 与 `summary`；`key` 上线后不要改名。

## 许可

本书文字与图示采用 **[CC BY-SA 4.0](LICENSE.md)** 授权，代码示例同样适用；贡献即视为以同许可授权自己的改动。

Made with [Honkit](https://github.com/honkit/honkit) · Powered by [GitBook](https://www.gitbook.com)
