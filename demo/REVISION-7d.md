# RevisiÃ³n independiente 7d â€” build, mÃ³vil y capturas

Fecha: 26/11/2026 (Europe/Madrid). Rama: `demo-web`.

**Veredicto: NO publicable como demo con contraste AA y avisos sin superposiciÃ³n en cualquier ancho. El alcance mÃ³vil solicitado, 360â€“430 px, sÃ­ pasa.** H2 y H3 estÃ¡n resueltos en mÃ³vil, pero sus correcciones terminan en 760 px; una comprobaciÃ³n adicional a 800 px reproduce ambos problemas. H4 y los cambios concretos de 5c estÃ¡n resueltos. No se ha modificado cÃ³digo, hecho push, merge ni cambiado de rama.

## Aislamiento y evidencia reproducible

Todo build, test, modificaciÃ³n experimental y captura se ejecutÃ³ en esta copia temporal, conservando `demo/` y `trabajo/ui/`:

`<carpeta temporal>\revision-7d-86a4064695714e95a2a898ad991173e9`

En el repositorio solo he escrito este informe. No he regenerado su `dist/` ni sus capturas. Los PNG de esta revisiÃ³n se encuentran en `demo/capturas/` dentro de la copia temporal, no en la carpeta homÃ³nima del repositorio. Los resultados se obtuvieron ejecutando las pruebas personalmente, no adoptando los informes previos.

Se ejecutÃ³ `node demo/build-demo.js` dos veces, seguido de `npm --prefix demo run test:all`. Los cuatro tests â€”build, mock API, browser y mobileâ€” dieron PASS; la suite terminÃ³ con cÃ³digo 0. Chrome headless local, CDP, emulaciÃ³n mÃ³vil tÃ¡ctil, viewport de 800 px de alto y DPR 2; Node 26.13.1. Se generaron 35 PNG nuevos. Evidencia adicional: `test-all.log`, `measurements.jsonl`, `extra.log`, `mutation.log`, `smtp.log` y scripts de instrumentaciÃ³n, todos bajo la raÃ­z temporal indicada.

| ComprobaciÃ³n | Resultado | Evidencia |
|---|---|---|
| Build reproducible, dos ejecuciones | OK | Ambos `index.html`: `8D884BBF83E3B7F68942D0AB1729DABC5AC881F8677361153563DFD471A442AD`. Ambos `_headers`: `689EB68F37488AF145404DB0486A232CE3202C3FD13CED9E74EF12C14DF69084`. |
| Coincidencia con el dist del repositorio | OK | El SHA-256 de `index.html` coincide con el indicado en la tarea y con el leÃ­do del repositorio antes y despuÃ©s de la revisiÃ³n. |
| Suite completa | OK | Cuatro PASS; build preserva 133 IDs y 21 atributos data; navegador carga Excel y completa cuatro intentos simulados. |
| H2, placeholders y valores, 360â€“430 px | OK | `getComputedStyle(input,'::placeholder')`, opacidad efectiva y fondo real; 5,98175:1 para placeholders y 16,13146:1 para valores de evento sobre blanco. |
| H3, toast y banner, 360â€“430 px | OK | Cero intersecciones con controles/textos en los estados auditados, incluido toast visible tras cargar Excel. Captura `360-toast.png`: aviso en flujo antes del tÃ­tulo, sin cubrir campos. |
| H4, texto de carga | OK | Se ve Â«Carga el Excel ficticio de demostraciÃ³nÂ» en la zona `#drop`, en DOM y captura con Excel cargado. |
| 5c, textos concretos solicitados | OK | DiÃ¡logo Â«Â¿Iniciar simulaciÃ³n para 4 intentos?Â» / Â«Simular 4 intentosÂ»; botÃ³n Â«Simular envÃ­o de pruebaÂ»; resultados Â«ConexiÃ³n simulada correctaÂ» y Â«Prueba simulada para prueba@example.invalidâ€¦Â». |
| Ejemplos ficticios de 5c | OK | HTML contiene Persona Demo, DEMO-001 y Carpeta de certificados. Búsqueda literal UTF-8 sin ejemplos de nombre/DNI con formato real ni rutas de perfil de usuario; también inspección visual de las ocho pantallas. |
| Ocho pantallas en 360, 375, 390, 412 y 430 px | OK | p0â€“p7, seis personas del Excel demo, ZIP ficticio en p5 y estado final de envÃ­o en p7. p0 se prueba antes de cargar el Excel, como inicio del recorrido. |
| Sin scroll horizontal mÃ³vil | OK | En cada ancho, `documentElement.scrollWidth = clientWidth`; body tampoco desborda. |
| Objetivos tÃ¡ctiles mÃ³viles â‰¥44 px | OK | Cero objetivos pequeÃ±os en pantallas y estados auditados. Checkbox/radio se mide con su label clicable; no se exige que el dibujo de la casilla mida 44 px. |
| Tablas largas, nombres y estados | OK | Tarjetas verticales; nombres completos, correo y estados Correcto/Sin correo/Correo no vÃ¡lido, Enviado/Fallido/Rebotado/Saltado y asignaciones de p5 conservados. |
| Subida y estado de envÃ­o | OK | Archivo elegido mediante `DOM.setFileInputFiles`; seis filas; cuatro intentos, dos saltados; resultado final y rebote legibles, botones amplios. |
| Foco visible | OK | Seis pasos de Tab a 360 px comprueban `:focus-visible` y outline; foco durante scroll no oculto por cabecera. Cancelar tiene anillo visible en la captura del diÃ¡logo. |
| Contraste textual AA mÃ³vil | OK | Cero fallos en texto normal, valores, placeholders y contenido textual de pseudoelementos inspeccionados; deshabilitados excluidos. No equivale a certificaciÃ³n WCAG completa. |
| CSS mÃ³vil y estilos computados | OK | Sin degradados ni emojis usados como iconos; iconos SVG. Radios decorativos 4/8 px, cero para anular redondeo. Ninguna sombra fuera de diÃ¡logo/toast en el recorrido mÃ³vil. |
| InspecciÃ³n personal de â‰¥8 capturas | OK | Trece PNG vistos; detalle y juicio visual abajo. |
| Build ante sustituciÃ³n obligatoria ausente | OK | MutaciÃ³n real en la copia: eliminaciÃ³n de la cadena de carga; exit 1 y error con etiqueta `zona de carga #drop`. |
| Original intacto | OK | `git diff --stat 6c34bd4 -- trabajo/ui/` vacÃ­o en el repositorio, antes y despuÃ©s. |
| H2/H3 fuera del breakpoint mÃ³vil | FALLO | A 800 px: placeholder 3,82349:1 y toast visible sobre texto de ayuda. VÃ©ase N1. |
| Coherencia editorial completa del diÃ¡logo | FALLO | Persiste Â«No cierres la ventana negraâ€¦Â» y falta espacio en Â«reales.No cierresÂ». VÃ©ase N2. |
| Dispositivos fÃ­sicos, Safari/Firefox, hosting publicado | NO PROBADO | Solo Chrome local emulado; no se realizÃ³ despliegue. |
| Apertura real file:/// en navegador en esta revisiÃ³n | NO PROBADO | El test unitario de mock sÃ­ pasa la regresiÃ³n Windows/subcarpetas, pero no repetÃ­ aquÃ­ el recorrido de navegador mediante file:///. |

