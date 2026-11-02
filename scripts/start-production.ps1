# Start the production server if port 3000 is free. Used by the logon task.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$busy = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Output "Port 3000 is already in use. Leaving the existing server."
  exit 0
}

npm run start
