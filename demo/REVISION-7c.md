# RevisiÃ³n independiente 7c â€” capa simulada, navegaciÃ³n y datos

Fecha: 25/11/2026. Rama observada: `demo-web`. RevisiÃ³n de solo lectura; Ãºnicamente se crea este informe. No se ejecutaron `build.test.js` ni `npm run test:all`.

**Veredicto: no publicable todavÃ­a.** El flujo de la demo, el bloqueo de red en Chrome y los arreglos funcionales comprobados pasan. La bÃºsqueda de privacidad sobre todo `demo/` aÃºn encuentra restos de aspecto personal en el informe histÃ³rico 7b y en literales de reemplazo del build. AdemÃ¡s, la protecciÃ³n de navegaciÃ³n directa solo estÃ¡ acreditada para Chrome con Navigation API; deben conservarse explÃ­citamente esos lÃ­mites.

## Resultados

| ComprobaciÃ³n | Resultado | Estado y evidencia |
|---|---|---|
| 7a H1 â€” apertura directa `file:///` en Windows | **OK** | AbrÃ­ el `demo/dist/index.html` real desde su ruta local en Chrome headless; elegÃ­ Solo correo, carguÃ© `demo/datos/asistentes-demo.xlsx` y lleguÃ© al envÃ­o simulado. Se mostraron seis filas y el lote terminÃ³ con cuatro intentos; no se enviÃ³ correo. |
| 7b P1 â€” navegaciÃ³n directa fuera de la demo | **OK en Chrome** | Sobre el `dist` real servido localmente, probÃ© `location.assign`, `location.href`, `location.replace`, `window.open`, `form.submit`, clic en enlace, `img.src`, `script.src`, `import()`, WebSocket, EventSource, `sendBeacon`, `iframe.src` y meta refresh. Un servidor sumidero de loopback registrÃ³ **cero peticiones**; la pÃ¡gina permaneciÃ³ en la demo. Los recursos/formularios quedan ademÃ¡s limitados por CSP y los enlaces por el listener. **No probado** en Firefox, Safari ni navegadores sin Navigation API; vÃ©ase la limitaciÃ³n publicada en `demo/src/LEEME-MOCK.md:21-23`. |
| 7b P1 â€” datos legacy | **FALLO (parcialmente resuelto)** | Los datasets y fixtures actuales usan nombres de demostraciÃ³n, identificadores `DEMO-*` y correo `.invalid`; el contenido XML del XLSX no dio coincidencias. Sin embargo, la bÃºsqueda de todo `demo/` encontrÃ³ restos en `demo/REVISION-7b.md:32,36,77`, `demo/REVISION-7d.md:11,26` y `demo/build-demo.js:190,193`; detalle en Â«PrivacidadÂ». No son datos de los fixtures activos, pero siguen dentro del Ã¡rbol que se revisÃ³. |
| 7b P2 â€” textos ambiguos de envÃ­o | **OK** | El diÃ¡logo ofrece Â«Simular N intentosÂ»; el resultado SMTP dice Â«ConexiÃ³n simulada correctaÂ» y el texto de prueba aclara que no se enviÃ³ correo. El botÃ³n de prueba tambiÃ©n se presenta como simulaciÃ³n. Verificado en `demo/dist/index.html` y en el flujo de Chrome. |
| 7b P2 â€” temporizador de rebotes antiguo | **OK** | `mock-api.js` sincroniza/suprime el temporizador heredado al consultar estado y protege el callback propio por identidad del trabajo (`demo/src/mock-api.js:117-145`). `node demo\tests\mock-api.test.js` pasÃ³; incluye el avance de 150 s del reloj falso para detectar callback tardÃ­o ajeno. |
| 7b P3 â€” anuncios accesibles | **OK** | El diÃ¡logo de descargas tiene `aria-labelledby`; el final se anuncia con `role=status` y `aria-live=polite` (`demo/src/demo-banner.js:9,16`). `node demo\tests\mock-api.test.js --browser` pasÃ³ en Chrome y comprobÃ³ nombre del diÃ¡logo, retorno de foco y anuncio final. |
| Privacidad del `dist` y del libro XLSX | **OK** | El HTML distribuido y las celdas del XLSX no contienen coincidencias de DNI/NIE, direcciones de ejemplo `.com/.org`, lista de nombres 7b ni rutas de perfil. Los fixtures empaquetados usan IDs `DEMO-*` y direcciones `.invalid`. |
| Rutas de perfil de Windows, buzones y secretos en todo `demo/` | **FALLO** | El informe 7b contiene una ruta genÃ©rica en la lÃ­nea 36 y una referencia al nombre del perfil en la lÃ­nea 77. Los literales fuente del build en las lÃ­neas indicadas arriba conservan nombres/direcciones de ejemplo y un identificador con forma de DNI. No encontrÃ© valores de claves o tokens; el Ãºnico `.env.example` versionado contiene solo un comentario indicando que no hay claves. |
| `trabajo\ui\` sin cambios | **OK** | `git diff --stat 6c34bd4 -- trabajo/ui/` estÃ¡ vacÃ­o. |
| Git y reglas de exclusiÃ³n | **FALLO parcial** | No aparecen secretos ni artefactos ejecutables/XLSX entre los archivos rastreados y `.env.example` es solo un comentario. Pero sÃ­ hay rutas de perfil y datos personales de aspecto real en fuentes rastreadas; vÃ©ase Â«Hallazgos nuevosÂ». `demo/dist/index.html` no estÃ¡ ignorado y `demo/datos/tmp/` sÃ­ estÃ¡ ignorado. Los archivos de `demo/` aÃºn estÃ¡n sin seguimiento en este estado. |
| Artefactos | **OK** | Los SHA-256 de `dist/index.html` y `_headers` coinciden con los valores suministrados para esta revisiÃ³n. |
| Compatibilidad fuera de Chrome y hosting publicado | **NO PROBADO** | Se probÃ³ Chrome headless local; no otros motores, equipos ni despliegue. La documentaciÃ³n advierte que no existe garantÃ­a universal de navegaciÃ³n en navegadores sin Navigation API. |

### Privacidad: coincidencias y alcance

La bÃºsqueda regex cubriÃ³ texto en `demo/` salvo `demo/tests/`; se inspeccionÃ³ aparte el XML del XLSX. En el informe histÃ³rico `demo/REVISION-7b.md:32` permanece el roster anterior, direcciones de correo reservadas `.com` y valores con formato de DNI; `:36` vuelve a citar un valor con ese formato y una ruta de usuario genÃ©rica; `:77` incluye una referencia al nombre de cuenta del perfil. En el informe paralelo `demo/REVISION-7d.md:11` aparece una ruta absoluta temporal con el nombre del perfil y `:26` repite una ruta de usuario. En `demo/build-demo.js:190,193` sobreviven cadenas de la UI original usadas como patrÃ³n de reemplazo: contienen nombres y buzones de ejemplo, y la segunda tambiÃ©n un identificador con formato de DNI. La coincidencia numÃ©rica en `demo/REVISION-7a.md:40` es un fragmento del SHA-256, no un DNI.

La comprobaciÃ³n de contenido rastreado (`git grep`, limitada por Git a `git ls-files`) hallÃ³ referencias adicionales fuera de `demo/`: rutas con el nombre de perfil en `trabajo/QA-INFORME.md:5` y `trabajo/REBUILD.md:22`; una muestra con direcciones institucionales y DNI/NIE de formato real en `trabajo/diseno/muestra.html:449-452`; datos de ejemplo con DNI y direcciones en `trabajo/diseno/comprobar-t3.js:7`; y un placeholder mÃ¡s un fallback de nombre/DNI en `trabajo/ui/index.html:924,1598`. Son ejemplos, no se verificÃ³ si identifican personas reales. No apareciÃ³ ningÃºn valor de clave, token ni clave privada.

Estos hallazgos no aparecen en los fixtures ni en el `dist` actual, y no prueban que los ejemplos correspondan a personas reales. Aun asÃ­, incumplen la bÃºsqueda solicitada sobre el Ã¡rbol completo y mantienen informaciÃ³n de aspecto personal â€”incluido un nombre de perfilâ€” en archivos que podrÃ­an distribuirse junto con la demo.

## Hallazgos nuevos priorizados

### P1 â€” El repositorio rastreado conserva rutas de perfil y muestras de identidad

`git ls-files` incluye las referencias y muestras enumeradas en Â«Privacidad: coincidencias y alcanceÂ». Aunque parecen ejemplos de QA/diseÃ±o, contienen rutas vinculadas al usuario, buzones institucionales y valores con formato real de DNI/NIE. Antes de una publicaciÃ³n del repositorio, confirmar que cada muestra es sintÃ©tica y redactar las rutas de perfil; si no se puede acreditar, sustituir los datos. No se hallaron secretos de autenticaciÃ³n.

### P1 â€” Informe histÃ³rico y literales del build impiden aprobar la bÃºsqueda completa

`demo/REVISION-7b.md` conserva la lista y los valores que motivaron el hallazgo anterior; `demo/build-demo.js` conserva el patrÃ³n original que reemplaza el build. El escaneo tambiÃ©n encontrÃ³ rutas de perfil en `demo/REVISION-7d.md`, informe paralelo. Aunque el `dist` de esta revisiÃ³n ya estÃ¡ limpio, esos archivos siguen dentro del Ã¡rbol y exponen nombres de perfil. Redactar/reemplazar los residuos y repetir el escaneo antes de dar por resuelto el hallazgo de datos.

## ValidaciÃ³n reproducible

- `node demo\tests\mock-api.test.js` â€” PASS.
- `node demo\tests\mock-api.test.js --browser` â€” PASS; Chrome headless, sin instalaciÃ³n global.
- `node demo\tests\browser.test.js` â€” PASS; carga el `dist` sin modificarlo y completa el envÃ­o simulado por HTTP local.
- Recorrido adicional sobre el `dist` real abierto directamente como `file:///` â€” PASS hasta completar el envÃ­o simulado.
- Sonda de escapes con sumidero loopback â€” cero solicitudes recibidas para todos los mÃ©todos enumerados.

No se ejecutaron comandos que regeneren o borren `demo/dist`.

## Condiciones para aprobar

1. Redactar coincidencias de `demo/` y del contenido rastreado; retirar rutas de perfil y literales de identidad/formato real, y repetir los escaneos para confirmar cero coincidencias no justificadas.
2. Publicar solo con Chrome probado y el lÃ­mite de Navigation API claramente declarado. Si se promete soporte para otros navegadores, aportar prueba especÃ­fica y una barrera externa de red para los que no cancelen la navegaciÃ³n.
3. Mantener el `dist` revisado y volver a verificar sus hashes tras cualquier regeneraciÃ³n.