## Medidas y alcance de las correcciones

**H2: resuelto en mÃ³vil / parcial globalmente.** En Datos del evento, los placeholders de horario, duraciÃ³n y segundo firmante usan `rgb(91,100,114)`, opacidad 1, fondo blanco: **5,981749:1**. Los valores de evento, fecha y lugar usan `rgb(29,33,41)`, opacidad 1, fondo blanco: **16,131463:1**. La auditorÃ­a lee `::placeholder` expresamente y verifica valores de inputs, selects y textareas. La instrumentaciÃ³n adicional conserva todas las medidas positivas, no solo fallos, en JSONL. A 800 px, el mismo placeholder recupera opacidad 0,8 y **3,823492:1**.

**H3: resuelto en mÃ³vil / parcial globalmente.** `demo-mobile.js` coloca el toast al principio de `main`; el CSS mÃ³vil usa `position:static` y `display:none/block`. Tras cargar el Excel se espera explÃ­citamente `.on`, se mide el solapamiento y se toma una captura con el aviso presente. Los cinco anchos dan `toastOverlap=0`. Las capturas ordinarias esperan a que desaparezca. Se comprueba ademÃ¡s banner frente a navegaciÃ³n, controles y diÃ¡logo. La correcciÃ³n no se extiende a >760 px.

**H4: resuelto.** `replaceRequired` valida la coincidencia antes de sustituir. QuitÃ© exclusivamente en la copia la cadena original Â«Arrastra aquÃ­ el Excel o CSVÂ», ejecutÃ© el build y obtuve:

```text
exit=1
Error: SustituciÃ³n obligatoria no encontrada en la UI original: zona de carga #drop
    at replaceRequired (.../demo/build-demo.js:168:11)
```

RestaurÃ© los bytes originales de la copia en `finally`; el dist conserva el hash esperado. La salida fallida se produce antes de borrar/escribir el dist. La prueba valida una sustituciÃ³n obligatoria real; la tabla de sustituciones usa el mismo helper para los restantes textos.

**5c: resuelto para los cambios enumerados.** AccionÃ© Probar conexiÃ³n y Simular envÃ­o de prueba en navegador, y leÃ­ el texto renderizado de sus resultados. TambiÃ©n repetÃ­ Probar conexiÃ³n seleccionando Gmail mediante `#segSmtp [data-v=gmail]`, no solo con Outlook. Ambos muestran Â«ConexiÃ³n simulada correctaÂ». AbrÃ­ el diÃ¡logo de envÃ­o: el CTA es Â«Simular 4 intentosÂ», y aparece la advertencia de que no se envÃ­an correos reales. La muestra sin lista del cÃ³digo generado usa Persona Demo/DEMO-001 y el placeholder de carpeta es genÃ©rico. Esto no elimina todos los textos heredados; N2 documenta el resto observado.

## RevisiÃ³n visual personal

