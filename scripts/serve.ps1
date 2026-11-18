param(
    [int]$Port = 8080
)

$Root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $PSScriptRoot "server.pid"
$logFile = Join-Path $PSScriptRoot "server.log"

$mime = @{
    ".html"  = "text/html; charset=utf-8"
    ".css"   = "text/css; charset=utf-8"
    ".js"    = "text/javascript; charset=utf-8"
    ".mjs"   = "text/javascript; charset=utf-8"
    ".json"  = "application/json"
    ".png"   = "image/png"
    ".jpg"   = "image/jpeg"
    ".jpeg"  = "image/jpeg"
    ".gif"   = "image/gif"
    ".svg"   = "image/svg+xml"
    ".ttf"   = "font/ttf"
    ".woff"  = "font/woff"
    ".woff2" = "font/woff2"
    ".ico"   = "image/x-icon"
    ".mp3"   = "audio/mpeg"
    ".wav"   = "audio/wav"
}

$listener = New-Object System.Net.HttpListener
$prefix = "http://localhost:$Port/"
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    "Impossible de démarrer le serveur sur $prefix : $($_.Exception.Message)" | Tee-Object -FilePath $logFile -Append
    exit 1
}

$PID | Out-File -FilePath $pidFile -Encoding ascii -Force
"ORÉE server running at $prefix (root: $Root) - PID $PID" | Tee-Object -FilePath $logFile -Append

$rootFull = [System.IO.Path]::GetFullPath($Root)

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        try {
            $reqPath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            if ($reqPath -eq "/") { $reqPath = "/index.html" }
            $relative = $reqPath.TrimStart("/") -replace "/", "\"
            $filePath = [System.IO.Path]::GetFullPath((Join-Path $rootFull $relative))

            if (-not $filePath.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
            } elseif (Test-Path -LiteralPath $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $contentType = $mime[$ext]
                if (-not $contentType) { $contentType = "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentType = $contentType
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $reqPath")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            try { $response.StatusCode = 500 } catch {}
        } finally {
            $response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
    $listener.Close()
    Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
    "Server stopped" | Tee-Object -FilePath $logFile -Append
}
