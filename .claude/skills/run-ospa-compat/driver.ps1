# ============================================================
#  OSPA Compat — driver para agentes
#
#  Sobe as páginas estáticas em http://localhost:8765 e dirige um
#  Chrome headless via DevTools Protocol. Sem Node/Python: só
#  PowerShell 5.1 + Chrome + Supabase local (Docker).
#
#  Uso (na raiz do repositório):
#    powershell -ExecutionPolicy Bypass -File .claude\skills\run-ospa-compat\driver.ps1 <comando> [args]
#
#  Comandos:
#    check            confere Supabase local e que nada aponta pra produção
#    seed             cria/atualiza o usuário de teste LOCAL (admin)
#    serve            sobe o servidor estático (processo em segundo plano)
#    stop             derruba o servidor estático
#    run <passos...>  abre Chrome headless e executa os passos, em ordem:
#        goto <pagina-ou-url>      ex.: goto index.html
#        login                     entra com o usuário de teste
#        wait <ms>
#        waitfor <seletor-css>     espera até 15s o elemento aparecer
#        click <seletor-css>
#        type <seletor-css> <texto>
#        eval <js>                 imprime o resultado (await permitido)
#        ss <arquivo.png>          screenshot da área visível (1440x900)
#        tab                       passa a dirigir a aba nova (window.open — editor)
#        viewport <larg> <alt>     ex.: viewport 390 844 (celular)
#        upload <seletor> <arquivo> escolhe um arquivo num <input type=file>, mesmo oculto
#      Ou de um arquivo, um passo por linha (# comenta):  run -f passos.txt
# ============================================================
param([Parameter(Position=0)][string]$Cmd = 'help',
      [Parameter(Position=1, ValueFromRemainingArguments=$true)][string[]]$Rest)

$ErrorActionPreference = 'Stop'
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $OutputEncoding

$ROOT      = (Resolve-Path "$PSScriptRoot\..\..\..").Path
$PORT      = 8765
$BASE      = "http://localhost:$PORT/"
$CDP_PORT  = 9333
$PIDFILE   = Join-Path $env:TEMP 'ospa-compat-serve.pid'
$CONTAINER = 'supabase_db_ospa-compat'
$SB_LOCAL  = 'http://127.0.0.1:54321'
$PROD_REF  = 'jxezjuovrxajjleyjdcs'
$TEST_EMAIL = 'agente@ospa.local'
$TEST_PASS  = 'agente-local-123'

function Falha($m) { Write-Host "ERRO: $m" -ForegroundColor Red; exit 1 }

# ── check ──────────────────────────────────────────────────
function Check {
  try { $null = Invoke-WebRequest "$SB_LOCAL/auth/v1/health" -UseBasicParsing -TimeoutSec 5 }
  catch { Falha "Supabase local não responde em $SB_LOCAL. Rode: supabase start" }
  # Páginas com URL de produção fixa que NÃO passam pelo seletor de ambiente do auth.js.
  $fixas = Get-ChildItem $ROOT -File -Include *.html,*.js -Recurse -Depth 0 |
    Where-Object { $_.Name -notin 'auth.js','editor-app.html' } |
    Select-String -Pattern $PROD_REF -List
  if ($fixas) { Falha ("URL de produção fixa em: " + (($fixas | ForEach-Object { $_.Filename }) -join ', ')) }
  if (-not (Select-String -Path "$ROOT\auth.js" -Pattern 'SB_LOCAL' -Quiet)) { Falha 'auth.js sem seletor de ambiente (SB_LOCAL) — abriria produção.' }
  if (-not (Select-String -Path "$ROOT\editor-launcher.js" -Pattern 'JSON.stringify\(SB_URL\)' -Quiet)) { Falha 'editor-launcher.js não injeta SB_URL no editor — editor abriria produção.' }
  Write-Host "ok: Supabase local no ar; páginas resolvem para $SB_LOCAL quando abertas em localhost"
}