InspeccionÃ© los ocho PNG `360-p0-inicio`, `360-p1-lista-excel`, `360-p2-evento`, `360-p3-certificado`, `360-p4-justificante`, `360-p5-recibidos`, `360-p6-correo` y `360-p7-envio-simulado`, ademÃ¡s de `360-toast`, `360-dialogo-enviar`, `390-p0-inicio`, `430-p7-enviar` y la comprobaciÃ³n adicional `capturas-desktop/800-toast` (todos con extensiÃ³n `.png`). Son capturas de mi copia. A 375 y 412 px se realizaron medidas y recorrido, pero el test no genera PNG.

La versiÃ³n mÃ³vil sÃ­ parece trabajada con criterio de diseÃ±ador: jerarquÃ­a tipogrÃ¡fica clara, mÃ¡rgenes consistentes, grupos bien separados, paleta contenida, iconos uniformes y acciones anchas. Las tarjetas conservan identidad y estado. No vi elementos superpuestos ni cortes accidentales en los ocho recorridos mÃ³viles. El toast ya tiene su propio espacio. El diÃ¡logo cabe y permite distinguir el foco.

Hay compromisos aceptables: p1, p3, p4 y p6 requieren bastante scroll vertical; las tarjetas repiten campos y alargan las listas. El tÃ­tulo de navegaciÃ³n de p5 se abrevia con puntos suspensivos, pero su encabezado principal permanece completo. Los valores largos de inputs y los textos extensos de textarea tienen desplazamiento interior normal; no son pÃ©rdida de informaciÃ³n. La vista previa documental es deliberadamente orientativa y pequeÃ±a. El acabado visual mÃ³vil es sÃ³lido, aunque la redacciÃ³n heredada impide considerar totalmente pulida la demo.

## Hallazgos priorizados

### N1 â€” Media: H2/H3 solo se corrigen hasta 760 px

UbicaciÃ³n: `demo/src/demo-mobile.css`, reglas de placeholders y `.toast` dentro de `@media (max-width:760px)`; `demo-mobile.js`, `placeToast()` vuelve a moverlo a body fuera de ese rango.

ReproducciÃ³n adicional: viewport 800Ã—800, cargar el Excel demo y abrir Datos del evento. El contraste del placeholder vuelve a **3,82349:1**. Tras cargar el Excel, con `.toast.on` y opacidad computada **1**, el aviso ocupa **x=529,28, y=731, ancho=246,72, alto=45 CSS px**, superpuesto a la ayuda de Â«Nombre que aparece en los documentosÂ». Lo confirma personalmente `capturas-desktop/800-toast.png`. No se interpreta como fallo mÃ³vil: los cinco anchos exigidos pasan.

La prueba adicional tambiÃ©n registrÃ³ `scrollWidth=840` frente a `clientWidth=800` en p5, fuera de la matriz mÃ³vil pedida. Conviene revisar el banner al salir del breakpoint. No trasladarÃ­a sin revisiÃ³n todos los fallos del test mÃ³vil a escritorio: sus reglas de tamaÃ±o tÃ¡ctil no son el criterio solicitado allÃ­, y su detector considera visibles los toasts con opacidad cero. La evidencia de superposiciÃ³n que reporto arriba usa exclusivamente el estado `.on` con opacidad 1 y captura visible.

Propuesta: aplicar el contraste de placeholders globalmente en los estilos de la demo, decidir una presentaciÃ³n de avisos sin cobertura tambiÃ©n fuera de mÃ³vil y aÃ±adir al menos un ancho >760 a las regresiones pertinentes. No modificar la UI original.

### N2 â€” Baja: instrucciones de aplicaciÃ³n local y uniÃ³n defectuosa en el diÃ¡logo

En `360-dialogo-enviar.png` y el texto DOM se lee Â«Esta demostraciÃ³n no envÃ­a correos reales.No cierres la ventana negra de la aplicaciÃ³n hasta que termineâ€¦Â». No existe una ventana negra que el visitante de esta demo web deba mantener abierta. El texto es incoherente y falta un espacio tras el punto. El botÃ³n nuevo y la advertencia de simulaciÃ³n sÃ­ estÃ¡n correctos: esto no invalida los cambios enumerados de 5c, pero es un defecto editorial nuevo confirmado.

Propuesta: sustituir el bloque completo del aviso por una instrucciÃ³n coherente con la simulaciÃ³n web, manteniendo la validaciÃ³n obligatoria del build. Otros textos descriptivos aÃºn dicen Â«RecibirÃ¡s el mismo correoÂ» o Â«Generar y enviar a 4 personasÂ»; el banner y la confirmaciÃ³n los contextualizan, pero armonizarlos mejorarÃ­a la claridad.

## Cierre

H4 y 5c quedan aprobados en su alcance concreto. Los requisitos mÃ³viles examinados pasan y las capturas ya son utilizables para mostrar ese recorrido. No doy aprobaciÃ³n global sin reservas a la demo mientras persistan las limitaciones de H2/H3 fuera de mÃ³vil; esa es la razÃ³n del veredicto NO, no un fallo de los cinco anchos mÃ³viles solicitados. Este informe no aplica arreglos.

