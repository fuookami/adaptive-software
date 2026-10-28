# 第三卷：工程支柱与世界模型篇 —— 记住过去、推演未来与白盒诊断

在第二卷中，我们构建了自适应软件的静态基石：以**形式化领域模型**统一业务系统、运筹优化、机器学习与智能体的语义契约，并以 `ospf` 框架承载代数化数值、物理量纲安全、统一表达式中间表示（Expression IR）与求解器解耦架构。

然而，企业运营与工业现场从来不是静止的数学公式标本，而是一个在时间长河中持续运转、充满突发扰动与人工干预的动态世界。当这套形式化底座进入真实的运行时（Runtime），它必须回答四个关乎系统生命力的核心工程问题：
1. **理论根基问题**：`LLM as Runtime` 究竟是抛弃传统软件工程的另起炉灶，还是半个世纪软件工程经典理论的合龙闭环？
2. **时间与状态问题**：系统如何既能“记住过去是怎么走到今天的”（事件溯源），又能“在不破坏真实生产的前提下安全推演未来”（数字孪生）？
3. **白盒算法编排问题**：如何用领域驱动设计（DDD）拆掉外挂算法黑盒，让局部推演、全局滚动排产以及列生成（Column Generation）、Benders 分解等超大规模工业求解成为应用层可白盒编排的原生能力？
4. **结果自解释问题**：当运筹求解器算完之后，如何告别“只返回有解/无解字符串或抛出一堆天书日志”的窘境，用正交求解报告（`SolveReport`）与分层证据链向计划员解释清楚“方案为什么最优”或“到底哪几条规则冲突导致了无解”？

本卷将围绕这四个问题逐章展开，为您搭建起自适应软件的工程骨架与运行时世界模型。

---

## 第 9 章：自适应软件的六大工程支柱 —— 跨越半个世纪的软件工程合龙

每当一种革命性的计算媒介（如大语言模型）出现时，行业里总会泛起一股“软件工程终结论”的躁动，仿佛有了提示词工程（Prompt Engineering）和智能体框架，过去几十年积累的领域建模、类型系统、状态管理与形式化验证都可以扔进历史垃圾堆。

本章将鲜明地指出：**“大语言模型即运行时（LLM as Runtime）”绝不是脱离传统软件工程的一套孤立方法；恰恰相反，它建立在六个彼此咬合的经典软件工程方向之上，并将过去主要发生在开发阶段的活动部分推进到了运行阶段**。

---

### 9.1 六大根本缺口：语义缺口、表达缺口、记忆缺口、推演缺口、生成缺口与信任缺口

在第 1 章结尾，我们曾指出当前企业软件（如 DOP / APS）面临着两个相互依赖的根问题：**“领域知识由谁统一表达？”**与**“新的领域能力如何进入系统？”**。

如果我们将这两个根问题沿着从“理解业务世界”到“安全产生软件能力”的全链路进一步拆解，就会发现传统工业软件之所以在面对现场变化与智能化升级时举步维艰，本质上是因为架构中长期存在着**六类根本性的软件工程缺口**：

1. **语义缺口（Semantic Gap）—— 业务世界缺少统一权威定义**：订单、资源、产能、投料、换产、约束、计划与实际等核心概念没有明确的语义所有权，导致业务系统、运筹算法、预测模型、报表与提示词各说各话，无法回答**“这个业务世界到底是什么”**。
2. **表达缺口（Expression Gap）—— 业务知识不能被机器稳定组合与执行**：业务规则散落在自然语言文档、硬编码过程逻辑和口头经验里，缺乏一套机器可读、可组合、可校验、可编译的受控语言，无法回答**“如何向机器精确描述这个世界”**。
3. **记忆缺口（Memory Gap）—— 系统只有当前状态，缺少可追溯的运行经验**：数据库只用最新值覆盖保存“当前是什么状态”，丢掉了事实演变、排产决策、人工微调原因与规则版本变更的历史轨迹，无法回答**“这个世界是怎样一步步走到今天的”**。
4. **推演缺口（Projection / Simulation Gap）—— 系统知道当前状态，却不能安全试演未来**：面对设备延误、急单插入或临时限制，系统缺乏可独立计算的生产世界镜像，无法在不污染真实生产状态的前提下回答**“如果现在这样做，接下来会发生什么”**。
5. **生成缺口（Generation Gap）—— 新的稳定需求仍主要依赖人工编码开发**：即便业务规则已经说清楚、并且在现场反复出现，依然要靠程序员手写查询、约束脚本与定制接口，缺乏从规范自动转化为可执行能力的机制，无法回答**“如何把结构化描述自动变成软件能力”**。
6. **信任缺口（Trust Gap）—— 动态产生的能力缺少可信执行边界**：运行时由智能体或配置工具动态生成的规则、流程与专用计划，如果仅仅依赖普通的手工功能测试，就没有资格进入严肃的生产环境，系统无法回答**“为什么敢信任并执行这个动态产生的能力”**。

---

### 9.2 六个软件工程方向的分工：领域驱动设计（定义）、领域语言（描述）、事件溯源（记忆）、数字孪生（推演）、产生式编程（产生）、形式化方法（验证）

为了填补上述六大根本缺口，我们不需要去发明一套玄虚的新名词，而是将计算机科学与软件工程历经半个世纪沉淀下来的**六个核心方向**汇聚到同一座架构屋顶之下，赋予它们清晰严密的职责分工：

| 根本工程缺口 | 对应的软件工程方向 | 核心动作 | 在自适应软件（LLM as Runtime）中的工程职责 | 面向业务与管理层的通俗解释 |
| :--- | :--- | :--- | :--- | :--- |
| **语义缺口** | **1. 领域驱动设计**<br>（Domain-Driven Design, DDD） | **定义** | 定义领域概念、限界上下文、聚合、业务不变量、状态角色与业务语义所有权，确保领域语义有唯一权威来源。 | **把业务说清楚**：统一订单、产能、投料等概念口径，避免各说各话。 |
| **表达缺口** | **2. 领域特定语言 / 领域语言**<br>（Domain-Specific Language, DSL） | **描述** | 把领域语义变成机器可读、可组合、可校验、可编译的业务语言；形式化领域模型同时承担领域语言规范与类型边界。 | **让系统听得懂规则**：把散落在文档和经验里的规则变成系统可识别、可检查的语言。 |
| **记忆缺口** | **3. 事件溯源与历史审计**<br>（Event Sourcing & Audit） | **记忆** | 保留领域事实、决策、人工计划调整、规则变化与能力发布/撤销的时间序列，形成可追溯、可回放的运行经验。 | **记住事情是怎么发生的**：保留谁在何时因何做了什么调整及结果，提供复盘与学习依据。 |
| **推演缺口** | **4. 数字孪生**<br>（Digital Twin） | **推演** | 建立可计算、可仿真、可回放的生产世界模型，动态更新未来预计状态，为候选方案提供低风险的安全试验场。 | **在执行前先推演未来**：先在安全镜像里模拟“如果这样改会怎样”，再决定是否动生产。 |
| **生成缺口** | **5. 产生式编程与语义编译**<br>（Generative Programming） | **产生** | 根据领域规范、语义中间表示（IR）和可变点，自动产生查询计划、数学约束、工作流、编译求值器或受控制品。 | **把稳定方案转成能力**：把说清楚、验证过的业务方案自动转成可执行能力，减少重复开发。 |
| **信任缺口** | **6. 形式化方法与运行时验证**<br>（Formal Methods & Verification） | **验证** | 以类型、物理单位、不变量、前置/后置契约、状态机、差分等价性、仿真、影子验证和运行时监测建立可信准入边界。 | **所有生成结果必须可验证**：用权限、边界、规则与对比试验把关，确保系统能进化但不失控。 |

这六个方向并非六个孤立的技术选型，而是严丝合缝地回答了企业软件从认知到执行的六个基本哲学问题：
* **领域驱动设计**定义世界（*What the business world is*）；
* **领域语言**描述世界（*How to express it precisely to machines*）；
* **事件溯源**记住世界（*What happened in the past*）；
* **数字孪生**推演世界（*What will happen if we do this*）；
* **产生式编程**产生能力（*How to turn specifications into capabilities*）；
* **形式化方法**验证能力（*Why we dare to execute it in production*）。

---

### 9.3 从“定义 → 描述 → 记忆 → 推演 → 产生 → 验证 → 执行”的完整演进闭环

当这六大工程支柱首尾相接时，它们就在软件运行时内部构建起了一条生生不息的**“能力形成与演进闭环”**：

```text
          ┌─────────────────────────────────────────────────────────┐
          │                1. 领域驱动设计（定义世界）               │
          │        明确概念、限界上下文、不变量与状态角色所有权      │
          └────────────────────────────┬────────────────────────────┘
                                       │
                                       ▼
          ┌─────────────────────────────────────────────────────────┐
          │                  2. 领域语言（描述世界）                 │
          │        转化为机器可读、可组合、可编译的形式化领域表示    │
          └────────────────────────────┬────────────────────────────┘
                                       │
                                       ▼
          ┌─────────────────────────────────────────────────────────┐
          │                  3. 事件溯源（记住世界）                 │◄─────────┐
          │        沉淀事实、决策、人工微调与规则版本的时间序列      │          │
          └────────────────────────────┬────────────────────────────┘          │
                                       │                                       │
                                       ▼                                       │
          ┌─────────────────────────────────────────────────────────┐          │
          │                  4. 数字孪生（推演世界）                 │          │
          │        基于当前状态与共享计算模型，安全试演未来候选方案  │          │
          └────────────────────────────┬────────────────────────────┘          │
                                       │                                       │
                                       ▼                                       │
          ┌─────────────────────────────────────────────────────────┐          │
          │                 5. 产生式编程（产生能力）                │          │
          │        由语义中间表示自动编译生成查询、约束、流程或制品  │          │
          └────────────────────────────┬────────────────────────────┘          │
                                       │                                       │
                                       ▼                                       │
          ┌─────────────────────────────────────────────────────────┐          │
          │                 6. 形式化方法（验证能力）                │          │
          │        执行类型、量纲、权限、契约、等价性与影子运行验证  │          │
          └────────────────────────────┬────────────────────────────┘          │
                                       │                                       │
                                       ▼                                       │
          ┌─────────────────────────────────────────────────────────┐          │
          │              7. 受控生产执行 ──> 产生新的领域事件        ├──────────┘
          │        投入真实业务运行，并将执行结果回流至事件记忆库    │
          └─────────────────────────────────────────────────────────┘
```

请特别留意图中从第 7 步回到第 3 步的那条回流弧线：**每一次受控生产执行、每一次现场报工反馈、每一次计划员的人工微调，都会产生新的领域事件，再次写入事件溯源系统，成为下一轮数字孪生推演、机器学习训练与运行时专门化的经验素材**。

正是在这个意义上，软件不再是交付即静止的死物，而是拥有了完整的“感知—记忆—推演—创造—验证—行动”代谢机制。

---

### 9.4 大语言模型在闭环中的真实坐标：不是第七根支柱，而是贯穿全链路的语义前端与编排器

既然上述六个软件工程方向已经构成了如此严密的闭环，那么大语言模型（LLM）和智能体（Agent）在这个体系里究竟处于什么位置？

这是一个至关重要的架构定性：**大语言模型不作为“第七根支柱”与上述六个方向并列；它的真实坐标，是贯穿整条闭环的“语义前端、运行时推理器与能力编排器”**。

具体而言，大语言模型在六大支柱之间承担着三大桥梁作用，同时严守“不替代确定性机制”的底线：

1. **在“定义/描述”入口处：大幅降低从自然语言到领域语言的表达成本**。过去，要把车间里一句临时规则写成形式化的领域特定语言（DSL）或 `ospf` 表达式，必须由懂语法的工程师操作；现在，大语言模型作为语义前端，帮助业务人员把模糊、不完整的自然语言诉求整理并映射到受约束的领域语言表示（Semantic IR）中。
2. **在“记忆/推演”环节中：结合事件历史与数字孪生进行上下文推理与方案协商**。面对现场异常，智能体自动调取事件溯源中的历史脉络与数字孪生中的预计状态，分析异常波及的订单与产线，组织并提出多个可供比选的候选方案（如“仅做局部顺延”还是“追加共享资源约束并触发滚动重排”），并用业务人员听得懂的语言解释各方案的利弊。
3. **在“产生/验证”交界处：将候选移交确定性管线，绝不越俎代庖**。大语言模型止步于提出结构化候选方案；至于如何将候选编译成查询计划或数学约束（产生式编程），以及如何校验单位、权限、数学可行性与结果等价性（形式化方法），则 100% 交由确定性的编译器、验证器与求解器完成。

此外，在这条六步能力形成闭环的上方，还坐落着负责产品治理的**软件产品线工程（Software Product Line Engineering, SPLE）**。它同样不作为顺序链条里的“第七步”，而是站在全局视角管理产品的共性与可变性——判断一个在运行时经过该闭环验证的动态能力，究竟应该继续保留为一次性临时能力，还是晋升为客户专用变体、正式产品可变点乃至平台稳定核心（我们将在第 17 章专门展开这一产品演化机制）。

明确了六大支柱的全局蓝图后，接下来在第 10 章中，我们将首先聚焦于支撑运行时学习与推理的时间底座——第 3 根支柱**“事件溯源”**与第 4 根支柱**“数字孪生”**。

---

## 第 10 章：运行时的世界模型 —— 事件溯源（过去）与可计算的数字孪生（未来）

在对比 Software 2.0 与 Software 3.0 时，我们曾指出一个极易被忽视的差异：**Software 2.0 通常只需在离线阶段从历史静态数据集中学习统计规律；而 Software 3.0 的智能体与运行时，则必须在每一次实时决策时深刻理解“正在运行中的业务世界”**。

