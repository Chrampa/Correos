# TAREA 0 · Resumen de viabilidad

**Veredicto: VIABLE.** Se puede extraer la interfaz a un fichero editable y volver a generar un .exe
funcional sin tocar el servidor.

## Evidencia
- `ui/index.html`: interfaz extraída (92 896 bytes, 1 184 líneas, 8 `data-page` 0–7). Cómo se localizó: `ui/NOTA-EXTRACCION.md`.
- Reconstrucción **sin cambios**: el blob SEA del .exe nuevo es **idéntico byte a byte** al original
  (`dist/app.js`, 4 844 044 bytes).
- Prueba de humo (`prueba/smoke.txt` y salida de `build.ps1 -Smoke`), con `CERT_NO_BROWSER=1` y solo en 127.0.0.1:
  ```
  EnviaCertificados-sincambios.exe puerto=48711 | GET / -> HTTP 200, 92896 bytes, text/html; charset=utf-8, title='Envío de certificados', data-page=8 | GET /api/info -> HTTP 200, version=1.4.0 | proceso cerrado
  EnviaCertificados-titulo.exe     puerto=48712 | GET / -> HTTP 200, 92913 bytes, title='Envío de certificados (prueba rebuild)', data-page=8 | GET /api/info -> HTTP 200, version=1.4.0 | proceso cerrado
  build.ps1 -Smoke (desde cero, re-extrayendo del original) -> GET / 200, 92896 bytes; /api/info 200 v1.4.0; exit=0
  ```
  No quedan procesos abiertos. No se ha enviado ningún correo ni abierto Outlook (solo GET / y GET /api/info).
- Ejecutables: `build/EnviaCertificados.exe` (UI sin cambios) y `build/EnviaCertificados-titulo.exe` (cambio en `<title>`), ~105 MB cada uno.

## Riesgos
1. **Node local ≠ original**: se empaqueta con node.exe 26.13.1 (el original 26.13.0). Arranca y responde;
   no se han probado los flujos completos (Excel, PDF, Outlook/SMTP), que dependen solo del bundle, que no cambia.
2. **Contrato UI ↔ servidor**: el servidor no se modifica, así que cualquier cambio en la UI debe mantener
   las rutas, cuerpos JSON y la forma del objeto `cfg` (ver abajo). Romperlo no da error al compilar, solo al usar.
3. El `cfg` se guarda en `%APPDATA%\EnviaCertificados\config.json` y lo lee `GET /api/info`; renombrar claves
   de `cfg` rompe la configuración guardada (hay una función `migrar()` en la UI para versiones antiguas).
4. El servidor rechaza POST con `Origin` distinto de `http://127.0.0.1:*`/`http://localhost:*` (403): la UI debe
   seguir servida por el propio servidor, no abrirse como fichero.
5. Solo existe la ruta `GET /` para la UI: no se pueden añadir .css/.js/imagenes externos sin tocar el servidor;
   todo debe ir incrustado (o como `data:` URI) en el único HTML.
6. .exe sin firmar (igual que el original). Sin herramientas instaladas: solo se usó `npx prettier@3.3.3`
   (caché de npm, no global) para formatear el trozo del servidor para leerlo.

## Contrato que la UI usa del servidor (no romper)
Helper `api(url, body, raw)`: `GET` si `body===undefined`, si no `POST` JSON; con `raw` devuelve la `Response`.

| Ruta | Llamada desde la UI | Cuerpo / respuesta |
|---|---|---|
| `GET /` | — | El HTML (este fichero) |
| `GET /api/info` | arranque (l.1173) | `{version, config, salida, so, …}` → carga `cfg` |
| `POST /api/config` | `guardar()` | `cfg` |
| `POST /api/lista` | carga de Excel (l.743) | `{nombre, datos(base64)}` → `{hojas:[{hoja, filas, filaEncabezado…}]}` |
| `POST /api/vista` | vista previa (l.1011) | `{config, fila, tipo}` → PDF (blob) + cabecera `X-Faltan` (JSON urlencoded) |
| `POST /api/smtp` | probar conexión (l.1034) | `{smtp, correo}` |
| `POST /api/prueba` | correo de prueba (l.1074) | `{config, fila, para}` |
| `POST /api/ejecutar` | `lanzar()` (l.1097) | `{config, filas, indices, modo:'enviar'|'generar', reutilizar}` |
| `GET /api/estado` | `sondear()` (l.1129) | estado del trabajo `{id, …}` (polling) |
| `POST /api/parar` | botón parar | — |
| `POST /api/abrir` | abrir carpeta | — |
| `POST /api/rebotes` | `comprobarRebotes()` (l.1120) | `{config, dias}` → `{marcados, …}` |
| `POST /api/recibidos?nombre=` | ZIP de certificados (l.858) | cuerpo binario crudo (`fetch` directo) |
| `GET /api/recibido?id=` | enlace «Ver PDF» (l.902) | PDF |
| `POST /api/excel` | Excel actualizado (l.983) | `{hoja, filaEncabezado, columnas, filas, extra, editables}` → .xlsx (blob) |
| `POST /api/salir` | botón salir (l.1164) | cierra el proceso |

