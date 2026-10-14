<#
  OBS Restream ポータブル版ランチャー。
  起動のたびに「フォルダの場所に依存する設定」を作り直してから OBS を起動する。
  - config\obs-restream.json   : このランチャー自身の状態（WebSocket パスワード等）
  - config\obs-studio\...      : OBS ポータブルモードの設定ルート
  詳細は README.txt を参照。

  -NoLaunch : 設定ファイルの生成だけ行い OBS は起動しない（動作確認用）
  -Reset    : config フォルダを削除して初期状態からやり直す
  -AppPort  : app\ を配信するローカル HTTP サーバーのポート（既定 48610）。
              指定すると config\obs-restream.json に保存され、以降も使われる。
              localStorage（ダッシュボードの設定）はポートごとに別扱いなので、
              通常は変更しないこと。
  -ObsExtraArgs : OBS にそのまま渡す追加引数（開発・検証用。例: --remote-debugging-port=9222）

  構成: このスクリプトが http://localhost:<AppPort>/ で app\ を配信し（同一プロセス内の
  HttpListener）、OBS のドック/ブラウザソースはそこを読む。OBS が終了するとサーバーを止めて
  スクリプトも終了する。このウィンドウを閉じるとサーバーも止まる（OBS 側の表示が空になる）。
#>
[CmdletBinding()]
param(
  [switch]$NoLaunch,
  [switch]$Reset,
  [int]$AppPort = 0,
  [string[]]$ObsExtraArgs = @()
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$AppDir = Join-Path $Root 'app'
$ObsExe = Join-Path $Root 'bin\64bit\obs64.exe'
$ConfigDir = Join-Path $Root 'config'
$StatePath = Join-Path $ConfigDir 'obs-restream.json'
$ObsCfg = Join-Path $ConfigDir 'obs-studio'
$Templates = Join-Path $Root 'templates'

$CollectionName = 'Restream'
$ProfileName = 'Restream'
$DockTitle = 'Restream'
$DefaultAppPort = 48610

function Write-Text([string]$Path, [string]$Text) {
  $dir = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.File]::WriteAllText($Path, $Text, $Utf8NoBom)
}

function Read-Text([string]$Path) {
  [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
}

# JSON 文字列リテラル（引用符込み）。テンプレートのプレースホルダ置換用。
function ConvertTo-JsonString([string]$Value) {
  $sb = New-Object System.Text.StringBuilder
  [void]$sb.Append('"')
  foreach ($ch in $Value.ToCharArray()) {
    switch ($ch) {
      '"' { [void]$sb.Append('\"') }
      '\' { [void]$sb.Append('\\') }
      default {
        if ([int]$ch -lt 0x20 -or [int]$ch -gt 0x7e) { [void]$sb.AppendFormat('\u{0:x4}', [int]$ch) }
        else { [void]$sb.Append($ch) }
      }
    }
  }
  [void]$sb.Append('"')
  $sb.ToString()
}

# OBS の user.ini / global.ini 用の最小 ini 編集。他の行・セクションは触らない。
function Set-IniValue([string]$Path, [string]$Section, [string]$Key, [string]$Value, [switch]$OnlyIfMissing) {
  $lines = New-Object System.Collections.Generic.List[string]
  if (Test-Path -LiteralPath $Path) {
    foreach ($l in (Read-Text $Path) -split "`r?`n") { $lines.Add($l) }
    while ($lines.Count -gt 0 -and $lines[$lines.Count - 1] -eq '') { $lines.RemoveAt($lines.Count - 1) }
  }
  $secStart = -1
  $secEnd = $lines.Count
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^\[(.+)\]\s*$') {
      if ($secStart -ge 0) { $secEnd = $i; break }
      if ($Matches[1] -eq $Section) { $secStart = $i }
    }
  }
  if ($secStart -lt 0) {
    if ($lines.Count -gt 0) { $lines.Add('') }
    $lines.Add("[$Section]")
    $lines.Add("$Key=$Value")
  } else {
    $found = -1
    for ($i = $secStart + 1; $i -lt $secEnd; $i++) {
      if ($lines[$i].StartsWith("$Key=")) { $found = $i; break }
    }
    if ($found -ge 0) {
      if ($OnlyIfMissing) { return }
      $lines[$found] = "$Key=$Value"
    } else {
      $lines.Insert($secEnd, "$Key=$Value")
    }
  }
  Write-Text $Path (($lines -join "`r`n") + "`r`n")
}

