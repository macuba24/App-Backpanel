# Repeatable shop install. Run from the Backpanel folder:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-shop.ps1
# PostgreSQL must already be a Windows service (see the message below if it is missing).
# Does not touch the Schmahl SQLite file. Does not drop databases.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Get-ShopLanIp {
  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.InterfaceAlias -notlike "*WSL*" -and
      $_.InterfaceAlias -notlike "*vEthernet*" -and
      $_.InterfaceAlias -notlike "*Loopback*" -and
      $_.AddressState -eq "Preferred"
    }
  $dhcp = $candidates | Where-Object { $_.PrefixOrigin -eq "Dhcp" } | Select-Object -First 1
  if ($dhcp) { return $dhcp.IPAddress }
  $first = $candidates | Select-Object -First 1
  if ($first) { return $first.IPAddress }
  throw "No LAN IPv4 address found."
}

$service = Get-Service | Where-Object { $_.Name -like "postgresql*" } | Select-Object -First 1
if (-not $service) {
  Write-Output "PostgreSQL-Dienst fehlt. In einer Administrator-PowerShell:"
  Write-Output 'winget install --id PostgreSQL.PostgreSQL.16 -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity --silent --override "--mode unattended --unattendedmodeui none --superpassword <Passwort aus DATABASE_URL> --serverport 5432 --servicename postgresql-x64-16 --enable-components server,commandlinetools"'
  exit 1
}

if ($service.StartType -ne "Automatic") {
  Set-Service -Name $service.Name -StartupType Automatic
}
if ($service.Status -ne "Running") {
  Start-Service -Name $service.Name
  $service.WaitForStatus("Running", "00:00:30")
}

$lan = Get-ShopLanIp
$panelUrl = "http://${lan}:3000"
$appUrl = "http://${lan}:8765/"

$envPath = Join-Path $Root ".env"
$envText = Get-Content $envPath -Raw
function Set-EnvLine([string]$text, [string]$key, [string]$value) {
  $pattern = "(?m)^$key=.*$"
  $line = "$key=`"$value`""
  if ($text -match $pattern) { return [regex]::Replace($text, $pattern, $line) }
  return $text.TrimEnd() + "`r`n$line`r`n"
}
$envText = Set-EnvLine $envText "NEXT_PUBLIC_PANEL_URL" $panelUrl
$envText = Set-EnvLine $envText "NEXT_PUBLIC_SCHMAHL_APP_URL" $appUrl
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($envPath, $envText, $utf8)

$link = Join-Path (Split-Path -Parent $Root) "panel-link.js"
if (Test-Path $link) {
  $js = Get-Content $link -Raw
  $js = [regex]::Replace($js, 'var ORIGIN = "http://[^"]+";', "var ORIGIN = `"$panelUrl`";")
  [System.IO.File]::WriteAllText($link, $js, $utf8)
}

$psql = Get-ChildItem "C:\Program Files\PostgreSQL" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
  Sort-Object FullName -Descending | Select-Object -First 1
if (-not $psql) { throw "psql.exe not found" }

$line = Get-Content $envPath | Where-Object { $_ -match '^\s*DATABASE_URL=' } | Select-Object -First 1
$url = ($line -replace '^\s*DATABASE_URL=', '' -replace '^"', '' -replace '"$', '')
if ($url -notmatch '^postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?]+)') {
  throw "DATABASE_URL is not a postgresql URL"
}
$env:PGPASSWORD = $Matches[2]
$dbUser = $Matches[1]
$dbHost = $Matches[3]
$dbPort = $Matches[4]
$dbName = $Matches[5]

$exists = & $psql.FullName -h $dbHost -p $dbPort -U $dbUser -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$dbName'"
if ($exists.Trim() -ne "1") {
  & $psql.FullName -h $dbHost -p $dbPort -U $dbUser -d postgres -c "CREATE DATABASE $dbName"
  if ($LASTEXITCODE -ne 0) { throw "CREATE DATABASE failed" }
}

npm run db:push
if ($LASTEXITCODE -ne 0) { throw "db:push failed" }
npm run db:seed
if ($LASTEXITCODE -ne 0) { throw "db:seed failed" }
npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }

$start = Join-Path $PSScriptRoot "start-production.ps1"
$backup = Join-Path $PSScriptRoot "backup-db.ps1"
schtasks /Create /F /TN "Backpanel" /SC ONLOGON /RL LIMITED /TR "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$start`""
schtasks /Create /F /TN "Backpanel Datenbank-Sicherung" /SC DAILY /ST 03:00 /RL LIMITED /TR "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$backup`""

try {
  New-NetFirewallRule -DisplayName "Backpanel HTTP 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction Stop | Out-Null
} catch {
  Write-Output "Firewall rule needs an administrator PowerShell: New-NetFirewallRule -DisplayName 'Backpanel HTTP 3000' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow"
}

$busy = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $busy) {
  Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile","-ExecutionPolicy","Bypass","-File",$start -WorkingDirectory $Root -WindowStyle Hidden
}

Write-Output "Panel: $panelUrl"
Write-Output "PostgreSQL service: $($service.Name) (Automatic)"
Write-Output "Backup: powershell -File scripts\backup-db.ps1"
