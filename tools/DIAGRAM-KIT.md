# 图示重绘规范（HTML Diagram Kit）

把 `docs/zh/*.md`（英文侧 `docs/en/*.md` 同结构） 里用 ```` ```text ```` 字符画描绘的**流程图 / 架构图 / 分层图**重绘为语义化 HTML + 共用样式表。
样式在 `styles/website.css`（由 `book.json` 的 `styles.website` 注入站点），不要新建 CSS、不要写 `style="…"` 内联样式。

**金标准样张**：`docs/zh/chapter-02.md` 里已经转好的 3 个图（四阶段横排图、两条长流程链）。开工前先读它。

## 一、四条铁律

1. **保真**：原字符画里的**每一个文字标签必须逐字保留**（术语、类型名、数字、单位、问号、括号都不能改、不能省、不能同义替换）。
   只允许三类改动：① 增加连接符号 `→ ↓ ↺` 等纯视觉字符；② 去掉制表框线字符；③ 给同一节点内部加 `<span>` 分层。
   改完必须跑 `node tools/check-diagrams.mjs`（它按基线 `ascii-baseline` 做词元级丢字校验），自己负责的文件必须 0 丢字。
2. **不发明内容**：不新增解释、结论、图例说明、"因此……"之类的句子。`aria-label` 只允许用图中已有标签拼成一句顺序描述。
   想补充说明？不要写进图示里，本次任务不产出正文改动。
3. **HTML 块语法**：整块内部**不能有空行**（有空行 CommonMark 会把 HTML 块切断，后半截会变成正文）；块内**不写 Markdown 语法**
   （`**粗体**` 不会生效，要粗体用 `<span class="dg-t">`）；起始 `<div class="dg">` **顶格写**，不要缩进 4 个空格（会被当代码块）。
4. **转义**：正文里的尖括号必须转义 —— `Ret<Quantity<Flt64>>` 要写成 `Ret&lt;Quantity&lt;Flt64&gt;&gt;`；`&` 写成 `&amp;`。
   不转义会被浏览器当成标签吞掉，内容直接消失。

## 二、类名清单

| 用途 | 写法 |
| :--- | :--- |
| 图容器（每张图一个） | `<div class="dg" role="img" aria-label="……">` |
| 图内标题（原图有标题时用） | `<div class="dg-title">…</div>` |
| 横排 / 纵排容器 | `<div class="dg-row">…</div>` / `<div class="dg-col">…</div>` |
| 节点 | `<div class="dg-node"><span class="dg-t">主标题</span><span class="dg-s">副标题/说明</span></div>` |
| 节点变体 | `dg-node--chip`（长链紧凑节）`dg-node--layer`（整层宽块）`dg-node--leaf`（分叉末梢）`dg-node--key`（橙色强调）`dg-node--fact`（绿色事实/数据）`dg-node--soft`（虚线，候选/临时/未固化） |
| 横向箭头 | `<div class="dg-edge" aria-hidden="true">→</div>` |
| 纵向箭头 | `<div class="dg-down" aria-hidden="true">↓</div>` |
| 箭头上的说明文字（原图在连线旁标注时） | `<div class="dg-down" aria-hidden="true">↓<span class="dg-lbl">原图标签</span></div>`（`.dg-lbl` 只能挂在 `dg-edge` / `dg-down` 内） |
| 一分多叉 | `<div class="dg-arms"><div class="dg-arm">↓</div>…</div>`（几个分支就几个 `dg-arm`） |
| 分组（同一层/同一侧） | `<div class="dg-group"><div class="dg-gt">分组标题</div>…</div>` |
| 回流 / 反馈 | `<div class="dg-loop">↺ 原图中的回流文字</div>` |
| 图例（仅原图有说明性符号时） | `<div class="dg-legend"><span><i class="dg-key dg-key--key"></i>说明</span></div>` |

强调色是**编辑性判断**，只在原文本身就在强调（加粗、"铁律""死路"等）的节点上使用；不确定就用默认蓝。

## 三、四种模式配方

- **A 顺序流程链**（`A ──> B ──> C …`）→ `dg-row` + `dg-node--chip` + `dg-edge`；超过 6 节就全用 chip，让浏览器自动换行。
- **B 纵向闭环**（自上而下 + 旁路回流）→ `dg-col` + `dg-node--layer` + `dg-down`，最后一条 `dg-loop` 写清"谁回到谁"。
- **C 一分多叉 / 多叉合一**（一个节点扇出到几个运行侧，再汇合）→ `dg-col` 里放主干，扇出处用 `dg-arms`（`dg-arm` 数量 = 分支数）+ `dg-group` 包住 `dg-node--leaf`；汇合时反向再来一组 `dg-arms`。
- **D 并列对照**（左右两栏"系统侧 vs 运筹侧"这类对比）→ 一个 `dg-row` 放 2–4 个 `dg-node`，各支内部用 `dg-s` 承载明细；
  若原图是"同一概念的多种解释"，用 `dg-group` + `dg-gt` 点出这组的共同标题。

## 四、不要动的东西

- **公式与推导块**（如 `后序任务预计开始时间 = max(…)` 一类、无框线无箭头的 ```text 块）保持原样，它们是排版而非图示。
- **代码围栏**（`kotlin` / `python` / `json`）一律不碰。
- 正文段落、表格、小标题一律不碰。
- 若发现某个 `text` 块其实是**贴错语言标记的代码**（例如以 `package …` 开头），不要改写，直接在你的汇报里指出，由主控处理。

