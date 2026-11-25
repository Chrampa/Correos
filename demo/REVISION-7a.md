# Revisión independiente 7a

Fecha: 25/11/2026. Rama comprobada: `demo-web`. **Veredicto: NO publicable con todos los requisitos solicitados.** El recorrido con servidor estático funciona, pero hay fallos de contraste, superposición temporal y apertura directa mediante `file://` en Windows. No se han aplicado arreglos ni cambiado de rama, hecho merge o push.

## Ejecución y alcance

Se leyeron `build-demo.js`, `serve.js`, `package.json`, los cuatro tests, `dist/index.html`, `_headers`, el CSS/JS móvil y las partes correspondientes del original. Se ejecutaron personalmente los builds y todos los tests; no se adoptaron resultados de informes anteriores. Chrome instalado, headless, CDP y Node 26.13.1; sin instalación global. La ejecución requerida de build/tests regenera sus artefactos `dist/` y las 32 capturas; no se editó código existente. El único documento redactado por el revisor es este informe.

`git diff --stat 6c34bd4 -- trabajo/ui/` no produjo salida, tanto antes como después. SHA-256 del original: `238624e87fab77dc8ec3574bc7c29c0f1143971fde0e8aaff335d9e6404d47e3`. El estado previo del repositorio ya contenía `.gitignore` modificado y `demo/` sin seguimiento.

## Comprobaciones

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Original intacto frente a 6c34bd4 | OK | Diff vacío de todo `trabajo/ui/`. |
| Dos builds consecutivos idénticos | OK | `node demo/build-demo.js` dos veces; `Get-FileHash` y `Compare-Object` de ambos archivos sin diferencias. El test de build volvió a comprobar identidad byte a byte. |
| Todos los tests | OK | `browser.test.js`, `build.test.js`, `mobile.test.js`, `mock-api.test.js`: salida PASS y exit 0 en cada caso. |
| Ocho pantallas a 360, 390 y 430 px | OK | Ejecución móvil de p0–p7 con seis personas, ZIP ficticio y envío simulado. También se ejecutaron 375 y 412 px. |
| Ausencia de scroll horizontal | OK | En todas esas pantallas `scrollWidth = clientWidth` y body sin desbordamiento. |
| Objetivos táctiles de 44 px | OK | Cero objetivos menores en el recorrido auditado: botones, enlaces, inputs de tabla, selects y casillas mediante su label clicable. La casilla dibujada puede medir 22 px; su objetivo asociado mide al menos 44 px. |
| Tablas, nombre y estados | OK | Tarjetas verticales con cabecera de persona y etiquetas de campo. Visibles Enviado, Fallido, Rebotado, Saltado y estados de asignación. Sin desplazamiento lateral necesario. |
| Excel y envío | OK | Upload real del fixture con `DOM.setFileInputFiles`; aparecen seis filas; cuatro intentos simulados terminan, dos personas quedan saltadas y se refleja el rebote. |
| Banner de demostración | OK | No tapa navegación, diálogo ni controles en las posiciones auditadas. |
| Todos los avisos sin superposición | FALLO | El toast inferior sí tapa controles y textos temporalmente; véase H3. |
| Foco visible | OK | Seis pasos de Tab a 360 px con `:focus-visible` y outline, reglas heredadas revisadas y foco de Cancelar visible en captura del diálogo. No constituye prueba exhaustiva de todos los controles y estados. |
| Contraste AA | FALLO | Los textos normales auditados pasan; los placeholders omitidos por el test dan 3,82:1; véase H2. |
| CSS móvil sin degradados/emojis/sombras extra | OK | CSS/JS revisados: no degradados ni emojis inyectados; sombras anuladas en filas. Auditoría de estilos computados: cero degradados y sombras fuera de toast/diálogo. |
| Radios | OK | Radios redondeados de 4/8 px; existe `border-radius:0` para quitar redondeo, no un tercer radio decorativo. |
| Revisión visual de al menos seis PNG a 360 px | OK | Se inspeccionaron personalmente nueve: p0, p1-excel, p2, p3, p4, p5, p6, p7-envio-simulado y diálogo. Observaciones abajo. |
| Privacidad del dist | OK | Solo `index.html` y `_headers`; ninguna URL literal `http(s)://` externa, EXE, archivo `.env` o XLSX empaquetado. Direcciones presentes bajo `example.invalid`; sin credenciales/token detectados. Las descargas XLSX del simulador se generan en memoria con datos ficticios. |
| CSP y robots | OK | 7 scripts y 3 estilos con hashes comprobados; 2 handlers cubiertos; `connect-src 'none'`, estilos por atributo permitidos para mutaciones de UI; cero errores de CSP en flujo servido. Meta robots y `X-Robots-Tag: noindex, nofollow` presentes. |
| Archivos versionados sensibles | OK | `git ls-files` revisado: no ejecutables, XLSX ni `.env` real. `.env.example` contiene solo el comentario «sin claves; la demo no usa ninguna». Búsqueda de claves privadas y patrones comunes de tokens sin coincidencias. Esto no certifica todo el historial git. |
| Funcionamiento sin backend, con servidor estático local | OK | `serve.js` sirve únicamente archivos de dist; browser test registró una petición HTTP inicial y tres imágenes `data:`; cero peticiones externas o API reales. Mobile test sin peticiones inesperadas ni errores de consola. |
| Funcionamiento literalmente sin servidor (`file://`) | FALLO | Prueba adicional sobre el HTML local en Chrome: timeout esperando las seis filas tras elegir Excel. Causa reproducida en H1. |
| Dispositivos físicos, otros motores y hosting publicado | NO PROBADO | Fuera de esta ejecución: Chrome headless local, no Safari/Firefox ni despliegue real. |

