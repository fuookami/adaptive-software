<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-15.md -->
# Chapter 15: The Trusted Execution Boundary — Eight Steps from Candidate to Production

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-15.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 15.1 从对话到沉淀能力的八步标准流水线：采集 → 规范化 → 中间表示 → 验证 → 优化 → 降阶映射 → 发布 → 自适应监控
- 15.2 形式化方法作为横切可信基础：类型、量纲、租户权限、预算配额、前置/后置契约与业务不变量检查
- 15.3 在进入生产前证明自己：数字孪生沙盒仿真、通用/专用路径等价性验证与影子运行
  - 1. 面向业务决策候选：数字孪生沙盒仿真比选（What-If Sandbox Simulation）
  - 2. 面向专门化编译能力：差分等价性验证与影子运行（Shadow Verification）
- 15.4 运行时六大核心风险治理：防御语义漂移、权限穿透、错误固化、环境变化、代码供应链风险与过度专门化

> 本页含 3 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
