<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-04.md -->
# Chapter 4: The Core Thesis: LLM as Runtime

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-04.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 4.1 为什么“把开发工具搬进聊天框、让大模型直接在线写生产代码”在工业界是死路一条？
  - 风险一：语义漂移（Semantic Drift）
  - 风险二：权限穿透（Privilege Penetration）
  - 风险三：错误固化（Error Ossification）
  - 风险四：环境变化与静默失效（Environmental Shift）
  - 风险五：代码供应链与运行隔离风险（Code Supply Chain Risk）
  - 风险六：过度专门化与结构熵增（Over-Specialization）
- 4.2 什么是真正的 LLM as Runtime？将大语言模型定位为运行时的“业务语义前端”
- 4.3 为什么它更像“即时编译（JIT）”，而不是“任意代码生成”？
- 4.4 生产执行铁律：自然语言永远停留在候选层，确定性机制负责把守生产执行边界

> 本页含 3 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