# ── seed ───────────────────────────────────────────────────
function Seed {
  Check
  # Via cmd: o `supabase status` escreve "Stopped services" no stderr, e o
  # PowerShell 5.1 transforma isso em erro fatal mesmo com 2>$null.
  $svc = (cmd /c 'supabase status -o json 2>nul' | Out-String | ConvertFrom-Json).SERVICE_ROLE_KEY
  if (-not $svc) { Falha 'não consegui ler SERVICE_ROLE_KEY de `supabase status`' }
  $h = @{ apikey = $svc; Authorization = "Bearer $svc" }
  $body = @{ email = $TEST_EMAIL; password = $TEST_PASS; email_confirm = $true } | ConvertTo-Json
  try {
    $u = Invoke-RestMethod "$SB_LOCAL/auth/v1/admin/users" -Method Post -Headers $h -ContentType 'application/json' -Body $body
    $id = $u.id
  } catch {
    # Já existe: localiza e redefine a senha.
    $todos = Invoke-RestMethod "$SB_LOCAL/auth/v1/admin/users?per_page=1000" -Headers $h
    $id = ($todos.users | Where-Object { $_.email -eq $TEST_EMAIL }).id
    if (-not $id) { throw }
    $null = Invoke-RestMethod "$SB_LOCAL/auth/v1/admin/users/$id" -Method Put -Headers $h -ContentType 'application/json' -Body (@{ password = $TEST_PASS } | ConvertTo-Json)
  }
  $sql = "insert into public.usuarios (id, nome, email, papel_global) values ('$id','Agente Local','$TEST_EMAIL','admin') on conflict (id) do update set papel_global='admin', nome=excluded.nome;"
  $sql | docker exec -i $CONTAINER psql -U postgres -d postgres -q -v ON_ERROR_STOP=1
  if ($LASTEXITCODE) { Falha 'insert em public.usuarios' }
  Write-Host "ok: $TEST_EMAIL / $TEST_PASS (admin global, só no banco local)"
}

# ── serve / stop ───────────────────────────────────────────
function Serve {
  Check
  if (Test-Path $PIDFILE) {
    $p = Get-Process -Id (Get-Content $PIDFILE) -ErrorAction SilentlyContinue
    if ($p) { Write-Host "já no ar: $BASE (pid $($p.Id))"; return }
  }
  $srv = @'
param($root, $prefix)
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8';
            '.json'='application/json'; '.png'='image/png'; '.svg'='image/svg+xml'; '.jpg'='image/jpeg'; '.ico'='image/x-icon' }
$l = New-Object System.Net.HttpListener; $l.Prefixes.Add($prefix); $l.Start()
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $rel = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/')); if (-not $rel) { $rel = 'index.html' }
    $f = [IO.Path]::GetFullPath((Join-Path $root $rel))
    if ($f.StartsWith($root) -and (Test-Path $f -PathType Leaf)) {
      $b = [IO.File]::ReadAllBytes($f)
      $ct = $types[[IO.Path]::GetExtension($f).ToLower()]; if ($ct) { $c.Response.ContentType = $ct }
      $c.Response.Headers.Add('Cache-Control', 'no-store')
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch {} finally { $c.Response.Close() }
}
'@
  $tmp = Join-Path $env:TEMP 'ospa-compat-serve.ps1'
  Set-Content $tmp $srv -Encoding UTF8
  $p = Start-Process powershell -WindowStyle Hidden -PassThru -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File',"`"$tmp`"","`"$ROOT`"",$BASE
  Set-Content $PIDFILE $p.Id
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 300
    try { $null = Invoke-WebRequest "${BASE}auth.js" -UseBasicParsing -TimeoutSec 2; Write-Host "ok: $BASE (pid $($p.Id))"; return } catch {}
  }
  Falha "servidor não respondeu em $BASE"
}

function Stop {
  if (Test-Path $PIDFILE) {
    Stop-Process -Id (Get-Content $PIDFILE) -Force -ErrorAction SilentlyContinue
    Remove-Item $PIDFILE
  }
  Write-Host 'ok: servidor parado'
}

# ── CDP ────────────────────────────────────────────────────
$script:ws = $null; $script:msgId = 0

