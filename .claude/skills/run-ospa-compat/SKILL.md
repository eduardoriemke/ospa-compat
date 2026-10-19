---
name: run-ospa-compat
description: Run, start, serve, log in to, click through and screenshot the OSPA Compat pages (index, home, apontamentos, projeto, editor...) locally against the LOCAL Supabase, never production. Use when asked to run the app, check a page/change in the browser, take a screenshot, or drive the editor.
---

# Run OSPA Compat (local only)

Static HTML pages (no build) that talk to Supabase. Agents drive it with
`.claude/skills/run-ospa-compat/driver.ps1` (PowerShell 5.1, no Node/Python):
it serves the repo at `http://localhost:8765`, launches headless Chrome and
runs steps over the DevTools Protocol (goto, login, click, eval, screenshot).
Paths are relative to the repo root.

**Never against production.** `auth.js` picks the local Supabase
(`http://127.0.0.1:44321`) only when the page is opened on `localhost`/`127.0.0.1`,
and `editor-launcher.js` passes that choice into the editor blob. The driver
refuses to start if either of those is missing, aborts if a page resolves
`SB_URL` to `jxezjuovrxajjleyjdcs`, and blocks that host on the network.

## Prerequisites

- Docker Desktop running, Supabase CLI (`supabase` on PATH), Chrome or Edge.
- Local Supabase up with a copy of the data (`supabase start`; to refresh it
  from production, read-only: `powershell -ExecutionPolicy Bypass -File supabase\baixar-producao.ps1`).

## Run (agent path)

```powershell
$d = '.claude\skills\run-ospa-compat\driver.ps1'
powershell -ExecutionPolicy Bypass -File $d check   # local Supabase up + no prod URL baked in
powershell -ExecutionPolicy Bypass -File $d seed    # agente@ospa.local / agente-local-123, global admin, LOCAL db only
powershell -ExecutionPolicy Bypass -File $d serve   # http://localhost:8765 (hidden background process)
```

Short flows as arguments (one step per argument):

```powershell
powershell -ExecutionPolicy Bypass -File $d run 'goto index.html' 'login' 'wait 2000' 'eval SB_URL' "ss $env:TEMP\ospa\projetos.png"
```

Longer flows from a steps file (one per line, `#` comments):

```powershell
@"
goto home.html?id=02139SJD_COMPAT
login
waitfor [data-action="editor"]
click [data-action="editor"]
tab
wait 3000
eval SB_URL
ss $env:TEMP\ospa\editor.png
"@ | Set-Content "$env:TEMP\ospa-passos.txt" -Encoding UTF8
powershell -ExecutionPolicy Bypass -File $d run -f "$env:TEMP\ospa-passos.txt"
```

Steps: `goto <page|url>` · `login` · `wait <ms>` · `waitfor <css>` ·
`click <css>` · `type <css> <text>` · `eval <js>` (prints result, `await` ok) ·
`ss <file.png>` (1440x900 viewport) · `tab` (switch to the tab opened by
`window.open`, i.e. the editor) · `viewport <w> <h>` (e.g. `viewport 390 844`
for phone; below 700px wide it also turns on mobile emulation). Console errors/warnings and page exceptions
are printed inline as `[console.error]` / `[exceção]`; `alert`/`confirm`
are auto-accepted and logged as `[alert]` / `[confirm]`.

Each `run` is a fresh Chrome profile, so start every flow with `goto` + `login`.
After login the session lives in `localStorage` and survives later `goto`s.

Stop the server when done: `powershell -ExecutionPolicy Bypass -File $d stop`

Useful addresses: projects `index.html`; a project's pages take `?id=<projeto>`
(`home.html?id=02139SJD_COMPAT`, `apontamentos.html?id=...`). Local projects:
`02139SJD_COMPAT` (MARSALA), `02151WEB`. Studio: http://127.0.0.1:44323.
SQL against the local db: `docker exec supabase_db_ospa-compat psql -U postgres -d postgres -c "..."`.

## Run (human path)

`driver.ps1 serve`, then open http://localhost:8765/ in a browser. It must be
`localhost`: opening the file directly (`file://`) or by another host name
makes `auth.js` choose **production**.

## Tests

There is no test suite; the driver is the check.

## Gotchas

- **The user's local Supabase has real production data** (users, projects).
  Do not log in as real users; use `seed`. The 13 real accounts have production
  password hashes, nobody knows them locally.
- **Shared files are versioned in the URL** (`sidebar.js?v=5`). The driver's
  server sends `Cache-Control: no-store`, so it always serves the current file,
  but a human's normal browser may not: bump `?v=` when you change a shared file.