一个真正“活着的”运行时业务世界，绝不能只有一个扁平的当前数据库截面，它必须同时贯通**过去、现在与未来**三个时间维度：

```text
   【过去（Past）】                   【现在（Present）】                  【未来（Future）】
  事件溯源与版本历史   ───────────>     当前领域状态      ───────────>       可计算数字孪生
   What happened?                        What is?                            What if?
（发生过什么？为何至此？）          （当前有效事实与规则是什么？）        （如果这样做，接下来会怎样？）
```

本章将详细阐述如何用**事件溯源（Event Sourcing）**构建系统的“记忆系统”，用**可计算的数字孪生（Digital Twin）**构建系统的“安全试验场”，从而将 Software 3.0 的语义推理牢牢锚定在真实的工业物理世界之上。

---

### 10.1 为什么只有“当前状态”的系统既无法复盘追责，也无法支撑机器学习与能力沉淀？

在传统的贫血 CRUD 系统中，数据库设计默认遵循“状态覆盖模式”：当订单数量修改、工单延期或排产计划重算时，一条 `UPDATE` 语句直接覆写原记录，系统里永远只保留最后一刻的“当前状态（`What is?`）”。

这种“只有现在、没有过去”的架构，在日常运营与智能化演进中会造成三重致命失能：

#### 1. 面对计划异常与变更，系统无法回答“为什么变成这样”
当车间看板显示“产线 A 的任务 `T2` 比基准计划晚了 45 分钟”或者“今天下午的排产顺序跟早班下发时完全不一样”时，业务与管理层真正关心的从来不只是那个结果数字，而是背后的因果链条：
* 是前序任务 `T1` 实际报工晚了，还是 WMS 原材料齐套延误了？
* 是某台设备突发故障触发了动态约束，还是某位计划员在上午 09:40 手工拖拽了工单并覆盖了运筹优化方案？
* 当时系统排产使用的是哪一版 BOM 规则、哪一版产能预测快照？
如果系统不保留稳定的领域事件、决策依据与版本时间轴，面对每一次计划波动就会陷入“死无对证”的罗生门。

#### 2. 机器学习训练陷入“时间穿越（数据泄漏）”与样本失真
在构建机器学习原生（ML-Native）能力（例如估算设备有效产能、预测工序实际耗时或校准运筹优化目标权重）时，训练样本必须严格还原**“当时做出决策那一刻所看到的真实世界”**。如果系统平时只保存被反复覆盖后的最新主数据和最终人工计划，而不保留历史观察发生的精确事件时间（Event Time）、标签成熟时点、当时的运筹原始方案以及计划员手工调整的结构化原因码，那么训练出来的模型要么因为混入了未来信息而发生严重的数据泄漏（Data Leakage），要么把计划员为了修补脏数据而做的临时妥协错误地当成了“最优业务偏好”学进模型权重里。

#### 3. 运行时能力沉淀失去证据链支撑
在 `LLM as Runtime` 架构下，系统之所以敢把某个动态规则或查询模式晋升为正式能力，靠的不是产品经理拍脑袋猜测，而是跨周期的**真实运行证据**。如果系统没有记录历次用户需求表达、候选方案生成、仿真结果对比、人工审批结论以及实际执行后的业务效果（KPI 改善或退化），自适应运行时就成了“没有记忆的盲人”，根本无从判断什么模式反复发生、什么方案真正有效。

---

### 10.2 事件溯源与版本快照：保留事实、决策、人工调整原因与规则版本的不可变时间轴

为了补齐“记忆缺口”，我们在架构中引入**事件溯源与版本化历史审计机制**，将其作为语义运行时的“记忆系统”。

需要强调的是，在工程落地上，我们保持务实与克制：**统一历史记忆，绝不要求系统里的每一个普通配置表或每一个业务对象都强行采用全量纯事件溯源（Pure Event Sourcing）实现**。我们采用的是**“不可变业务版本快照 + 关键领域事件时间轴”**的双轨组合模式：

```text
                     【运行时记忆系统：版本快照 + 领域事件时间轴】
                                           │
            ┌──────────────────────────────┴──────────────────────────────┐
            ▼                                                             ▼
  【不可变业务版本快照（Versioned Snapshots）】             【不可变领域事件时间轴（Domain Event Timeline）】
  • 排产输入数据快照、规则快照、字段目录版本                • 外部执行事实事件（MES报工、WMS领料、TMS到车）
  • 机器学习训练数据集、特征模式（Schema）、模型制品版本     • 计划决策事件（排产下发、滚动重排触发原因）
  • 产能估算快照与激活覆盖层（CapacityEffectiveOverlay）     • 人工计划微调事件（原始方案、结构化差异、原因码）
  • 历史计划方案版本（基准计划 / 仿真候选方案快照）          • 运行时能力生命周期事件（候选审批、发布、失效、回滚）
```

这套记忆机制在架构上严格保障以下四项核心能力：

1. **按任意历史时点精确重建状态（Time-Travel Reconstruction）**：排产、MRP、仿真试算与数字孪生复盘，都必须显式绑定并冻结当轮计算所使用的输入快照、规则快照、数据版本、预测快照与计划版本。在进行历史问题复盘或模型回放时，系统能够精确还原当时那一刻的领域状态，**绝对禁止默认读取当前的最新主数据或当前模型版本去解释历史排产结果**。
2. **结构化记录“人工计划调整”的完整上下文**：当计划员在工作台上修改运筹优化给出的原始方案时，系统绝不能直接覆盖原方案，而必须同时冻结记录：**当时的领域输入与模型参数版本 → 运筹优化原始方案 → 人工调整后的方案 → 两者的结构化差异（Diff） → 计划员选择的结构化调整原因码（是修正主数据错误、补充未建模硬约束、处理一次性客户特批，还是体现长期排产偏好） → 审批链 → 后续真实执行结果**。
3. **承载带时点语义的外部执行事实**：当 MES、WMS、TMS 的执行反馈进入平台时，系统以不可变事件形式记录其业务发生时间（Event Time）、同步到达时间、来源系统版本与数据质量语义，为数字孪生推演与机器学习特征构造提供防篡改的原始观察。
4. **全程追踪动态能力的血缘（Provenance）**：每一个由智能体或运行时生成的动态约束、预测覆盖层或专用查询计划，都通过事件链完整记录其原始意图来源、内容哈希、验证证据、批准人、生效区间与失效回退记录。

---

### 10.3 告别“静态展示看板”：基于计划时间、预计时间、实际时间三层模型的数字孪生动态推演

如果说事件溯源解决了“过去发生过什么（`What happened?`）”，当前领域状态呈现了“现在是什么（`What is?`）”，那么**生产计划数字孪生（Production Planning Digital Twin）**则负责回答最关键的未来之问：**“如果这样做，接下来会发生什么（`What if?`）”**。

在许多传统数字化项目中，“数字孪生”被异化成了一个昂贵的 3D 可视化大屏——仅仅把车间设备当前的运行绿灯或故障红灯静态展示在屏幕上。但在本书的架构体系中，**数字孪生绝不是单纯的展示看板，而是将订单、库存、产能、设备、工艺、BOM、人员、能源、约束与计划任务映射为可计算、可仿真、可回放的生产系统镜像**。

数字孪生最核心的业务价值，在于**根据现场实际执行数据，持续、动态地更新对未来预计状态的推演**。要做到这一点，工单与工序任务在领域模型中绝不能只有一组开始/结束时间，而必须建立严谨的**“计划、预计、实际”三层时间模型**：

| 时间模型层级 | 领域语义定义 | 产生与更新机制 | 在数字孪生与排产闭环中的作用 |
| :--- | :--- | :--- | :--- |
| **1. 计划开始/结束时间**<br>（Planned Time） | 排产方案正式确认并下发时生成的基准计划时间 | 在每轮排产下发时作为基准快照冻结，后续不随现场报工静默篡改。 | 作为衡量交付准时率与现场执行偏差的黄金基准参照系。 |
| **2. 预计开始/结束时间**<br>（Estimated / Projected Time） | 根据当前最新执行进度与有效产能动态推算出的最新未来预测 | 当前序任务产生实际时间或资源状态变化时，由领域计算模型自动向后传播重算。 | 避免继续用已过期的原计划解释现场状态，实时暴露后续交期延误与资源冲突风险。 |
| **3. 实际开始/结束时间**<br>（Actual Time） | MES 或车间现场反馈的真实物理执行时间 | 由现场报工与物联网事实入口写入，属于不可变的物理执行事实。 | 锚定数字孪生的“当前真实进度起点”，驱动后续预计状态的级联更新。 |

让我们结合第 4 章与第 5 章的贯穿用例，用一组可复算的真实时间数据（假设展示采用工厂本地时区，底层持久化统一使用 UTC `Instant`），看看三层时间模型在数字孪生中是如何动态运作的：

* **基准计划设定**：产线 A 上排有前序任务 `T1`（计划 `08:00` 开始，`09:30` 结束）和后序任务 `T2`（计划 `10:00` 开始，其中 `09:30` 至 `10:00` 为 30 分钟换产时间）；产线 B 上排有任务 `T3`（计划 `11:00` 开始，且初始假设下 `T3` 不与 `T1` 争抢同一时段的关键资源）。
* **现场延误发生**：上午 `10:00`，MES 反馈 `T1` 实际在 `08:10` 才开工，直到 `10:00` 才刚刚实际结束（比计划结束时间晚了 30 分钟）。

此时，数字孪生无需等待夜间批量重排，立即根据 `T1` 的实际结束时间（`10:00`）加上 `T1` 到 `T2` 的换产时间（30 分钟），自动将 `T2` 的预计开始时间推演更新为 `10:30`：

| 工单任务 | 所属产线 | 计划开始 | 计划结束 | 实际开始 | 实际结束 | 预计开始（数字孪生动态重算后） |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **任务 T1** | 产线 A | `08:00` | `09:30` | `08:10` | `10:00` | `08:00`（已完工，由实际时间接管） |
| **任务 T2** | 产线 A | `10:00` | （按时长定） | `-` | `-` | **`10:30`**（受 T1 实际延误与 30 分钟换产影响自动顺延） |
| **任务 T3** | 产线 B | `11:00` | （按时长定） | `-` | `-` | **`11:00`**（无共享资源冲突假设下未受波及；若共享投料口时间窗重叠则进入冲突校验） |

请特别注意表中关于任务 `T3` 的严谨边界：**如果仅看产线归属，`T3` 在产线 B 上，似乎不受产线 A 延误的影响；但一旦叠加了“今天产线 A、B 共用投料口且存在容量上限”的动态约束，当 `T2` 被推迟到 `10:30` 以后，它的投料时间窗口就可能与 `11:00` 启动的 `T3` 发生重叠！此时，`T3` 也必须被拉入数字孪生的资源冲突校验范围，绝不能仅凭产线不同就草率判定未受波及**。

---

### 10.4 换产时间、生产时长与日历可用性的领域沉淀：如何实现“前序任务延误 → 后序预计状态秒级自动更新”？

仔细观察上面 `T2` 预计时间的动态更新过程，其背后的通用数学推演公式如下：

```text
后序任务预计开始时间
= 前序任务实际结束时间
+ 前序任务到后序任务的换产时间 (Changeover Time)
+ 日历可用时间调整 (Calendar Availability Adjustment)

后序任务预计结束时间
= 后序任务预计开始时间
+ 后序任务生产时长 (Production Duration)
+ 班次 / 休息 / 计划停机时间调整
```

其中，换产时间与生产时长绝不是固定的死常数，而是依赖多维业务属性与已批准有效产能覆盖层（`CapacityEffectiveOverlay`）的领域计算函数：

```text
换产时间 = f(前一物料属性, 后一物料属性, 设备特征, 工艺换产矩阵规则)
生产时长 = f(计划生产数量, 已冻结的有效设备产能, 工艺节拍, 班次日历)
```

这组公式揭示了一个极其深刻的架构倒逼逻辑（即我们在第 11 章将详述的“第 12 点数字孪生反向强化第 1 点与第 8 点”）：
**在过去的架构中，如果换产时间计算、生产时长折算、班次日历跨休调整等逻辑只被写在排产算法服务内部，那么当 MES 上报 `T1` 晚了 30 分钟时，业务系统自己根本算不出 `T2` 预计会推迟到几点，只能要么在看板上继续挂着已经过期的 `10:00` 计划时间误导现场，要么被迫每次报工都去重新调用沉重的完整排产算法**！

而在我们的架构中，通过将换产时间、生产时长、日历可用性、物料消耗预计等全部沉淀为**由 `ospf` 双入口承载的形式化领域计算模型**，业务系统在收到 `T1` 实际完工事件的瞬间，直接调用领域层的**确定性数值入口**，即可在毫秒级独立完成后续任务预计时间的级联重算与资源占用推演！

更进一步，这个实时演进的数字孪生镜像，直接成为了**智能体业务推理（Agent Reasoning）与滚动排产决策的权威上下文来源**。当计划员询问影响时，智能体不再是凭空瞎猜，而是读取数字孪生状态，沿着一条严密的工程链路完成闭环协同：

```text
┌────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
│  1. 现场实际反馈   │    │ 2. 数字孪生更新预计态  │    │ 3. 智能体推理偏差影响  │    │ 4. 生成候选并仿真对比  │    │ 5. 局部调整或滚动排产  │
│ MES报工/WMS库存同步│───>│ 领域模型重算预计时间窗 │───>│ 识别受波及任务与新冲突 │───>│ 试算局部顺延vs全局重排 │───>│ 应用层按策略校验并执行 │
└────────────────────┘    └────────────────────────┘    └────────────────────────┘    └────────────────────────┘    └────────────────────────┘
```

