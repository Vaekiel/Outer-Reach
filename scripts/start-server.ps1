$scriptsDir = $PSScriptRoot
$pidFile = Join-Path $scriptsDir "server.pid"
$port = 8080

if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    $running = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "Le serveur ORÉE tourne déjà (PID $existingPid) sur http://localhost:$port/"
        Start-Process "http://localhost:$port/"
        Start-Sleep -Seconds 2
        exit 0
    } else {
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    }
}

Start-Process powershell -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $scriptsDir "serve.ps1"),
    "-Port", $port
) -WindowStyle Hidden

Write-Host "Démarrage du serveur ORÉE sur http://localhost:$port/ ..."
Start-Sleep -Seconds 1
Start-Process "http://localhost:$port/"
Start-Sleep -Seconds 2
