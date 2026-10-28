# 从代码到意图：构建会进化的自适应软件

**—— Software 3.0 时代的领域驱动设计、OSPF 运筹优化与大语言模型运行时架构**

[![Deploy book to GitHub Pages](https://github.com/fuookami/adaptive-software/actions/workflows/deploy.yml/badge.svg)](https://github.com/fuookami/adaptive-software/actions/workflows/deploy.yml)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-sa/4.0/)

> **English edition（翻译中）**：<https://fuookami.github.io/adaptive-software/en/>
> **在线阅读（中文）**：<https://fuookami.github.io/adaptive-software/zh/> ·
> **GitBook**：<https://YOUR-SPACE.gitbook.io/adaptive-software/>（TODO：填入你的 GitBook 空间地址）

---

## 这本书在讲什么

过去半个世纪，企业软件有一条从未被撼动的铁律：**软件能力主要在“发布之前”形成**。需求 → 编码 → 测试 → 发版 → 使用，一旦现场出现开发期没预见的临时规则与长尾需求，团队就只能重跑一轮漫长循环。

大语言模型第一次让“能力塑造”从开发期跨进了运行现场。本书给出的答案不是“让大模型在线写任意代码”，而是一套可工程的架构立场：

> 过去，用户使用程序；未来，用户在使用程序的同时，也在持续 **“编译”** 程序——把运行时的开放意图转化为可验证、可版本化、可回退的确定性软件能力。

围绕这一命题，全书五卷 18 章 72 节依次展开：**范式革命**（Software 1.0/2.0/3.0 与 LLM as Runtime）→ **语义底座**（形式化领域模型与 `ospf` 数值、量纲、表达式双入口）→ **工程支柱与世界模型**（六大支柱、事件溯源、数字孪生、DDD 白盒编排列生成与 Benders、`SolveReport` 正交诊断）→ **三原生协同与意图转化**（OR×ML 双向增强、Semantic IR、八步受控编译管线）→ **运行时进化与全景实战**（Semantic JIT 热点专门化、SPLE 四级能力晋升、自适应 DOP 落地路线图）。

## 适合谁读

| 你是谁 | 建议路线 |
| :--- | :--- |
| 架构师、后端研发、运筹算法工程师、AI 智能体开发者 | 第一卷 → 第五卷完整顺序阅读，重点是第二、三、四卷的实现细节 |
| CTO、技术管理者、数字化负责人、产品经理、工业软件业务专家 | 第一卷（第 1～4 章）+ 第 9～10 章 + 第 17～18 章，这三段刻意剥离了底层数学推导 |

## 全书结构

| 卷 | 主题 | 章节 |
| :--- | :--- | :--- |
| [第一卷](part-1.md) | 范式革命篇：从 Software 1.0 到 LLM as Runtime | [1](chapter-01.md)–[4](chapter-04.md) |
| [第二卷](part-2.md) | 语义底座篇：形式化领域模型与 OSPF 运筹建模框架 | [5](chapter-05.md)–[8](chapter-08.md) |
| [第三卷](part-3.md) | 工程支柱与世界模型篇：记住过去、推演未来与白盒诊断 | [9](chapter-09.md)–[12](chapter-12.md) |
| [第四卷](part-4.md) | 三原生协同与意图转化篇：LLM、ML 遇上运筹优化 | [13](chapter-13.md)–[15](chapter-15.md) |
| [第五卷](part-5.md) | 运行时进化与全景实战篇：从动态探索到自适应 DOP 平台 | [16](chapter-16.md)–[18](chapter-18.md) |

起点建议：[前言](preface.md) → [全书大纲](outline.md) → [第 1 章](chapter-01.md)；完整导航见 [SUMMARY.md](SUMMARY.md)。

## 许可与声明

- 本书文字与图示采用 **[CC BY-SA 4.0](../../LICENSE.md)** 授权，代码示例同样适用该许可。
- 书中 `ospf` 建模底座、`SolveReport`、Semantic IR 等均以架构说明与示例代码形式呈现，可自由引用、改编，但衍生作品须以同许可共享。
- 本书观点（Software 3.0 的定位、LLM as Runtime 的“语义前端”边界、四级能力晋升等）为作者的技术立场，欢迎在 [Issues](https://github.com/fuookami/adaptive-software/issues) 中争论。

源码、双语版本与贡献方式见 [GitHub 仓库首页](../../README.md)。