在这条连续链路中，数字孪生同时充当了**三原生的交汇点**：
* **机器学习原生**为数字孪生提供带血缘与不确定性的有效产能与耗时预测输入；
* **系统侧领域计算模型**驱动预计状态随实际反馈秒级更新；
* **智能体原生**结合数字孪生判断偏差是否越出交付窗口、是否触发了共享投料口等新冲突，并生成候选调整方案；
* **运筹原生**在数字孪生沙盒中对候选方案执行轻量求解与仿真比选（`What-if`），最终由应用层根据确定性策略决定是仅做局部时间更新，还是正式触发新一轮滚动排产。

一句话总结：**事件溯源提供经验（记忆），数字孪生提供想象（试验场）；没有记忆，软件无法从历史中学习；没有试验场，软件无法在生产前安全尝试**。

---

## 第 11 章：用领域驱动设计（DDD）白盒编排运筹算法与大规模分解求解

在第 10 章的数字孪生闭环中，我们看到系统需要在“局部数值推演”、“轻量级仿真试算”与“全局滚动重排（乃至列生成、Benders 分解等大规模数学规划）”之间自如切换。

要实现这种丝滑的协同，传统的“业务系统通过粗糙 HTTP 接口调用外挂黑盒算法服务”的架构必须被彻底淘汰。本章将完整呈现平台架构的 **15 点依赖关系推演**，阐明为什么运筹算法必须作为可被应用层白盒编排的库/模块融入领域驱动设计（DDD），并直接基于 `ospf-kotlin` 的原生模型与符号基础设施，给出局部/全局排产触发守卫、DDD 列生成（Column Generation）与 Benders 分解算法的完整工程实现代码。

---

### 11.1 15 点架构依赖推演：为什么算法必须优先作为可被应用层白盒编排的库与模块？

为什么我们如此坚定地主张采用“领域驱动设计（DDD）+ 函数式编程（FP）+ 形式化领域模型 + 白盒可编排算法库”的架构路线？因为这不是出于某种主观的技术审美偏好，而是由工业软件的 15 个核心诉求通过严格的逻辑依赖**一步步“逼”出来的唯一解**。

让我们先列出构建现代化智能 APS / DOP 平台所必需的 **15 个关键架构点位**：

| 点位编号 | 核心架构与业务能力内容 | 点位编号 | 核心架构与业务能力内容 |
| :--- | :--- | :--- | :--- |
| **第 1 点** | 业务逻辑内聚到领域模型 | **第 9 点** | 纯计算可测试性（脱离框架与数据库单测） |
| **第 2 点** | 领域层与持久化、外部接口、运行时框架分离 | **第 10 点** | 轻量高频可仿真性（不污染真实业务状态） |
| **第 3 点** | 仓储（Repository）是领域接口，基础设施层只是实现 | **第 11 点** | 迭代数据与版本快照（含计划、预计、实际三层状态） |
| **第 4 点** | 算法可被应用层白盒编排，避免不透明黑盒接口 | **第 12 点** | 可计算的数字孪生动态推演 |
| **第 5 点** | 算法与系统业务口径严格一致 | **第 13 点** | 滚动排产与跨节点可组合流程编排 |
| **第 6 点** | 支持运行时结构化动态约束注入 | **第 14 点** | 智能体基于结构化领域元数据动态适配 |
| **第 7 点** | 业务中间值透明、具名、可解释、可查询 | **第 15 点** | 智能体基于数字孪生和领域上下文做业务推理 |
| **第 8 点** | **各运行侧（系统/OR/ML/Agent）共享同一形式化领域模型** | — | *（注：ML 原生、基础框架与 LLM as Runtime 作为跨切面能力叠加其上）* |

当我们把这 15 个点位的支撑与制约关系绘制成完整的架构依赖拓扑图时，整座大厦的力学结构便一目了然：

```text
                                 【第 8 点：形式化领域模型】
                           （系统、运筹、机器学习、智能体共享领域概念）
                                              │
        ┌──────────────────┬──────────────────┼──────────────────┬──────────────────┐
        ▼                  ▼                  ▼                  ▼                  ▼
    [第 5 点]          [第 6 点]          [第 7 点]         [第 12 点]         [第 15 点]
 算法与系统口径一致   动态约束安全注入     中间值透明可查    数字孪生动态推演   智能体业务推理
                           │                  │                  │      (反向强化第 1 点与第 8 点)
                           └────────┬─────────┘                  │
                                    ▼                            │
                    【第 4 点：算法可被应用层白盒编排】          │
                      （避免只暴露不透明的黑盒服务接口）         │
                                    │                            │
                    ┌───────────────┴───────────────┐            │
                    ▼                               ▼            │
                [第 10 点]                    [第 6 / 7 点]      │
              轻量高频可仿真性                 得以工程实现      │
                    ▲                                            │
                    │                                            ▼
                    └─────────────── 【第 11 点】 ───────────────┘
                              计划 / 预计 / 实际 + 版本快照
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
                [第 10 点]      [第 12 点]      [第 13 点]
                 仿真对比      数字孪生推演   滚动排产与流程编排
                                                    │
                                                    ▼
                                                [第 15 点]
                                       智能体推理影响范围与候选方案
                                                    │
                                                    ▼
                                                [第 14 点]
                                       智能体生成动态约束与流程适配


  【第 1 点：业务逻辑内聚】 ──┐
  【第 2 点：领域与框架分离】 ┼───────► [第 9 点：纯计算可测试性]
  【第 3 点：仓储接口化】 ────┘        （不启 Spring、不连库、不调远程服务直接单测）
```

在第 5 章中我们已经拆解了第一层依赖（第 8 点形式化领域模型是一切的根基），现在让我们重点审视**第二层至第六层依赖**是如何严密咬合的：

#### 1. 为什么第 4 点（算法白盒可编排）是第 6 点（动态约束）、第 7 点（中间值透明）与第 10 点（可仿真性）的实现前提？
如果运筹算法只对外暴露一个不透明的黑盒 RPC/HTTP 接口（传入固定 DTO，返回排程摘要），那么决策变量、中间值表达式、约束构造管线和求解过程就全被锁死在服务内部：
* **第 4 点 → 第 6 点（动态约束注入）**：动态约束要求在运行时把新规则（如 `actualFeedingInWindow + plannedFeedingRemaining[A] + plannedFeedingRemaining[B] <= feedingLimit`）注入算法模型。只有当算法以可被应用层编排的库/模块形式存在（或者在远程部署时显式暴露与领域模型对齐的结构化变量目录与约束契约），应用层才能直接基于同一批领域对象追加结构化约束，而不是退化为传不可解析的黑盒字符串。
* **第 4 点 → 第 7 点（中间值透明）**：如果黑盒服务只返回 `output summary`，系统就拿不到投料量、资源占用、换产耗时等具名中间值。算法作为白盒模块时，可以直接复用领域计算对象（如 `ospf` 的 `LinearExpressionSymbol`），显式输出带名称、来源表达式、物理单位、生命周期和版本信息的中间值结果。
* **第 4 点 → 第 10 点（轻量可仿真性）**：仿真试算（`What-if`）要求高频、轻量、低延迟地执行“改参数/加约束 → 重算 → 对比结果”。算法作为模块库由应用层直接在内存级编排调用时，省去了繁重的跨网拼装、序列化与服务调度开销；即便针对超大规模问题采用远端算力部署，也必须通过统一的领域快照契约、批量请求或就地缓存来治理延迟。

#### 2. 第三层至第六层依赖的连锁传导
* **第 1、2、3 点 → 第 9 点（可测试性）**：可测试性不是靠加几个测试工具解决的，它取决于架构本身。只有当业务逻辑内聚在领域模型中（第 1 点）、领域层保持纯函数计算且不依赖持久化与框架（第 2 点）、仓储全部抽象为接口（第 3 点）时，研发团队才能做到**“不启动 Spring 容器、不连接数据库、不调用远程算法服务，直接在毫秒级单元测试中验证所有领域规则、计算公式与约束管线”**。
* **第 11 点（三层状态与版本快照） → 第 10、12、13 点**：没有计划/预计/实际三层时间与版本快照 diff 机制，仿真就无法结构化对比方案优劣（第 10 点），数字孪生就无法推演未来预计状态（第 12 点），滚动排产也就不知道哪些任务已完工、哪些正在执行、哪些预计会偏移（第 13 点）。
* **第 12 点（数字孪生）反向强化第 1 点与第 8 点**：正因为数字孪生要求不依赖完整排产就能实时重算预计时间，换产时间、生产时长与日历推算就必须从算法黑盒中抽出来，内聚沉淀到共享的形式化领域模型中。
* **第 15 点（智能体业务推理） → 第 14 点（智能体动态适配）**：两者的顺序永远是**“先结合领域上下文与数字孪生做影响推理（第 15 点），再基于结构化元数据生成可校验的动态约束或流程编排方案，并交由仿真验证后执行（第 14 点）”**。

通过下表，我们可以清晰地看到这套架构中的每一个设计决策是如何被业务目标一步步“倒逼”出来的：

| 架构点位 | 是否被其它点约束？ | 直接约束来源 | 架构倒逼逻辑说明 |
| :--- | :--- | :--- | :--- |
| **第 8 点（形式化领域模型）** | **否，是总根基** | — | 核心架构基石，直接决定了第 5、6、7、12、13、14、15 点的解法。 |
| **第 1、3 点（领域内聚/仓储接口）** | **否，是基础选择** | — | 领域驱动设计分层的基础，否则所有能力只能靠过程式接口堆叠。 |
| **第 2 点（领域与框架分离）** | 被第 3 点支撑 | 第 3 点 | 仓储接口化后，领域层才能彻底摆脱数据库与框架实现绑定。 |
| **第 4 点（算法白盒可编排）** | 部分受约束 | 第 8 点 | 若领域概念未形式化，算法即便做成库也无法与系统共享领域对象。 |
| **第 5 点（算法系统口径一致）** | 受严格约束 | 第 8 点 | 唯有共享同一份领域定义并隔离状态角色，口径一致才有根本保障。 |
| **第 6、7 点（动态约束/中间值）** | 受双重约束 | 第 8 点、第 4 点 | 要求变量与中间值是具名领域符号，且算法模型支持运行时白盒注入与解析。 |
| **第 9 点（可测试性）** | 受三重约束 | 第 1、2、3 点 | 依赖业务逻辑内聚、纯计算无副作用与持久化接口隔离。 |
| **第 11 点（三层状态与快照）** | 相对独立的数据基石 | — | 为仿真对比、数字孪生推演与滚动排产提供版本化数据基础。 |
| **第 10 点（可仿真性）** | 受四重约束 | 第 4、6、7、11 点 | 仿真要求轻量求解调用、动态约束注入、中间值查询与版本快照对比。 |
| **第 12 点（数字孪生推演）** | 受约束且反向强化 | 第 8、11 点（强化第 1 点） | 要求可独立计算的领域模型与计划/预计/实际三层数据。 |
| **第 13 点（滚动排产与编排）** | 受三重约束 | 第 8、11、12 点 | 依赖统一节点领域契约、版本快照数据与动态预计状态推演。 |
| **第 15 点（智能体业务推理）** | 受六重约束 | 第 7、8、10、11、12、13 点 | 依赖形式化词典、透明中间值、历史快照、数字孪生状态、仿真与流程上下文。 |
| **第 14 点（智能体动态适配）** | 受五重约束 | 第 6、8、10、13、15 点 | 依赖结构化元数据、推理结论、可注入约束、安全仿真验证与可组合流程节点。 |

---

### 11.2 局部推演 vs. 全局滚动排产：如何划定局部时间传播与触发完整重排的策略边界？

当运筹算法与领域计算模型都能被应用层自由编排后，我们在处理第 10 章“前序任务 `T1` 延误”这类日常现场扰动时，就不再只有“要么不管、要么全盘重排”这两个极端选项，而是可以建立起**“系统侧局部推演（Local Propagation）”与“运筹侧全局滚动排产（Global Rolling Rescheduling）”的分级响应机制**。

为什么要严格划定“局部推演”与“完整重排”的边界？
* **如果任何微小偏差都触发完整重排**：不仅算力开销大、响应慢，而且频繁改变全厂工单顺序会引发严重的“计划神经质（Schedule Nervousness）”——车间工人刚领完料准备开工，系统又把工单顺序全改了，现场根本无法执行；
* **反之，如果只做局部推演而不设全局冲突警戒线**：局部的顺延修正可能会掩盖跨产线的全局资源冲突（例如 `T2` 顺延后与产线 B 的 `T3` 在同一时间桶争抢共享投料口容量或公用模具），导致推演出来的预计计划实际上是不可行的。

因此，应用层通过确定性策略将处理流程划分为三个清晰梯度：

```text
               【现场实际执行反馈进入（如 T1 实际完工晚 30 分钟）】
                                        │
                                        ▼
         ┌─────────────────────────────────────────────────────────────┐
         │ 第一级：领域计算模型局部推演（系统侧纯数值计算，毫秒级）    │
         │ • 沿前后置工序链与产线日历，重算 T2 等后序任务的预计时间窗  │
         │ • 重算受影响时间桶内的预计投料量与预计资源占用              │
         └──────────────────────────────┬──────────────────────────────┘
                                        │
                                        ▼
                     [应用层确定性边界与冲突守卫检查]
         • 预计结束时间是否越出订单交付窗口或超过偏差容忍阈值？
         • 是否触发跨产线资源冲突（如共享投料口、公用夹具、齐套库存）？
                                        │
               ┌────────────────────────┴────────────────────────┐
        【未越界且无全局冲突】                            【越过阈值或产生资源冲突】
               │                                                 │
               ▼                                                 ▼
┌──────────────────────────────┐                  ┌──────────────────────────────┐
│ 保持原基准计划顺序，仅更新   │                  │ 第二/三级：运筹求解与仿真比选│
│ 数字孪生预计状态并持续监控   │                  │ • 方案 A：受限局部窗口重排   │
└──────────────────────────────┘                  │ • 方案 B：全局滚动排产重算   │
                                                  │ 经数字孪生仿真对比后确认下发 │
                                                  └──────────────────────────────┘
```

