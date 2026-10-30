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
| English | [GitHub Pages](https://fuookami.github.io/adaptive-software/en/) · [GitBook](https://fuookami.gitbook.io/adaptive-software/en/) | [docs/en/](docs/en/)（翻译中） |

**GitHub Pages 是带图主入口**，中文站根路径是语言选择页。**GitBook 是文本镜像**：该平台会剥离图示的 HTML 标签，
把每张图压平成一行文字，内容的可读性保留但框线与分行不再呈现。图示的实现规范与各平台差异见
[tools/DIAGRAM-KIT.md](tools/DIAGRAM-KIT.md)。

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
├── styles/website.css     # 图示组件库（dg-*）与站点样式的唯一真源
├── i18n/                  # 术语对照表与翻译流程
├── gitbook-docs.yaml      # GitBook 站点结构：一个站点、两个语言空间
├── tools/                 # 切分 / 校验 / 构建 / 截图脚本
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
npm run check          # 书稿结构 + 图示结构 + 双语一致性 + GitBook 配置
npm run i18n           # 翻译进度
```

## 参与翻译

先读 [i18n/README.md](i18n/README.md) 与术语表 [i18n/glossary.md](i18n/glossary.md)：一页一 PR，文件名与导航槽位不动，
翻完把页面首行的 `i18n-status` 从 `untranslated` 改成 `translated`，`npm run check` 会核对两侧页面、导航与图示数量是否对齐。
其余贡献方式（正文修订、图示规范、提交流程）见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 发布

- **GitHub Pages**：工作流发布构建产物，仓库 Pages 的 Source 需设为 **GitHub Actions**（不能是分支）。
- **GitBook**：由根目录 [gitbook-docs.yaml](gitbook-docs.yaml) 声明两个语言空间，各空间目录内用 `.gitbook.yaml`
  指定 `readme` 与 `summary`；`key` 上线后不要改名。

## 许可

本书文字与图示采用 **[CC BY-SA 4.0](LICENSE.md)** 授权，代码示例同样适用；贡献即视为以同许可授权自己的改动。

Made with [Honkit](https://github.com/honkit/honkit) · Powered by [GitBook](https://www.gitbook.com)
