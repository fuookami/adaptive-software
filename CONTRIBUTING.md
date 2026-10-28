# 贡献指南

欢迎参与《从代码到意图：构建会进化的自适应软件》的开源协作：错字与病句、术语统一、图示补充、示例完善、翻译衍生都欢迎。

## 1. 内容放在哪里

| 想做的事 | 改动的文件 |
| :--- | :--- |
| 修订正文 | `docs/` 下对应页面（前言 `preface.md`、大纲 `outline.md`、卷首 `part-N.md`、章节 `chapter-NN.md`、卷末小结 `part-N-summary.md`、结语 `epilogue.md`） |
| 增删章节或调整卷次归属 | 正文文件 + [`SUMMARY.md`](SUMMARY.md) + 必要时 `tools/split-book.mjs` 中的卷章映射 |
| 调整书籍元数据、封面、导出选项 | [`book.json`](book.json)、[`.gitbook.yaml`](.gitbook.yaml) |
| 修订站点首页 | [`README.md`](README.md) |
| 改工具链 | `tools/`、`.github/workflows/`、`package.json` |

> `manuscript/` 是最初按卷合并的手稿，只在“重新生成整本书结构”时使用。**日常修订请直接改 `docs/`**，
> 否则重跑 `tools/split-book.mjs` 会覆盖你的改动（脚本默认会拒绝覆盖已存在的页面，需要 `--force` 才会重写）。

## 2. 排版与写作约定

- **一页一个一级标题**：每章文件的第一行必须是 `# 第 N 章：…`；小节用 `##`，小节内的分点用 `###`。`npm run check` 会校验这一点。
- **章内小节编号保持 `N.M`**（例如第 12 章的 `## 12.3 有解与无解的数学证据`），不要跨章连续编号。
- **中文排版**：使用全角标点；中英文之间留一个空格；专有名词大小写固定（LLM、OSPF、DDD、ERP/APS/MES/WMS/TMS、Semantic IR、SolveReport、CVaR、DRO）。
- **术语一致**：运筹原生（OR-Native）、机器学习原生（ML-Native）、智能体原生（Agent-Native）、形式化领域模型、语义即时编译（Semantic JIT）、软件产品线工程（SPLE）、自适应数字化运营平台（Adaptive DOP）。
- **图示**：现有架构图使用 ```` ```text ```` 围栏里的字符画。新增图形优先沿用字符画或 Mermaid；图片请放到 `docs/assets/` 并用相对路径引用，避免绝对 URL。
- **代码**：标明语言围栏；`ospf` 相关类型名（`RealNumber`、`Quantity`、`PhysicalUnit`、`LinearPolynomial`、`LinearInequality`、`LinearMetaModel`、`Result`/`Ret`）与正文保持一致；示例需可读、可裁剪，不引入真实企业数据。
- 每个页面结尾不要留 `---` 分隔线（GitBook 会自动分页，脚本也会清理）。

## 3. 本地验证

```bash
npm install
npm run serve    # http://localhost:4000 逐页检查导航与渲染
npm run check    # SUMMARY.md 引用的文件都存在、每页恰好 1 个一级标题、18 章齐全
```

提交前请至少跑一次 `npm run check`。

## 4. 提交流程

1. Fork 本仓库，从 `main` 切出分支：`fix/chapter-12-typo`、`feat/part-3-diagrams`……
2. 一个 PR 只做一件事；正文修订请在 PR 描述里说明“为什么这样改”，而不只是“改成什么”。
3. 涉及技术判断（例如架构边界、公式口径）的改动，请先开 Issue 讨论，避免返工。
4. 维护者会在合并前跑 `npm run build` 验证站点可构建。

### 提交信息建议

```text
docs(chapter-07): 补充双入口等价性测试的失败用例说明
fix(summary): 修正第 14 章标题中的破折号
chore(tools): split-book 支持 --force 覆盖保护
```

## 5. 授权声明

提交贡献即表示你同意以 [CC BY-SA 4.0](LICENSE.md) 授权你的贡献，并声明你有权作出该授权。详见 LICENSE.md。

## 6. 行为准则

请保持就事论事：批评观点，不针对个人；欢迎来自不同背景的读者提问。我们希望这里成为一本能被长期使用和改进的书，而不是一个辩论场。