1. **第一级（系统侧纯数值局部推演）**：由应用层直接调用领域层的换产时间、生产时长与物料消耗计算模型，更新受影响工序链的预计时间。只要更新后的预计时间未突破订单交期红线、偏差在允许阈值内，且经约束求值器检查未违反任何跨资源硬约束，系统就只需更新数字孪生预计状态，无需惊动运筹求解器改动基准排产顺序。
2. **第二级（运筹侧受限局部窗口重排）**：当偏差超出局部缓冲，但影响范围被领域图谱严格限定在某几个关联工单或单一车间内时，算法层仅锁定受影响对象集合（如 `{T2, T3, 产线 A, 产线 B}`），将其余已稳定工单冻结为边界常数，执行秒级轻量重排。
3. **第三级（全局滚动排产与流程编排）**：当扰动波及全局瓶颈资源、引发多级物料齐套缺口，或智能体与计划员注入了跨产线的新动态约束时，应用层触发完整的滚动排产工作流（如 `排产求解 → 替代料分配 → 重算物料消耗预计 → MRP 缺口核算 → 仿真对比 → 审批下发`）。每一轮滚动都强制冻结并记录输入快照、规则版本、触发原因与结果版本，确保全链路 100% 可复盘。

#### 工程实现：基于 OSPF 原生单位与三层时间模型的数字孪生局部推演与滚动重排触发守卫
下面给出直接复用第 7 章 `TaskDurationSharedCore`、`FeedingSharedCore` 以及 `ospf-kotlin` 原生单位（`Hour`、`Minute`、`Kilogram`）实现的**数字孪生预计状态级联推演器与重排触发决策守卫代码**：

```kotlin
package org.adaptive.dop.application.twin

import java.time.Duration
import java.time.Instant
import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import org.adaptive.dop.domain.core.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. 工单任务的三层时间状态模型（计划时间、预计时间、实际时间严格分离，持久化统一使用 UTC Instant）
data class TaskThreeTierScheduleState(
    val taskId: String,
    val lineId: String,
    val plannedStart: Instant,
    val plannedEnd: Instant,
    val estimatedStart: Instant,
    val estimatedEnd: Instant,
    val actualStart: Instant? = null,
    val actualEnd: Instant? = null,
    val orderDeliveryDeadline: Instant,
    val plannedOutputMass: Quantity<Flt64>,
    val durationSpec: TaskDurationSpec,
    val feedingSpec: FeedingRuleSpec
)

// 2. 应用层重排分级响应决策结果
sealed interface PropagationDecision {
    /** 第一级：仅更新数字孪生预计状态，不改动基准排产顺序 */
    data class KeepBaselineUpdateTwinOnly(
        val updatedTasks: List<TaskThreeTierScheduleState>
    ) : PropagationDecision

    /** 第二/三级：触发受限局部窗口重排或全局滚动排产（携带触发原因、受影响对象与冻结快照要求） */
    data class TriggerRollingReschedule(
        val reason: String,
        val affectedTaskIds: Set<String>,
        val affectedLineIds: Set<String>,
        val updatedPreviewTasks: List<TaskThreeTierScheduleState>
    ) : PropagationDecision
}

/**
 * 数字孪生局部推演与滚动重排触发守卫：
 * 当收到前序任务 T1 实际完工反馈时，在系统侧用 OSPF 纯函数数值入口秒级推演后序预计时间，
 * 并检查是否越过交期偏差阈值或触发跨产线共享投料口容量冲突。
 */
class DigitalTwinPropagationGuard(
    private val maxAllowedDelayThreshold: Quantity<Flt64> = Quantity(Flt64(15.0), Minute) // 局部容忍偏差阈值: 15 分钟
) {
    fun propagateAndEvaluate(
        completedPredecessor: TaskThreeTierScheduleState,
        successorChainOnSameLine: List<TaskThreeTierScheduleState>,
        parallelTasksOnOtherLines: List<TaskThreeTierScheduleState>,
        actualFeedingAlreadyOccurred: Quantity<Flt64>, // 当日已实际发生的投料事实 (如 450 kg)
        sharedFeedingLimit: Quantity<Flt64>            // 当日共享投料口容量上限 (如 1000 kg)
    ): Ret<PropagationDecision> {
        val predActualEnd = completedPredecessor.actualEnd
            ?: return Failed(Err(ErrorCode.IllegalArgument, "前序任务 [${completedPredecessor.taskId}] 尚未产生实际结束时间"))

        val updatedSuccessors = mutableListOf<TaskThreeTierScheduleState>()
        var cursorEndInstant: Instant = predActualEnd
        var delayThresholdBreached = false
        var deadlineBreached = false

        // 1. 沿同产线前后置工序链，调用第 7 章共享业务核心的【数值入口】级联重算预计开始与预计结束时间
        for (succ in successorChainOnSameLine) {
            // 1.1 计算换产时间 + 日历可用时间调整，推算后序任务预计开始时间
            val changeoverHoursQty = when (
                val r = OspfBoundaryAdapter.addQuantitiesSafely(
                    lhs = succ.durationSpec.changeoverDuration,
                    rhs = succ.durationSpec.calendarBreakDuration,
                    targetUnit = Hour
                )
            ) {
                is Ok -> r.value
                is Failed -> return r
            }
            val changeoverSeconds = (changeoverHoursQty.value * Flt64(3600.0)).toDouble().toLong()
            val newEstimatedStart = cursorEndInstant.plusSeconds(changeoverSeconds)

            // 1.2 调用共享业务核心计算含换产与加工的总耗时，推算后序任务预计结束时间
            val totalDurationHours = when (
                val r = TaskDurationSharedCore.evaluateNumericalTotalDuration(succ.durationSpec, succ.plannedOutputMass)
            ) {
                is Ok -> r.value
                is Failed -> return r
            }
            val totalElapsedSeconds = (totalDurationHours.value * Flt64(3600.0)).toDouble().toLong()
            val newEstimatedEnd = cursorEndInstant.plusSeconds(totalElapsedSeconds)

            // 1.3 检查预计结束时间与原计划结束时间的偏差是否超过阈值，或是否突破订单交付窗口
            val delayMinutes = Duration.between(succ.plannedEnd, newEstimatedEnd).toMinutes().coerceAtLeast(0)
            val delayQty = Quantity(Flt64(delayMinutes.toDouble()), Minute)
            val thresholdInMin = (OspfBoundaryAdapter.convertQuantitySafely(maxAllowedDelayThreshold, Minute) as Ok).value

            if (delayQty.value gr thresholdInMin.value) {
                delayThresholdBreached = true
            }
            if (newEstimatedEnd.isAfter(succ.orderDeliveryDeadline)) {
                deadlineBreached = true
            }

            val updatedTask = succ.copy(
                estimatedStart = newEstimatedStart,
                estimatedEnd = newEstimatedEnd
            )
            updatedSuccessors.add(updatedTask)
            cursorEndInstant = newEstimatedEnd
        }

        // 2. 全局冲突守卫检查：即使单线顺延未超交期，也必须检查顺延后的时间窗口是否与并行产线 (如产线 B 的 T3)
        //    发生时间窗重叠，并校验当日共享投料口累计投料量是否超限！
        val allPendingTasks = updatedSuccessors + parallelTasksOnOtherLines
        var totalEstimatedRemainingFeedingKg = Flt64.zero
        for (task in allPendingTasks) {
            val taskFeeding = when (val r = FeedingSharedCore.evaluateNumericalFeeding(task.feedingSpec, task.plannedOutputMass)) {
                is Ok -> r.value
                is Failed -> return r
            }
            val taskFeedingKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(taskFeeding, Kilogram)) {
                is Ok -> r.value.value
                is Failed -> return r
            }
            totalEstimatedRemainingFeedingKg += taskFeedingKg
        }

        val actualKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(actualFeedingAlreadyOccurred, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val limitKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(sharedFeedingLimit, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val projectedTotalFeedingKg = actualKg + totalEstimatedRemainingFeedingKg
        val sharedResourceConflict = projectedTotalFeedingKg gr limitKg

        // 3. 根据确定性守卫判定返回第一级（仅更新孪生）还是第二/三级（触发滚动重排与仿真比选）
        return if (!delayThresholdBreached && !deadlineBreached && !sharedResourceConflict) {
            Ok(PropagationDecision.KeepBaselineUpdateTwinOnly(updatedSuccessors))
        } else {
            val reasons = buildList {
                if (delayThresholdBreached) add("后序任务预计延误超出局部缓冲阈值 (${maxAllowedDelayThreshold.value} ${maxAllowedDelayThreshold.unit.symbol})")
                if (deadlineBreached) add("后序任务预计完工时间突破订单交付红线")
                if (sharedResourceConflict) add("跨产线共享投料口预计累计投料 ($projectedTotalFeedingKg kg) 超出当日上限 ($limitKg kg)")
            }.joinToString("；")

            val affectedTasks = allPendingTasks.map { it.taskId }.toSet()
            val affectedLines = allPendingTasks.map { it.lineId }.toSet() + completedPredecessor.lineId
            Ok(
                PropagationDecision.TriggerRollingReschedule(
                    reason = reasons,
                    affectedTaskIds = affectedTasks,
                    affectedLineIds = affectedLines,
                    updatedPreviewTasks = updatedSuccessors
                )
            )
        }
    }
}
```

---

### 11.3 用 DDD 架构驾驭列生成（Column Generation）：受限主问题、定价子问题契约与约化成本验证

当企业规模进一步扩大——例如面对跨多个工厂、上万张工单的排产，或者数字化运营平台（DOP）中运输管理系统（TMS）的**大规模车辆路径与配载问题（VRP）**、下料切割问题（Cutting Stock）与人员班次调度问题时，如果试图把所有组合方案一次性建成一个巨大的单一混合整数线性规划（MILP）模型，变量数量会呈指数级爆炸（多达数百万乃至上亿列），任何商业求解器都会直接内存溢出或超时卡死。

为了攻克这类超大规模优化难题，运筹学界最强大的武器之一是**列生成（Column Generation）与分支定价（Branch-and-Price）算法**。然而在传统算法脚本中，列生成的主问题与子问题往往写成一团高度耦合的面条代码，极难维护与扩展。

在 `ospf` 与本书的领域驱动设计（DDD）架构下，我们将列生成算法拆解为职责极其清晰的领域与算法协作组件，并为后续引入机器学习/强化学习加速预留了严格的安全验证边界：

```text
                    【DDD 架构下的列生成（Column Generation）协作闭环】

       ┌─────────────────────────────────────────────────────────────────────┐
       │ 1. 受限主问题（Restricted Master Problem, RMP —— 运筹主控层）       │
       │ • 仅包含当前已生成的有限个可行方案列（如单车配载路径列 / 单线排产列）│
       │ • 负责全局耦合硬约束（订单全覆盖、共享投料口总量上限、全局库存平衡）│
       │ • 求解线性松弛并输出当前对偶价格（Dual Prices / Shadow Prices）     │
       └──────────────────┬───────────────────────────────────▲──────────────┘
                          │ 下发带对偶信息与业务边界的子问题契约 │
                          ▼                                   │ 回注经验证的改进列
       ┌──────────────────────────────────────────────────────┴──────────────┐
       │ 2. 定价子问题契约（Pricing Subproblem Contract —— 领域与算法解耦层）│
       │ • 按独立限界上下文/聚合（如单台设备、单条产线、单辆货车）拆分子问题 │
       │ • 目标：寻找满足单资源局部工艺/时空约束、且约化成本（Reduced Cost） │
       │   为负（最小化问题中）的新方案列                                    │
       └──────────────────┬───────────────────────────────────▲──────────────┘
                          │                                   │
            ┌─────────────┴─────────────┐       ┌─────────────┴─────────────┐
            ▼                           ▼       │                           │
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────────┐
│ 路径 A：加速/启发式器 │   │ 路径 B：精确子问题求解│   │ 3. 运筹验证守卫（OR Guard）│
│ 启发式 / 受控 RL 策略 │   │ 动态规划 / MILP / CP  │──>│ • 独立校验领域硬约束可行性│
│ 快速生成或排序候选列  │──>│ （负责收敛与最优证明）│   │ • 独立重算并核验约化成本  │
└───────────────────────┘   └───────────────────────┘   └───────────────────────────┘
```

用 DDD 架构组织列生成的核心工程精髓在于以下三点：

1. **按领域聚合边界自然解耦主问题与定价子问题**：
   * **受限主问题（RMP）**只关心跨资源的全局协调契约（如“每个订单必须被执行”、“产线 A 与 B 今日共享投料总和不超过 `1000 kg`”），它甚至不需要知道单条产线内部复杂的换产细节；
   * **定价子问题（Pricing Subproblem）**则完全内聚在单个领域聚合（如单条产线或单辆运输车）内部，利用领域层定义的换产时间、生产时长、班次日历与局部工艺规则，结合主问题传下来的对偶价格（Dual Prices），独立寻找最有价值的候选方案列。
