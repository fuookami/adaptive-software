# 《从代码到意图：构建会进化的自适应软件》—— 双语书籍仓库初始化脚本
# 用法（在本仓库根目录下）：
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1                 # 切分 + 英文骨架 + 三道校验
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 -MoveSources    # 同时把手稿归档到 manuscript/
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 -Git            # 再 git init + 首次提交
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 -MoveSources -Force -Git

param(
  [switch]$MoveSources,
  [switch]$Force,
  [switch]$Git
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "工作目录：$root"

function Invoke-Step($name, [string[]]$args1) {
  Write-Host "`n▶ $name" -ForegroundColor Cyan
  node @args1
  if ($LASTEXITCODE -ne 0) { throw "$name 失败（exit $LASTEXITCODE）" }
}

# 1) 手稿 → docs/zh/（章节一文件，标题层级规范化）
$splitArgs = @('tools/split-book.mjs')
if ($MoveSources) { $splitArgs += '--move-sources' }
if ($Force) { $splitArgs += '--force' }
Invoke-Step '切分中文正文' $splitArgs

# 2) 英文骨架（幂等：已有译文不会被覆盖；--Force 由 init-en 自己判断）
Invoke-Step '生成英文骨架' @('tools/init-en.mjs')

# 3) 三道闸：书稿结构 / 图示 HTML 结构 / 双语一致性
Invoke-Step '书稿结构校验' @('tools/split-book.mjs', '--check')
Invoke-Step '图示结构校验' @('tools/check-diagrams.mjs', '--structure')
Invoke-Step '双语一致性校验' @('tools/check-i18n.mjs')

# 4) Git 初始化
if ($Git) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw '未找到 git，请先安装 Git for Windows' }
  if (-not (Test-Path '.git')) { git init -b main }
  git add .
  git status --short
  git commit -m "chore: 初始化双语开源书籍仓库（GitBook + Honkit + GitHub Pages）"
  Write-Host '已创建首次提交。推送到 GitHub（带上基线标签，图示保真校验要用它）：'
  Write-Host '  git remote add origin https://github.com/fuookami/adaptive-software.git'
  Write-Host '  git push -u origin main --follow-tags'
}

Write-Host ''
Write-Host '后续：'
Write-Host '  npm install        # 安装 honkit'
Write-Host '  npm run serve      # 中文站 http://localhost:4000'
Write-Host '  npm run serve:en   # 英文站'
Write-Host '  npm run build      # 双语构建 → _book/{zh,en} + 语言选择页'
Write-Host '  npm run i18n       # 翻译进度'