- **The editor opens in a `blob:` tab** with no knowledge of the host. Its
  own `const SB_URL` is hard-coded to production; only the replace in
  `editor-launcher.js` (`JSON.stringify(SB_URL)`) points it at local. If you
  touch that replace or rename the constants in `editor-app.html`, re-check
  with `tab` + `eval SB_URL`.
- **`window.open` after an `await`** is eaten by the popup blocker when the
  click comes from JS. The driver starts Chrome with `--disable-popup-blocking`.
- **`click` changes page → follow it with `wait`**; evaluating while the page
  navigates fails with "Execution context was destroyed".
- **Only `localhost` is allowed in `goto`**; the driver refuses other hosts.
- **PowerShell variables are case-insensitive**: `$d` (the driver path) and a
  `$D` helper are the same variable. A script that set `$D` to a psql
  scriptblock and then `$d` to the driver silently ran the driver instead of
  the SQL meant to restore the test user. Use distinct names.
- To test as a non-admin, temporarily `update usuarios set papel_global=null`
  for `agente@ospa.local` and insert a `projeto_usuarios_v2` row; restore with
  `driver.ps1 seed` (it sets admin back) and delete the row.
- **Folder/file pickers (`showDirectoryPicker`, `showSaveFilePicker`) can't be
  driven headless.** To test the comparator's "Baixar pendências (.zip)", build a
  fake Drive tree in the browser's private storage (`navigator.storage.getDirectory()`
  returns real directory handles), set `ZIP_PASTA` to it, override
  `window.showSaveFilePicker` to return an OPFS file handle, call
  `compararComServidor([...])` with a fake server list, click `#zip-baixar`, then
  read the OPFS file back as base64 and check it with
  `"C:\Program Files\7-Zip\7z.exe" t file.zip`.
- `sidebar.js` records accesses (`acessos` table): browsing writes rows to
  the local db. Harmless, but don't be surprised by them.

## Troubleshooting

- *`É necessário fornecer uma expressão de valor após o operador '+'`* (parse
  errors in lines that look correct) → the `.ps1` was saved as UTF-8
  **without BOM**; PS 5.1 reads it as cp1252 and the `—` byte becomes a `”`
  quote. Re-save with BOM:
  `$f=(Resolve-Path $d).Path; [IO.File]::WriteAllText($f,[IO.File]::ReadAllText($f),[Text.UTF8Encoding]::new($true))`
- *`supabase : Stopped services: [...]` NativeCommandError* → PS 5.1 turns
  native stderr into a fatal error under `ErrorActionPreference=Stop`; the
  driver calls `supabase status` through `cmd /c ... 2>nul`.
- *`ParameterBindingException ... entrada de pipeline`* when piping steps into
  the driver → pipe is not supported; write a file and use `run -f`.
- *`tab: nenhuma aba nova apareceu`* → the page didn't call `window.open`
  (link not rendered for this role/project type, or JS error; read the
  `[console.error]` lines above it).
- *`ports are not available ... bind: Foi feita uma tentativa de acesso a um soquete de uma maneira que é proibida`*
  → Windows (Hyper-V/WSL) reserved a port range that covered the old Supabase
  ports (543xx). Check with `netsh interface ipv4 show excludedportrange protocol=tcp`.
  Since 2026-10-19 the local Supabase uses **443xx** (API 44321, DB 44322, Studio
  44323) — below 49152, where Windows never reserves. If ports ever change again,
  update `supabase/config.toml`, the local URL in `auth.js` (and bump `auth.js?v=`),
  `$SB_LOCAL` in the driver, and `supabase/baixar-producao.ps1`; then
  `supabase stop` + `supabase start` (data is kept).
- *`Supabase local não responde`* but all containers are "Up" → the port mapping
  was lost after Docker restarted (`docker port supabase_kong_ospa-compat` prints
  nothing). `supabase stop` then `supabase start`.
- *`Supabase local não responde`* → `supabase start` (Docker Desktop must be running).
  If `docker ps` says `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`,
  Docker Desktop is closed: `Start-Process "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"`,
  wait for `docker info` to succeed, then `supabase start`. The first `supabase start` can fail with
  `StatusDbNotReadyError ... starting`; wait for
  `docker inspect -f '{{.State.Health.Status}}' supabase_db_ospa-compat` to be `healthy` and run it again.
- *`login: Invalid login credentials`* → run `seed` (after re-importing with
  `baixar-producao.ps1` the local db is recreated and the test user is gone).
