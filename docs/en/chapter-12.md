<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-12.md -->
# Chapter 12: Beyond “Infeasible” — The Orthogonal SolveReport Protocol

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-12.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 12.1 为什么只返回“成功/失败”或一段求解器日志会让计划员寸步难行？
- 12.2 正交求解结果协议（`SolveReport`）：解耦问题状态、终止原因与解存在性，严禁把“超时未得解”谎报为“不可行”
- 12.3 有解与无解的数学证据：最优差距（Gap）、松弛量/违反量、关键紧绑定约束与最小不可行子系统（IIS/冲突集合）
  - 1. 当求解“有解（类 1 与类 2）”时的诊断证据
  - 2. 当求解“已证明不可行或无界（类 3 与类 4）”时的诊断证据
  - 工程实现：基于 OSPF 的正交求解报告（`OspfSolveReport`）与约束松弛量/紧绑定诊断器代码
- 12.4 求解结果自解释的四层架构：从底层数学证据、算法符号映射、业务对象绑定到智能体本地化归纳
  - 工程实现：从第 2 层 `OspfSolveReport` 到第 3 层业务绑定与第 4 层受控智能体自解释的代码实现

> 本页含 2 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
