# RevisiÃ³n independiente 7b: diseÃ±o y capa simulada

## Resumen

| ComprobaciÃ³n | Resultado |
|---|---|
| Fidelidad de rutas y respuestas para la UI | **OK**, con las divergencias de simulaciÃ³n indicadas abajo |
| Aislamiento de red | **FALLO**: una navegaciÃ³n directa mediante `location.assign()` escapa |
| Privacidad del contenido de `demo/` | **FALLO**: quedan datasets antiguos con nombres de aspecto real, identificadores con formato válido y direcciones de dominio reservado de ejemplo |
| CÃ³digo, estados, textos y accesibilidad | **FALLO parcial**: textos de envÃ­o ambiguos, temporizador tardÃ­o y avisos sin anuncio accesible |
| Tests | **OK con lÃ­mites**: las pruebas no estÃ¡n vacÃ­as, pero no cubren todos los casos que afirman |
| Discrepancia de fixtures | **FALLO documental**: hay datos legacy de 15 personas ademÃ¡s del catÃ¡logo activo de seis |

**Veredicto: no publicable todavía.** No se ha acreditado que los nombres o identificadores encontrados correspondan a personas reales; los archivos los declaran ficticios y los correos usan un dominio reservado de ejemplo. Aun así, su formato parece real, contradice el criterio de usar `.invalid` y convive con una vía de navegación externa no bloqueada. Antes de publicar, retirar/sustituir los datos legacy y cerrar o acotar la navegación.

## Hallazgos priorizados

### P1 â€” La polÃ­tica no bloquea la navegaciÃ³n directa fuera de la demo

**Archivos:** `demo/src/mock-api.js:20-21, 172-174`; `demo/build-demo.js:239-250`.

El mock bloquea `window.open()` salvo Blob propio y cancela enlaces y formularios, pero no intercepta `window.location`/`location.assign()`. `connect-src 'none'` no limita la navegaciÃ³n de nivel superior y la CSP generada no establece una polÃ­tica equivalente de navegaciÃ³n.

**ReproducciÃ³n:** en Chrome headless, con la demo abierta, se probaron `img.src`, `script.src`, `import()`, `form.submit()`, clic en enlace externo, `window.open()` y `location.assign('http://127.0.0.1:1/location')`. La CSP bloqueÃ³ imagen, script, importaciÃ³n y formulario; el listener cancelÃ³ el enlace y `window.open()` lanzÃ³ `TypeError`. En cambio, la asignaciÃ³n a `location` generÃ³ una peticiÃ³n de navegaciÃ³n observada por DevTools. El destino fue loopback, puerto 1, sin servicio; no se contactÃ³ un tercero. Los eventos de DevTools para los recursos rechazados reflejan intentos que la consola identifica como bloqueados por CSP.

**Arreglo propuesto:** aplicar una restricciÃ³n efectiva de navegaciÃ³n externa en el entorno de publicaciÃ³n/navegador (y una directiva de CSP compatible con los navegadores soportados, si estÃ¡ disponible); no confiar solo en `fetch`, `connect-src` o el listener de enlaces. AÃ±adir una prueba de navegador para `location.assign`/`location.href` y verificar que no inicia navegaciÃ³n HTTP(S).

### P1 â€” Datos legacy con apariencia de datos personales permanecen en `demo/`

La bÃºsqueda regex recorriÃ³ los ficheros de texto de `demo/` (sin `node_modules`, que no existe) y se inspeccionÃ³ el contenido XML del XLSX. No aparecieron telÃ©fonos, claves/tokens reales, un buzÃ³n UPV activo ni una ruta con el perfil real del usuario. SÃ­ aparecen estas coincidencias:

* `demo/datos/demo-datos.json`: 15 nombres completos y apellidos de aspecto real (líneas **7, 16, 25, 34, 43, 52, 61, 70, 79, 88, 97, 106, 115, 124 y 133**), 13 correos con dominio reservado de ejemplo y una dirección mal formada con el mismo dominio (**L8, 26, 35, 44, 53, 62, 71, 80, 89, 98, 107, 116, 125, 134**), e identificadores con formato y checksum plausibles (**L9, 18, 27, 36, 45, 54, 63, 72, 81, 90, 99, 108, 117, 126, 135**; uno duplicado). También hay 4 nombres de firmantes de aspecto real (**L148, 152, 164, 168**). *Los valores literales se han omitido en esta copia por privacidad; los números de línea se conservan.*
* `demo/datos/estados-envio.json`: repite los 15 nombres completos (**L11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95**) y mensajes de progreso (**L104-L118**), junto con los correos coincidentes (**L12, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96**), incluidos 13 válidos con dominio reservado de ejemplo y uno mal formado. *Valores literales omitidos en esta copia; líneas conservadas.*
* `demo/datos/asistentes-demo.xlsx`, hoja `sheet1`: las celdas **B2:C16** contienen el mismo roster de nombres de aspecto real; **D2:D16** contienen los 15 identificadores con formato válido y **E2, E4:E16** los correos anteriores (E3 vacío). No hay número de línea en el binario; se indican celdas. *Valores literales omitidos en esta copia.*
* `demo/datos/README.md:32-33` documenta como permitidos correos de dominio reservado de ejemplo y DNI de formato válido. Esto choca con la política de `.invalid` de la demo.
* El artefacto activo `demo/dist/index.html:2298` conserva un ejemplo de UI con nombre y DNI de formato válido. `demo/dist/index.html:1441` incluye un placeholder genérico de ruta con carpeta de usuario; no contiene el nombre de usuario del equipo. *Valores literales omitidos en esta copia.*
* `demo/tests/mock-api.test.js:37` contiene una dirección con dominio reservado de ejemplo como entrada negativa de una prueba, no como dato de una persona.