function Cdp($method, $params = @{}) {
  $script:msgId++
  $id = $script:msgId
  $json = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $null = $script:ws.SendAsync((New-Object ArraySegment[byte] (,$bytes)), 'Text', $true, [Threading.CancellationToken]::None).Wait()
  $buf = New-Object byte[] 1048576
  while ($true) {
    $ms = New-Object IO.MemoryStream
    do {
      $r = $script:ws.ReceiveAsync((New-Object ArraySegment[byte] (,$buf)), [Threading.CancellationToken]::None)
      $null = $r.Wait(); $ms.Write($buf, 0, $r.Result.Count)
    } while (-not $r.Result.EndOfMessage)
    $msg = [Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
    if ($msg.id -eq $id) {
      if ($msg.error) { throw "CDP $method -> $($msg.error.message)" }
      return $msg.result
    }
    # Eventos: só o console interessa (erros JS aparecem aqui).
    if ($msg.method -eq 'Runtime.consoleAPICalled' -and $msg.params.type -in 'error','warning') {
      Write-Host ("  [console.$($msg.params.type)] " + (($msg.params.args | ForEach-Object { if ($_.value) { $_.value } else { $_.description } }) -join ' ')) -ForegroundColor DarkYellow
    }
    if ($msg.method -eq 'Runtime.exceptionThrown') {
      Write-Host "  [exceção] $($msg.params.exceptionDetails.exception.description)" -ForegroundColor DarkYellow
    }
  }
}

function Js($expr) {
  $r = Cdp 'Runtime.evaluate' @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
  if ($r.exceptionDetails) { throw "JS: $($r.exceptionDetails.exception.description)" }
  return $r.result.value
}

function Lit($s) { ConvertTo-Json ([string]$s) -Compress }

function WaitFor($sel, $ms = 15000) {
  $fim = (Get-Date).AddMilliseconds($ms)
  while ((Get-Date) -lt $fim) {
    if (Js "(()=>{const e=document.querySelector($(Lit $sel));return !!(e&&e.offsetParent!==null)})()") { return }
    Start-Sleep -Milliseconds 200
  }
  throw "waitfor: '$sel' não apareceu em ${ms}ms"
}

function Conectar($alvo) {
  if ($script:ws) { $script:ws.Dispose() }
  $script:alvoId = $alvo.id
  $script:ws = New-Object Net.WebSockets.ClientWebSocket
  $null = $script:ws.ConnectAsync([Uri]$alvo.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  $null = Cdp 'Runtime.enable'
  $null = Cdp 'Page.enable'
  # Segunda trava: qualquer requisição ao projeto de produção é bloqueada na rede.
  $null = Cdp 'Network.enable'
  $null = Cdp 'Network.setBlockedURLs' @{ urls = @("*$PROD_REF*") }
  # Diálogos (alert/confirm) travariam a página headless: aceita todos e registra.
  $null = Cdp 'Page.addScriptToEvaluateOnNewDocument' @{ source = "window.alert=m=>console.warn('[alert] '+m);window.confirm=m=>(console.warn('[confirm] '+m),true);" }
}

function GuardaProducao {
  if ((Js 'typeof SB_URL==="string"?SB_URL:""') -match $PROD_REF) { Falha 'página resolveu SB_URL para PRODUÇÃO — abortando' }
}

function Run($passos) {
  $chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
              "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
  if (-not $chrome) { Falha 'Chrome/Edge não encontrado' }
  try { $null = Invoke-WebRequest "${BASE}auth.js" -UseBasicParsing -TimeoutSec 2 } catch { Falha "servidor fora do ar — rode: driver.ps1 serve" }

  $perfil = Join-Path $env:TEMP "ospa-compat-chrome-$PID"
  $proc = Start-Process $chrome -PassThru -ArgumentList '--headless=new', "--remote-debugging-port=$CDP_PORT",
    "--user-data-dir=`"$perfil`"", '--window-size=1440,900', '--no-first-run', '--no-default-browser-check',
    # O editor abre com window.open depois de um await: sem gesto de usuário, o bloqueador engoliria a aba.
    '--disable-popup-blocking', 'about:blank'
  try {
    $alvo = $null
    for ($i = 0; $i -lt 40 -and -not $alvo; $i++) {
      Start-Sleep -Milliseconds 250
      try { $alvo = (Invoke-RestMethod "http://127.0.0.1:$CDP_PORT/json" -TimeoutSec 2) | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
    }
    if (-not $alvo) { Falha 'Chrome não abriu a porta de depuração' }
    Conectar $alvo

    foreach ($linha in $passos) {
      $linha = $linha.Trim(); if (-not $linha -or $linha.StartsWith('#')) { continue }
      $verbo, $arg = $linha -split '\s+', 2
      Write-Host "> $linha" -ForegroundColor Cyan
      switch ($verbo) {
        'goto' {
          $url = if ($arg -match '^https?://') { $arg } else { $BASE + $arg }
          if ($url -notmatch '^http://(localhost|127\.0\.0\.1)[:/]') { Falha 'goto só em localhost (o auth.js escolhe produção fora dele)' }
          $null = Cdp 'Page.navigate' @{ url = $url }
          $fim = (Get-Date).AddSeconds(15)
          do { Start-Sleep -Milliseconds 200 } until ((Js 'document.readyState') -eq 'complete' -or (Get-Date) -gt $fim)
          Start-Sleep -Milliseconds 500
          GuardaProducao
        }
        'tab' {
          # Passa a dirigir a aba aberta por window.open (ex.: o editor, que abre num blob:).
          $novo = $null
          for ($i = 0; $i -lt 40 -and -not $novo; $i++) {
            $novo = (Invoke-RestMethod "http://127.0.0.1:$CDP_PORT/json") | Where-Object { $_.type -eq 'page' -and $_.id -ne $script:alvoId } | Select-Object -First 1
            if (-not $novo) { Start-Sleep -Milliseconds 250 }
          }
          if (-not $novo) { Falha 'tab: nenhuma aba nova apareceu' }
          Conectar $novo
          $fim = (Get-Date).AddSeconds(15)
          do { Start-Sleep -Milliseconds 200 } until ((Js 'document.readyState') -eq 'complete' -or (Get-Date) -gt $fim)
          Write-Host "  agora em: $(Js 'location.href.slice(0,80)')"
          GuardaProducao
        }
        'login' {
          WaitFor '#login-email'
          $null = Js "document.getElementById('login-email').value=$(Lit $TEST_EMAIL);document.getElementById('login-password').value=$(Lit $TEST_PASS);doLogin()"
          Start-Sleep -Milliseconds 2500
          # Só conta se estiver visível: o doLogin esconde o erro anterior sem apagar o texto.
          $err = Js "(()=>{const e=document.getElementById('login-err');return e&&e.offsetParent!==null?e.textContent:''})()"
          if ($err) { Falha "login: $err (rode: driver.ps1 seed)" }
        }
        'viewport' {
          $w, $h = $arg -split '\s+'
          $null = Cdp 'Emulation.setDeviceMetricsOverride' @{ width = [int]$w; height = [int]$h; deviceScaleFactor = 1; mobile = ([int]$w -lt 700) }
        }
        'upload' {
          # Preenche um <input type=file> (mesmo oculto) e dispara o change, como um clique em "Escolher".
          $sel, $arq = $arg -split '\s+', 2
          $arq = (Resolve-Path $arq).Path
          $docRoot = (Cdp 'DOM.getDocument' @{ depth = 0 }).root.nodeId
          $node = (Cdp 'DOM.querySelector' @{ nodeId = $docRoot; selector = $sel }).nodeId
          if (-not $node) { throw "upload: '$sel' não encontrado" }
          $null = Cdp 'DOM.setFileInputFiles' @{ nodeId = $node; files = @($arq) }
        }
        'wait'    { Start-Sleep -Milliseconds ([int]$arg) }
        'waitfor' { WaitFor $arg }
        'click'   { $null = Js "document.querySelector($(Lit $arg)).click()" }
        'type' {
          $sel, $txt = $arg -split '\s+', 2
          $null = Js "(()=>{const e=document.querySelector($(Lit $sel));e.focus();e.value=$(Lit $txt);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()"
        }
        'eval'    { $v = Js $arg; if ($v -is [string]) { Write-Host $v } else { Write-Host ($v | ConvertTo-Json -Depth 5 -Compress) } }
        'ss' {
          $png = Cdp 'Page.captureScreenshot' @{ format = 'png' }
          $dest = if ([IO.Path]::IsPathRooted($arg)) { $arg } else { Join-Path (Get-Location) $arg }
          $null = New-Item -ItemType Directory -Force (Split-Path $dest)
          [IO.File]::WriteAllBytes($dest, [Convert]::FromBase64String($png.data))
          Write-Host "  salvo: $dest"
        }
        default { Falha "passo desconhecido: $verbo" }
      }
    }
  } finally {
    if ($script:ws) { $script:ws.Dispose() }
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    # Chrome deixa processos filhos; espera soltarem o perfil antes de apagar.
    Start-Sleep -Milliseconds 800
    Remove-Item $perfil -Recurse -Force -ErrorAction SilentlyContinue
  }
}

switch ($Cmd) {
  'check' { Check }
  'seed'  { Seed }
  'serve' { Serve }
  'stop'  { Stop }
  'run'   {
    if ($Rest.Count -ge 2 -and $Rest[0] -eq '-f') { Run (Get-Content $Rest[1] -Encoding UTF8) }
    else { Run @($Rest) }
  }
  default { Get-Content $PSCommandPath -TotalCount 27 | Select-Object -Skip 1 }
}
