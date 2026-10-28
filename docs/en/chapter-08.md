<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-08.md -->
# Chapter 8: Business as Building Blocks — Structured Functions, Logic Operators, Solver Decoupling

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-08.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 8.1 化非线性为线性：绝对值、松弛变量、分段线性与阶梯规则的规范化与代数分类
  - 1. 规范化与代数阶数自动分类（Canonicalization & Algebraic Classification）
  - 2. OSPF 内置连续与分段业务算子积木
- 8.2 把业务分支装进数学模型：布尔逻辑、条件分支、选一约束与多目标软约束权衡
  - 1. OSPF 内置布尔逻辑与条件分支算子
  - 2. 结构化约束元数据与多目标/软约束权衡
- 8.3 类编译器降阶架构：如何让领域模型彻底摆脱对特定商业或开源求解器 API 的绑定？
- 8.4 显式错误契约（`Result` / `Ret`）与能力检查：严禁静默截断高阶项，当求解器能力不支持时如何优雅报错或降级
  - 工程实现：基于 OSPF 函数算子、阶数守卫、`LinearMetaModel` 与 `LinearSolver` 的完整建模与求解代码

> 本页含 2 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
