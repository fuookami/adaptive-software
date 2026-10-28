# 术语对照表（中英翻译契约）

术语选择是**契约**而不是偏好：同一个中文概念在全书只用同一个英文译法，反之亦然。
新增术语请连同译法一起提 PR，由维护者评审后入表。
说明：`npm run i18n:check` 目前强制的是**结构一致性**（两侧页面集合、导航顺序与层级、书根配置、站点映射，
以及已标记 `translated` 的页面图示数量不少于中文页）；**术语一致性靠本表 + PR 评审把关**，
机器化的术语漂移检查尚未实现（要做的话，可解析本表并在英文页里找对应词）。

风格基线：美式拼写（`optimization` / `specialization` / `normalize` / `modeling`）；标识符与类型名不译；
数字与单位保持原样（`1000 kg`、`Gap 25%`）。

## 一、核心命题与架构

| 中文 | English | 说明 / 不要译成 |
| :--- | :--- | :--- |
| 自适应软件 | Adaptive Software | 全书主线，不用 self-adaptive（那是另一条学术脉络） |
| 从代码到意图 | From Code to Intent | 书名主标题 |
| Software 1.0 / 2.0 / 3.0 | Software 1.0 / 2.0 / 3.0 | 原样保留，不加空格或罗马数字改写 |
| 大语言模型即运行时 | LLM as Runtime | 用 `as`，不要写成 LLM-in-Runtime / Runtime LLM |
| 业务语义前端 | business semantic frontend | frontend 一词，不用 front-end 混用 |
| 能力形成于“发布之前” | capability is formed before release | 全书关键短语，译法固定 |
| 能力形成于“使用之中” | capability is formed while in use | 同上，与 “发布之前” 对偶 |
| 候选层 | candidate layer | 自然语言只停留在候选层 |
| 生产执行边界 | production execution boundary | 不要译成 production line |
| 受控生产执行 | controlled production execution | |
| 三原生 | three natives | 运筹原生 / 机器学习原生 / 智能体原生 |
| 运筹原生 | OR-Native (Operations-Research-Native) | |
| 机器学习原生 | ML-Native | |
| 智能体原生 | Agent-Native | |
| 形式化领域模型 | formal domain model | 全书根基；不要漂移成 formalized |
| 限界上下文 | bounded context | DDD 标准术语 |
| 领域语言 | domain language | 与 DSL 区分：书中“领域语言”指统一语义表达 |
| 状态角色隔离 | state-role isolation | 需求量/计划量/预测量/预计量/实际量 |
| 语义即时编译 | Semantic JIT | 保留 JIT 缩写 |
| 运行画像 | runtime profiling | 名词性用 profile 亦可，动词统一 profiling |
| 能力提升 / 晋升 | promotion | 不要译成 advancement / upgrade |
| 热点专门化 | hot-spot specialization | |
| 去优化 / 回退 | deoptimization / fallback | V8 术语体系 |
| 规范化语义形状 | normalized semantic shape | 配 shape hash |
| 形状哈希 | shape hash | |
| 计划注册表 | plan registry | |
| 影子验证 / 影子运行 | shadow verification / shadow run | |
| 差分等价性验证 | differential equivalence verification | |

## 二、软件工程支柱与世界模型

| 中文 | English |
| :--- | :--- |
| 语义缺口 / 表达缺口 / 记忆缺口 / 推演缺口 / 生成缺口 / 信任缺口 | semantic gap / expression gap / memory gap / projection gap / generation gap / trust gap |
| 领域驱动设计 | Domain-Driven Design (DDD) |
| 事件溯源 | event sourcing |
| 版本快照 | version snapshot |
| 数字孪生 | digital twin |
| 产生式编程 | generative programming |
| 形式化方法 | formal methods |
| 三层时间模型（计划/预计/实际） | three-layer time model (planned / estimated / actual) |
| 局部推演 | local propagation |
| 滚动排产 / 滚动重排 | rolling rescheduling |
| 世界模型 | world model |
| 概念完整性 | conceptual integrity |
| 软件产品线工程 | Software Product Line Engineering (SPLE) |
| 可变点 / 共性 | variability point / commonality |
| 四级能力晋升 | four-tier capability promotion |
| 临时能力 → 客户专用能力 → 产品可变点 → 平台稳定核心 | temporary capability → customer-specific capability → product variability point → stable platform core |
| 结构熵 | structural entropy |
| 自适应数字化运营平台 | Adaptive Digital Operations Platform (Adaptive DOP) |

