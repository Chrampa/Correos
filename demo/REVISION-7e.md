# Revisión final independiente 7e

Fecha: 26/11/2026, Europe/Madrid. Rama comprobada: `demo-web`.

**Veredicto: SÍ, publicable como demo pública estática, publicando exclusivamente `demo/dist/`, con datos ficticios y noindex, dentro del alcance probado en Chrome 158 sobre Windows.** N1 y N2 están resueltos. No se han encontrado bloqueos nuevos para ese alcance. No se certifican otros navegadores, accesibilidad WCAG completa ni configuración efectiva de un hosting todavía no desplegado. El servidor elegido debe aplicar las cabeceras de `_headers` o su equivalente; noindex no restringe el acceso público.

## Aislamiento y reproducibilidad

Solo se ha escrito este informe en el repositorio. No se ha editado código existente, regenerado su dist, cambiado de rama, hecho commit, merge ni push. Las modificaciones preexistentes de QA, REBUILD y diseño se han conservado.

Se copiaron `demo/` y `trabajo/ui/`, conservando su disposición relativa, a `<TEMP>/revision-7e-1fa86f4678ce45bbb9a7ee5e56da1184`. Allí se ejecutaron personalmente `node demo/build-demo.js` dos veces y `npm --prefix demo run test:all`, y allí se guardan los scripts adicionales, `test-all.log`, `network.log`, `file-extra.log`, `privacy.json` y las capturas. Las rutas personales se omiten deliberadamente de este informe.

Los dos builds y la verificación final de la copia y del repositorio coinciden byte a byte:

| Archivo | SHA-256 |
|---|---|
| index.html | `be5499f790f9b80d82538d2263ff33fe1961b19a8df74568867141b4a0fa7035` |
| _headers | `09a919a47d5192064d3d83f3149fcc622e395cf19a853db54d1303aacb0fde38` |

## Matriz de comprobaciones

| Comprobación | Resultado | Evidencia y alcance |
|---|---|---|
| Dos builds reproducibles e iguales al dist final | OK | Hashes anteriores antes y después; la suite también repite el build. |
| Suite completa | OK | Exit 0; PASS de build, mock API, browser y mobile. Conserva 133 IDs y 21 atributos data. |
| N1: placeholders en 360/390/430/800/1280 | OK | Estilos computados de p2: RGB(91,100,114), opacidad 1, fondo blanco; contraste **5,981749:1** en los cinco anchos. Auditoría de placeholders en el resto del recorrido sin fallos. |
| N1: aviso sin cubrir controles | OK | Banner y toast con cero solapamientos detectados en todos los anchos; estado toast visible tras Excel probado explícitamente. Captura adicional a 800 confirma toast en flujo sobre el título. |
| N1: p5 a 800 y 1280 sin scroll horizontal | OK | `scrollWidth=clientWidth=785` y `1265`, respectivamente; los 15 px restantes corresponden a la barra vertical del documento. Body también comprobado. |
| N2: diálogo y botones de simulación | OK | Diálogo real «¿Iniciar simulación para 4 intentos?», CTA «Simular 4 intentos» y explicación coherente de simulación. No quedan en el dist las tres fórmulas heredadas señaladas en la tarea. |
| Ejemplo original de nombre/documento/ruta fuera del dist | OK | Búsqueda del nombre compuesto original, DNI original y ruta de perfil, más aserciones del build: sin coincidencias. |
| Ocho pantallas × 360/375/390/412/430 | OK | Recorrido p0–p7, Excel de muestra, ZIP ficticio, envío completado y rebote. También recorrido completo a 800/1280. |
| Scroll horizontal móvil | OK | Cero fallos de ancho del documento/body en los cinco anchos y estados auditados. |
| Objetivos móviles ≥44 px | OK | Cero objetivos pequeños en controles visibles auditados; checkbox/radio medidos mediante su etiqueta clicable. No se exige 44 px a escritorio. |
| Tablas como tarjetas | OK | Personas, certificados, asignaciones y resultados legibles en las capturas móviles, con nombres y estados conservados. |
| Estado de envío | OK | Cuatro intentos simulados, estado final con enviados, fallo temporal y rebote; dos filas saltadas. |
| Foco | OK | Seis pasos de Tab a 360 comprueban `:focus-visible` y outline; foco durante scroll no oculto por cabecera. Cancelar presenta anillo visible en el diálogo. No equivale a auditar todas las secuencias de teclado. |
| Contraste AA textual | OK | Cero fallos del detector en textos, valores, placeholders y texto de pseudoelementos del recorrido; controles deshabilitados excluidos. |
| Inspección visual personal ≥8 PNG | OK | Doce capturas nuevas vistas, enumeradas abajo; 57 PNG generados por esta ejecución. |
| HTTP local: recorrido normal sin red externa | OK | Solo petición inicial del HTML; SVG data: locales; cero errores de consola, incluidos CSP. |
| file: real: carga y envío | OK | HTML real abierto por su URL de archivo, sin sustituirlo mediante intercepción; input Excel → seis personas → cuatro intentos completados. Cero peticiones HTTP/WS y errores. |
| Sumidero: 14 vías de salida × HTTP/file | OK | 28 casos, cero peticiones recibidas por el servidor loopback; documento permanece en su URL. Detalle abajo. |
| CSP y cabeceras | OK | Hashes recalculados de siete scripts, tres estilos y tres ocurrencias de handlers (dos hashes únicos); todos presentes. CSP meta idéntica a cabecera. Robots, nosniff y referrer-policy correctos. |
| Privacidad del dist | OK | Solo dos archivos; sin perfil personal, buzones reales, DNI/NIE de formato real ni secretos detectados. |
| Privacidad de `git ls-files` + `demo/` | OK, con restos declarados | 106 archivos inventariados antes de añadir este informe; búsquedas de patrones, XML del XLSX y metadatos PNG. Restos técnicos y ejemplos fuente justificados abajo. |
| `trabajo/ui/` intacto | OK | `git diff --stat 6c34bd4 -- trabajo/ui/` vacío antes y después. |
| Firefox, Safari, Edge, móviles físicos | NO PROBADO | Solo Chrome/158.0.8127.37 headless, emulación CDP; no se atribuye a Edge una prueba no realizada. |
| Hosting público y cabeceras reales de producción | NO PROBADO | No se ha desplegado ni contactado un hosting. |
| Certificación WCAG completa / historial Git completo | NO PROBADO | Contraste y controles del recorrido no son una certificación; auditoría de archivos actuales, no de objetos históricos. |