function Get-IniValue([string]$Path, [string]$Section, [string]$Key) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  $inSec = $false
  foreach ($l in (Read-Text $Path) -split "`r?`n") {
    if ($l -match '^\[(.+)\]\s*$') { $inSec = ($Matches[1] -eq $Section); continue }
    if ($inSec -and $l.StartsWith("$Key=")) { return $l.Substring($Key.Length + 1) }
  }
  return $null
}

function New-RandomToken([int]$Length) {
  $chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'.ToCharArray()
  $bytes = New-Object byte[] $Length
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $sb = New-Object System.Text.StringBuilder
  foreach ($b in $bytes) { [void]$sb.Append($chars[$b % $chars.Length]) }
  $sb.ToString()
}

function Test-ObsRunning {
  foreach ($p in (Get-Process -Name 'obs64' -ErrorAction SilentlyContinue)) {
    try {
      if ($p.Path -and $p.Path.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    } catch { }
  }
  $false
}

# ---------------------------------------------------------------- 前提チェック
if (-not (Test-Path -LiteralPath $ObsExe)) { throw "obs64.exe が見つかりません: $ObsExe" }
if (-not (Test-Path -LiteralPath (Join-Path $AppDir 'index.html'))) { throw "app\index.html が見つかりません: $AppDir" }
if ($Root.StartsWith('\\')) {
  throw 'ネットワークパス (\\server\...) からは起動できません。ローカルドライブに展開してください。'
}
if (-not $NoLaunch -and (Test-ObsRunning)) {
  throw 'このフォルダの OBS は既に起動しています。終了してからもう一度実行してください。'
}

if ($Reset -and (Test-Path -LiteralPath $ConfigDir)) {
  Remove-Item -LiteralPath $ConfigDir -Recurse -Force
  Write-Host 'config フォルダを削除しました。初期状態から作り直します。'
}

$firstRun = -not (Test-Path -LiteralPath $StatePath)

# ---------------------------------------------------------------- ランチャー状態
$state = $null
if (-not $firstRun) {
  try { $state = (Read-Text $StatePath) | ConvertFrom-Json } catch { $state = $null }
}
if ($null -eq $state -or -not $state.password) {
  $state = [pscustomobject]@{
    password = (New-RandomToken 24)
    port     = 4455
    appPort  = $DefaultAppPort
    dockUuid = ([guid]::NewGuid().ToString('N'))
  }
  Write-Text $StatePath ($state | ConvertTo-Json)
}
$password = [string]$state.password
$port = [int]$state.port
$dockUuid = [string]$state.dockUuid

# app\ 配信用ポート: パラメータ > 保存値 > 既定。変わったら保存する。
# 旧版（http://absolute/ 方式）の state には appPort が無いので既定値を補う。
$savedAppPort = 0
if ($state.PSObject.Properties['appPort']) { $savedAppPort = [int]$state.appPort }
$servePort = $savedAppPort
if ($AppPort -gt 0) { $servePort = $AppPort }
if ($servePort -le 0) { $servePort = $DefaultAppPort }
if ($servePort -lt 1024 -or $servePort -gt 65535) { throw "AppPort は 1024-65535 の範囲で指定してください: $servePort" }
if ($servePort -eq $port) { throw "AppPort が OBS WebSocket のポートと同じです: $servePort" }
if ($servePort -ne $savedAppPort) {
  $state = [pscustomobject]@{
    password = $password
    port     = $port
    appPort  = $servePort
    dockUuid = $dockUuid
  }
  Write-Text $StatePath ($state | ConvertTo-Json)
}

# ---------------------------------------------------------------- URL
$appDirFull = (Resolve-Path -LiteralPath $AppDir).ProviderPath
$appUrl = "http://localhost:$servePort"
$wsUrl = "ws://127.0.0.1:$port"
$query = '?obsUrl=' + [System.Uri]::EscapeDataString($wsUrl) +
  '&obsPassword=' + [System.Uri]::EscapeDataString($password) +
  '&obsScene=' + [System.Uri]::EscapeDataString($CollectionName)
$dockUrl = "$appUrl/index.html$query"
$sceneUrl = "$appUrl/scene.html"
$syncUrl = "$appUrl/sync.html$query"

# ---------------------------------------------------------------- OBS 設定
# 1) WebSocket（毎回上書き: パスワード・ポートはランチャーが管理する）
$wsTemplate = Read-Text (Join-Path $Templates 'websocket-config.json')
$wsJson = $wsTemplate.Replace('__PASSWORD__', $password).Replace('"__PORT__"', [string]$port)
Write-Text (Join-Path $ObsCfg 'plugin_config\obs-websocket\config.json') $wsJson

# 2) プロファイル（初回のみ。ユーザーの設定変更は保持する）
$profileIni = Join-Path $ObsCfg "basic\profiles\$ProfileName\basic.ini"
if (-not (Test-Path -LiteralPath $profileIni)) {
  Write-Text $profileIni (Read-Text (Join-Path $Templates 'profile-basic.ini'))
}

# 3) シーンコレクション
$collectionPath = Join-Path $ObsCfg "basic\scenes\$CollectionName.json"
if (-not (Test-Path -LiteralPath $collectionPath)) {
  $tpl = Read-Text (Join-Path $Templates 'scene-collection.json')
  $tpl = $tpl.Replace('"__SCENE_URL__"', (ConvertTo-JsonString $sceneUrl))
  $tpl = $tpl.Replace('"__SYNC_URL__"', (ConvertTo-JsonString $syncUrl))
  Write-Text $collectionPath $tpl
} else {
  # フォルダ移動・ポート変更への追従: ユーザーが編集したシーンは壊さず、当ツールの URL
  # （scene/slot/sync.html）だけ張り替える。対象は
  #   - 旧方式の http://absolute/<パス>/...
  #   - http://localhost:<以前のポート / 既定ポート / 今回のポート>/...
  $portAlt = (@($servePort, $savedAppPort, $DefaultAppPort) | Where-Object { $_ -gt 0 } | Select-Object -Unique) -join '|'
  $prefix = "(?:http://absolute/[^`"]*?|http://localhost:(?:$portAlt))"
  $text = Read-Text $collectionPath
  $syncJson = (ConvertTo-JsonString $syncUrl)
  $syncJson = $syncJson.Substring(1, $syncJson.Length - 2)
  $appJson = (ConvertTo-JsonString $appUrl)
  $appJson = $appJson.Substring(1, $appJson.Length - 2)
  $syncEval = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $syncJson }
  $baseEval = [System.Text.RegularExpressions.MatchEvaluator] { param($m) $appJson + '/' + $m.Groups[1].Value + '.html' }
  $new = [regex]::Replace($text, "$prefix/sync\.html(\?[^`"]*)?", $syncEval)
  $new = [regex]::Replace($new, "$prefix/(scene|slot)\.html", $baseEval)
  if ($new -ne $text) { Write-Text $collectionPath $new }
}

