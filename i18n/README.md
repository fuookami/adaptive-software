# 双语与翻译工作流

本仓库的中英两版是**两本独立的书**，各自有 `book.json`、`SUMMARY.md`、`README.md`，但**页面文件名与导航顺序一一对应**——
这样 `npm run i18n:check` 才能机器化地保证两版不错位。

```text
docs/zh/preface.md   ⇄   docs/en/preface.md
docs/zh/chapter-12.md ⇄  docs/en/chapter-12.md
```

## 1. 页面状态标记

每个英文页首行的 HTML 注释是状态源，校验器以它统计进度：

```markdown
<!-- i18n-status: untranslated -->
<!-- i18n-source: docs/zh/chapter-12.md -->
# Beyond “Infeasible” — The Orthogonal SolveReport Protocol
```

| 值 | 含义 | 校验行为 |
| :--- | :--- | :--- |
| `untranslated` | 骨架，只有标题、回链与原文结构 | 必须含指向 `../zh/<同名文件>` 的链接 |
| `translating` | 有人正在译（开 PR 前先占位，避免撞车） | 同上 |
| `translated` | 译文完成 | 图示数量不得少于中文页；小节数少于中文页会告警 |

翻完一页：删掉骨架里的 “Original structure” 对照节和提示语，把状态改成 `translated`，跑 `npm run check`。

## 2. 一条硬规则：不要改文件名和导航槽位

新增/删除页面要同时动两侧 `SUMMARY.md`；文件名必须与中文侧同名（`chapter-12.md` 就是 `chapter-12.md`），
否则一致性校验直接失败。想改英文 URL 别名的话，改 `docs/en/.gitbook.yaml` 里的 `redirects`，不要改文件名。

## 3. 翻译约定

- **术语**：先查 [glossary.md](glossary.md)。表里没有的术语，把拟定的译法**加进表里**再落笔，术语表随 PR 一起评审。
- **拼写**：美式（`optimization` / `specialization` / `normalize` / `modeling`）。数字与单位保留原样（`1000 kg`、`90%`、`Gap`）。
- **代码**：标识符、类型名、API 名**永不翻译**（`LinearPolynomial`、`SolveReport`、`Ret<T>`）；注释可以译，但要保持与中文页逐行对应，方便两边一起修。
- **公式与量纲**：`ospf` 的表达式、约束式、单位写法一律原样保留，不做“可读性改写”。
- **图示**：44 张图是 HTML 组件（`dg-*`），翻译时同步重绘**图内标签**，结构不动，规范见
  [../tools/DIAGRAM-KIT.md](../tools/DIAGRAM-KIT.md)。只译正文不译图内标签，会被图示保真闸拦下。
- **引用与书名**：中文书名《从代码到意图：构建会进化的自适应软件》，英文书名 *From Code to Intent — Building Software That Evolves*；
  两版互链时用对应书名。

## 4. 常用命令

```bash
npm run i18n:init        # 从中文侧生成/更新英文骨架页与 SUMMARY.md（不覆盖已有译文）
npm run i18n:check       # 双语一致性 + 进度
npm run i18n             # 只看进度
npm run check            # 书稿结构 + 图示结构 + 双语一致性
npm run build            # 双语构建，产出 _book/{zh,en} + 语言选择页
```

## 5. 从中文手稿重新生成正文

中文侧结构调整后（新增一章、改标题层级等）：

```bash
node tools/split-book.mjs --dry-run
node tools/split-book.mjs --force        # ⚠ 会回退中文侧已重绘的图示与手工修订
node tools/init-en.mjs                   # 让英文骨架跟着对齐
npm run check
```
