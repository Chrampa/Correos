# T8 · QA final y empaquetado

Fecha: 25-11-2026. UI probada: `ui/index.html` (153 638 bytes, SHA-256 `238624E8…D47E3`, última modificación 21:55).
Ejecutable generado: **`trabajo\build\EnviaCertificados-nuevo.exe`** (105 140 040 bytes, SHA-256 `8F2346F6…7A6E`),
copiado a **`C:\Users\Glen\OneDrive - UPV\Escritorio\correos\EnviaCertificados-nuevo.exe`** (hash idéntico).
El original `Entrega\Entrega\EnviaCertificados.exe` **no se ha tocado** (fecha 23-11-2026, hash distinto, sin cambios).

**Resultado global: no hay regresiones funcionales ni de datos; no ha hecho falta corregir nada en `ui/index.html`.**
Hay incumplimientos del sistema de diseño y puntos de comportamiento nuevos que van como hallazgos (sección 6), ninguno bloqueante.

Scripts reutilizables (todos en `trabajo\diseno\`): `comprobar-t8-estatico.js`, `comprobar-t8-e2e.js`, `comprobar-t8-generar.js`, `comprobar-t8-node.js`.
No se envió ningún correo, no se abrió Outlook (comprobado: 0 procesos `outlook` antes y después), no se pulsó «Probar conexión», «Buscar rebotes» ni «Enviarme una prueba».
El servidor de prueba se arrancó con `APPDATA` temporal (no se ha modificado `%APPDATA%\EnviaCertificados\config.json` del usuario) y los PDF de la prueba «Solo generar» se escribieron en una carpeta temporal ya borrada.

## Resumen de comprobaciones

| # | Comprobación | Resultado |
|---|---|---|
| 1a | IDs, data-*, clases del JS, `data-bind`/`DEF`, llamadas `/api/*`, marcadores | **OK** |
| 1b | Diff de la lógica JS original → actual | **OK con cambios de presentación/estado documentados (6.1)** |
| 1c | HTML/CSS roto por ediciones concurrentes | **OK** |
| 2 | Sintaxis JS, HTML básico, iconos del sprite | **OK** |
| 3 | Funcional con servidor real, opciones A, B, C, D hasta pantalla 7 | **OK** (con límites: ver «No probado») |
| 4 | Visual 360/768/1280, desbordes, foco, contraste, radios, emojis | **OK salvo objetivos táctiles en móvil, degradado en scroll de tablas y `style=` residuales (FALLO parcial)** |
| 5 | Hallazgos de la auditoría (`.two`, Pendiente/Saltado, `confirmar()`) | `.two` **OK (resuelto)**; Pendiente/Saltado **es nuevo, no del original**; `confirmar()` **igual que el original** |
| 6 | Riesgo Node 26.13.1 vs 26.13.0 | **OK** |

## 1. Integridad frente al original

UI original extraída del `.exe` original con `tools\extract-sea.js` + `tools\extract-ui.js` a un temporal (92 896 bytes, igual que el documentado en `NOTA-EXTRACCION.md`).

- **IDs:** los 91 IDs del original siguen presentes (el 92 que cuenta `comprobar-ids-t3.js` incluye símbolos). Sin IDs duplicados en el HTML estático. IDs nuevos: `navPasos navToggle navActual listaEstado t6Metodo` (+ los símbolos del sprite). Los `$('#…')` del JS (91) tienen todos elemento, estático o creado por plantilla (`bOtroArchivo`, `bBorrarFiltro`, `bElegirCol`…).
- **data-\*:** 19 atributos y 112 valores `data-bind/go/page/modo/v/asset/var/preview/accept` presentes. **68 `data-bind` idénticos** (ninguno nuevo, ninguno perdido). Bloque `const DEF` (claves de `cfg`) **idéntico byte a byte**.
- **Clases usadas por el JS** (12 en selectores + `classList`): todas siguen.
- **`fetch`/`api(...)`:** las 14 llamadas `/api/*` (método por `body===undefined`, ruta y payload) son idénticas al original. `confirmar`, `norm`, `fill`, `vars`, `get` no cambian de lógica.
- **Marcadores** `{nombre_pila} {evento} {fecha} {horario} {lugar} {cargos} {nombre} {dni}`: mismo número de apariciones.
- **Funciones:** las 50 originales siguen; nuevas `estadoLista`, `recEstado`. 133 `const` de nivel y 28 handlers `$('#id').onX` conservados.
- **Servidor:** el bundle `dist/app.js` del exe nuevo es **idéntico al original byte a byte fuera del literal HTML** (prefijo 3 197 814 B y sufijo 1 552 151 B iguales). El servidor no ha cambiado.
- **HTML/CSS roto:** etiquetas del `<body>` balanceadas, llaves CSS balanceadas (profundidad final 0), bloques `T4/T5/T6-inicio/fin` bien cerrados. La capa base solo la redefinen T4/T5/T6 en `.modos`, `.modo`, `.modo:hover`, `.modo.on` (y su regla móvil): es la reescritura intencionada de la pantalla 0 como lista (el `.modo` base queda como código muerto, inocuo). Ninguna otra regla base se pisa.
- Hay ahora **dos** `<script>`: el principal (igual que el original, con cambios en 6.1) y uno pequeño de la capa base T3 (menú móvil `#navPasos`), solo presentación, no toca estado ni API.

### 6.1 Diferencias de comportamiento en el JS (ignorando markup/texto)

Ninguna cambia rutas, payloads, claves de cfg ni datos enviados. Lo que **sí** es nuevo (todo presentación/estado de UI):
1. `cargar()`: ya no hay `toast` de error; un fallo del servidor muestra el panel `#listaEstado` (oculta `#drop` hasta elegir otro archivo). Nuevo `estadoLista()`.
2. `pintarTabla()`: estado vacío (sin filas / sin coincidencias con botón «Borrar búsqueda»), alerta `sinCol` («No encuentro la columna del correo») si **todas** las filas marcadas (≥2) tienen correo inválido, columnas reordenadas (Nombre con casilla, Estado, Correo, DNI/NIE, N.º), contador «N de M marcadas».
3. `bEnviar` muestra `E.length - malas` (correos que saldrán de verdad); antes `E.length` (incluía sin correo). Coherente con el diálogo, que ya usaba `indices` filtrados.
4. `bSmtp.onclick`: `try/catch/finally` + botón deshabilitado durante la prueba (antes quedaba en «Conectando…» si fallaba la red). Se borra el resultado al cambiar cuenta/remitente (`t6LimpiaConexion`).
5. `vista()`: guarda de carrera `box._seq` (solo vale la última petición) y estados de carga/error con «Reintentar».
6. `revisar()`: checklist reordenada (avisos primero), cifras resumen, botones «Ir a <paso>» con el nombre real del paso.
7. `sondear()`: títulos nuevos; tabla de estado **sin la columna #** (la fila va en `title`), orden por gravedad (Rebotado, Error, Saltado) cuando termina; estados **«Pendiente» y «Saltado» nuevos** (ver 5.2).
8. `pintarRecibidos()`: columnas reordenadas, `#bRecVaciar` oculto si no hay certificados, `#bRecNuevas` pasa a `.pri` si hay sin asignar, «★» → «Posible:», estados vacíos. `recEstado()` para carga/error/ok del ZIP; `#dropRec` ahora se activa con Enter/Espacio.
9. `confirmar()` por defecto «Continuar» (antes «Aceptar»); la lógica es la misma.

## 2. Sintaxis y referencias

- `node --check` sobre el script principal extraído: **OK** (original y nuevo).
- Los 25 `<use href="#i-…">`/nombres de icono usados (HTML y plantillas JS, incluidos los compuestos `pl('ok','circle-check',…)` y la tabla `est`) existen en el sprite (32 símbolos). El único «fallo» del script (`i-nombre`) es un comentario CSS de ejemplo, no una referencia real.
- Símbolos sin usar (inocuos): `i-calendar i-send i-info i-download i-x i-log-out i-signature i-image`.
- Falsos positivos del script revisados a mano: `</html>` (queda fuera del `<body>` analizado) y `→` (está en un comentario JS, línea ~1212).

## 3. Funcional con servidor real (`comprobar-t8-e2e.js`, `comprobar-t8-generar.js`)

Chrome headless + CDP contra `EnviaCertificados-nuevo.exe` con `CERT_NO_BROWSER=1`, puerto 48731/48751.

- **Arranque** y `/api/info` (`version=1.4.0`, claves `version,config,salida,so`): OK.
- **Opción A (certificados):** `asistentes-ejemplo.xlsx` cargado (10 filas, columnas detectadas «Correo electrónico» y «DNI»); datos del evento; vista previa del certificado (`/api/vista`, iframe con blob): OK; vista previa del justificante: OK; pantalla 6; pantalla 7 («Generar y enviar a 9 personas», 1 se salta por correo inválido). «Generar y enviar» abre el diálogo «¿Enviar 9 correos ahora?» con remitente, asunto y «Se saltan 1»; se pulsó **Cancelar**, `/api/estado` queda `{}` (nada en marcha).
- **Opción B (justificantes):** pasos `0,1,2,4,6,7`; vista previa del justificante OK; pantalla 7 sin avisos de adjuntos.
- **Opción C (ya creados):** pasos `1,5,6,7`; carga del ZIP (generado con el PDF de ejemplo) y del PDF suelto: «2 certificados cargados», tabla, estadísticas, diálogo de sugerencia aceptado; pantalla 7 con aviso «2 certificados recibidos sin asignar». *El certificado de ejemplo no corresponde a nadie de `asistentes-ejemplo.xlsx`, por eso queda «Sin asignar»* (ver «No probado»).
- **Opción D (solo correo):** pasos `0,1,2,6,7`, «Enviar a 9 personas», sin «Solo generar».
- **Sin lista cargada:** vista previa del correo y pantalla 7 muestran sus estados vacíos con botón «Ir a…».
- **Progreso real** con «Solo generar los PDF» a carpeta temporal (no envía nada): fase «Pendiente» visible (`Generando 0 de 10 (0 %)`, 10 filas Pendiente) y fin «Generados 10 de 10», barra verde, tabla con estado/icono, PDF+registro escritos. En 360, 768 y 1280.
- **Errores de UI:** búsqueda sin resultados → estado vacío; fallo de lectura de lista (simulado desde el navegador devolviendo 500, porque el servidor real acepta casi cualquier fichero como CSV) → panel de error y recuperación al elegir un archivo válido.
- **Consola:** 0 errores, 0 avisos, 0 excepciones, 0 `alert`/`confirm` nativos; **0 respuestas HTTP ≥ 400**.

**NO PROBADO (a propósito o por falta de datos):** envío real, «Enviarme una prueba» (`/api/prueba`), «Probar conexión» (`/api/smtp`, abre Outlook), «Buscar rebotes» (`/api/rebotes`), «Descargar Excel actualizado» (`/api/excel`), «Reintentar fallidos», «Abrir carpeta», «Detener» y asignación de un certificado a una persona concreta por DNI/nombre (el ejemplo no coincide con nadie del Excel). Todos estos handlers conservan las mismas llamadas `/api` que el original (sección 1), y el servidor es idéntico.

## 4. Visual

Capturas en `trabajo\diseno\capturas\t8-<ancho>-<pantalla>.png` (54 PNG: pantallas 0–7 a 360/768/1280 px, más estados vacíos, error, progreso, diálogo, toast y menú móvil), p. ej.:
`t8-360-p0-inicio.png`, `t8-360-p1-lista-vacia.png`, `t8-360-p1-lista.png`, `t8-360-p2-evento.png`, `t8-360-p3-certificado.png`, `t8-360-p4-justificante.png`, `t8-360-p5-recibidos.png`, `t8-360-p6-correo.png`, `t8-360-p7-enviar.png`, `t8-360-p7-progreso.png`, `t8-360-nav-abierto.png`, `t8-360-dialogo.png` y los equivalentes `t8-768-…` y `t8-1280-…` (más `t8-1280-B-p7.png`, `t8-1280-D-p7.png`, `t8-1280-dialogo-enviar.png`). Datos crudos: `t8-auditoria.json` y `t8-resultado.json`.

| Criterio | Resultado |
|---|---|
| Desbordamiento horizontal (360/768/1280, todas las pantallas y estados) | **OK** (ninguno) |
| Foco visible (tabulación en pantalla 0; regla global `:focus-visible`, sin `outline:none`) | **OK** |
| Contraste (texto computado vs fondo efectivo; 4,5:1, 3:1 en texto grande) | **OK**, 0 incumplimientos en los estados capturados (no cubre placeholders ni controles deshabilitados) |
| Emojis/pictogramas como iconos | **OK** (ninguno en el DOM ni en el fuente) |
| Radios | **OK** (solo `4px` y `8px` calculados en todo el DOM) |
| Sombras fuera de diálogo/toast | **OK en lo renderizado**; ver F2 (reglas inset de fila en error) |
| Degradados | **FALLO** (F2) |
| `style=` inline innecesarios | **FALLO menor** (F3) |
| Objetivos táctiles ≥ 44 px en móvil (360) | **FALLO parcial** (F1) |

## 5. Hallazgos de la auditoría

1. **`.two` entre 1101 y 1125 px: resuelto.** La capa base redujo las columnas a `minmax(320px,1fr) minmax(340px,1.1fr)` con `gap:16px` (cabe desde ~1000 px) y la regla de 1 columna sigue en `max-width:1100px`. Barrido de 1060 a 1160 px de 4 en 4, pantallas 2, 3, 4, 6, 7: sin desborde de `main`, de la página ni de ningún hijo.
2. **«Pendiente» / «Saltado»: no existían en el original; son una función nueva solo de interfaz.** Ni el HTML original ni el bundle del servidor contienen esas palabras (el servidor solo registra Enviado/Generado/Error/Rebotado). La UI las deduce de `window._t6Lote`/`_t6Saltados`, que solo existen en la ventana que lanzó el lote y solo si `lote.length === j.total`. Consecuencias: tras recargar la pestaña o abrir otra ventana con un envío en marcha no aparecen filas «Pendiente»/«Saltado» (se ve solo el log del servidor, como en el original); en modo «Solo generar» no hay «Saltado» (se procesan también los sin correo, igual que antes). No afecta a lo que se envía. Decisión pendiente: aceptarlo así o calcularlo desde el servidor (requeriría tocar el servidor).
3. **`confirmar()` base: lógica idéntica al original** (`showModal`, `dlgSi`/`dlgNo`); solo cambia el texto por defecto («Continuar»). Comportamiento heredado: el foco inicial cae en «Cancelar» (seguro); **Escape cierra el `<dialog>` de forma nativa sin resolver la promesa** (queda pendiente para siempre; en `lanzar()` equivale a cancelar, no se envía nada) y no hay cierre por clic fuera. Sin consecuencias, pero conviene no depender de la promesa en usos futuros.

## 6. Hallazgos pendientes (informe; no corregidos)

- **F1 – Objetivos táctiles < 44 px a 360 px (incumple SISTEMA.md):** `input.t4-email` 220×36 y `input` DNI 132×36 y etiqueta de casilla 142×22 en la tabla de la lista (pantalla 1); `input.t5-color` 294×36 (pantallas 3 y 4); `input[type=range]` 222×16 (pantalla 4, margen); `select.t5-sel-pers` 220×30 (pantalla 5). Los botones, `.step`, chips y menú móvil sí cumplen en 360. En 768/1280 los controles miden 34–36 px y los chips 28 px (la regla de 44 px es solo móvil). Arreglo sugerido: `min-height:var(--toque)` en esas clases dentro de `@media (max-width:760px)`.
- **F2 – Degradados/sombras:** `linear-gradient` para el indicador de scroll lateral de `.tbl` (líneas ~360-361 de `ui/index.html`, capa base móvil; en 360 detectado en `.t4-tabla`, `.t5-alto-l`, `.t5-alto-m`) y `box-shadow:inset 3px 0 0` como franja de color en `.t6-fila-bad/.t6-fila-warn` (líneas ~551-552). Son afordancias funcionales, no decoración, pero técnicamente chocan con «sin degradados ni sombras fuera de diálogo/toast». Decisión de diseño.
- **F3 – `style=` inline:** 3 en el HTML estático (`#ver` `margin-top:6px`, `#dlgT` `margin-top:0`, fila de botones del diálogo `justify-content:flex-end;margin-top:18px`), más el del sprite (`display:none`, aceptable) y el de la pantalla «Aplicación cerrada» en JS. Ya estaban en el original.
- **F4 – Cosmético:** con 0 personas la pantalla 7 marca «Correcto» en «Todos los correos tienen un formato válido» y «Evento…» (el estado vacío superior ya avisa); tras un error de lectura la tabla anterior sigue visible bajo el panel de error.
- **F5 – Servidor (heredado):** `/api/lista` acepta casi cualquier fichero (lo trata como CSV): un binario/vacío da «El archivo no tiene personas», no un error. El panel «No se ha podido leer» solo sale si el servidor devuelve error.

## 7. Riesgo Node (26.13.1 local vs 26.13.0 original) — **OK**

`comprobar-t8-node.js` arranca ambos exe con `APPDATA` temporal y compara:

| | Original | Nuevo |
|---|---|---|
| Versión Node embebida (VersionInfo) | 26.13.0 | 26.13.1 |
| Arranque hasta `/api/info` | 985 ms | 534 ms |
| `GET /` | 200 `text/html; charset=utf-8` | 200 `text/html; charset=utf-8` |
| `GET /nada` | 404 | 404 |
| `POST /api/config` con `Origin` ajeno | 403 | 403 |
| `GET /api/estado` | `{}` | `{}` |
| `GET /api/info` | **texto idéntico** (version 1.4.0, so win32) | idéntico |

Además todo el recorrido de la sección 3 (xlsx, ZIP/PDF, vistas previas con generación de PDF, generación de lote) funciona sobre 26.13.1 sin errores. Mismo major/minor, parche distinto; el bundle del servidor es idéntico. Riesgo residual: solo los caminos no probados (Outlook COM, SMTP) por no poder ejercerlos aquí; no dependen de la versión de parche de Node, pero se recomienda la prueba manual de abajo.

## Correcciones hechas

**Ninguna.** No se encontró HTML roto, ID perdido, icono roto ni desborde que corregir; `ui/index.html` y el servidor quedan como estaban. El `.exe` se generó con `build.ps1 -Out build\EnviaCertificados-nuevo.exe -Smoke` (GET / 200 de 153 638 B, `title='Envío de certificados y justificantes'`, `/api/info` 200 v1.4.0) a partir del `ui/index.html` actual (el exe es posterior a la última edición, 21:55 < 21:57).

## Pasos de prueba manual para el usuario

Antes de distribuir, con el `.exe` nuevo (no sustituye al original; hay que probar con Outlook real, que aquí no se pudo):
1. Doble clic en `EnviaCertificados-nuevo.exe`; se abre el navegador. Comprueba el título de la pestaña y que el menú izquierdo muestra «Inicio» y las 4 opciones.
2. **Opción A:** carga `asistentes-ejemplo.xlsx`; revisa que se detectan correo y DNI; rellena evento/fecha; mira las vistas previas del certificado (paso 3).
3. **Correo → «Outlook de este ordenador» → «Probar conexión»:** debe decir «Conexión correcta» con tu cuenta. Cambia el remitente y comprueba que el resultado se borra.
4. **Revisar y enviar:** pon tu correo en «Enviar la prueba a» y pulsa «Enviarme una prueba»; comprueba el correo y el adjunto. Pulsa «Generar y enviar a N personas» y **Cancelar** en el diálogo (comprueba que N excluye a quien no tiene correo válido).
5. Un envío real **pequeño** (2-3 personas tuyas): mira la tabla de estado (Pendiente → Enviado), el resumen final y «Abrir carpeta»; recarga la pestaña a mitad para ver que el envío sigue (ahí no habrá «Pendiente»).
6. **Opción C:** ZIP real de certificados + Excel; asigna, «Añadir los no encontrados como personas nuevas», «Descargar Excel actualizado», envío pequeño.
7. **Opciones B y D:** una prueba breve cada una hasta el diálogo de confirmación.
8. «Buscar rebotes» (necesita Outlook) con una dirección inventada.
9. En móvil/ventana estrecha (≈ 360 px) confirma que se pueden pulsar bien los campos de la tabla de la lista (ver F1).
10. Si algo falla, sigue disponible el original en `Entrega\Entrega\EnviaCertificados.exe`.
