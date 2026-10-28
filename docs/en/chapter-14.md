<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-14.md -->
# Chapter 14: Agent Native and the Business Semantic Frontend

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-14.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 14.1 给智能体装上“业务词典与语法”：暴露结构化领域元数据、可引用变量、中间值、约束模板与流程契约
- 14.2 结构化推理上下文裁剪：结合当前数字孪生状态、历史快照与异常事件进行影响范围推理
- 14.3 语义中间表示（Semantic IR）：查询中间表示、约束中间表示与流程中间表示的设计规范
- 14.4 动态约束转化实战：从“今天 A、B 线共用投料口，总投料不超 1000 公斤”到可哈希、可编译的结构化线性约束候选
  - 第一步：用户用自然语言表达现场规则
  - 第二步：大语言模型作为语义前端生成结构化候选
  - 第三步：严格的边界拦截与动态约束编译
  - 第四步：映射至底层算法执行后端
  - 工程实现：基于 OSPF `LinearPolynomial`、`LinearInequality` 与 `LinearMetaModel` 的动态约束编译器完整代码

> 本页含 2 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
