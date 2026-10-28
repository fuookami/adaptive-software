<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-06.md -->
# Chapter 6: Meet OSPF — Algebraic Numbers and Dimensional Safety

> **This page is not translated yet.** Read the original:
> [中文原文 →](../zh/chapter-06.md)
>
> 本页尚未翻译。英文译文提交后请删除上面的提示，并把首行的
> `i18n-status` 改为 `translated`（`npm run i18n:check` 以它统计进度）。

## Original structure（供译者对照，译文就绪后删除本节）

- 6.1 为什么在工业软件里直接用裸 `Double` 浮点数写公式是一颗定时炸弹？
  - 1. 精度、容差与舍入策略隐式散落，悄悄篡改业务规则
  - 2. 整数、有理数、浮点数与任意精度数无法泛型复用同一套业务公式
  - 3. 物理量纲完全隐形，“千克加小时”也能顺利通过编译
- 6.2 代数化数值类型层次（`RealNumber`）：整数、有理数、浮点数与任意精度数的泛型抽象及精度容差治理
- 6.3 物理量纲与单位安全（`Quantity` / `PhysicalUnit`）：让“重量加时间”或单位错配在校验期直接显式失败
  - 1. 不兼容量纲运算在编译期或构建校验期直接显式失败
  - 2. 乘除、幂与倒数运算自动推导复合量纲
  - 3. 符号变量与数学约束同样携带物理单位
- 6.4 线性换算与仿射转换：跨系统（ERP/APS/MES/WMS）单位口径的统一收敛

> 本页含 1 个图示（HTML 组件）。翻译时请同步重绘图内标签，保持 `dg-*` 结构不变：见 [tools/DIAGRAM-KIT.md](../../tools/DIAGRAM-KIT.md)。