## 五、各平台支持情况与兜底

| 发布渠道 | HTML 图示表现 | 说明 |
| :--- | :--- | :--- |
| Honkit 构建的静态站 / GitHub Pages | ✅ 完整彩色渲染 | `book.json` 的 `styles.website` 已注入 `styles/website.css`，本地 `npm run build` 已验证 |
| VS Code Markdown 预览 | ✅ 完整彩色渲染 | 需要 `.vscode/settings.json` 里的 `"markdown.styles": ["styles/website.css"]`；预览不加载外链样式表，没有这一条就会退化成堆叠文字。改过 CSS 要重开预览页 |
| 无任何样式的裸环境 | ✅ 完整彩色渲染 | 已用「只挂 `styles/website.css`、不挂 GitBook 主题」的页面实测：框线、分组虚线、分叉臂、回流线、图例都正常，说明样式表自足，不依赖主题 |
| GitHub 直接阅读 `.md` | ⚠️ 有结构无样式 | GitHub 会剥掉 `class` 与外链样式表，图示退化为按行排列的标签 + 真实箭头字符，内容仍可读（这正是要求箭头用真实字符的原因） |
| GitBook.com（Git 同步） | ❓ 待验证 | 现代 GitBook 把 Markdown 解析成自己的块模型，对原始 HTML 块的支持不保证。**接入空间后请先打开任意图示页确认**；若被当作代码块或丢弃，走下面的兜底 |

**本仓库的定位**：GitHub 作为源码仓库，GitHub Pages / GitBook 作为阅读入口。图示「散架」时按这个顺序排查：
① 是否在看 `.md` 源码页（换 Pages/`npm run serve`）；② VS Code 预览是否有 `markdown.styles`（看本文件与 `.vscode/settings.json`）；
③ CSS 是否被构建注入（`_book/docs/*.html` 里应有 `<link rel="stylesheet" href="../styles/website.css">`）；④ 图块是否被 Markdown 切断（`npm run structure`）。

兜底顺序（从省事到彻底）：

1. 以 Honkit 构建的 GitHub Pages 站点作为主阅读入口，GitBook 空间只作镜像；
2. 给 `tools/` 增加一步“图示导出为 SVG”（用无头浏览器把每个 `.dg` 截图 / 导出为 `docs/assets/*.svg`），把 HTML 换成 `![](assets/…)`；
3. 个别关键图（如第 18 章总架构图）可手工补一份 Mermaid 版作为正文备份。

第 2、3 项尚未实现——是否要做，取决于你在 GitBook 空间里的实测结果。

> **基线标签要一起推**：`npm run diagrams` 依赖 `ascii-baseline` 标签（字符画时代的快照）。
> 首次推送时执行 `git push origin main --follow-tags`（或 `git push origin ascii-baseline`）；
> 别人克隆后若没有该标签，脚本会自动退回 `HEAD` 并在无标签时给出提示。

## 六、自检与交付

```bash
node tools/check-diagrams.mjs            # 全库丢字校验，必须 ✓（0 处丢字）
node tools/check-diagrams.mjs --list     # 看你负责的文件是否 N/N
```

不要执行 `npm install` / `npm run build` / `git`（避免并发冲突），只用文本编辑改文件。
完成后汇报：每个文件转了几张图、每张图对应原字符画的哪一节、跳过了哪些块及原因。

改完之后想肉眼确认排版：

```bash
npm run build
powershell -ExecutionPolicy Bypass -File tools/preview-shot.ps1 -Pages docs/chapter-09.html,docs/chapter-18.html
```

截图输出到 `.shots/`（已 gitignore），用无头 Edge/Chrome 渲染，能看到配色、分叉与回流线的真实效果。