# 4) user.ini（アクティブなプロファイル/コレクションは初回のみ、ドックは毎回 URL を更新）
$userIni = Join-Path $ObsCfg 'user.ini'
Set-IniValue $userIni 'General' 'FirstRun' 'true' -OnlyIfMissing
Set-IniValue $userIni 'Basic' 'Profile' $ProfileName -OnlyIfMissing
Set-IniValue $userIni 'Basic' 'ProfileDir' $ProfileName -OnlyIfMissing
Set-IniValue $userIni 'Basic' 'SceneCollection' $CollectionName -OnlyIfMissing
Set-IniValue $userIni 'Basic' 'SceneCollectionFile' $CollectionName -OnlyIfMissing

# ExtraBrowserDocks: 既存の他のドックは維持し、自分の uuid のエントリだけ差し替える
$docks = @()
$existing = Get-IniValue $userIni 'BasicWindow' 'ExtraBrowserDocks'
if ($existing) {
  try {
    foreach ($d in (ConvertFrom-Json $existing)) {
      if ($d.uuid -ne $dockUuid) { $docks += $d }
    }
  } catch { }
}
$docks += [pscustomobject]@{ title = $DockTitle; url = $dockUrl; uuid = $dockUuid }
$docksJson = '[' + (($docks | ForEach-Object {
  '{"title":' + (ConvertTo-JsonString $_.title) + ',"url":' + (ConvertTo-JsonString $_.url) + ',"uuid":' + (ConvertTo-JsonString $_.uuid) + '}'
}) -join ',') + ']'
Set-IniValue $userIni 'BasicWindow' 'ExtraBrowserDocks' $docksJson