2. **严格的候选列验证守卫（Candidate Column Verification）**：无论是通过确定性启发式算法、还是通过第 13 章将介绍的强化学习（RL）加速器生成的候选列，在回注主问题之前，都**必须经过运筹优化验证守卫的独立检验**——验证该列是否 100% 满足单产线/单车的领域硬约束，并用主问题对偶值独立重算其**约化成本（Reduced Cost）**是否真正具有改进价值；任何不可行列或非改进列都会被当场拒绝。
3. **精确定价兜底与最优性认证（Exact Pricing Fallback & Certification）**：在迭代初期，系统可以使用快速启发式或学习型策略批量产出优质列以加速收敛；但当启发式/加速器找不到改进列、或者算法接近收敛需要给出严格的**数学上下界（Bounds）与全局最优性证明**时，系统**必须强制切换并运行可认证的精确定价子问题**，严格证明在当前分支约束下确实已不存在任何可改进列，绝不允许用未经认证的近似策略输出宣告全局收敛！

#### 工程实现：基于 OSPF 的 DDD 列生成（Column Generation）主子问题编排与验证守卫代码
下面给出直接基于 `ospf-kotlin` 的 `Flt64`、`Quantity`（`Kilogram` / `Hour`）、`LinearMetaModel` 与 `Ret` 实现的 DDD 列生成编排核心代码：

```kotlin
package org.adaptive.dop.algorithm.cg

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import fuookami.ospf.kotlin.utils.physics.quantity.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import org.adaptive.dop.infrastructure.ospf.OspfBoundaryAdapter

// 1. 单条产线/单辆货车的排产/配载候选方案列（领域值对象）
enum class ColumnSource { INITIAL_BASIS, HEURISTIC_ACCELERATOR, CONSTRAINED_RL_POLICY, EXACT_PRICING_MIP }

data class LineScheduleColumn(
    val columnId: String,
    val lineId: String,
    val coveredTaskIds: Set<String>,         // 该列执行的工单任务集合
    val totalScheduleCost: Flt64,            // 该列的直接执行成本（换产+能耗+延误惩罚）
    val totalFeedingMass: Quantity<Flt64>,   // 该列在共享投料口消耗的投料量 (OSPF Quantity，如 Kilogram)
    val totalElapsedShiftTime: Quantity<Flt64>, // 该列占用的产线班次总时长 (OSPF Quantity，如 Hour)
    val source: ColumnSource
)

// 2. 受限主问题 (RMP) 求解线性松弛后下发的对偶价格（影子价格）快照契约
data class RmpDualPriceSnapshot(
    val iteration: Int,
    val taskCoverageDuals: Map<String, Flt64>, // 每个任务覆盖约束的对偶乘子 \pi_i
    val lineConvexityDuals: Map<String, Flt64>,// 每条产线凸组合约束 (\sum \lambda_k <= 1) 的对偶乘子 \mu_l
    val sharedFeedingDual: Flt64               // 共享投料口上限约束的对偶乘子 \sigma (每 kg 投料的影子价格)
)

// 3. 单产线领域聚合硬约束校验器（由领域层提供，独立校验候选列在单条产线上是否物理可行）
interface SingleLineDomainValidator {
    val lineId: String
    val maxShiftAvailableTime: Quantity<Flt64>
    fun verifySequenceAndTimeWindows(column: LineScheduleColumn): Ret<Unit>
}

// 4. 运筹候选列验证守卫 (Candidate Column Verification Guard)
// 任何由启发式或强化学习 (RL) 生成的候选列，必须通过此守卫的【领域硬约束验证 + 约化成本独立重算】才能进入主问题！
class OspfCandidateColumnGuard(
    private val improvementTolerance: Flt64 = Flt64(-1e-6)
) {
    fun verifyAndComputeReducedCost(
        column: LineScheduleColumn,
        duals: RmpDualPriceSnapshot,
        lineValidator: SingleLineDomainValidator
    ): Ret<Flt64> {
        // 守卫 1：校验候选列占用的班次时长是否超出单产线日历可用上限（使用 OSPF Quantity 对齐为 Hour）
        val elapsedHours = when (val r = OspfBoundaryAdapter.convertQuantitySafely(column.totalElapsedShiftTime, Hour)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        val maxHours = when (val r = OspfBoundaryAdapter.convertQuantitySafely(lineValidator.maxShiftAvailableTime, Hour)) {
            is Ok -> r.value.value
            is Failed -> return r
        }
        if (elapsedHours gr maxHours) {
            return Failed(
                Err(ErrorCode.ApplicationError, "候选列 [${column.columnId}] 违反产线班次时长硬约束: $elapsedHours h > $maxHours h")
            )
        }

        // 守卫 2：调用单产线领域聚合校验工序先后序、换产与交期硬约束
        when (val domainCheck = lineValidator.verifySequenceAndTimeWindows(column)) {
            is Ok -> {}
            is Failed -> return Failed(domainCheck.error)
        }

        // 守卫 3：将候选列的投料量对齐为 OSPF 原生 Kilogram，并独立重算约化成本 (Reduced Cost)
        // Reduced Cost \bar{c}_k = c_k - \sum_{i \in Tasks} \pi_i - \sharedFeedingDual * feedingKg_k - \mu_{line}
        val feedingKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(column.totalFeedingMass, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }

        var taskDualSum = Flt64.zero
        for (taskId in column.coveredTaskIds) {
            taskDualSum += (duals.taskCoverageDuals[taskId] ?: Flt64.zero)
        }
        val resourceDualCost = duals.sharedFeedingDual * feedingKg
        val convexityDual = duals.lineConvexityDuals[column.lineId] ?: Flt64.zero

        val reducedCost = column.totalScheduleCost - taskDualSum - resourceDualCost - convexityDual
        return Ok(reducedCost)
    }

    fun isImprovingColumn(reducedCost: Flt64): Boolean = reducedCost ls improvementTolerance
}

// 5. 定价子问题求解器契约：严格分离【RL/启发式快速通道】与【可认证的精确定价兜底通道】
interface LinePricingSubproblemPort {
    val lineId: String
    /** 快速通道：可由启发式或受约束强化学习 (RL) 实现，允许超时或返回空列表 */
    fun proposeFastCandidateColumns(duals: RmpDualPriceSnapshot): List<LineScheduleColumn>
    /** 精确认证通道：基于 OSPF LinearMetaModel / 动态规划求解，用于提供对偶下界与全局收敛证明 */
    fun solveExactPricingColumn(duals: RmpDualPriceSnapshot): Ret<List<LineScheduleColumn>>
}

// 6. DDD 列生成主控编排器：构建 OSPF 受限主问题 (RMP) 并管理“RL加速 -> 运筹守卫 -> 精确认证兜底”闭环
class OspfColumnGenerationCoordinator(
    private val guard: OspfCandidateColumnGuard = OspfCandidateColumnGuard()
) {
    /**
     * 基于当前列池构建 OSPF 受限主问题 (Restricted Master Problem, RMP)
     */
    fun buildRestrictedMasterModel(
        allTaskIds: Set<String>,
        allLineIds: Set<String>,
        columnPool: List<LineScheduleColumn>,
        remainingSharedFeedingLimit: Quantity<Flt64> // 扣除已发生实际投料后的剩余共享投料上限
    ): Ret<Pair<LinearMetaModel, Map<String, URealVar>>> {
        val rmpModel = LinearMetaModel("DOP_RMP_Master")
        val lambdaVars = mutableMapOf<String, URealVar>()

        val limitKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(remainingSharedFeedingLimit, Kilogram)) {
            is Ok -> r.value.value
            is Failed -> return r
        }

        // 1) 为列池中的每一列注册主问题权重变量 \lambda_k \in [0, 1]
        for (col in columnPool) {
            val v = URealVar("lambda_${col.columnId}")
            v.range.leq(Flt64.one)
            rmpModel.add(v)
            lambdaVars[col.columnId] = v
        }

        // 2) 全局任务覆盖约束：\sum_{k: i \in col_k} \lambda_k >= 1
        for (taskId in allTaskIds) {
            val coverPoly = MutableLinearPolynomial()
            for (col in columnPool) {
                if (taskId in col.coveredTaskIds) {
                    coverPoly += Flt64.one * lambdaVars.getValue(col.columnId)
                }
            }
            when (val res = rmpModel.addConstraint(LinearPolynomial(coverPoly) geq Flt64.one, name = "rmp_cover_$taskId")) {
                is Ok -> {}
                is Failed -> return Failed(res.error)
            }
        }

        // 3) 每条产线凸组合约束：\sum_{k \in Line_l} \lambda_k <= 1
        for (lineId in allLineIds) {
            val convPoly = MutableLinearPolynomial()
            for (col in columnPool.filter { it.lineId == lineId }) {
                convPoly += Flt64.one * lambdaVars.getValue(col.columnId)
            }
            when (val res = rmpModel.addConstraint(LinearPolynomial(convPoly) leq Flt64.one, name = "rmp_conv_$lineId")) {
                is Ok -> {}
                is Failed -> return Failed(res.error)
            }
        }

        // 4) 跨产线共享投料口耦合容量约束：\sum_{k} feedingKg_k * \lambda_k <= limitKg
        val sharedFeedingPoly = MutableLinearPolynomial()
        for (col in columnPool) {
            val colKg = when (val r = OspfBoundaryAdapter.convertQuantitySafely(col.totalFeedingMass, Kilogram)) {
                is Ok -> r.value.value
                is Failed -> return r
            }
            sharedFeedingPoly += colKg * lambdaVars.getValue(col.columnId)
        }
        when (val res = rmpModel.addConstraint(LinearPolynomial(sharedFeedingPoly) leq limitKg, name = "rmp_shared_feeding")) {
            is Ok -> {}
            is Failed -> return Failed(res.error)
        }

        // 5) 主问题目标函数：Minimize \sum_k c_k * \lambda_k
        val totalCostPoly = MutableLinearPolynomial()
        for (col in columnPool) {
            totalCostPoly += col.totalScheduleCost * lambdaVars.getValue(col.columnId)
        }
        rmpModel.minimize(LinearPolynomial(totalCostPoly), name = "rmp_total_schedule_cost")

        return Ok(rmpModel to lambdaVars)
    }

    /**
     * 单轮子问题定价调度（严格落实第 13.3 节受约束强化学习边界）：
     * 先调用快速/RL 通道并经 OspfCandidateColumnGuard 验证；
     * 若未找到改进列或需要收敛认证，强制回退调用 solveExactPricingColumn 完成精确定价证明！
     */
    fun priceNewColumnsWithExactFallback(
        duals: RmpDualPriceSnapshot,
        pricingPort: LinePricingSubproblemPort,
        lineValidator: SingleLineDomainValidator,
        forceExactCertification: Boolean = false
    ): Ret<Pair<List<LineScheduleColumn>, Boolean>> { // 返回: (通过验证的改进列列表, 是否已经过精确定价认证)
        if (!forceExactCertification) {
            val fastProposals = runCatching { pricingPort.proposeFastCandidateColumns(duals) }.getOrDefault(emptyList())
            val verifiedFastCols = fastProposals.filter { candidate ->
                when (val rcRes = guard.verifyAndComputeReducedCost(candidate, duals, lineValidator)) {
                    is Ok -> guard.isImprovingColumn(rcRes.value)
                    is Failed -> false // 自动拦截并丢弃违反领域硬约束或约化成本不优的 RL 候选列
                }
            }
            if (verifiedFastCols.isNotEmpty()) {
                return Ok(verifiedFastCols to false)
            }
        }

        // 强制精确兜底：当 RL/启发式无改进列、超时或处于最终收敛认证阶段时，必须运行精确定价！
        val exactProposals = when (val exactRes = pricingPort.solveExactPricingColumn(duals)) {
            is Ok -> exactRes.value
            is Failed -> return Failed(exactRes.error)
        }
        val verifiedExactCols = exactProposals.filter { candidate ->
            when (val rcRes = guard.verifyAndComputeReducedCost(candidate, duals, lineValidator)) {
                is Ok -> guard.isImprovingColumn(rcRes.value)
                is Failed -> false
            }
        }
        return Ok(verifiedExactCols to true)
    }
}
```

---

### 11.4 用 DDD 架构驾驭 Benders 分解：主子问题解耦、可行割/最优割验证与收敛认证边界

与按“资源/方案列”纵向拆解的列生成相对应，运筹学中另一把处理多阶段、跨系统协同优化的利器是 **Benders 分解算法（Benders Decomposition）**。

在数字化运营平台（DOP）中，很多决策天然具有“先定宏观骨架、再验微观执行”或“确定性主计划 + 多场景随机扰动评估”的两阶段结构：
* 例如在主生产计划与详细排程协同中，**第一阶段（主问题）**决定跨工厂的订单分配、主产能开启与关键物料调拨；**第二阶段（子问题）**则在给定分配方案下，分别检验各车间的详细工序排程、共享投料口约束与 WMS/TMS 齐套配载是否可行及具体执行成本是多少。
* 又如在鲁棒优化与随机规划中，**主问题**决定基准排产方案，而**成百上千个子问题**则分别代表不同产能波动、耗时延误或需求变化场景（Scenarios）下的适应性检验。

在 DDD 与 `ospf` 架构下，Benders 分解同样被构建为一套高度模块化、带严格数学认证边界的协作管线：