**Objeto `cfg`** (definido en `const DEF` l.504, enlazado por 80 `data-bind`): secciones `datos`, `evento`,
`certificado` (+`plantilla`), `justificante`, `recibidos`, `extra`, `correo`, `smtp`, `salida`, `modo`.
Rutas `data-bind` en uso: datos.{nombre,email,dni,capitalizar,invertirComa}; evento.{evento,fecha,horario,horas,lugar,
lugar_firma,organizador,firmante,cargo_firmante,firmante2,cargo_firmante2,fecha_emision}; certificado.{activo,archivo,color,
titulo,subtitulo,encabezado,intro,cuerpo,lugarFecha,mostrarCodigo, plantilla.{x,fuente,colorTexto,nombreY,nombreSize,
nombreNegrita,cuerpoActivo,cuerpoY,cuerpoSize,cuerpoAncho,codigoActivo,codigoY}}; justificante.{activo,archivo,titulo,cabecera,
cuerpo,detalles,cierre,color,margenIzq,requiereDni}; recibidos.{activo,archivo}; extra.{activo,carpeta,columna};
correo.{asunto,cuerpo,cco,pausa,remitenteNombre,remitenteEmail,responderA}; smtp.{host,port,seguridad,user,pass,recordar};
salida.carpeta. Las variables de plantilla (`{nombre}`, `{evento}`, `{nombre_pila}`, `{cargos}`…) usan `norm()`, que
la UI declara «mismo criterio que el servidor»: no cambiarla.

**IDs que usa el JS** (si se cambia el HTML deben seguir existiendo): avisosLista ayudaSmtp bCarpeta bDeleg bEnviar bExcel
bExcel2 bExport bGenerar bImport bNinguno bParar bPegar bPrueba bQuitarDup(dinámico) bRebotes bRebotes2 bRecNuevas bRecVaciar
bReintentar bSalir bSmtp bTodos cabeceraJust cardRebotes carpetaSalida cfgDiseno cfgPlantilla checklist colsChips cuenta dlg dlgB
dlgNo dlgSi dlgT drop dropRec fEmision fImport fLista fRec filaPrueba filtro firmaCorreo hoja hojaWrap listaInfo mailPrev
membreteMargen membretePropio modoAct olGrid olVacio paraPrueba pegado progActual progBar progError progTitulo progreso pruebaRes
rebDias rebotesRes recAvisos recCarga recFiltro recInfo recStats remCorreo remNombre sEta sFallos sHechos sOk segMembrete segModo
segSmtp selDni selEmail selExtra smtpGrid smtpPass smtpRes tabla tablaLog tablaPers tablaRec toast ver.
Selectores de clase/atributo: `.page`, `.page.on`, `.step`, `.modo`, `.varChips`, `.pl-codigo`, `.pl-cuerpo`, `main`,
`[data-bind]`, `[data-asset]`, `data-page`, `data-go`, `data-modo`, `data-var`, `data-v`, `data-preview`, `data-edit`, `data-accept`.

**Funciones JS de la UI**: merge set toast esc api confirmar descargar nombreDe vars validarDoc aplicarModo elegirModo ir
onPage pintar guardar cambio pintarChips pintarAsset zona cargar opcionesColumnas usarHoja estadoFilas pintarTabla calcPersonas
asegurarColDni reemparejar sugerirRecibidos nombrePersona pintarRecibidos nuevaPersona filaFusionada construirEnvios
excelActualizado montarPreview vista mailPrev revisar cuentaLista quien lanzar tablaRebotes comprobarRebotes sondear migrar
(+ `get`, `norm`, `fill`, `capit`, `hoy` como constantes flecha). `onclick="ir(n)"` es el único manejador inline.

## Pendiente
- Prueba funcional completa con la UI modificada (cargar Excel de ejemplo, vista previa, generar sin enviar) antes de distribuir.