**Arreglo propuesto:** retirar los tres datasets legacy o regenerarlos con nombres inequÃ­vocamente ficticios, IDs `DEMO-*` y correos `.invalid`; sustituir el fallback `GarcÃ­a LÃ³pez`/DNI por un registro del catÃ¡logo demo; alinear el README de datos. El test puede conservar una direcciÃ³n no permitida, pero usar un literal inequÃ­voco como `no-valido@dominio-no-permitido.invalid`.

### P2 â€” La UI sigue afirmando que envÃ­a y conecta de verdad

**Archivos:** `trabajo/ui/index.html:1639, 1694, 1713`; `demo/build-demo.js:186, 194-195`.

La sustituciÃ³n del tÃ­tulo del diÃ¡logo no alcanza el texto del botÃ³n: al cargar el Excel ficticio y pulsar Â«EnviarÂ», el diÃ¡logo dice Â«Iniciar simulaciÃ³nÂ», pero el botÃ³n de confirmaciÃ³n aÃºn dice **Â«Enviar 4 correosÂ»**. En la prueba SMTP, el resultado aÃºn muestra **Â«ConexiÃ³n correctaÂ»**. En la prueba de correo, la respuesta queda como **Â«Prueba enviada aâ€¦Â»** seguida de **Â«No se ha enviado ningÃºn correoÂ»**: contradictorio, aunque el aviso fijo y la segunda frase aclaren que es una simulaciÃ³n. El botÃ³n conserva el texto **Â«Enviarme una pruebaÂ»** y el mensaje posterior afirma que se enviÃ³.

**Arreglo propuesto:** sustituir tambiÃ©n el texto del botÃ³n por Â«Simular 4 intentosÂ» y usar Â«ConexiÃ³n simulada correctaÂ» / Â«Prueba simulada paraâ€¦Â» en las respuestas, conservando el aviso explÃ­cito de que no sale correo.

### P2 â€” Queda un temporizador de rebotes obsoleto tras la comprobaciÃ³n acelerada

**Archivos:** `demo/src/mock-api.js:120`; `trabajo/ui/index.html:1746-1772`.

El mock lanza la comprobaciÃ³n a los 1,2 s. La UI ademÃ¡s programa otra consulta a los 150 s; al completar la consulta acelerada no cancela ese `setTimeout` ni comprueba que siga correspondiendo al mismo `job`. Si se inicia otro trabajo antes de que venza, la llamada antigua consulta el estado actual y puede sobrescribir el panel de rebotes con un resultado independiente/ajeno al lote que la programÃ³.

**ReproducciÃ³n:** completar un envÃ­o y esperar su comprobaciÃ³n automÃ¡tica; iniciar otro lote antes de los 150 s y observar la consulta tardÃ­a del temporizador del lote anterior. **Arreglo propuesto:** cancelar el timer original cuando el mock acelera la comprobaciÃ³n o guardar el `job.id` y descartar callbacks cuyo lote ya no sea actual. No esperÃ© 150 s en esta revisiÃ³n; el riesgo se desprende de ambos temporizadores y del callback sin guardia.

### P3 â€” Avisos dinÃ¡micos y diÃ¡logo de descargas con nombre accesible incompleto

**Archivo:** `demo/src/demo-banner.js:9, 16-17`.

El texto Â«DemostraciÃ³n finalizadaâ€¦Â» se inserta sin `role="status"`, `aria-live` ni foco, por lo que un lector de pantalla puede no anunciar el fin tras Â«SalirÂ». El diÃ¡logo de descargas tampoco enlaza su tÃ­tulo con el `<dialog>` mediante `aria-labelledby` ni `aria-label`. El aviso inicial sÃ­ usa `role="note"` y permanece visible.

**Arreglo propuesto:** dar nombre accesible al diÃ¡logo con `aria-labelledby` y anunciar el fin con una regiÃ³n de estado; comprobar foco al cerrar la aplicaciÃ³n.

