# Reempaquetar EnviaCertificados.exe con la interfaz modificada

## Requisitos
- Windows, **Node 26.x** en el PATH (probado con v26.13.1; el original usa v26.13.0).
  Se usa `node --build-sea` (integrado desde Node 25.5): **no hace falta postject** ni instalar nada.
- El .exe original en `..\Entrega\Entrega\EnviaCertificados.exe` (solo se lee).

## Estructura
| Ruta | QuÃ© es |
|---|---|
| `ui/index.html` | **La interfaz editable** (HTML+CSS+JS en un solo fichero). Ver `ui/NOTA-EXTRACCION.md`. |
| `extracted/app.js` | Bundle original del servidor extraÃ­do del .exe. **Base de la reconstrucciÃ³n, no editar.** |
| `extracted/sea-blob.bin` | Blob SEA original completo (referencia). |
| `extracted/server-tail*.js` | Solo lectura: trozo final del bundle (servidor HTTP y rutas), formateado. |
| `tools/extract-sea.js` | Lee el recurso PE `NODE_SEA_BLOB` y saca `sea-blob.bin` + `app.js`. |
| `tools/extract-ui.js` | Saca el HTML del mÃ³dulo `vfe.exports=\`â€¦\`` de `app.js`. |
| `tools/build.js` | Sustituye el HTML en `app.js` por `ui/index.html` y ejecuta `node --build-sea`. |
| `build.ps1` | Todo lo anterior en un comando (+ prueba de humo opcional). |

## Procedimiento (comandos exactos, PowerShell)
```powershell
cd "<raíz del proyecto>\trabajo"
# 1. editar ui\index.html
# 2. reconstruir y probar:
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1 -Out build\EnviaCertificados.exe -Smoke
```
Equivalente paso a paso:
```powershell
node tools\extract-sea.js ..\Entrega\Entrega\EnviaCertificados.exe extracted   # solo si falta extracted\app.js
node tools\extract-ui.js  extracted\app.js ui\index.html                         # solo si falta ui\index.html
node tools\build.js build\EnviaCertificados.exe ui\index.html
```
`build.js` genera `build\dist\app.js` y `build\sea-config.json`
(`{"main":"dist/app.js","disableExperimentalSEAWarning":true,"useSnapshot":false,"useCodeCache":false}`)
y ejecuta `node --build-sea sea-config.json` con `cwd=build\`, de modo que la ruta embebida es
`dist/app.js` como en el original (y no se filtra ninguna ruta local).

- Si `ui\index.html` no cambia, se reutiliza el literal original byte a byte: **el blob SEA resultante
  es idÃ©ntico al original** (verificado: `sea-blob.bin` igual byte a byte).
- Si cambia, el HTML se inserta como cadena JSON (`vfe.exports="â€¦"`), equivalente para JS.

## Prueba manual sin abrir el navegador
```powershell
$env:CERT_PORT="48711"; $env:CERT_NO_BROWSER="1"; .\build\EnviaCertificados.exe
# en otra consola: Invoke-WebRequest http://127.0.0.1:48711/ -UseBasicParsing
```
Variables de entorno que entiende la app: `CERT_PORT` (por defecto 4870; si estÃ¡ ocupado prueba los
siguientes) y `CERT_NO_BROWSER` (no abre el navegador).

## Notas / riesgos
- El .exe resultante usa el `node.exe` local (26.13.1) en vez del 26.13.0 original: mismo major/minor,
  parche distinto. Si se actualiza Node a otra versiÃ³n mayor, revisar que el bundle sigue arrancando.
- Las propiedades del fichero (icono, "Node.js" como descripciÃ³n) son las del node.exe; el original
  tambiÃ©n tenÃ­a las de Node, asÃ­ que no cambia nada visible.
- El .exe no estÃ¡ firmado (el original tampoco): SmartScreen seguirÃ¡ avisando igual.
- Mantener la versiÃ³n `1.4.0`: si otra instancia con distinta versiÃ³n ocupa el puerto, la app abre
  una segunda en el puerto siguiente (comportamiento del servidor, ver `Tw()`).

