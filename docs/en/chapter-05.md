<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-05.md -->
# Chapter 5: Unifying the Three Natives in a Formal Domain Model

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-05.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 5.1 为什么说“各运行侧共享同一形式化领域模型”是整座架构大厦的根基？
- 5.2 同一业务概念的四种正交解释：系统侧数值解释、运筹侧符号解释、机器学习侧统计解释与智能体侧语义解释
  - 1. 系统侧：确定性数值解释（Numerical Interpretation）
  - 2. 运筹原生（OR-Native）：符号与优化解释（Symbolic Interpretation）
  - 3. 机器学习原生（ML-Native）：统计与概率解释（Statistical / Probabilistic Interpretation）
  - 4. 智能体原生（Agent-Native）：语义与编排解释（Semantic Interpretation）
- 5.3 状态角色隔离：为什么统一“投料量”定义，绝不等于把需求量、计划量、预测量、预计量和实际量混为一个字段？
  - 工程实现：基于 OSPF 原生 `Quantity`、`PhysicalUnit` 与 `Ret` 的状态角色强类型隔离代码
- 5.4 形式化领域模型的八大最低构成要素与运行时实例边界

> 本页含 3 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
