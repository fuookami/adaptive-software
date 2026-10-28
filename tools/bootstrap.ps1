# 《从代码到意图：构建会进化的自适应软件》—— 开源书籍仓库初始化脚本
# 用法（在本仓库根目录下）：
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1            # 只切分 + 校验
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 -MoveSources  # 同时把手稿归档到 manuscript/
#   powershell -ExecutionPolicy Bypass -File tools/bootstrap.ps1 -MoveSources -Git # 再 git init + 首次提交

param(
  [switch]$MoveSources,
  [switch]$Force,
  [switch]$Git
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host "工作目录：$root"

# 1) 切分手稿 → docs/
$splitArgs = @('tools/split-book.mjs')
if ($MoveSources) { $splitArgs += '--move-sources' }
if ($Force) { $splitArgs += '--force' }
node @splitArgs
if ($LASTEXITCODE -ne 0) { throw "split-book.mjs 执行失败（exit $LASTEXITCODE）" }

# 2) 结构校验
node tools/split-book.mjs --check
if ($LASTEXITCODE -ne 0) { throw "结构校验失败（exit $LASTEXITCODE）" }

# 3) 清理临时文件
if (Test-Path '.qoder-write-test.md') {
  Remove-Item '.qoder-write-test.md'
  Write-Host '已删除临时文件 .qoder-write-test.md'
}

# 4) Git 初始化
if ($Git) {
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw '未找到 git，请先安装 Git for Windows' }
  if (-not (Test-Path '.git')) { git init -b main }
  git add .
  git status --short
  git -c user.name="${env:USERNAME}" commit -m "chore: 初始化开源书籍仓库（GitBook + Honkit 本地预览 + GitHub Pages）"
  Write-Host '已创建首次提交。推送到 GitHub：'
  Write-Host '  git remote add origin https://github.com/fuookami/adaptive-software.git'
  Write-Host '  git push -u origin main'
}

Write-Host ''
Write-Host '后续本地预览：'
Write-Host '  npm install'
Write-Host '  npm run serve   # http://localhost:4000'
