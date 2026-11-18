<#
Télécharge une snapshot du site en ligne (déployé par le créateur original)
dans scripts\..\_live-snapshot\, SANS toucher au code de travail local,
puis affiche un diff pour permettre une fusion manuelle et volontaire.
#>

param(
    [string]$BaseUrl = "https://oree-flight.vekamelgaming.chatgpt.site"
)

$root = Split-Path -Parent $PSScriptRoot
$snapshotDir = Join-Path $root "_live-snapshot"

$files = @(
    "index.html",
    "style.css",
    "cockpit-polish.css",
    "app.js",
    "cockpit-windows.js",
    "traffic.js",
    "ship-tree.js",
    "resources.js",
    "ships.js",
    "shipyard.js",
    "audio.js",
    "equipment.js",
    "joystick.js",
    "cockpit-logic.js",
    "mobile-layout.js",
    "simulation.js",
    "render.js",
    "context-menu.js",
    "navigation.js",
    "assets/ui/icon-cargo.png",
    "assets/ship-tree-atlas.png",
    "assets/oree-atlas.png",
    "assets/ui/button-hover.png",
    "assets/ui/icon-sound.png",
    "assets/ui/primary.png",
    "assets/ui/icon-actions.png",
    "assets/ui/icon-radar.png",
    "assets/ui/icon-ship.png",
    "assets/ui/icon-dock.png",
    "assets/ui/icon-credits.png",
    "assets/ui/icon-equipment.png",
    "assets/ui/icon-engine.png",
    "assets/ui/icon-brake.png",
    "assets/ui/icon-help.png",
    "assets/ui/icon-close.png",
    "assets/ui/oree-pixel.ttf",
    "assets/ui/panel.png",
    "assets/ui/button.png",
    "assets/ui/button-pressed.png",
    "assets/ui/primary-pressed.png",
    "assets/ui/icon-mine.png"
)

if (Test-Path $snapshotDir) { Remove-Item $snapshotDir -Recurse -Force }
New-Item -ItemType Directory -Path $snapshotDir | Out-Null

Write-Host "Téléchargement de la snapshot en ligne depuis $BaseUrl ..."
$changed = @()
$newFiles = @()
$errors = @()

foreach ($f in $files) {
    $dest = Join-Path $snapshotDir ($f -replace "/", "\")
    $destDir = Split-Path -Parent $dest
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }

    try {
        Invoke-WebRequest -Uri "$BaseUrl/$f" -OutFile $dest -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop
    } catch {
        $errors += $f
        continue
    }

    $localPath = Join-Path $root ($f -replace "/", "\")
    if (-not (Test-Path $localPath)) {
        $newFiles += $f
    } else {
        $ext = [System.IO.Path]::GetExtension($f).ToLower()
        if ($ext -in @(".html", ".css", ".js")) {
            # Le HTML servi embarque un jeton anti-bot Cloudflare qui change à
            # chaque requête (window.__CF$cv$params={...}) : on l'ignore pour
            # ne comparer que le vrai contenu du fichier.
            $localText = (Get-Content -LiteralPath $localPath -Raw) -replace 'window\.__CF\$cv\$params\s*=\s*\{[^}]*\};?', ''
            $remoteText = (Get-Content -LiteralPath $dest -Raw) -replace 'window\.__CF\$cv\$params\s*=\s*\{[^}]*\};?', ''
            if ($localText -ne $remoteText) {
                $changed += $f
            }
        } else {
            $localHash = (Get-FileHash $localPath -Algorithm SHA256).Hash
            $remoteHash = (Get-FileHash $dest -Algorithm SHA256).Hash
            if ($localHash -ne $remoteHash) {
                $changed += $f
            }
        }
    }
}

Write-Host ""
Write-Host "=== Résultat de la synchronisation ==="
if ($newFiles.Count -gt 0) {
    Write-Host "`nFichiers présents en ligne mais absents en local (nouveaux) :" -ForegroundColor Yellow
    $newFiles | ForEach-Object { Write-Host "  + $_" }
}
if ($changed.Count -gt 0) {
    Write-Host "`nFichiers différents entre le local et la version en ligne :" -ForegroundColor Cyan
    $changed | ForEach-Object { Write-Host "  ~ $_" }
    Write-Host "`nPour voir un diff texte d'un fichier :"
    Write-Host "  fc `"$root\<fichier>`" `"$snapshotDir\<fichier>`""
} else {
    Write-Host "`nAucune différence détectée sur les fichiers texte/connus." -ForegroundColor Green
}
if ($errors.Count -gt 0) {
    Write-Host "`nErreurs de téléchargement (fichier supprimé du site ?) :" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  ! $_" }
}

Write-Host "`nSnapshot complète sauvegardée dans : $snapshotDir"
Write-Host "Rien n'a été modifié dans le code local. Fusionnez manuellement ce qui vous intéresse."
