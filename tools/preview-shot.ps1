# 用无头浏览器截图，便于肉眼检查 HTML 图示的排版。
# 支持本地已构建页面，也支持直接截线上站点（发版后验收用）。
#
# 用法（仓库根目录）：
#   powershell -ExecutionPolicy Bypass -File tools/preview-shot.ps1
#   powershell -ExecutionPolicy Bypass -File tools/preview-shot.ps1 -Pages zh/chapter-09.html,en/chapter-12.html -Height 4200
#   （页面路径相对 _book/：中文版在 zh/、英文版在 en/，语言选择页是 index.html）
#   powershell -ExecutionPolicy Bypass -File tools/preview-shot.ps1 -Pages https://fuookami.github.io/adaptive-software/zh/chapter-02.html
#   （以 http(s):// 开头的条目按线上地址处理，不检查 _book/）
# 图片输出到 .shots/（已在 .gitignore 中）。

param(
  [string[]]$Pages = @('index.html', 'zh/chapter-02.html'),
  [int]$Width = 1160,
  [int]$Height = 2200
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

$candidates = @(
  'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Microsoft\Edge\Application\msedge.exe',
  'C:\Program Files\Google\Chrome\Application\chrome.exe',
  'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe'
)
$browser = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw '未找到 Edge 或 Chrome，无法截图。请手动在浏览器打开 _book/index.html 检查。' }

New-Item -ItemType Directory -Force -Path '.shots' | Out-Null
$profile = Join-Path $env:TEMP 'dsh-browser-profile'

# 用 -File 调用时参数都是字符串，逗号列表需要自己拆开
$targets = $Pages | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ }

foreach ($p in $targets) {
  if ($p -match '^https?://') {
    $url = $p
    $leaf = ($p -replace '^https?://', '' -replace '[^\w\-]+', '-').Trim('-')
    if ($leaf.Length -gt 60) { $leaf = $leaf.Substring($leaf.Length - 60) }
  } else {
    if (-not (Test-Path '_book')) { throw '请先执行 npm run build（_book/ 不存在）' }
    $src = Join-Path '_book' $p
    if (-not (Test-Path $src)) { Write-Warning "跳过不存在的页面：$src"; continue }
    $abs = (Resolve-Path $src).Path -replace '\\', '/'
    $url = "file:///$abs"
    $leaf = [IO.Path]::GetFileNameWithoutExtension($p)
  }

  $out = Join-Path (Get-Location) ".shots\$leaf.png"
  & $browser --headless=new --disable-gpu --hide-scrollbars --no-first-run `
    --user-data-dir="$profile" --screenshot="$out" --window-size="$Width,$Height" $url 2>&1 | Out-Null
  if (Test-Path $out) { Write-Host "✓ $out" } else { Write-Warning "截图失败：$url" }
}
