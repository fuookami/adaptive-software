<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-10.md -->
# Chapter 10: The Runtime World Model — Event Sourcing and the Computable Digital Twin

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-10.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 10.1 为什么只有“当前状态”的系统既无法复盘追责，也无法支撑机器学习与能力沉淀？
  - 1. 面对计划异常与变更，系统无法回答“为什么变成这样”
  - 2. 机器学习训练陷入“时间穿越（数据泄漏）”与样本失真
  - 3. 运行时能力沉淀失去证据链支撑
- 10.2 事件溯源与版本快照：保留事实、决策、人工调整原因与规则版本的不可变时间轴
- 10.3 告别“静态展示看板”：基于计划时间、预计时间、实际时间三层模型的数字孪生动态推演
- 10.4 换产时间、生产时长与日历可用性的领域沉淀：如何实现“前序任务延误 → 后序预计状态秒级自动更新”？

> 本页含 3 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