# DockState: クリーンな OBS で取得したドックレイアウト。キーが無い（初回含む）場合のみ書く。
# 無いと OBS はドックを全部リセットし、追加したブラウザドックが浮動・非表示になるため。
# 既存の値は上書きしない（ユーザーがレイアウトを変えた場合を保持する）。
$dockState = (Read-Text (Join-Path $Templates 'dock-state.txt')).Trim()
Set-IniValue $userIni 'BasicWindow' 'DockState' $dockState -OnlyIfMissing

# 5) portable_mode.txt（無ければ作る）
$portableMarker = Join-Path $Root 'portable_mode.txt'
if (-not (Test-Path -LiteralPath $portableMarker)) { Write-Text $portableMarker '' }

Write-Host "設定を更新しました: $ObsCfg"
Write-Host "  Dock URL : $appUrl/index.html"
Write-Host "  WebSocket: $wsUrl"

if ($NoLaunch) { return }

# ---------------------------------------------------------------- 初回のみ MOTW 解除
if ($firstRun) {
  Write-Host '初回起動の準備中です（ファイルのブロック解除）。しばらくお待ちください...'
  try {
    Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue |
      Where-Object { $_.FullName -notlike "$ConfigDir*" } |
      Unblock-File -ErrorAction SilentlyContinue
  } catch { }
}

# ---------------------------------------------------------------- app\ 配信サーバー
# OBS がドック/ブラウザソースを読み込み始める前に listen 済みにしておく。
# Twitch の埋め込みは親ページが localhost でないと frame-ancestors で拒否されるため、
# http://localhost:<port>/ で配信する（localhost 接頭辞は管理者権限・URL ACL 不要）。
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$servePort/")
try {
  $listener.Start()
} catch {
  $reason = $_.Exception.Message
  throw ("ポート $servePort は他のプログラムが使用中のため、配信サーバーを起動できません。`n" +
    "  - 同じ(または別フォルダの) Start-OBS-Restream.bat が既に動いていないか確認してください。`n" +
    "  - 他のアプリが使っている場合は、そのアプリを終了するか、別のポートで起動してください:`n" +
    "      Start-OBS-Restream.bat -AppPort $($servePort + 1)`n" +
    "    （ポートを変えると、ダッシュボードの保存済み設定は引き継がれません）`n" +
    "  詳細: $reason")
}

