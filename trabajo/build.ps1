# Reempaqueta EnviaCertificados.exe con la interfaz de ui\index.html.
# Uso:
#   .\build.ps1                                  -> build\EnviaCertificados.exe
#   .\build.ps1 -Out build\X.exe -Ui otra.html    -> salida / UI alternativas
#   .\build.ps1 -Smoke                           -> ademas arranca el .exe, comprueba GET / y /api/info y lo cierra
# Requisito: Node 26.x en el PATH (se usa `node --build-sea`, Node >= 25.5). No necesita postject.
param(
  [string]$Out = "build\EnviaCertificados.exe",
  [string]$Ui = "ui\index.html",
  [string]$Original = "..\Entrega\Entrega\EnviaCertificados.exe",
  [switch]$Smoke,
  [int]$Port = 48711
)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$nodeVer = (node -v)
if (-not ($nodeVer -match '^v2[6-9]\.')) { Write-Warning "Node ${nodeVer}: el original se hizo con Node v26.13.0; se recomienda Node 26.x" }

# 1) Extraer el bundle original (solo lectura del .exe original) si aun no existe
if (-not (Test-Path "extracted\app.js")) {
  node tools\extract-sea.js $Original extracted
  if ($LASTEXITCODE) { throw "fallo extract-sea" }
}
if (-not (Test-Path $Ui)) { node tools\extract-ui.js extracted\app.js $Ui }

# 2) Inyectar la UI y construir el ejecutable
node tools\build.js $Out $Ui
if ($LASTEXITCODE) { throw "fallo build.js" }

# 3) Prueba de humo opcional (no abre navegador, solo escucha en 127.0.0.1)
if ($Smoke) {
  $env:CERT_PORT = "$Port"; $env:CERT_NO_BROWSER = "1"
  $p = Start-Process -FilePath (Resolve-Path $Out) -PassThru -WindowStyle Hidden
  try {
    $r = $null
    for ($i = 0; $i -lt 40 -and -not $r; $i++) {
      Start-Sleep -Milliseconds 500
      try { $r = Invoke-WebRequest "http://127.0.0.1:$Port/" -UseBasicParsing -TimeoutSec 3 } catch {}
    }
    if (-not $r) { throw "el servidor no respondio en el puerto $Port" }
    $info = Invoke-WebRequest "http://127.0.0.1:$Port/api/info" -UseBasicParsing -TimeoutSec 3
    $title = [regex]::Match($r.Content, '<title>(.*?)</title>').Groups[1].Value
    "GET / -> HTTP $($r.StatusCode), $($r.RawContentLength) bytes, title='$title'"
    "GET /api/info -> HTTP $($info.StatusCode), version=$(($info.Content | ConvertFrom-Json).version)"
  } finally {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    Remove-Item Env:CERT_PORT, Env:CERT_NO_BROWSER -ErrorAction SilentlyContinue
  }
}
