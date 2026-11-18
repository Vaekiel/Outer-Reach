$scriptsDir = $PSScriptRoot
$pidFile = Join-Path $scriptsDir "server.pid"

if (Test-Path $pidFile) {
    $procId = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($procId) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "Serveur ORÉE arrêté (PID $procId)."
} else {
    Write-Host "Aucun serveur ORÉE en cours d'exécution (pas de fichier PID)."
}
Start-Sleep -Seconds 2