$serverScript = {
  param($listener, [string]$rootDir, $mime)
  $rootPrefix = $rootDir.TrimEnd('\') + '\'
  while ($listener.IsListening) {
    $ctx = $null
    try { $ctx = $listener.GetContext() } catch { break }
    $res = $ctx.Response
    try {
      $req = $ctx.Request
      $method = $req.HttpMethod
      if ($method -ne 'GET' -and $method -ne 'HEAD') { $res.StatusCode = 405; continue }
      # AbsolutePath はクエリを含まない。デコード後に検証する。
      $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).Replace('/', '\').TrimStart('\')
      if ($rel -eq '') { $rel = 'index.html' }
      if ($rel.IndexOf([char]0) -ge 0 -or $rel.Contains(':')) { $res.StatusCode = 404; continue }
      $full = [System.IO.Path]::GetFullPath((Join-Path $rootDir $rel))
      if (-not $full.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
          -not [System.IO.File]::Exists($full)) {
        $res.StatusCode = 404; continue
      }
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $type = $mime[$ext]
      if (-not $type) { $res.StatusCode = 404; continue }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.StatusCode = 200
      $res.ContentType = $type
      if ($ext -eq '.html') { $res.Headers['Cache-Control'] = 'no-cache' }
      $res.ContentLength64 = $bytes.Length
      if ($method -ne 'HEAD') { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } catch {
      try { $res.StatusCode = 500 } catch { }
    } finally {
      try { $res.Close() } catch { }
    }
  }
}
$mimeTypes = @{
  '.html'  = 'text/html; charset=utf-8'
  '.js'    = 'text/javascript; charset=utf-8'
  '.mjs'   = 'text/javascript; charset=utf-8'
  '.css'   = 'text/css; charset=utf-8'
  '.json'  = 'application/json; charset=utf-8'
  '.map'   = 'application/json; charset=utf-8'
  '.svg'   = 'image/svg+xml'
  '.png'   = 'image/png'
  '.jpg'   = 'image/jpeg'
  '.jpeg'  = 'image/jpeg'
  '.webp'  = 'image/webp'
  '.woff2' = 'font/woff2'
  '.ico'   = 'image/x-icon'
  '.txt'   = 'text/plain; charset=utf-8'
}
# ブラウザソース・ドックが並列に読み込むため、複数ワーカーが同じ listener を待ち受ける。
$workerCount = 6
$pool = [runspacefactory]::CreateRunspacePool(1, $workerCount)
$pool.Open()
$workers = @()
for ($i = 0; $i -lt $workerCount; $i++) {
  $ps = [powershell]::Create()
  $ps.RunspacePool = $pool
  [void]$ps.AddScript($serverScript).AddArgument($listener).AddArgument($appDirFull).AddArgument($mimeTypes)
  $workers += [pscustomobject]@{ Ps = $ps; Handle = $ps.BeginInvoke() }
}
Write-Host "配信サーバーを起動しました: $appUrl/"

# ---------------------------------------------------------------- 起動
# OBS は作業ディレクトリが exe のあるフォルダでないと起動できない。
try {
  $obsArgs = @('--portable', '--disable-updater') + $ObsExtraArgs
  $obsProc = Start-Process -FilePath $ObsExe -WorkingDirectory (Split-Path -Parent $ObsExe) `
    -ArgumentList $obsArgs -PassThru
  Write-Host 'OBS を起動しました。'
  Write-Host 'OBS を終了するとこのウィンドウも自動で閉じます。'
  Write-Host '（OBS の使用中はこのウィンドウを閉じないでください。配信サーバーが止まります）'

  # コンソールを最小化する（閉じなければ邪魔にならない）
  try {
    Add-Type -Namespace ObsRestream -Name Win -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("kernel32.dll")] public static extern System.IntPtr GetConsoleWindow();
[System.Runtime.InteropServices.DllImport("user32.dll")] public static extern bool ShowWindow(System.IntPtr h, int n);
'@
    $hwnd = [ObsRestream.Win]::GetConsoleWindow()
    if ($hwnd -ne [System.IntPtr]::Zero) { [void][ObsRestream.Win]::ShowWindow($hwnd, 6) }
  } catch { }

  # OBS が終了（正常終了・クラッシュ）するまで配信を続ける。
  $obsProc.WaitForExit()
} finally {
  # 正常終了・Ctrl+C のどちらでもサーバーを止める（孤児プロセスを残さない）
  try { $listener.Stop(); $listener.Close() } catch { }
  foreach ($w in $workers) { try { $w.Ps.Dispose() } catch { } }
  try { $pool.Close() } catch { }
}