Hashes del dist revisado:

- `index.html`: `a1524e091c2427115ec1bf7c5fd89fb7d92b3b166e93dc5a349a552d252d62e4`.
- `_headers`: `021852e17302d6b879199273123c32ab49b7c48208daeef8258ad7b6b79977e7`.

## Hallazgos priorizados y arreglos propuestos

### H1 — Alta: el HTML local no funciona en Windows

Archivo: `demo/src/mock-api.js:127–129` (incrustado en `demo/dist/index.html:1633–1635`). Aunque acepta protocolo `file:`, compara literalmente `url.pathname` con `/api/...`. En Windows, `new URL('/api/lista', 'file:///C:/demo/dist/index.html').pathname` devuelve `/C:/api/lista`, que no existe en `routes`.

Reproducción: abrir `demo/dist/index.html` directamente en Chrome, elegir Solo correo y cargar `demo/datos/asistentes-demo.xlsx`. No aparecen las seis personas. Se ejecutó una variante en memoria de `browser.test.js`, cambiando únicamente la navegación por `pathToFileURL(...)` y la expectativa de HTTP por cero peticiones: falló con `Timeout: Excel ficticio reemplazado por seis personas`. No se modificó el test en disco.

Propuesta: normalizar las rutas locales del simulador de manera explícita para `file:` o resolver las rutas API relativas contra una base virtual controlada, conservando el rechazo de destinos externos. Añadir regresión Windows con `file:///C:/...`. Si «sin servidor» pretendía decir únicamente «sin backend», el recorrido estático sí cumple, pero no debe anunciarse apertura directa compatible hasta corregirlo.

### H2 — Media: placeholders por debajo de AA

Archivo: `demo/dist/index.html:227`, heredado de `trabajo/ui/index.html:225`; no hay override corrector en `demo/src/demo-mobile.css`. El original debe permanecer intacto.