```text
                    【DDD 架构下的 Benders 分解协作闭环】

       ┌─────────────────────────────────────────────────────────────────────┐
       │ 1. Benders 主问题（Master Problem —— 第一阶段战略/主计划决策）      │
       │ • 决策核心骨架变量（如跨线任务分配、批次大小、主资源启停）          │
       │ • 维护割平面池（Cut Pool），不断吸收子问题反馈的可行割与最优割      │
       │ • 维护并更新全局下界（Lower Bound，以最小化问题为例）               │
       └──────────────────┬───────────────────────────────────▲──────────────┘
                          │ 下发当前主问题固定解（Trial Solution）│
                          ▼                                   │ 回注经认证的可行割 / 最优割
       ┌──────────────────────────────────────────────────────┴──────────────┐
       │ 2. Benders 子问题群（Subproblems —— 第二阶段分车间/分场景检验）     │
       │ • 在主问题固定解下，按各限界上下文或各随机场景独立并行求解          │
       │ • 若子问题不可行 ──> 提取极射线/Farkas 证明，构造【Benders 可行割】 │
       │ • 若子问题有最优解 ──> 提取对偶乘子，构造【Benders 最优割】并更新上界│
       └──────────────────────────────────────────────────────┬──────────────┘
                                                              │
                                                              ▼
       ┌─────────────────────────────────────────────────────────────────────┐
       │ 3. 割平面有效性验证与收敛认证守卫（Cut & Convergence Guard）        │
       │ • 任何由启发式或学习型策略提出的候选割/场景排序，必须经原始/对偶信息│
       │   严格验证其数学有效性（绝不能切掉真正的全局最优解！）              │
       │ • 主问题上下界（UB/LB）与终止间隙（Gap）必须由认证子问题精确计算！  │
       └─────────────────────────────────────────────────────────────────────┘
```

在工程实现中，Benders 分解架构严格遵循三条铁律：
1. **主子问题通过领域快照与结构化割契约通信**：主问题无需感知子问题内部复杂的工序或物流细节；子问题求解完成后，向主问题返回的是绑定了稳定符号身份的**结构化割平面（Feasibility Cut / Optimality Cut）**，表达“为了避免车间排产不可行或成本过高，主问题的分配变量必须满足怎样的线性不等式约束”。
2. **可行割与最优割必须经过对偶数学认证**：即使在求解过程中引入了启发式策略或机器学习/强化学习来选择场景求解顺序、管理割池优先级（Cut Pool Priority）或直接预测提出候选割，每一个真正加入主问题的可行割或最优割，都**必须由运筹优化层根据经过认证的原始/对偶（Primal/Dual）信息验证其有效性**，绝不允许无效割污染主问题可行域。
3. **上下界与终止收敛标准不可篡改**：整个分解算法的全局上下界（Upper Bound / Lower Bound）与终止间隙（Optimality Gap），必须 100% 由经过精确验证的主子问题数学结果计算得出，任何外部估计模型均无权越权宣告算法收敛。

#### 工程实现：基于 OSPF `LinearMetaModel` 与 `LinearInequality` 的 Benders 割平面验证与收敛认证守卫代码

```kotlin
package org.adaptive.dop.algorithm.benders

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.variable.*
import fuookami.ospf.kotlin.core.frontend.expression.monomial.*
import fuookami.ospf.kotlin.core.frontend.expression.polynomial.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*

// 1. Benders 割平面类型与基于 OSPF 线性多项式的结构化割契约
enum class BendersCutType { FEASIBILITY_CUT, OPTIMALITY_CUT }

data class CertifiedBendersCut(
    val cutId: String,
    val scenarioId: String,
    val cutType: BendersCutType,
    // 割平面右端关于主问题决策变量 x 的线性近似下界表达式：\alpha + \pi^T (b - T x)
    val masterRhsPolynomial: LinearPolynomial,
    // 在当前主问题固定解 x_bar 下，由子问题精确对偶证明算出的值（用于验证割是否有效切掉当前不可行/次优解）
    val evaluatedValueAtTrialPoint: Flt64,
    val isDualCertified: Boolean // 标记该割是否经过子问题精确原始/对偶信息验证
)

/**
 * Benders 割平面有效性守卫与主问题注入器：
 * 严禁未经对偶认证的启发式/RL 猜测割直接混入主问题切掉真实全局最优解！
 */
class OspfBendersCutGuard(
    private val cutViolationTolerance: Flt64 = Flt64(1e-6)
) {
    /**
     * 验证并向 OSPF Benders 主问题 (LinearMetaModel) 注入可行割或最优割：
     * - 对于可行割 (FEASIBILITY_CUT)：要求 masterRhsPolynomial <= 0，且在当前试验点处 evaluatedValue > tolerance（确实切掉了当前不可行点）
     * - 对于最优割 (OPTIMALITY_CUT)：要求子问题代价辅助变量 \theta >= masterRhsPolynomial，且 evaluatedValue > currentTheta + tolerance
     */
    fun verifyAndInjectCut(
        masterModel: LinearMetaModel,
        thetaVar: URealVar, // 主问题中代表第二阶段子问题代价下界的辅助变量 \theta_s
        currentTrialAssignment: Map<AbstractVariableItem<*, *>, Flt64>,
        candidateCut: CertifiedBendersCut
    ): Ret<LinearInequality> {
        // 守卫 1：必须经过子问题精确原始/对偶信息认证
        if (!candidateCut.isDualCertified) {
            return Failed(
                Err(ErrorCode.ApplicationError, "Benders 守卫拦截：割平面 [${candidateCut.cutId}] 未经子问题对偶数学认证，严禁注入主问题！")
            )
        }

        // 守卫 2：在当前主问题固定解处独立求值，验证多项式求值与对偶证明值一致
        val polyValAtTrial = candidateCut.masterRhsPolynomial.evaluate(currentTrialAssignment)
            ?: return Failed(Err(ErrorCode.SymbolNotFound, "割平面 [${candidateCut.cutId}] 包含未绑定的主问题变量"))

        if (polyValAtTrial neq candidateCut.evaluatedValueAtTrialPoint) {
            return Failed(
                Err(ErrorCode.ApplicationError, "割平面 [${candidateCut.cutId}] 表达式求值 ($polyValAtTrial) 与对偶证书值 (${candidateCut.evaluatedValueAtTrialPoint}) 不一致！")
            )
        }

        // 守卫 3：构造 OSPF LinearInequality 并注册进主问题 LinearMetaModel
        val inequality: LinearInequality = when (candidateCut.cutType) {
            BendersCutType.FEASIBILITY_CUT -> {
                if (polyValAtTrial leq cutViolationTolerance) {
                    return Failed(Err(ErrorCode.ApplicationError, "无效可行割 [${candidateCut.cutId}]：未切掉当前不可行试验点 ($polyValAtTrial <= 0)"))
                }
                candidateCut.masterRhsPolynomial leq Flt64.zero
            }
            BendersCutType.OPTIMALITY_CUT -> {
                val currentTheta = currentTrialAssignment[thetaVar] ?: Flt64.zero
                if ((polyValAtTrial - currentTheta) leq cutViolationTolerance) {
                    return Failed(Err(ErrorCode.ApplicationError, "非改进最优割 [${candidateCut.cutId}]：未提升当前下界 theta ($currentTheta)"))
                }
                // \theta >= masterRhsPolynomial  <==>  thetaVar - masterRhsPolynomial >= 0
                thetaVar geq candidateCut.masterRhsPolynomial
            }
        }

        return when (val addRes = masterModel.addConstraint(inequality, name = candidateCut.cutId)) {
            is Ok -> Ok(inequality)
            is Failed -> Failed(addRes.error)
        }
    }

    /**
     * 独立收敛认证守卫：
     * 全局上界 (UB) 与下界 (LB) 必须由经过精确认证的主子问题结果计算，严禁由 RL 估计替代！
     */
    fun certifyConvergence(
        certifiedLowerBound: Flt64,
        certifiedUpperBound: Flt64,
        allScenariosExactCertified: Boolean,
        relativeGapTolerance: Flt64 = Flt64(1e-4)
    ): Boolean {
        if (!allScenariosExactCertified) return false
        val denom = maxOf(abs(certifiedUpperBound), Flt64.one)
        val gap = (certifiedUpperBound - certifiedLowerBound) / denom
        return gap leq relativeGapTolerance
    }
}
```

---

## 第 12 章：告别“无解报错” —— 正交求解结果协议（SolveReport）与分层自解释

当运筹优化模型（无论是单次 MILP 求解，还是第 11 章的列生成与 Benders 分解）运行结束后，软件工程链路上最容易被敷衍了事、却又对用户体验影响最大的环节出现了：**如何向业务系统和人类计划员汇报求解结果？**

在传统的工业软件中，这一步往往是一场灾难。本章将深入剖析为什么粗暴的“成功/失败”返回值会让排产系统在复杂现场寸步难行，并展示如何依托 `ospf` 基础框架建立**正交求解结果协议（`SolveReport`）**、**有解/无解数学诊断证据**以及**四层自解释架构**，让每一次求解结论都经得起数学检验、业务复盘与智能体归因。

---

### 12.1 为什么只返回“成功/失败”或一段求解器日志会让计划员寸步难行？

让我们回到真实的排产工作台。假设今天上午 `10:00`，计划员加入了“产线 A、B 共用投料口，总投料量不超过 1000 公斤”的约束，并点击了“仿真重排”按钮。等待了 30 秒后，传统外挂算法接口只会在屏幕上弹出以下两种结果之一：

* **情况一：弹窗提示“排产成功！”并刷新了一张甘特图**。
  计划员看着新甘特图满腹狐疑：这个方案到底是已经证明全局最优了，还是因为到了 30 秒时间上限、求解器随便吐出来的一个差距还很大的初始可行解（最优差距 Optimality Gap 高达 25%）？为什么在这个新方案里，订单 M 的交期被推迟了？到底是因为共享投料口满载卡住了，还是因为设备产能不够？
* **情况二：弹窗提示“求解失败：模型无解（Infeasible）”或者直接打印出几百行英文求解器控制台日志（Solver Log）**。
  计划员彻底懵了：到底是真的在物理上不存在任何可行排产方案（已证明不可行），还是仅仅因为问题太复杂、30 秒超时还没来得及搜到第一个可行解（超时未找到当前可行解）？又或者是求解器许可证过期、内存溢出或网络断了？如果真的是规则冲突导致无解，全厂几千条排产约束里，**究竟是哪几条约束撞在一起导致了冲突**？我需要把投料口上限放宽多少公斤，或者把哪个订单的交期推迟几小时，才能让计划重新跑通？

如果算法接口只返回 `"SUCCESS" / "FAILED"` 状态字符串，或者在业务 Service 里用正则表达式去扒求解器的英文文本日志，不仅机器无法做可靠的自动化分支判断，如果再让大语言模型去根据这种模糊状态“自由发挥写解释”，大模型就会把毫无根据的猜测包装成看似笃定的结论，严重误导生产决策！

---

### 12.2 正交求解结果协议（`SolveReport`）：解耦问题状态、终止原因与解存在性，严禁把“超时未得解”谎报为“不可行”

为了彻底根除上述混乱，基础框架（如 `ospf-kotlin` 及其规划的 `OSPF-SOL-*` 求解协议体系）确立了一条核心设计原则：**运行是否完成、数学问题本身的状态、以及当前手里是否握有可用解，是三个完全正交的维度，必须通过统一的 `SolveReport`（求解报告协议）进行正交表达**！

无论是本地内存求解、分解组合求解还是远端算力求解，都必须统一返回包含以下核心正交维度的 `SolveReport`：

```text
                        【统一正交求解结果协议（SolveReport）】
                                           │
     ┌──────────────────┬──────────────────┼──────────────────┬──────────────────┐
     ▼                  ▼                  ▼                  ▼                  ▼
1. 问题数学状态    2. 求解终止原因    3. 当前解存在性    4. 目标与界指标    5. 血缘与尝试轨迹
(problemStatus)  (terminationReason) (solutionPresence) (Objective & Gap) (Provenance & Trace)
```

1. **`problemStatus`（问题数学状态）**：描述数学模型本身的客观性质——是已证明最优（`Optimal`）、已证明不可行（`Infeasible`）、已证明无界（`Unbounded`），还是尚未完成最终证明（`Indeterminate` / `Feasible`）；
2. **`terminationReason`（求解终止原因）**：描述求解器为什么停下来——是因为完成了数学收敛证明，还是触达了时间限制（`TimeLimit`）、节点数限制（`NodeLimit`）、迭代次数限制、用户主动取消（`Cancelled`），抑或是遭遇了数值病态、许可证失败或基础设施错误；
3. **`solutionPresence`（解存在性）**：明确声明当前报告中是否包含至少一个可执行的**当前可行解（Incumbent Solution）**；
4. **目标值、上下界与最优差距（Objective, Best Bound & Optimality Gap）**：在存在可行解时，同时报告当前目标函数值、已证明的最佳理论界（Best Bound）以及二者之间的最优差距百分比（Gap），严禁只给一个目标值而隐瞒其距离最优界还有多远；
5. **模型/配置指纹、求解器血缘与组合求解尝试轨迹（Attempt Trace）**：完整记录当次求解的数学模型哈希指纹、实际生效的求解器配置参数、求解器名称与版本血缘；若采用了“先启发式、再受控 RL 定价、最后精确求解兜底”的组合求解策略，还需完整保留每一步尝试的 `attempt trace`。

依托这三个正交维度的组合，基础框架强制将所有求解输出严格划分为**五类标准结果类别**，并在架构上立下死规矩：