No hay filas FALLO en el alcance obligatorio comprobado; las limitaciones anteriores son explícitas.

## Red y cabeceras

Se sirvió el dist con `demo/serve.js`, que lee y aplica `_headers`, y se abrió además directamente como archivo. La prueba adicional `file-extra.js` reutiliza el recorrido del test de navegador cambiando la URL a `pathToFileURL` y exigiendo una lista vacía de peticiones HTTP/WS. Su mensaje final conserva la frase heredada «una única petición HTTP inicial», pero la aserción ejecutada para file exige **cero**: no se utiliza esa frase como evidencia de una petición.

El sumidero es un servidor HTTP en loopback con puerto efímero, contador de solicitudes y listener de upgrade para WebSocket. Se probaron en ambos modos: `location.assign`, asignación a `location.href`, `location.replace`, `window.open`, `form.submit`, clic de enlace, imagen dinámica, script dinámico, `import()`, WebSocket, EventSource, sendBeacon, iframe y meta refresh. Se esperó después de cada intento y se comprobó la URL. Resultado: **0 solicitudes al sumidero, 28/28 permanencias en la demo**. El navegador sí emite eventos DevTools de intento para algunos recursos bloqueados; no son solicitudes recibidas en red. Los errores CSP provocados deliberadamente pertenecen a esta prueba negativa, no al recorrido normal, cuya consola está limpia.

La protección de navegación usa Navigation API y se ha verificado en esta versión de Chrome; no debe anunciarse como cortafuegos universal para cualquier navegador o ejecución arbitraria de código hostil. La CSP incluye `default-src 'none'`, hashes para scripts/estilos, `connect-src 'none'`, `form-action 'none'`, `base-uri 'none'` y restricciones de recursos. Permite imágenes data/blob y frames blob para vistas locales; `style-src-attr 'unsafe-inline'` admite las mutaciones de estilo usadas por la interfaz. No permite scripts mediante `unsafe-inline`.

`X-Robots-Tag: noindex, nofollow`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y meta robots `noindex,nofollow` están presentes. Los hashes se calcularon sobre el contenido real del artefacto final, no sobre los fuentes previos a insertar datos. La meta CSP reproduce exactamente la política de `_headers`.

## Privacidad: restos justificados

Se buscaron el nombre del perfil local, prefijos de perfil Windows, direcciones en dominios de ejemplo comerciales y de la universidad, patrones DNI/NIE, rutas absolutas y patrones comunes de secretos/claves privadas. No se encontró el nombre del perfil, ni buzones `example.com/.org`, ni valores de credenciales. Las coincidencias se clasifican así:

| Ubicación | Resto | Justificación |
|---|---|---|
| `trabajo/ui/index.html:877,945` | Dos placeholders de correo institucional | Son las dos líneas originales de ejemplo expresamente exceptuadas; el build las reemplaza por dominios ficticios. Ausentes del dist. |
| `trabajo/ui/index.html:924` | Placeholder de ruta Windows con puntos suspensivos | Tercera línea exceptuada; no identifica un perfil real. Sustituida por «Carpeta de certificados» en dist. |
| `trabajo/ui/index.html:1598` | Nombre compuesto, correo de ejemplo y DNI con formato real | Cuarta línea exceptuada, fallback original. Reemplazada por Persona Demo / dominio inválido / identificador DEMO en dist. No se afirma que el ejemplo original sea una persona verificada. |
| `demo/build-demo.js:192,198` | Copias literales de esos dos patrones originales | Necesarias para detectar y sustituir el texto fuente de manera obligatoria; comentarios explican su función. Son código de build, no datos publicados. |
| `demo/tests/build.test.js:68–72` | Literales originales en aserciones negativas | Prueban que el artefacto no contiene los ejemplos; no se empaquetan. |
| Tests browser/mobile y `trabajo/diseno/comprobar-t3`, `comprobar-t8-e2e`, `comprobar-t8-generar` | Rutas absolutas estándar de instalación de Chrome | Rutas de Program Files sin perfil personal, utilizadas para localizar el navegador de QA. No se publican. |
| `demo/tests/mock-api.test.js`, `demo/src/LEEME-MOCK.md`, `demo/REVISION-7a.md` | Rutas ficticias en unidades Windows y URLs file | Casos documentados de normalización/denegación de rutas. Sin nombres de usuario; no llegan al dist. |
| Mock y sus pruebas | Campos `password/pass`, palabra `secret`, usuario/clave sintéticos de una URL negativa, `tokens` de diseño/texto | Nombres de propiedades, prueba de eliminación de contraseña y entradas negativas; no credenciales operativas. `.env.example` solo contiene el comentario de ausencia de claves. |
| Código SVG/OOXML, endpoints locales y rutas `/api/...` | Namespaces, URLs técnicas y rutas de aplicación | Identificadores de formatos y llamadas interceptadas en memoria; no rutas personales. El dist conserva namespaces escapados y una URL `.invalid` de autocomprobación bloqueada, no recursos externos activos. |

Las redacciones de `trabajo/QA-INFORME.md`, `trabajo/REBUILD.md`, `trabajo/diseno/` y los informes anteriores ya no exponen el nombre del perfil. Las muestras de diseño usan identificadores DEMO y dominios inválidos. Las menciones institucionales genéricas de la interfaz describen el producto y no identifican una cuenta personal.

Se inspeccionó el ZIP/XML completo de `demo/datos/asistentes-demo.xlsx`: personas de prueba, documentos DEMO, dominios `.invalid`, propiedades de autor vacías y ninguna coincidencia sensible en la búsqueda automatizada. Los JSON y demás textos de datos entraron en el barrido general. El XLSX contiene 15 registros; el simulador reemplaza su contenido por sus seis fixtures, comportamiento comprobado y esperado.

Los PNG del repositorio solo contienen chunks IHDR/IDAT/IEND, sin metadatos textuales de perfil. La inspección visual se realizó sobre doce capturas recién generadas de la copia; no se ha hecho OCR exhaustivo de cada imagen histórica. No se publica ninguna captura ni XLSX con `dist/`. La revisión no autoriza a publicar todo el repositorio sin declarar las cuatro líneas originales y los literales técnicos anteriores, ni certifica el historial Git.

## Juicio visual

Vistas personalmente: `360-p0-inicio.png`, `360-p1-lista-excel.png`, `360-p2-evento.png`, `360-p3-certificado.png`, `360-p4-justificante.png`, `360-p5-recibidos.png`, `360-p6-correo.png`, `360-p7-envio-simulado.png`, `360-dialogo-enviar.png`, `800-toast.png`, `800-p5-recibidos.png` y `1280-p5-recibidos.png`, todas bajo las capturas de la copia temporal.

La jerarquía, separación de grupos, tamaño de campos y estados son claros. Las tarjetas móviles mantienen la información sin necesitar desplazamiento horizontal; los estados combinan color, texto e iconos. El diálogo cabe, el foco de Cancelar se distingue y el texto explica que no hay correo real. El aviso a 800 ocupa espacio propio. Los formularios y tablas largos requieren bastante scroll vertical, y la previsualización documental es deliberadamente pequeña y orientativa, compromisos razonables para la demo.

## Hallazgos nuevos priorizados

No se han hallado defectos nuevos de prioridad alta o media que bloqueen publicar el dist en el alcance declarado.

1. **Baja, acabado de escritorio:** p5 muestra dos barras verticales contiguas a 800 y 1280 (documento y zona principal). No produce scroll horizontal ni oculta controles, pero puede hacer menos cómodo desplazarse. Se ve en ambas capturas de p5. Es una mejora opcional, no una reapertura de N1.
2. **Baja, coherencia editorial residual:** algunos párrafos generales de p0/p6/p7 siguen describiendo el producto real («te mandas una prueba», instrucciones de Outlook y carpeta de salida). El banner permanente y los CTA/confirmaciones corregidos contextualizan la simulación; no son las cadenas prohibidas de N2. Conviene armonizarlos si se desea una demo enteramente redactada como simulación.

## Archivos que se publicarían

| Ruta dentro de la raíz publicada | Bytes |
|---|---:|
| `index.html` | 202265 |
| `_headers` | 1061 |
| **Total** | **203326** |

Total aproximado: **198,56 KiB**, sin compresión HTTP. No hay otros archivos, ejecutables, variables de entorno, fuentes de construcción, informes, capturas ni datos externos en ese directorio. No se ha detectado información sensible en los dos archivos. El veredicto SÍ se refiere a este artefacto exacto y a estos límites; el despliegue y la comprobación de cabeceras en la URL pública quedan pendientes de la fase de publicación.
