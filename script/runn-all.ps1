# scripts/run-all.ps1
$ErrorActionPreference = 'SilentlyContinue'
taskkill /f /im node.exe | Out-Null
$ErrorActionPreference = 'Stop'

if (Test-Path .next) { Remove-Item -Recurse -Force .next }

npm run dev