| 标准结果类别 | `problemStatus` | `solutionPresence` | `terminationReason` 典型值 | 架构与前端展示治理铁律 |
| :--- | :--- | :--- | :--- | :--- |
| **1. 有解且已证明最优** | `Optimal` | **有当前可行解**<br>（Has Incumbent） | 收敛证明完成（达到容差内 Gap ≈ 0） | 完整报告当前可行解、目标值、最佳界、最优差距、关键紧绑定约束及可用的敏感性证据。 |
| **2. 有解但未证明最优** | `Feasible` /<br>`Suboptimal` | **有当前可行解**<br>（Has Incumbent） | 触达时间限制（`TimeLimit`）或节点限制（`NodeLimit`） | 报告当前可行解、当前上下界与最优差距（Gap）；**严禁将此类“限时有解”在前端展示或汇报为“已最优”**！ |
| **3. 已证明不可行** | `Infeasible` | **无可行解**<br>（No Solution） | 完成不可行数学证明 | 报告不可行证明级别，并提供可用的最小不可行子系统（IIS）、冲突集合、Farkas 证书或等价数学证据，通过稳定元素 ID 关联原始约束。 |
| **4. 无界或不可判定** | `Unbounded` /<br>`Indeterminate` | 无解（或含无界射线） | 完成无界证明 / 模型能力不支持 / 数值病态问题 | 严格区分已证明数学无界、底层求解器能力不支持与数值稳定性故障；后端支持时保留无界射线（Unbounded Ray）诊断。 |
| **5. 未返回解但未证明不可行** | `Unknown` /<br>`Indeterminate` | **无当前可行解**<br>（No Incumbent） | **超时未搜到首个可行解** / 用户取消 / 许可证或解析错误 | **最高优先级防错铁律：绝对禁止将“超时未找到当前可行解”、取消或系统错误归并映射为 `Infeasible`（不可行）**，必须保留真实终止原因！ |

---

### 12.3 有解与无解的数学证据：最优差距（Gap）、松弛量/违反量、关键紧绑定约束与最小不可行子系统（IIS/冲突集合）

仅仅分清上面五类状态还不够。为了支撑方案比较（What-if）、瓶颈分析与冲突排雷，`SolveReport` 还必须为“有解”和“无解”两种情况分别提供结构化的**数学诊断证据（Diagnostic Evidence）**：

#### 1. 当求解“有解（类 1 与类 2）”时的诊断证据
当求解器找到了可行方案时，计划员需要知道“方案好在哪里、瓶颈卡在哪里”。此时报告提供：
* **决策变量与具名中间值取值**：所有决策变量及领域中间值（如 `plannedFeeding[lineA]`、各任务预计开始/结束时间）的精确取值与物理单位；
* **目标函数分项拆解（Objective Breakdown）**：将总目标值拆解为交期延误惩罚、换产耗时成本、库存持有成本、加班成本等各业务子项的贡献明细，一眼看清方案是在哪里付出了代价；
* **约束左右端求值（LHS / RHS）、松弛量（Slack）与违反量（Violation）**：对每一条结构化约束，给出其在当前解下的左端实际计算值（LHS）、右端界限值（RHS）、剩余裕度（松弛量 Slack）以及软约束的违反量；
* **紧绑定状态（Binding Status）与对偶/约化成本**：自动识别出松弛量为零（即已经顶到天花板、限制了目标进一步优化）的**关键紧绑定约束（Critical Binding Constraints）**，并在求解器支持时提供对偶价格（影子价格）与约化成本。例如，直接用数学证据指出：“当前共享投料口约束 `LHS = 1000 kg, RHS = 1000 kg, Slack = 0`，处于紧绑定状态，是导致任务 T2/T3 无法进一步提前的瓶颈约束”。

#### 2. 当求解“已证明不可行或无界（类 3 与类 4）”时的诊断证据
当模型被证明确实不存在可行解时，计划员最需要的是“精准排雷”。此时报告提供：
* **稳定模型元素 ID（Stable Model Element IDs）**：在构建模型时，每一条约束和变量都被赋予了跨求解器一致的稳定元素 ID，确保诊断结果能精准反查回原始表达式；
* **最小不可行子系统（IIS, Irreducible Inconsistent Subsystem）或冲突约束集合（Conflict Set）**：从成千上万条排产约束中，精准抽取出最小的一组互相矛盾的约束集合（在这组集合里，只要拿掉任意一条约束，该子系统就能恢复可行），或者提供 Farkas 不可行证明证书、无界射线及受控的约束松弛建议（Relaxation Suggestions）。

在提供上述诊断证据时，基础框架强制执行一条**“证据诚实性守卫”原则**：

> **每一项诊断证据都必须显式声明其来源、底层求解器能力支持情况、证据精度等级（是严格的数学精确证明 Exact，还是启发式冲突排查 Heuristic）以及缺失时的真实原因。当底层求解器不支持计算 IIS 时，必须显式返回“能力不支持（Capability Missing）”，绝对禁止伪造 IIS，也绝对禁止把启发式搜索猜出来的冲突列表冒充为严格的数学不可行证明**！

#### 工程实现：基于 OSPF 的正交求解报告（`OspfSolveReport`）与约束松弛量/紧绑定诊断器代码
下面给出直接基于 `ospf-kotlin`（`Flt64`、`SolverStatus`、`FeasibleSolverOutput`、`LinearMetaModel`、`LinearInequality`、`InequalitySign`）实现的正交求解报告协议与诊断证据提取器代码：

```kotlin
package org.adaptive.dop.foundation.report

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.error.*
import fuookami.ospf.kotlin.utils.functional.*
import fuookami.ospf.kotlin.core.frontend.inequality.*
import fuookami.ospf.kotlin.core.frontend.model.mechanism.*
import fuookami.ospf.kotlin.core.backend.solver.output.*

// 1. 三个严格正交的状态维度枚举（OSPF-SOL-* 规范承载）
enum class OrthogonalProblemStatus {
    PROVEN_OPTIMAL,         // 类 1：已证明全局最优
    FEASIBLE_SUBOPTIMAL,    // 类 2：已找到可行解，但因限时等原因未证明最优
    PROVEN_INFEASIBLE,      // 类 3：经数学证明绝对不可行
    PROVEN_UNBOUNDED,       // 类 4：经数学证明无界
    INDETERMINATE           // 类 4/5：未完成判定（如超时未找到首个可行解、用户取消、数值或设施错误）
}

enum class OrthogonalTerminationReason {
    CONVERGED_TO_OPTIMALITY,
    PROVEN_INFEASIBLE_OR_UNBOUNDED,
    TIME_LIMIT_REACHED,
    NODE_OR_ITERATION_LIMIT,
    USER_CANCELLED,
    NUMERICAL_INSTABILITY,
    LICENSE_OR_INFRA_ERROR
}

enum class OrthogonalSolutionPresence {
    HAS_INCUMBENT_SOLUTION, // 存在至少一个可用当前可行解
    NO_SOLUTION             // 未返回任何可行解
}

// 2. 诊断证据精度等级与不可行冲突证据契约（证据诚实性守卫：不支持 IIS 时必须显式声明 Missing！）
enum class EvidencePrecisionGrade { EXACT_MATHEMATICAL_PROOF, HEURISTIC_CONFLICT_FILTER }

sealed interface InfeasibilityDiagnosticEvidence {
    /** 后端支持并成功提取冲突证据（如 IIS、冲突集合或 Farkas 证书） */
    data class Provided(
        val precisionGrade: EvidencePrecisionGrade,
        val conflictingConstraintElementIds: List<String>, // 稳定模型元素 ID 列表
        val farkasDualCertificate: Map<String, Flt64> = emptyMap(),
        val providerSolverName: String
    ) : InfeasibilityDiagnosticEvidence

    /** 后端不支持 IIS 或因超时未能完成提取：严禁伪造 IIS，必须显式返回缺失原因！ */
    data class CapabilityMissing(
        val missingReason: String,
        val solverName: String,
        val solverSupportsExactIIS: Boolean = false
    ) : InfeasibilityDiagnosticEvidence
}

// 3. 单条约束在当前可行解下的求值、松弛量 (Slack)、违反量 (Violation) 与紧绑定诊断
data class EvaluatedConstraintEvidence(
    val elementId: String,          // 稳定模型元素 ID，如 "c_shared_feeding_limit_lineAB_day1"
    val displayName: String,
    val lhsEvaluated: Flt64,        // 左端多项式在当前解下的实际计算值
    val sign: Sign,                 // OSPF 不等号方向 (LessEqual / Equal / GreaterEqual)
    val rhsConstant: Flt64,         // 右端界限值
    val slack: Flt64,               // 剩余裕度（>= 0）
    val violation: Flt64,           // 违反量（若通过软约束松弛或容差越界则 > 0）
    val isCriticalBinding: Boolean  // Slack 在容差范围内为 0 时标记为关键紧绑定约束！
)

// 4. 组合求解尝试轨迹 (Attempt Trace)：记录“启发式 -> RL 定价 -> 精确 MILP”每一步尝试
data class SolveAttemptStep(
    val stepIndex: Int,
    val strategyName: String,
    val solverBackend: String,
    val elapsedMs: Long,
    val resultingStatus: OrthogonalProblemStatus,
    val foundIncumbent: Boolean,
    val gapAfterStep: Flt64?
)

// 5. 统一正交求解报告 (OspfSolveReport) —— 含构造函数防错铁律守卫
data class OspfSolveReport(
    val modelFingerprintHash: String,
    val solverName: String,
    val solverVersion: String,
    val problemStatus: OrthogonalProblemStatus,
    val terminationReason: OrthogonalTerminationReason,
    val solutionPresence: OrthogonalSolutionPresence,
    val objectiveValue: Flt64?,
    val bestBound: Flt64?,
    val optimalityGap: Flt64?,
    val variableSolutionMap: Map<String, Flt64>,
    val intermediateSymbolValues: Map<String, Flt64>,
    val objectiveBreakdown: Map<String, Flt64>,
    val constraintEvidences: List<EvaluatedConstraintEvidence>,
    val infeasibilityEvidence: InfeasibilityDiagnosticEvidence?,
    val attemptTrace: List<SolveAttemptStep>
) {
    init {
        // 防错铁律 1：超时未找到当前可行解、取消或基础设施错误，绝对禁止归并映射为 PROVEN_INFEASIBLE！
        if (solutionPresence == OrthogonalSolutionPresence.NO_SOLUTION &&
            terminationReason in setOf(
                OrthogonalTerminationReason.TIME_LIMIT_REACHED,
                OrthogonalTerminationReason.USER_CANCELLED,
                OrthogonalTerminationReason.LICENSE_OR_INFRA_ERROR
            )
        ) {
            require(problemStatus == OrthogonalProblemStatus.INDETERMINATE) {
                "协议防错拦截：终止原因为 [$terminationReason] 且无解时，problemStatus 必须为 INDETERMINATE，绝对禁止谎报为 PROVEN_INFEASIBLE！"
            }
        }
        // 防错铁律 2：限时终止且最优差距 (Gap) 大于容差时，绝对禁止展示为 PROVEN_OPTIMAL！
        if (problemStatus == OrthogonalProblemStatus.PROVEN_OPTIMAL) {
            require(solutionPresence == OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION) {
                "协议防错拦截：PROVEN_OPTIMAL 状态必须包含当前可行解！"
            }
            if (optimalityGap != null) {
                require(optimalityGap leq Flt64(1e-4)) {
                    "协议防错拦截：当前最优差距 Gap ($optimalityGap) 未收敛至零，必须标记为 FEASIBLE_SUBOPTIMAL 而非 PROVEN_OPTIMAL！"
                }
            }
        }
    }

    /** 获取所有限制了当前方案进一步优化的关键紧绑定约束 (Slack == 0) */
    val criticalBindingConstraints: List<EvaluatedConstraintEvidence>
        get() = constraintEvidences.filter { it.isCriticalBinding }
}

// 6. 基于 OSPF LinearMetaModel 与求解输出的自动诊断构建器
object OspfSolveReportBuilder {

    /**
     * 将 OSPF 底层 SolverStatus 与 FeasibleSolverOutput 安全转换为正交 OspfSolveReport，
     * 并自动遍历 metaModel.constraints 计算每条约束的 LHS、RHS、Slack 与紧绑定状态！
     */
    fun buildFromFeasibleOutput(
        metaModel: LinearMetaModel,
        solverName: String,
        solverVersion: String,
        output: FeasibleSolverOutput,
        intermediateValues: Map<String, Flt64>,
        attemptTrace: List<SolveAttemptStep> = emptyList()
    ): OspfSolveReport {
        metaModel.tokens.setSolution(output.solution)

        // 1) 正交映射 OSPF SolverStatus -> (ProblemStatus, TerminationReason, SolutionPresence)
        val (probStatus, termReason) = when (output.status) {
            SolverStatus.Optimal -> OrthogonalProblemStatus.PROVEN_OPTIMAL to OrthogonalTerminationReason.CONVERGED_TO_OPTIMALITY
            SolverStatus.Feasible -> OrthogonalProblemStatus.FEASIBLE_SUBOPTIMAL to OrthogonalTerminationReason.TIME_LIMIT_REACHED
            else -> OrthogonalProblemStatus.FEASIBLE_SUBOPTIMAL to OrthogonalTerminationReason.NODE_OR_ITERATION_LIMIT
        }

        // 2) 遍历 OSPF LinearMetaModel 中的结构化约束，自动求值 LHS、RHS、Slack 与紧绑定状态
        val constraintEvidences = metaModel.constraints.map { constraint: LinearInequality ->
            val lhsVal = constraint.lhs.evaluate(results = output.solution, tokenList = metaModel.tokens) ?: Flt64.zero
            val rhsVal = constraint.rhs.evaluate(results = output.solution, tokenList = metaModel.tokens) ?: Flt64.zero
            val diff = rhsVal - lhsVal // 对于 lhs <= rhs，剩余裕度为 rhs - lhs

            val (slack, violation) = when (constraint.sign) {
                Sign.LessEqual -> if (diff geq Flt64.zero) diff to Flt64.zero else Flt64.zero to (-diff)
                Sign.GreaterEqual -> if (diff leq Flt64.zero) (-diff) to Flt64.zero else Flt64.zero to diff
                Sign.Equal -> Flt64.zero to abs(diff)
            }
            // 使用 OSPF Flt64 的容差相等 eq Flt64.zero 判定是否为关键紧绑定约束
            val isBinding = (slack eq Flt64.zero) && (violation eq Flt64.zero)

            EvaluatedConstraintEvidence(
                elementId = constraint.name.ifBlank { "anon_c_${constraint.hashCode()}" },
                displayName = constraint.displayName ?: constraint.name,
                lhsEvaluated = lhsVal,
                sign = constraint.sign,
                rhsConstant = rhsVal,
                slack = slack,
                violation = violation,
                isCriticalBinding = isBinding
            )
        }

        val varMap = metaModel.tokens.tokens.associate { it.variable.name to (it.result ?: Flt64.zero) }

        return OspfSolveReport(
            modelFingerprintHash = "sha256:${metaModel.name}_${metaModel.constraints.size}_${metaModel.tokens.tokens.size}",
            solverName = solverName,
            solverVersion = solverVersion,
            problemStatus = probStatus,
            terminationReason = termReason,
            solutionPresence = OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION,
            objectiveValue = output.obj,
            bestBound = output.possibleBestObj,
            optimalityGap = output.gap,
            variableSolutionMap = varMap,
            intermediateSymbolValues = intermediateValues,
            objectiveBreakdown = mapOf("total_objective" to output.obj),
            constraintEvidences = constraintEvidences,
            infeasibilityEvidence = null,
            attemptTrace = attemptTrace
        )
    }
}
```

