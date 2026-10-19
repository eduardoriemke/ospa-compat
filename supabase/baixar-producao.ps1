# ============================================================
#  OSPA Compat — copia o banco de PRODUÇÃO para o Supabase LOCAL
#
#  Produção só é LIDA (supabase db dump --linked).
#  Tudo que é escrito vai para o container local via docker exec.
#  O banco local é apagado e recriado a cada execução.
#
#  Pré-requisitos (uma vez só):
#    supabase login
#    supabase link --project-ref jxezjuovrxajjleyjdcs
#
#  Uso (na raiz do projeto):
#    powershell -ExecutionPolicy Bypass -File supabase\baixar-producao.ps1
# ============================================================
$ErrorActionPreference = 'Stop'
# Sem isso o PowerShell 5.1 manda ASCII para o psql e corrompe os acentos.
$OutputEncoding = New-Object System.Text.UTF8Encoding $false
Set-Location (Split-Path $PSScriptRoot)

$PROD_REF  = 'jxezjuovrxajjleyjdcs'
$CONTAINER = 'supabase_db_ospa-compat'
# Dentro de supabase/.temp (ignorado pelo git): os arquivos contêm dados reais.
$OUT = 'supabase\.temp\dump'

function Passo($m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Falha($m) { Write-Host "ERRO: $m" -ForegroundColor Red; exit 1 }

# O link precisa apontar para produção — é de onde lemos.
if (-not (Test-Path 'supabase\.temp\project-ref')) { Falha "projeto não vinculado. Rode: supabase link --project-ref $PROD_REF" }
if ((Get-Content 'supabase\.temp\project-ref' -Raw).Trim() -ne $PROD_REF) { Falha 'supabase/.temp/project-ref não é o projeto esperado.' }

Passo 'Exportando de produção (somente leitura)'
New-Item -ItemType Directory -Force $OUT | Out-Null
supabase db dump --linked --role-only -f "$OUT\1_roles.sql";                         if ($LASTEXITCODE) { Falha 'dump de roles' }
supabase db dump --linked -f "$OUT\2_estrutura.sql";                                 if ($LASTEXITCODE) { Falha 'dump de estrutura' }
# Inclui os usuários do login (auth.users/identities), com as senhas criptografadas.
supabase db dump --linked --data-only -f "$OUT\3_dados.sql";                         if ($LASTEXITCODE) { Falha 'dump de dados' }

Passo 'Recriando o Supabase local do zero'
supabase stop --no-backup
supabase start;                                                                      if ($LASTEXITCODE) { Falha 'supabase start' }

Passo 'Importando no banco local'
foreach ($f in '1_roles', '2_estrutura', '3_dados') {
  Write-Host "-- $f"
  # Roles esbarra em papéis reservados que o Supabase local já cria (ex.: supabase_admin); o resto deve entrar limpo.
  $stop = if ($f -in '2_estrutura', '3_dados') { 1 } else { 0 }
  Get-Content "$OUT\$f.sql" -Raw -Encoding UTF8 |
    docker exec -i $CONTAINER psql -U postgres -d postgres -q -v ON_ERROR_STOP=$stop
  if ($LASTEXITCODE -and $stop) { Falha "importação de $f" }
}

Passo 'Conferência'
docker exec $CONTAINER psql -U postgres -d postgres -c "select (select count(*) from auth.users) as usuarios, (select count(*) from information_schema.tables where table_schema='public') as tabelas_public;"
Write-Host "`nPronto. Banco local: http://127.0.0.1:44321  |  Studio: http://127.0.0.1:44323" -ForegroundColor Green
