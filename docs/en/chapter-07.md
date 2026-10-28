<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-07.md -->
# Chapter 7: One Fish, Two Dishes — A Shared Expression IR with Two Entry Points

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-07.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 7.1 传统研发的分裂之痛：后端程序员用业务代码算物料消耗，算法工程师用脚本重写一遍投料约束
- 7.2 OSPF 表达式中间表示（Expression IR）：常量、稳定符号身份、属性路径与不可变语法树
- 7.3 共享业务核心的双入口架构：系统侧代入具体数值直接求值 vs. 运筹侧代入符号变量生成约束片段
  - 工程实现：基于 OSPF 原生组件的“投料量与生产时长”双入口共享核心代码
- 7.4 部分求值、编译求值缓存与等价性性质测试：用自动化测试证明系统计算与算法模型 100% 口径一致
  - 1. 完整求值、部分求值（Partial Evaluation）与三值逻辑
  - 2. 编译求值（Compiled Evaluation）与稀疏大表达式性能治理
  - 3. 双入口等价性与代数律验证（Equivalence & Property-Based Testing）
  - 工程实现：基于 OSPF `LinearPolynomial` 的三值逻辑部分求值、编译求值器与双入口等价性测试代码

> 本页含 2 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