## 三、运筹优化与算法

| 中文 | English |
| :--- | :--- |
| 高级计划与排程 | Advanced Planning and Scheduling (APS) |
| 混合整数线性规划 | Mixed-Integer Linear Programming (MILP) |
| 列生成 | column generation |
| 受限主问题 | restricted master problem (RMP) |
| 定价子问题 | pricing subproblem |
| 约化成本 | reduced cost |
| Benders 分解 | Benders decomposition |
| 可行割 / 最优割 | feasibility cut / optimality cut |
| 收敛认证 | convergence certification |
| 最小不可行子系统 | irreducible infeasible subsystem (IIS) |
| 冲突集合 | conflict set |
| 正交求解结果协议 | orthogonal solve-result protocol (`SolveReport`) |
| 问题状态 / 终止原因 / 解存在性 | problem status / termination reason / solution presence |
| 最优差距 | optimality gap |
| 松弛量 / 违反量 | slack / violation |
| 关键紧绑定约束 | binding (active) constraint |
| 硬约束 / 软约束 | hard constraint / soft constraint |
| 分段线性 | piecewise linear |
| 绝对值线性化 | absolute-value linearization |
| 鲁棒优化 | robust optimization |
| 随机规划 | stochastic programming |
| 机会约束 | chance constraint |
| 条件风险价值 | Conditional Value-at-Risk (CVaR) |
| 分布鲁棒优化 | distributionally robust optimization (DRO) |
| 受约束强化学习 | constrained reinforcement learning (RL) |
| 决策反馈驱动的参数校准 | decision-feedback parameter calibration |

## 四、OSPF 底座与代码符号（不译）

| 中文 | English / 处理 |
| :--- | :--- |
| 代数化数值类型层次 | algebraic numeric hierarchy (`RealNumber` / `RationalNumber` / `IntegerNumber`) |
| 物理量纲 / 单位安全 | physical dimension / unit safety (`Quantity`, `PhysicalUnit`) |
| 精度容差 | precision tolerance (`ep`) |
| 表达式中间表示 | expression intermediate representation (`Expression IR`) |
| 同源双入口 | single-source dual entry points |
| 部分求值 | partial evaluation |
| 编译求值缓存 | compiled evaluation cache |
| 等价性性质测试 | property-based equivalence testing |
| 显式错误契约 | explicit error contract (`Result` / `Ret`) |
| 类编译器降阶 | compiler-style lowering |
| `LinearPolynomial` / `LinearInequality` / `LinearMetaModel` / `SlackFunction` | **标识符原样保留，任何语言都不译** |

## 五、制造与供应链现场

| 中文 | English |
| :--- | :--- |
| 企业资源计划 / 制造执行 / 仓储管理 / 运输管理 | ERP / MES / WMS / TMS（保留缩写） |
| 投料量 | feeding quantity（同一概念全书唯一，注意状态角色前缀：计划/预计/实际） |
| 换产时间 | changeover time |
| 生产时长 | production duration |
| 齐套 | material availability (kitting) |
| 工单 | work order |
| 交付窗口 | delivery window |
| 急单 / 插单 | rush order / order insertion |
| 产线 / 工位 | production line / workstation |
| 计划员 | planner |
| 报工 | production reporting |
| 共用投料口 | shared feeding port |

## 六、书名与副书名

| 中文 | English |
| :--- | :--- |
| 《从代码到意图：构建会进化的自适应软件》 | *From Code to Intent — Building Software That Evolves* |
| 副书名：Software 3.0 时代的领域驱动设计、OSPF 运筹优化与大语言模型运行时架构 | Domain-Driven Design, OSPF Optimization Modeling and the LLM as Runtime Architecture for the Software 3.0 Era |
