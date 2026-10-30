# 英译作业规范（Translator brief）

本文件是**可独立交付的翻译说明**：译者（或并行作业的子代理）只读本文件 + 术语表 + 两份样张 + 自己负责的中文页，
即可产出符合本仓库校验的英文页。

## 1. 输入与输出

| 项 | 约定 |
| :--- | :--- |
| 输入 | `docs/zh/<file>.md`（**逐字读完**，不要只看标题） |
| 输出 | `docs/en/<同名文件>`，**整文件覆盖** |
| 页首两行 | `<!-- i18n-status: translated -->` 与 `<!-- i18n-source: docs/zh/<file> -->` |
| 只改自己的文件 | 不要动 `SUMMARY.md`、其他页面、脚本、配置，也不要 `git commit` |

## 2. 结构契约（校验器会查）

1. **恰好一个 `# ` 一级标题**，且必须是该页的英文标题。
2. **`## ` 小节数量不得少于中文页**（`npm run i18n:check` 会对 `translated` 页比对）。顺序与中文一致。
3. **不得删节、不得合并小节**。允许的做法：把中文的长句拆成英文短句、把过于啰嗦的并列压缩为从句，
   但**信息量不得减少**；不要添加原文没有的段落、译注、导语、结语。
4. 保留原有的**粗体、引用块 `>`、有序/无序列表、编号、分隔线**结构。
5. 不要保留脚手架内容：`## Original structure` 那节、`> **This page is not translated yet.**` 提示、
   `本页尚未翻译…` 之类的中文提示，一律删除。

## 3. 术语

- 先查 [glossary.md](glossary.md)，**表里有的必须照用**（大小写也照用：`Semantic JIT`、`SPLE`、`Adaptive DOP`）。
- 表里没有的术语，选定一个译法并**在完成报告里列出**（形如 `中文 → English（理由一行）`），由维护者入表。
- 拼写用美式：`optimization` / `specialization` / `normalize` / `modeling` / `behavior`。

## 4. 代码与数据

- ` ``` ` 围栏内的**一切原样保留**：标识符（`LinearPolynomial`、`SolveReport`、`Ret<T>`）、数值、单位、注释位置。
  中文注释可以译，但要保持与代码逐行对应。
- 行内 `` `code` `` 同理：不改名、不加空格。
- 数字、百分比、单位、公式符号（`Gap 25%`、`1000 kg`、`x_ij`）原样。

## 5. 图示（SVG 资产 + HTML 源码）

正文里的图示已经是**图片引用**：`![alt 文字](assets/diagrams/<页面>-<序号>.svg)`。
`alt` 取自原图的 `aria-label`，保持原样即可，不要改路径。

图示的源码在 `figures/<lang>/<页面>-<序号>.html`（HTML 组件）。译页时：

1. 复制 `figures/zh/<页面>-<序号>.html` 为 `figures/en/` 下的同名文件（若尚未存在），
   只替换其中的可见文字与 `aria-label`，**结构与类名逐字节保留**
   （`dg-row` / `dg-col` / `dg-box` / `dg-node` / `dg-node--*` / `dg-edge` / `dg-down` / `dg-arms` / `dg-arm` /
   `dg-group` / `dg-gt` / `dg-loop` / `dg-legend` / `dg-lbl` / `dg-t` / `dg-s`、箭头 `→ ↓ ↑ ↺`、缩进、块内无空行）；
2. 跑 `npm run figures` 重新导出该语言的 SVG；
3. 再跑 `npm run check`。校验会确认：每个 `.md` 的图片引用与 `figures/` 里的源码一一对应、
   SVG 文件存在、正文没有残留内联 HTML 块。

**标签要短**：中文标签译成英文后常变长，允许略作缩写（如 "formal domain model (OSPF)" → "Domain model (OSPF)"），
但不得改变语义，也不得删节点。导出器的版心宽度按线上正文实测值固定，标签过长会折行——折行可接受，溢出不行。

## 6. 风格

- 学术但可读；面向工程师，避免营销腔。
- 中文的「我们/本书/您」：用 "we / this book / you"，不要滥用 "one"。
- 中文的破折号 `——` → 英文 `—`。**标题与 `SUMMARY.md` 里的连接号用两侧带空格的 ` — `**（与样张一致，保证 H1 与导航逐字相同），
  正文句子内的插入语用不带空格的 `—`。
- 中文的「」引号 → 英文 `"`；书名号《》→ 斜体 `*…*`。
- 段落长度：一句话讲一件事；原文一段若含 4 个以上分号并列，可拆成两段（拆段不算删节）。
- **一次性写完整文件**：不要先写半篇再续写。半截文件会让整页校验失败，也会浪费一轮。宁可分节构思、一次落盘。

## 7. 样张（先读这两个再动笔）

- 无图页：[../docs/en/preface.md](../docs/en/preface.md)
- 含图页：[../docs/en/epilogue.md](../docs/en/epilogue.md)

## 8. 自检

```bash
node tools/check-i18n.mjs      # 该页应为 translated，且页面/导航/图示数量对齐
npm run check                  # 四道闸全绿
```

若 `check-i18n` 报“图示只有 N 个（中文 M 个）”，说明漏了图；报“小节数少于中文页”，说明漏了小节。
