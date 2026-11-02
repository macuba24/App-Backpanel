# Dump the Backpanel database into backups\ (gitignored).
# Daily task: schtasks /Create /F /TN "Backpanel Datenbank-Sicherung" /SC DAILY /ST 03:00 /RL LIMITED /TR "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"D:\Einzelhandel App\Backpanel\scripts\backup-db.ps1`""
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$envFile = Join-Path $Root ".env"
$line = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
if (-not $line) { throw "DATABASE_URL missing in .env" }
$url = $line -replace '^\s*DATABASE_URL=', '' -replace '^"', '' -replace '"$', ''
if ($url -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
  throw "DATABASE_URL is not a local postgresql URL"
}
$user = $Matches[1]
$env:PGPASSWORD = $Matches[2]
$hostName = $Matches[3]
$port = $Matches[4]
$database = $Matches[5]

$dump = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter pg_dump.exe -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending |
  Select-Object -First 1
if (-not $dump) { throw "pg_dump.exe not found under C:\Program Files\PostgreSQL" }

$folder = Join-Path $Root "backups"
New-Item -ItemType Directory -Force -Path $folder | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$out = Join-Path $folder "$database-$stamp.sql"
& $dump.FullName -h $hostName -p $port -U $user -d $database --no-owner --file $out
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed with exit $LASTEXITCODE" }
Write-Output "Backup written: $out"
