# 贡献指南

欢迎参与《从代码到意图：构建会进化的自适应软件》的开源协作：错字与病句、术语统一、图示补充、示例完善、翻译衍生都欢迎。

## 1. 内容放在哪里

这本书有**两个语言书根**：`docs/zh/`（中文版）与 `docs/en/`（英文版），各自是一套完整的
`book.json` + `SUMMARY.md` + `README.md` + 页面文件；两边**文件名与导航顺序必须一一对应**。

| 想做的事 | 改动的文件 |
| :--- | :--- |
| 修订中文正文 | `docs/zh/` 下对应页面（`preface.md`、`outline.md`、`part-N.md`、`chapter-NN.md`、`part-N-summary.md`、`epilogue.md`） |
| 贡献英文译文 | `docs/en/` 下**同名**页面，见 [i18n/README.md](i18n/README.md) 与术语表 [i18n/glossary.md](i18n/glossary.md) |
| 增删章节或调整卷次归属 | 正文文件 + 两侧 `SUMMARY.md` + 必要时 `tools/split-book.mjs` 的卷章映射与 `tools/init-en.mjs` 的 `EN_TITLES` |
| 调整书籍元数据、导出选项 | `docs/zh/book.json`、`docs/en/book.json`、对应 `.gitbook.yaml` |
| 调整 GitBook 站点/空间映射 | 根目录 [gitbook-docs.yaml](gitbook-docs.yaml) |
| 修订站点首页 | 仓库首页 [README.md](README.md)；各语言落地页 `docs/<lang>/README.md` |
| 改图示样式 | [styles/website.css](styles/website.css)（唯一真源，构建时同步进两个书根） |
| 改工具链 | `tools/`、`.github/workflows/`、`package.json` |

> `manuscript/` 是最初按卷合并的中文手稿，只在“重新生成整本中文书结构”时使用。**日常修订请直接改 `docs/zh/`**，
> 否则重跑 `tools/split-book.mjs` 会覆盖你的改动（脚本默认拒绝覆盖已存在的页面，需要 `--force` 才会重写）。
> 特别注意：手稿里的图仍是字符画，`--force` 会**连已重绘的 HTML 图示一起回退**，请勿轻易使用。

## 2. 排版与写作约定

- **一页一个一级标题**：每章文件的第一行必须是 `# 第 N 章：…`；小节用 `##`，小节内的分点用 `###`。`npm run check` 会校验这一点。
- **章内小节编号保持 `N.M`**（例如第 12 章的 `## 12.3 有解与无解的数学证据`），不要跨章连续编号。
- **中文排版**：使用全角标点；中英文之间留一个空格；专有名词大小写固定（LLM、OSPF、DDD、ERP/APS/MES/WMS/TMS、Semantic IR、SolveReport、CVaR、DRO）。
- **术语一致**：运筹原生（OR-Native）、机器学习原生（ML-Native）、智能体原生（Agent-Native）、形式化领域模型、语义即时编译（Semantic JIT）、软件产品线工程（SPLE）、自适应数字化运营平台（Adaptive DOP）。
- **图示**：全书的流程图、架构图、分层图一律用 **HTML 图示组件**绘制，不再使用字符画。类名清单、四种模式配方与保真铁律见
  [`tools/DIAGRAM-KIT.md`](tools/DIAGRAM-KIT.md)，样张见 [docs/zh/chapter-02.md](docs/zh/chapter-02.md)。样式集中在
  [`styles/website.css`](styles/website.css)（唯一真源，构建前由 `npm run sync` 复制进两个书根，`book.json` 再注入网站 / PDF / EPUB），
  **不要**在正文里写内联 `style="…"`，也不要新建 CSS。
  新增图片请放到 `docs/<lang>/assets/` 并用相对路径引用，避免绝对 URL。译页里的图示要**同步重绘图内标签**，
  结构与类名不变。
- **公式与推导**：这类 ```` ```text ```` 块（无框线、无箭头，如 `后序任务预计开始时间 = max(…)`）保持字符形式，它们不是图示。
- **降级要求**：GitHub 直接阅读 `.md` 时会丢弃样式表，因此图示里的箭头必须是真实字符（`→ ↓ ↺`）而不是 CSS 生成的伪元素，
  保证无样式时仍能按行顺序读出内容。
- **代码**：标明语言围栏；`ospf` 相关类型名（`RealNumber`、`Quantity`、`PhysicalUnit`、`LinearPolynomial`、`LinearInequality`、`LinearMetaModel`、`Result`/`Ret`）与正文保持一致；示例需可读、可裁剪，不引入真实企业数据。
- 每个页面结尾不要留 `---` 分隔线（GitBook 会自动分页，脚本也会清理）。

## 3. 本地验证

```bash
npm install
npm run serve        # 中文站 http://localhost:4000，逐页检查导航与渲染
npm run serve:en     # 英文站
npm run check        # 书稿结构 + 图示 HTML 结构 + 双语一致性（三道闸，CI 同样顺序）
npm run i18n         # 只看翻译进度
npm run build        # 双语构建 → _book/{zh,en} + 根语言选择页
npm run diagrams     # 图示文字保真：与 ascii-baseline 标签逐词元比对，重绘不许丢字
```

改动过正文或图示，提交前请至少跑一次 `npm run check`；若是从字符画转 HTML 或改写了图内文字，
再加跑 `npm run diagrams`（需要本地有 `ascii-baseline` 标签）与 `npm run diagrams -- --strict`（拦截新增表述）。
想肉眼看图示效果：`npm run build` 后
`powershell -ExecutionPolicy Bypass -File tools/preview-shot.ps1 -Pages "zh/chapter-18.html,en/chapter-12.html"`，
截图在 `.shots/`（页面路径相对 `_book/`）。

### 在编辑器里阅读图示

图示的样式在 `styles/website.css`，`.md` 源码里只有 `class` 名，因此**必须由渲染环境加载这张样式表**：

- VS Code 预览：仓库已带 `.vscode/settings.json` → `"markdown.styles": ["styles/website.css"]`。若你看到一堆按行堆叠的文字而没有框线，
  先确认这个设置存在、然后**关掉再重开预览页**（CSS 变更后预览不会自动重取样式表）。
- GitHub 的 `.md` 页面：样式表与 `class` 都会被剥掉，图示退化为纯文本顺序。这是预期行为，
  请通过 GitHub Pages 或 `npm run serve` 阅读带图版本（箭头使用真实字符 `→ ↓ ↺`，保证退化时内容仍可读）。
- 用 `book.json` 之外的方式自建站点时，记得手动引入 `styles/website.css`，否则图示同样不显示。

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