## Fidelidad, red y comportamiento

La UI usa las 15 rutas definidas por `mock-api.js`; no encontrÃ© rutas `/api/*` adicionales sin cubrir. El contrato cotejado con `trabajo/RESUMEN.md`, `trabajo/ui/index.html` y `trabajo/extracted/server-tail.pretty.js` coincide en mÃ©todos, cuerpos principales, campos y estados: `/api/config` recibe `{config}`, `/api/ejecutar` devuelve 409 ocupado y 400 sin selecciÃ³n, `/api/recibidos` recibe el archivo crudo y puede devolver 400, `/api/recibido` devuelve PDF o 404, y `/api/smtp`/`/api/prueba` representan fallos funcionales con HTTP 200 y `{ok:false,error}`. La UI selecciona automÃ¡ticamente la hoja con filas, consulta `/api/estado` sin avanzar el reloj del mock, lee `X-Faltan`, procesa los documentos y recibe XLSX. No hay un endpoint consumido por la UI ausente del mock.

La divergencia de `/api/vista` es intencionada y visible en el contrato demo: el servidor real devuelve PDF (`server-tail.pretty.js:529-557`), mientras el mock devuelve SVG `image/svg+xml` con marca de demostraciÃ³n. La UI coloca el Blob en un `<iframe>` sin exigir MIME PDF, asÃ­ que la vista se muestra; no es una reproducciÃ³n del PDF real. El PDF de Â«Ver PDFÂ» sÃ­ es un Blob local `application/pdf`.

La polÃ­tica del artefacto bloqueÃ³ en la prueba de navegador las cargas dinÃ¡micas de imagen/script y `import()` mediante CSP (`img-src data: blob:`, `script-src` con hashes); `form-action 'none'` rechazÃ³ `form.submit()`. Los clics en enlaces externos se cancelan y `window.open()` ajeno falla. El **Ãºnico bypass confirmado** fue la navegaciÃ³n directa descrita en P1.

## Privacidad y discrepancia de datos

El build carga `demo/datos/mock-fixtures.json` (`demo/build-demo.js:9, 175`): es la fuente usada realmente y contiene una hoja vacÃ­a mÃ¡s seis registros `Persona Demo`, DNI `DEMO-001`â€¦`DEMO-006`, cuatro direcciones `.invalid`, una vacÃ­a y una invÃ¡lida deliberada. La UI escoge la hoja no vacÃ­a (`trabajo/ui/index.html:1300`). Por tanto, `demo/datos/demo-datos.json` (15 personas), `estados-envio.json` y el contenido del XLSX **no alimentan las respuestas del mock**. `asistentes-demo.xlsx` se usa como archivo de activaciÃ³n en `tests/browser.test.js`, pero el mock ignora su binario y devuelve los seis fixtures. Los dos JSON antiguos no estÃ¡n referenciados por el build. Son artefactos muertos/contradictorios, no el catÃ¡logo runtime.

Las capturas revisadas muestran los seis registros `Persona Demo` y correos `.invalid`; no vi datos adicionales en ellas. La búsqueda encontró en `demo/` únicamente el placeholder genérico de ruta ya indicado; no encontró una ruta con nombre de perfil de usuario, teléfono ni buzón real. Los campos SMTP de los fixtures están vacíos o usan `.invalid`; la cadena `secret` de `mock-api.test.js:24` es un valor sintético para probar que se elimina `smtp.pass`.

## Tests ejecutados y lÃ­mites

* `node demo\tests\mock-api.test.js` â€” **PASS**. No es un test vacÃ­o: comprueba las 15 rutas, cuerpos/estados principales, sanitizaciÃ³n de contraseÃ±a, escenarios, tipos de respuesta, estados de trabajo (incluido detener/reintentar/rebotar), `AbortSignal` y rechazo de APIs de red del mock.
* `node demo\tests\browser.test.js` â€” **PASS**. En Chrome headless comprobÃ³ carga, envÃ­o simulado y solo una peticiÃ³n HTTP inicial en el flujo normal. No prueba ataques de recursos/navegaciÃ³n; la sonda de navegador separada de esta revisiÃ³n detectÃ³ el bypass de `location.assign`.

Los tests del mock no crean DOM: no ejercitan reescritura/clic central de enlaces PDF, formularios, diÃ¡logos, anuncios accesibles ni carga dinÃ¡mica de recursos. Tampoco abren el XLSX/PDF generado con un lector de formato: el test solo revisa la firma ZIP y algunos bytes OOXML del XLSX, y el prefijo `%PDF-1.4` del PDF; no demuestra interoperabilidad completa. No se ejecutÃ³ `build.test.js` porque regenera y borra `demo/dist`; el `dist` presente se inspeccionÃ³ en solo lectura.




