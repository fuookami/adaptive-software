<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-11.md -->
# Chapter 11: Orchestrating Optimization Algorithms in the Open with DDD

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-11.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 11.1 15 点架构依赖推演：为什么算法必须优先作为可被应用层白盒编排的库与模块？
  - 1. 为什么第 4 点（算法白盒可编排）是第 6 点（动态约束）、第 7 点（中间值透明）与第 10 点（可仿真性）的实现前提？
  - 2. 第三层至第六层依赖的连锁传导
- 11.2 局部推演 vs. 全局滚动排产：如何划定局部时间传播与触发完整重排的策略边界？
  - 工程实现：基于 OSPF 原生单位与三层时间模型的数字孪生局部推演与滚动重排触发守卫
- 11.3 用 DDD 架构驾驭列生成（Column Generation）：受限主问题、定价子问题契约与约化成本验证
  - 工程实现：基于 OSPF 的 DDD 列生成（Column Generation）主子问题编排与验证守卫代码
- 11.4 用 DDD 架构驾驭 Benders 分解：主子问题解耦、可行割/最优割验证与收敛认证边界
  - 工程实现：基于 OSPF `LinearMetaModel` 与 `LinearInequality` 的 Benders 割平面验证与收敛认证守卫代码

> 本页含 4 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
