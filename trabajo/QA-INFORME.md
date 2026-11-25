# T8 Â· QA final y empaquetado

Fecha: 25-11-2026. UI probada: `ui/index.html` (153 638 bytes, SHA-256 `238624E8â€¦D47E3`, Ãºltima modificaciÃ³n 21:55).
Ejecutable generado: **`trabajo\build\EnviaCertificados-nuevo.exe`** (105 140 040 bytes, SHA-256 `8F2346F6â€¦7A6E`),
copiado a **`<raíz del proyecto>\EnviaCertificados-nuevo.exe`** (hash idéntico).
El original `Entrega\Entrega\EnviaCertificados.exe` **no se ha tocado** (fecha 23-11-2026, hash distinto, sin cambios).

**Resultado global: no hay regresiones funcionales ni de datos; no ha hecho falta corregir nada en `ui/index.html`.**
Hay incumplimientos del sistema de diseÃ±o y puntos de comportamiento nuevos que van como hallazgos (secciÃ³n 6), ninguno bloqueante.

Scripts reutilizables (todos en `trabajo\diseno\`): `comprobar-t8-estatico.js`, `comprobar-t8-e2e.js`, `comprobar-t8-generar.js`, `comprobar-t8-node.js`.
No se enviÃ³ ningÃºn correo, no se abriÃ³ Outlook (comprobado: 0 procesos `outlook` antes y despuÃ©s), no se pulsÃ³ Â«Probar conexiÃ³nÂ», Â«Buscar rebotesÂ» ni Â«Enviarme una pruebaÂ».
El servidor de prueba se arrancÃ³ con `APPDATA` temporal (no se ha modificado `%APPDATA%\EnviaCertificados\config.json` del usuario) y los PDF de la prueba Â«Solo generarÂ» se escribieron en una carpeta temporal ya borrada.

## Resumen de comprobaciones

| # | ComprobaciÃ³n | Resultado |
|---|---|---|
| 1a | IDs, data-*, clases del JS, `data-bind`/`DEF`, llamadas `/api/*`, marcadores | **OK** |
| 1b | Diff de la lÃ³gica JS original â†’ actual | **OK con cambios de presentaciÃ³n/estado documentados (6.1)** |
| 1c | HTML/CSS roto por ediciones concurrentes | **OK** |
| 2 | Sintaxis JS, HTML bÃ¡sico, iconos del sprite | **OK** |
| 3 | Funcional con servidor real, opciones A, B, C, D hasta pantalla 7 | **OK** (con lÃ­mites: ver Â«No probadoÂ») |
| 4 | Visual 360/768/1280, desbordes, foco, contraste, radios, emojis | **OK salvo objetivos tÃ¡ctiles en mÃ³vil, degradado en scroll de tablas y `style=` residuales (FALLO parcial)** |
| 5 | Hallazgos de la auditorÃ­a (`.two`, Pendiente/Saltado, `confirmar()`) | `.two` **OK (resuelto)**; Pendiente/Saltado **es nuevo, no del original**; `confirmar()` **igual que el original** |
| 6 | Riesgo Node 26.13.1 vs 26.13.0 | **OK** |

## 1. Integridad frente al original

UI original extraÃ­da del `.exe` original con `tools\extract-sea.js` + `tools\extract-ui.js` a un temporal (92 896 bytes, igual que el documentado en `NOTA-EXTRACCION.md`).

- **IDs:** los 91 IDs del original siguen presentes (el 92 que cuenta `comprobar-ids-t3.js` incluye sÃ­mbolos). Sin IDs duplicados en el HTML estÃ¡tico. IDs nuevos: `navPasos navToggle navActual listaEstado t6Metodo` (+ los sÃ­mbolos del sprite). Los `$('#â€¦')` del JS (91) tienen todos elemento, estÃ¡tico o creado por plantilla (`bOtroArchivo`, `bBorrarFiltro`, `bElegirCol`â€¦).
- **data-\*:** 19 atributos y 112 valores `data-bind/go/page/modo/v/asset/var/preview/accept` presentes. **68 `data-bind` idÃ©nticos** (ninguno nuevo, ninguno perdido). Bloque `const DEF` (claves de `cfg`) **idÃ©ntico byte a byte**.
- **Clases usadas por el JS** (12 en selectores + `classList`): todas siguen.
- **`fetch`/`api(...)`:** las 14 llamadas `/api/*` (mÃ©todo por `body===undefined`, ruta y payload) son idÃ©nticas al original. `confirmar`, `norm`, `fill`, `vars`, `get` no cambian de lÃ³gica.
- **Marcadores** `{nombre_pila} {evento} {fecha} {horario} {lugar} {cargos} {nombre} {dni}`: mismo nÃºmero de apariciones.
- **Funciones:** las 50 originales siguen; nuevas `estadoLista`, `recEstado`. 133 `const` de nivel y 28 handlers `$('#id').onX` conservados.
- **Servidor:** el bundle `dist/app.js` del exe nuevo es **idÃ©ntico al original byte a byte fuera del literal HTML** (prefijo 3 197 814 B y sufijo 1 552 151 B iguales). El servidor no ha cambiado.
- **HTML/CSS roto:** etiquetas del `<body>` balanceadas, llaves CSS balanceadas (profundidad final 0), bloques `T4/T5/T6-inicio/fin` bien cerrados. La capa base solo la redefinen T4/T5/T6 en `.modos`, `.modo`, `.modo:hover`, `.modo.on` (y su regla mÃ³vil): es la reescritura intencionada de la pantalla 0 como lista (el `.modo` base queda como cÃ³digo muerto, inocuo). Ninguna otra regla base se pisa.
- Hay ahora **dos** `<script>`: el principal (igual que el original, con cambios en 6.1) y uno pequeÃ±o de la capa base T3 (menÃº mÃ³vil `#navPasos`), solo presentaciÃ³n, no toca estado ni API.

### 6.1 Diferencias de comportamiento en el JS (ignorando markup/texto)

Ninguna cambia rutas, payloads, claves de cfg ni datos enviados. Lo que **sÃ­** es nuevo (todo presentaciÃ³n/estado de UI):
1. `cargar()`: ya no hay `toast` de error; un fallo del servidor muestra el panel `#listaEstado` (oculta `#drop` hasta elegir otro archivo). Nuevo `estadoLista()`.
2. `pintarTabla()`: estado vacÃ­o (sin filas / sin coincidencias con botÃ³n Â«Borrar bÃºsquedaÂ»), alerta `sinCol` (Â«No encuentro la columna del correoÂ») si **todas** las filas marcadas (â‰¥2) tienen correo invÃ¡lido, columnas reordenadas (Nombre con casilla, Estado, Correo, DNI/NIE, N.Âº), contador Â«N de M marcadasÂ».
3. `bEnviar` muestra `E.length - malas` (correos que saldrÃ¡n de verdad); antes `E.length` (incluÃ­a sin correo). Coherente con el diÃ¡logo, que ya usaba `indices` filtrados.
4. `bSmtp.onclick`: `try/catch/finally` + botÃ³n deshabilitado durante la prueba (antes quedaba en Â«Conectandoâ€¦Â» si fallaba la red). Se borra el resultado al cambiar cuenta/remitente (`t6LimpiaConexion`).
5. `vista()`: guarda de carrera `box._seq` (solo vale la Ãºltima peticiÃ³n) y estados de carga/error con Â«ReintentarÂ».
6. `revisar()`: checklist reordenada (avisos primero), cifras resumen, botones Â«Ir a <paso>Â» con el nombre real del paso.
7. `sondear()`: tÃ­tulos nuevos; tabla de estado **sin la columna #** (la fila va en `title`), orden por gravedad (Rebotado, Error, Saltado) cuando termina; estados **Â«PendienteÂ» y Â«SaltadoÂ» nuevos** (ver 5.2).
8. `pintarRecibidos()`: columnas reordenadas, `#bRecVaciar` oculto si no hay certificados, `#bRecNuevas` pasa a `.pri` si hay sin asignar, Â«â˜…Â» â†’ Â«Posible:Â», estados vacÃ­os. `recEstado()` para carga/error/ok del ZIP; `#dropRec` ahora se activa con Enter/Espacio.
9. `confirmar()` por defecto Â«ContinuarÂ» (antes Â«AceptarÂ»); la lÃ³gica es la misma.

## 2. Sintaxis y referencias

- `node --check` sobre el script principal extraÃ­do: **OK** (original y nuevo).
- Los 25 `<use href="#i-â€¦">`/nombres de icono usados (HTML y plantillas JS, incluidos los compuestos `pl('ok','circle-check',â€¦)` y la tabla `est`) existen en el sprite (32 sÃ­mbolos). El Ãºnico Â«falloÂ» del script (`i-nombre`) es un comentario CSS de ejemplo, no una referencia real.
- SÃ­mbolos sin usar (inocuos): `i-calendar i-send i-info i-download i-x i-log-out i-signature i-image`.
- Falsos positivos del script revisados a mano: `</html>` (queda fuera del `<body>` analizado) y `â†’` (estÃ¡ en un comentario JS, lÃ­nea ~1212).

## 3. Funcional con servidor real (`comprobar-t8-e2e.js`, `comprobar-t8-generar.js`)

Chrome headless + CDP contra `EnviaCertificados-nuevo.exe` con `CERT_NO_BROWSER=1`, puerto 48731/48751.

- **Arranque** y `/api/info` (`version=1.4.0`, claves `version,config,salida,so`): OK.
- **OpciÃ³n A (certificados):** `asistentes-ejemplo.xlsx` cargado (10 filas, columnas detectadas Â«Correo electrÃ³nicoÂ» y Â«DNIÂ»); datos del evento; vista previa del certificado (`/api/vista`, iframe con blob): OK; vista previa del justificante: OK; pantalla 6; pantalla 7 (Â«Generar y enviar a 9 personasÂ», 1 se salta por correo invÃ¡lido). Â«Generar y enviarÂ» abre el diÃ¡logo Â«Â¿Enviar 9 correos ahora?Â» con remitente, asunto y Â«Se saltan 1Â»; se pulsÃ³ **Cancelar**, `/api/estado` queda `{}` (nada en marcha).
- **OpciÃ³n B (justificantes):** pasos `0,1,2,4,6,7`; vista previa del justificante OK; pantalla 7 sin avisos de adjuntos.
- **OpciÃ³n C (ya creados):** pasos `1,5,6,7`; carga del ZIP (generado con el PDF de ejemplo) y del PDF suelto: Â«2 certificados cargadosÂ», tabla, estadÃ­sticas, diÃ¡logo de sugerencia aceptado; pantalla 7 con aviso Â«2 certificados recibidos sin asignarÂ». *El certificado de ejemplo no corresponde a nadie de `asistentes-ejemplo.xlsx`, por eso queda Â«Sin asignarÂ»* (ver Â«No probadoÂ»).
- **OpciÃ³n D (solo correo):** pasos `0,1,2,6,7`, Â«Enviar a 9 personasÂ», sin Â«Solo generarÂ».
- **Sin lista cargada:** vista previa del correo y pantalla 7 muestran sus estados vacÃ­os con botÃ³n Â«Ir aâ€¦Â».
- **Progreso real** con Â«Solo generar los PDFÂ» a carpeta temporal (no envÃ­a nada): fase Â«PendienteÂ» visible (`Generando 0 de 10 (0 %)`, 10 filas Pendiente) y fin Â«Generados 10 de 10Â», barra verde, tabla con estado/icono, PDF+registro escritos. En 360, 768 y 1280.
- **Errores de UI:** bÃºsqueda sin resultados â†’ estado vacÃ­o; fallo de lectura de lista (simulado desde el navegador devolviendo 500, porque el servidor real acepta casi cualquier fichero como CSV) â†’ panel de error y recuperaciÃ³n al elegir un archivo vÃ¡lido.
- **Consola:** 0 errores, 0 avisos, 0 excepciones, 0 `alert`/`confirm` nativos; **0 respuestas HTTP â‰¥ 400**.

**NO PROBADO (a propÃ³sito o por falta de datos):** envÃ­o real, Â«Enviarme una pruebaÂ» (`/api/prueba`), Â«Probar conexiÃ³nÂ» (`/api/smtp`, abre Outlook), Â«Buscar rebotesÂ» (`/api/rebotes`), Â«Descargar Excel actualizadoÂ» (`/api/excel`), Â«Reintentar fallidosÂ», Â«Abrir carpetaÂ», Â«DetenerÂ» y asignaciÃ³n de un certificado a una persona concreta por DNI/nombre (el ejemplo no coincide con nadie del Excel). Todos estos handlers conservan las mismas llamadas `/api` que el original (secciÃ³n 1), y el servidor es idÃ©ntico.

## 4. Visual

Capturas en `trabajo\diseno\capturas\t8-<ancho>-<pantalla>.png` (54 PNG: pantallas 0â€“7 a 360/768/1280 px, mÃ¡s estados vacÃ­os, error, progreso, diÃ¡logo, toast y menÃº mÃ³vil), p. ej.:
`t8-360-p0-inicio.png`, `t8-360-p1-lista-vacia.png`, `t8-360-p1-lista.png`, `t8-360-p2-evento.png`, `t8-360-p3-certificado.png`, `t8-360-p4-justificante.png`, `t8-360-p5-recibidos.png`, `t8-360-p6-correo.png`, `t8-360-p7-enviar.png`, `t8-360-p7-progreso.png`, `t8-360-nav-abierto.png`, `t8-360-dialogo.png` y los equivalentes `t8-768-â€¦` y `t8-1280-â€¦` (mÃ¡s `t8-1280-B-p7.png`, `t8-1280-D-p7.png`, `t8-1280-dialogo-enviar.png`). Datos crudos: `t8-auditoria.json` y `t8-resultado.json`.

| Criterio | Resultado |
|---|---|
| Desbordamiento horizontal (360/768/1280, todas las pantallas y estados) | **OK** (ninguno) |
| Foco visible (tabulaciÃ³n en pantalla 0; regla global `:focus-visible`, sin `outline:none`) | **OK** |
| Contraste (texto computado vs fondo efectivo; 4,5:1, 3:1 en texto grande) | **OK**, 0 incumplimientos en los estados capturados (no cubre placeholders ni controles deshabilitados) |
| Emojis/pictogramas como iconos | **OK** (ninguno en el DOM ni en el fuente) |
| Radios | **OK** (solo `4px` y `8px` calculados en todo el DOM) |
| Sombras fuera de diÃ¡logo/toast | **OK en lo renderizado**; ver F2 (reglas inset de fila en error) |
| Degradados | **FALLO** (F2) |
| `style=` inline innecesarios | **FALLO menor** (F3) |
| Objetivos tÃ¡ctiles â‰¥ 44 px en mÃ³vil (360) | **FALLO parcial** (F1) |

## 5. Hallazgos de la auditorÃ­a

1. **`.two` entre 1101 y 1125 px: resuelto.** La capa base redujo las columnas a `minmax(320px,1fr) minmax(340px,1.1fr)` con `gap:16px` (cabe desde ~1000 px) y la regla de 1 columna sigue en `max-width:1100px`. Barrido de 1060 a 1160 px de 4 en 4, pantallas 2, 3, 4, 6, 7: sin desborde de `main`, de la pÃ¡gina ni de ningÃºn hijo.
2. **Â«PendienteÂ» / Â«SaltadoÂ»: no existÃ­an en el original; son una funciÃ³n nueva solo de interfaz.** Ni el HTML original ni el bundle del servidor contienen esas palabras (el servidor solo registra Enviado/Generado/Error/Rebotado). La UI las deduce de `window._t6Lote`/`_t6Saltados`, que solo existen en la ventana que lanzÃ³ el lote y solo si `lote.length === j.total`. Consecuencias: tras recargar la pestaÃ±a o abrir otra ventana con un envÃ­o en marcha no aparecen filas Â«PendienteÂ»/Â«SaltadoÂ» (se ve solo el log del servidor, como en el original); en modo Â«Solo generarÂ» no hay Â«SaltadoÂ» (se procesan tambiÃ©n los sin correo, igual que antes). No afecta a lo que se envÃ­a. DecisiÃ³n pendiente: aceptarlo asÃ­ o calcularlo desde el servidor (requerirÃ­a tocar el servidor).
3. **`confirmar()` base: lÃ³gica idÃ©ntica al original** (`showModal`, `dlgSi`/`dlgNo`); solo cambia el texto por defecto (Â«ContinuarÂ»). Comportamiento heredado: el foco inicial cae en Â«CancelarÂ» (seguro); **Escape cierra el `<dialog>` de forma nativa sin resolver la promesa** (queda pendiente para siempre; en `lanzar()` equivale a cancelar, no se envÃ­a nada) y no hay cierre por clic fuera. Sin consecuencias, pero conviene no depender de la promesa en usos futuros.

## 6. Hallazgos pendientes (informe; no corregidos)

- **F1 â€“ Objetivos tÃ¡ctiles < 44 px a 360 px (incumple SISTEMA.md):** `input.t4-email` 220Ã—36 y `input` DNI 132Ã—36 y etiqueta de casilla 142Ã—22 en la tabla de la lista (pantalla 1); `input.t5-color` 294Ã—36 (pantallas 3 y 4); `input[type=range]` 222Ã—16 (pantalla 4, margen); `select.t5-sel-pers` 220Ã—30 (pantalla 5). Los botones, `.step`, chips y menÃº mÃ³vil sÃ­ cumplen en 360. En 768/1280 los controles miden 34â€“36 px y los chips 28 px (la regla de 44 px es solo mÃ³vil). Arreglo sugerido: `min-height:var(--toque)` en esas clases dentro de `@media (max-width:760px)`.
- **F2 â€“ Degradados/sombras:** `linear-gradient` para el indicador de scroll lateral de `.tbl` (lÃ­neas ~360-361 de `ui/index.html`, capa base mÃ³vil; en 360 detectado en `.t4-tabla`, `.t5-alto-l`, `.t5-alto-m`) y `box-shadow:inset 3px 0 0` como franja de color en `.t6-fila-bad/.t6-fila-warn` (lÃ­neas ~551-552). Son afordancias funcionales, no decoraciÃ³n, pero tÃ©cnicamente chocan con Â«sin degradados ni sombras fuera de diÃ¡logo/toastÂ». DecisiÃ³n de diseÃ±o.
- **F3 â€“ `style=` inline:** 3 en el HTML estÃ¡tico (`#ver` `margin-top:6px`, `#dlgT` `margin-top:0`, fila de botones del diÃ¡logo `justify-content:flex-end;margin-top:18px`), mÃ¡s el del sprite (`display:none`, aceptable) y el de la pantalla Â«AplicaciÃ³n cerradaÂ» en JS. Ya estaban en el original.
- **F4 â€“ CosmÃ©tico:** con 0 personas la pantalla 7 marca Â«CorrectoÂ» en Â«Todos los correos tienen un formato vÃ¡lidoÂ» y Â«Eventoâ€¦Â» (el estado vacÃ­o superior ya avisa); tras un error de lectura la tabla anterior sigue visible bajo el panel de error.
- **F5 â€“ Servidor (heredado):** `/api/lista` acepta casi cualquier fichero (lo trata como CSV): un binario/vacÃ­o da Â«El archivo no tiene personasÂ», no un error. El panel Â«No se ha podido leerÂ» solo sale si el servidor devuelve error.

## 7. Riesgo Node (26.13.1 local vs 26.13.0 original) â€” **OK**

`comprobar-t8-node.js` arranca ambos exe con `APPDATA` temporal y compara:

| | Original | Nuevo |
|---|---|---|
| VersiÃ³n Node embebida (VersionInfo) | 26.13.0 | 26.13.1 |
| Arranque hasta `/api/info` | 985 ms | 534 ms |
| `GET /` | 200 `text/html; charset=utf-8` | 200 `text/html; charset=utf-8` |
| `GET /nada` | 404 | 404 |
| `POST /api/config` con `Origin` ajeno | 403 | 403 |
| `GET /api/estado` | `{}` | `{}` |
| `GET /api/info` | **texto idÃ©ntico** (version 1.4.0, so win32) | idÃ©ntico |

AdemÃ¡s todo el recorrido de la secciÃ³n 3 (xlsx, ZIP/PDF, vistas previas con generaciÃ³n de PDF, generaciÃ³n de lote) funciona sobre 26.13.1 sin errores. Mismo major/minor, parche distinto; el bundle del servidor es idÃ©ntico. Riesgo residual: solo los caminos no probados (Outlook COM, SMTP) por no poder ejercerlos aquÃ­; no dependen de la versiÃ³n de parche de Node, pero se recomienda la prueba manual de abajo.

## Correcciones hechas

**Ninguna.** No se encontrÃ³ HTML roto, ID perdido, icono roto ni desborde que corregir; `ui/index.html` y el servidor quedan como estaban. El `.exe` se generÃ³ con `build.ps1 -Out build\EnviaCertificados-nuevo.exe -Smoke` (GET / 200 de 153 638 B, `title='EnvÃ­o de certificados y justificantes'`, `/api/info` 200 v1.4.0) a partir del `ui/index.html` actual (el exe es posterior a la Ãºltima ediciÃ³n, 21:55 < 21:57).

## Pasos de prueba manual para el usuario

Antes de distribuir, con el `.exe` nuevo (no sustituye al original; hay que probar con Outlook real, que aquÃ­ no se pudo):
1. Doble clic en `EnviaCertificados-nuevo.exe`; se abre el navegador. Comprueba el tÃ­tulo de la pestaÃ±a y que el menÃº izquierdo muestra Â«InicioÂ» y las 4 opciones.
2. **OpciÃ³n A:** carga `asistentes-ejemplo.xlsx`; revisa que se detectan correo y DNI; rellena evento/fecha; mira las vistas previas del certificado (paso 3).
3. **Correo â†’ Â«Outlook de este ordenadorÂ» â†’ Â«Probar conexiÃ³nÂ»:** debe decir Â«ConexiÃ³n correctaÂ» con tu cuenta. Cambia el remitente y comprueba que el resultado se borra.
4. **Revisar y enviar:** pon tu correo en Â«Enviar la prueba aÂ» y pulsa Â«Enviarme una pruebaÂ»; comprueba el correo y el adjunto. Pulsa Â«Generar y enviar a N personasÂ» y **Cancelar** en el diÃ¡logo (comprueba que N excluye a quien no tiene correo vÃ¡lido).
5. Un envÃ­o real **pequeÃ±o** (2-3 personas tuyas): mira la tabla de estado (Pendiente â†’ Enviado), el resumen final y Â«Abrir carpetaÂ»; recarga la pestaÃ±a a mitad para ver que el envÃ­o sigue (ahÃ­ no habrÃ¡ Â«PendienteÂ»).
6. **OpciÃ³n C:** ZIP real de certificados + Excel; asigna, Â«AÃ±adir los no encontrados como personas nuevasÂ», Â«Descargar Excel actualizadoÂ», envÃ­o pequeÃ±o.
7. **Opciones B y D:** una prueba breve cada una hasta el diÃ¡logo de confirmaciÃ³n.
8. Â«Buscar rebotesÂ» (necesita Outlook) con una direcciÃ³n inventada.
9. En mÃ³vil/ventana estrecha (â‰ˆ 360 px) confirma que se pueden pulsar bien los campos de la tabla de la lista (ver F1).
10. Si algo falla, sigue disponible el original en `Entrega\Entrega\EnviaCertificados.exe`.