Reproducción: a 360 px, cargar Excel y abrir Datos del evento. Inspeccionar el placeholder de `[data-bind="evento.horario"]`: Chrome devuelve color `rgb(91,100,114)`, opacidad `0.8`, fondo blanco y tamaño 16 px. Componiendo la opacidad sobre blanco, el contraste calculado es **3,82349:1**, menor que 4,5:1. También se ve en los ejemplos de duración y segundo firmante.

Propuesta: override en el CSS de demo con `opacity:1` para placeholders y color cuyo contraste sea al menos 4,5:1. Ampliar el test: `demo/tests/mobile.test.js:194–195` solo evalúa nodos de texto directos; omite pseudo-elementos, placeholders y texto de valores de inputs. Su PASS no prueba AA completo.

### H3 — Media: toasts tapan controles y contaminan capturas

Archivos: `demo/dist/index.html:309,366,1796` (reglas y función heredadas de `trabajo/ui/index.html:307,364,1096`), y `demo/tests/mobile.test.js:302–303`.

Reproducción: cargar Excel y pasar inmediatamente a Datos del evento. A 360×800 el toast ocupa x=16, y=739, ancho=328, alto=45 y se solapa con los inputs `evento.lugar` y `evento.organizador`. Medición adicional realizada en Chrome con emulación móvil y táctil activadas. El toast no intercepta el puntero (`pointer-events:none`), pero impide leer el contenido durante su aparición.

Las capturas `360-p1-lista-excel.png`, `360-p2-evento.png`, `360-p3-certificado.png`, `360-p4-justificante.png`, `360-p5-recibidos.png` y `360-p7-envio-simulado.png` muestran avisos temporales sobre campos o mensajes. La auditoría automática solo contrasta solapamientos con `#demo-banner`, no con `.toast`.

Propuesta: reservar un espacio de estado o presentar el aviso en flujo, sin cubrir controles; añadir comprobación de toast y foco durante scroll. Para capturas de presentación esperar a que el toast desaparezca, manteniendo además una prueba separada de su estado visible. Esperar solo 120 ms antes de capturar no garantiza una pantalla estable.

### H4 — Baja: reemplazo de texto de Excel no se aplica

Archivo: `demo/build-demo.js:180`; resultado en `demo/dist/index.html:1172`.

El build busca `Arrastra aquí el Excel o el CSV`, pero el original contiene `Arrastra aquí el Excel o CSV`. Por tanto sigue apareciendo la instrucción genérica, en lugar de «Carga el Excel ficticio de demostración»; comprobado en captura y HTML. El banner mantiene el aviso de simulación, por lo que esto no implica envío real.

Propuesta: localizar el elemento por una estructura estable y sustituir su contenido, o corregir la cadena y comprobar que cada sustitución obligatoria haya ocurrido. Añadir una aserción de texto de la zona de carga al test de build.

## Juicio visual y límites de las pruebas

La jerarquía de títulos, bloques y acciones es clara; espaciado y alineación consistentes; iconos SVG discretos y controles amplios. Las tarjetas conservan nombres completos y estados y no presentan cortes horizontales en el recorrido. El diálogo cabe a 360 px y su foco es evidente. Las pantallas p3/p4/p6 son largas pero legibles. En p5 el título del menú se abrevia con puntos suspensivos y el encabezado completo de página sigue visible. Los campos de una línea desplazan su valor internamente cuando es largo; no se confundió esto con pérdida de datos.

No aprobaría las capturas como presentación final mientras contengan toasts superpuestos. Tampoco el PASS automático de contraste equivale a conformidad AA completa: se confirmó un contraejemplo real. El script de móvil recorre ocho pantallas y estados principales; no agota todos los presets SMTP, escenarios de error, scrolls ni combinaciones de foco. `package.json` ejecuta solo `build.test.js` con `npm test`; conviene agregar un comando de suite completa para que las demás verificaciones no dependan de invocación manual.

Para aprobar: resolver H2/H3, aclarar o corregir H1 según la promesa de distribución, corregir H4 y repetir las verificaciones afectadas. Ninguna corrección fue aplicada por esta revisión.