---

### 12.4 求解结果自解释的四层架构：从底层数学证据、算法符号映射、业务对象绑定到智能体本地化归纳

有了正交的 `SolveReport` 与诚实的数学诊断证据，我们终于可以实现真正的**“求解结果自解释（Self-Explaining Solve Results）”**。

本书所定义的“自解释”，**绝不是让求解器吐出一堆日志，然后让大语言模型看着日志去编造一段看似通顺的借口**，而是建立一套权责分明的**四层自解释架构**——让每一层都严格基于上一层提供的结构化证据，完成本层职责范围内的解释转换：

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ 第一层：求解器与计算后端（Solver / Backend Layer）                      │
│ • 产出原始求解状态、变量解值、目标值、上下界与底层数学证据（IIS/对偶等）│
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 第二层：OSPF 基础框架层（Base Framework Layer）                         │
│ • 封装统一正交的 SolveReport、稳定模型元素 ID、证据能力等级、           │
│   数学模型指纹（Fingerprint）与组合求解尝试轨迹（Attempt Trace）        │
│ • 边界：只懂通用数学报告与代数诊断，不知道“哪个订单延期”“哪台设备冲突”  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 第三层：算法层与 APS/DOP 应用层（Algorithm & Application Layer）        │
│ • 算法层：保留数学语义，将元素 ID 映射回领域变量、约束模板、目标与中间值│
│ • 应用层：将数学证据绑定到具体业务对象（订单/产线/任务/库位）、         │
│   冻结的版本快照、业务 KPI 对比结果与租户权限边界                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 第四层：工作台展示层与智能体层（Presentation & Agent Layer）            │
│ • 在工作台可视化展示可行性、KPI 拆解、松弛量（Slack）与冲突约束集（IIS）│
│ • 智能体基于已授权的结构化证据做归纳、多方案对比与本地化业务语言说明    │
│ • 铁律：智能体严禁改写求解状态、严禁虚构 IIS、严禁用置信度覆盖硬约束！  │
└─────────────────────────────────────────────────────────────────────────┘
```

让我们通过一个直观的例子，看一看当“共享投料口上限（1000 kg）”与“某紧急订单强制当日完工硬约束”发生冲突导致无解时，这四层架构是如何协同生成一份无懈可击的自解释报告的：

1. **第一层 & 第二层（`ospf` 基础框架）**：底层求解器完成不可行证明并提取冲突极小集；`ospf` 生成 `SolveReport`，记录 `problemStatus = PROVEN_INFEASIBLE`、`solutionPresence = NO_SOLUTION`，输出精确等级（`EXACT_MATHEMATICAL_PROOF`）的冲突约束元素 ID 列表 `["c_shared_feeding_limit_lineAB_day1", "c_order_urgent_deadline", "c_actual_feeding_frozen"]`，并附上当前数学模型指纹 `sha256:8f3a...`。
2. **第三层（算法层与应用层）**：应用层根据稳定元素 ID 反查当轮冻结的领域快照，将这三条数学约束精准绑定到具体业务对象：
   * `c_actual_feeding_frozen` → 产线 A 任务 `T1` 今日已实际发生投料 `450 kg`（来自 MES 事实快照 `#v102`）；
   * `c_order_urgent_deadline` → 产线 A 任务 `T2` 与产线 B 任务 `T3` 若今日必须完工，按 BOM 与替代料规则最低需计划投料 `400 kg + 300 kg = 700 kg`（来自订单与 BOM 快照 `#v88`）；
   * `c_shared_feeding_limit_lineAB_day1` → 产线 A、B 今日共享投料口上限动态约束为 `1000 kg`（来自车间主任 10:00 提交的临时规则 `#r09`），而 `450 + 700 = 1150 kg > 1000 kg`，存在 `150 kg` 的硬性容量缺口。
3. **第四层（工作台与智能体）**：智能体读取第三层授权的结构化冲突证据包，向计划员输出清晰、可审计的业务说明与候选调整建议：
   > “当前排产方案经数学证明不可行（引用报告指纹 `8f3a`）。冲突根源在于以下三条硬约束无法同时满足：今日已实际投料 `450 kg`，待执行的 `T2` 与 `T3` 最低还需投料 `700 kg`（合计 `1150 kg`），超出了动态规则 `#r09` 设定的共享投料口当日上限 `1000 kg` 达 `150 kg`。您可以选择以下两个候选方案进入数字孪生试算：**方案一**：将任务 `T3` 的后半部分（对应 `150 kg` 投料）顺延至明日早班执行；**方案二**：向车间申请将今日投料口检修上限从 `1000 kg` 临时放宽至 `1150 kg`。”

#### 工程实现：从第 2 层 `OspfSolveReport` 到第 3 层业务绑定与第 4 层受控智能体自解释的代码实现

```kotlin
package org.adaptive.dop.application.explanation

import fuookami.ospf.kotlin.utils.math.*
import fuookami.ospf.kotlin.utils.physics.unit.*
import org.adaptive.dop.foundation.report.*

// 1. 第三层（应用层）领域约束注册元数据：将稳定模型元素 ID 绑定到业务对象与冻结快照版本
data class DomainConstraintBindingMeta(
    val elementId: String,
    val businessRuleName: String,
    val affectedObjectIds: List<String>, // 如 ["lineA", "lineB", "task_T2", "task_T3"]
    val unit: PhysicalUnit,              // OSPF 原生单位，如 Kilogram
    val sourceSnapshotVersion: String,   // 如 "snapshot_bom_#v88" 或 "dynamic_rule_#r09"
    val authorizedRoles: Set<String>
)

// 2. 第三层向第四层（工作台/智能体）输出的已授权结构化业务解释证据包
data class AuthorizedBusinessExplanationBundle(
    val modelFingerprintHash: String,
    val inputSnapshotVersion: String,
    val algorithmVersion: String,
    val solverProvenance: String,
    val problemStatus: OrthogonalProblemStatus,
    val terminationReason: OrthogonalTerminationReason,
    val solutionPresence: OrthogonalSolutionPresence,
    val objectiveSummary: String?,
    val bindingBottlenecks: List<String>,
    val verifiedConflictSetDescription: List<String>,
    val evidenceHonestyStatement: String // 显式声明证据等级，防止智能体把启发式或缺失证据吹成数学证明
)

/**
 * 求解结果四层自解释编排服务：
 * 严格将数学报告 (OspfSolveReport) 映射为绑定了领域对象与版本血缘的业务证据包；
 * 强制约束智能体只能归纳已授权证据，绝不允许改写 problemStatus 或虚构 IIS！
 */
class SolveResultSelfExplanationService(
    private val constraintBindings: Map<String, DomainConstraintBindingMeta>,
    private val inputSnapshotVersion: String,
    private val algorithmVersion: String
) {
    fun buildAuthorizedExplanation(
        report: OspfSolveReport,
        callerRoles: Set<String>
    ): AuthorizedBusinessExplanationBundle {
        // 1) 过滤并映射有解时的关键紧绑定瓶颈约束（权限裁剪：未授权字段不向智能体暴露明细）
        val bottlenecks = report.criticalBindingConstraints.mapNotNull { ev ->
            val meta = constraintBindings[ev.elementId] ?: return@mapNotNull null
            if (callerRoles.intersect(meta.authorizedRoles).isEmpty()) return@mapNotNull null
            "瓶颈约束 [${meta.businessRuleName}] (元素ID=${ev.elementId}, 来源=${meta.sourceSnapshotVersion}) 已达极限: " +
            "当前值=${ev.lhsEvaluated} ${meta.unit.symbol}, 上限/界限=${ev.rhsConstant} ${meta.unit.symbol}, 剩余裕度 Slack=${ev.slack} ${meta.unit.symbol}，受影响对象=${meta.affectedObjectIds}"
        }

        // 2) 映射不可行时的冲突证据（严格执行证据诚实性守卫）
        val (conflictDescriptions, honestyStatement) = when (val infEv = report.infeasibilityEvidence) {
            is InfeasibilityDiagnosticEvidence.Provided -> {
                val gradeText = when (infEv.precisionGrade) {
                    EvidencePrecisionGrade.EXACT_MATHEMATICAL_PROOF -> "精确数学不可行证明 (Exact IIS / Farkas)"
                    EvidencePrecisionGrade.HEURISTIC_CONFLICT_FILTER -> "启发式冲突排查列表 (非严格数学最小集，仅供参考)"
                }
                val items = infEv.conflictingConstraintElementIds.map { id ->
                    val meta = constraintBindings[id]
                    if (meta != null && callerRoles.intersect(meta.authorizedRoles).isNotEmpty()) {
                        "冲突约束 [${meta.businessRuleName}] (ID=$id, 绑定对象=${meta.affectedObjectIds}, 快照版本=${meta.sourceSnapshotVersion})"
                    } else {
                        "受限约束 (ID=$id)"
                    }
                }
                items to "当前不可行诊断基于后端 [${infEv.providerSolverName}] 提供的 [$gradeText]。"
            }
            is InfeasibilityDiagnosticEvidence.CapabilityMissing -> {
                emptyList<String>() to "注意：底层求解器 [${infEv.solverName}] 未提供 IIS 冲突集（原因：${infEv.missingReason}）。严禁智能体自行猜测或伪造冲突约束列表！"
            }
            null -> {
                emptyList<String>() to "当前求解未触发不可行冲突提取（问题状态：${report.problemStatus}，终止原因：${report.terminationReason}）。"
            }
        }

        val objSummary = if (report.solutionPresence == OrthogonalSolutionPresence.HAS_INCUMBENT_SOLUTION) {
            "当前目标值=${report.objectiveValue}, 理论最优界=${report.bestBound}, 最优差距 Gap=${report.optimalityGap}"
        } else null

        return AuthorizedBusinessExplanationBundle(
            modelFingerprintHash = report.modelFingerprintHash,
            inputSnapshotVersion = inputSnapshotVersion,
            algorithmVersion = algorithmVersion,
            solverProvenance = "${report.solverName} (${report.solverVersion})",
            problemStatus = report.problemStatus,
            terminationReason = report.terminationReason,
            solutionPresence = report.solutionPresence,
            objectiveSummary = objSummary,
            bindingBottlenecks = bottlenecks,
            verifiedConflictSetDescription = conflictDescriptions,
            evidenceHonestyStatement = honestyStatement
        )
    }
}
```

---

## 本卷小结：工程骨架与运行世界已就位

回顾第三卷（第 9～12 章），我们将第二卷的静态形式化底座彻底激活成了一个有记忆、能推演、可白盒编排、会自我解释的运行时世界：
* 在**第 9 章**中，我们打通了**领域驱动设计（定义）、领域语言（描述）、事件溯源（记忆）、数字孪生（推演）、产生式编程（产生）与形式化方法（验证）**六大软件工程支柱的演进闭环，明确了大语言模型作为贯穿全链路的语义前端与编排器的坐标；
* 在**第 10 章**中，我们构建了贯通“过去（事件溯源与版本快照）—现在（当前状态）—未来（基于计划/预计/实际三层时间模型的可计算数字孪生）”的运行时世界模型，实现了偏差传播的秒级动态推演；
* 在**第 11 章**中，我们通过 **15 点架构依赖推演**证明了白盒可编排算法的必然性，划定了局部推演与全局滚动排产的边界，并用 DDD 架构优雅地驾驭了列生成（Column Generation）与 Benders 分解等超大规模工业求解算法；
* 在**第 12 章**中，我们通过**正交求解结果协议（`SolveReport`）**、有解/无解数学诊断证据（Slack / Binding / IIS）与**四层自解释架构**，彻底终结了“黑盒无解报错”与“大模型凭空猜原因”的乱象。

现在，坚实的形式化语言（第二卷）与鲜活的运行时世界模型（第三卷）都已经准备就绪。接下来的问题是：当机器学习模型（Software 2.0）与大语言模型智能体（Software 3.0）正式驶入这座舞台时，运筹优化与机器学习如何实现双向增强？用户的一句自然语言又是如何一步步通过语义中间表示（Semantic IR）与防幻觉护栏，转化为受控的生产执行能力的？

让我们翻开**第四卷：三原生协同与意图转化篇**，揭开三原生交响曲与语义编译管线的核心篇章。
