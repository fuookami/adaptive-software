<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-16.md -->
# Chapter 16: Semantic JIT — Profile-Driven Specialization and Invalidating Rebuilds

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-16.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 16.1 动态查询即时编译与动态约束专门化：用“规范化语义形状”聚合同类请求，而非按原始文本统计
- 16.2 运行时画像（Profiling）与晋升阈值：综合调用频率、延迟、扫描行数、计算成本与业务收益决定是否专门化
- 16.3 三层专门化阶梯（Tier 0 → Tier 1 → Tier 2）：从通用规划器、参数化计划/预编译约束，到受控虚拟机插件的按需升级
- 16.4 计划注册表与去优化：当数据库结构、字段目录或权限策略变更时，如何精确标记失效并自动回退通用路径？
  - 工程实现：规范化语义形状哈希、运行画像晋升、影子验证与计划注册表去优化完整代码

> 本页含 3 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
