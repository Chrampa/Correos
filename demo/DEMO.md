# Diseño de la demostración web estática

Documento de implementación; no constituye una demo ya construida. Fuente: `trabajo/ui/index.html`, contrastada con `trabajo/RESUMEN.md`, `trabajo/AUDITORIA-UI.md`, `trabajo/QA-INFORME.md` y `trabajo/extracted/server-tail.pretty.js`. Prevalece el código actual sobre los números de línea de los informes antiguos. No modificar la fuente ni ejecutar el .exe.

## 1. Contrato completo y simulación

Hay **15 rutas API**: 14 invocadas mediante `fetch` (directo o helper `api`) y una mediante enlace. El helper usa GET sin cuerpo y POST JSON con cuerpo; `raw=true` entrega la `Response` sin interpretar. Responder con `Response`, códigos HTTP y MIME correctos; errores HTTP en JSON `{error:"…"}`. Los fallos funcionales de conexión/prueba/rebotes son HTTP 200 con `{ok:false,error}`.

| Método y ruta | Cuerpo enviado por la UI | Respuesta consumida | Comportamiento simulado |
|---|---|---|---|
| GET `/api/info` | Ninguno | `{version,config,salida,so}`; usa los tres primeros | Configuración ficticia inicial, `version:"1.4.0-demo"`, `salida:"Descargas de demostración"`, `so:"web-demo"`. Sin leer configuración del equipo. |
| POST `/api/config` | **`{config:cfg}`**, no `cfg` directamente | `{ok:true}` | Copia saneada en memoria; contraseña eliminada, sin persistencia. Debounce de 600 ms ya en UI. |
| POST `/api/lista` | `{nombre:f.name,datos:base64}` vía FileReader | `{hojas:[{hoja,columnas,filas,filaEncabezado}]}`; filas son objetos por encabezado | Tras 350 ms devolver únicamente hojas ficticias predefinidas. No interpretar bytes de archivos del usuario; avisar «Carga simulada: se usan personas ficticias». Incluir hoja vacía y hoja Personas con encabezados Nombre, Apellidos, Correo electrónico, DNI. `filaEncabezado:0`. Escenario de error explícito devuelve 400. |
| POST `/api/vista` | `{config:c,fila:row,tipo}`; tipo certificado/justificante | Blob y cabecera `X-Faltan` con array JSON codificado por `encodeURIComponent`; original devuelve PDF | Blob SVG seguro `image/svg+xml` creado en memoria, con nombre ficticio, evento, fecha, tipo y marca DEMOSTRACIÓN. El iframe actual admite ese MIME sin cambiar `vista()`. Cabecera `%5B%5D` o variables realmente ausentes. Ver detalles abajo. |
| POST `/api/smtp` | `{smtp:cfg.smtp,correo:cfg.correo}` | `{ok,info?:{usuario,nombre},error?}` | Espera 600 ms, éxito ficticio con `usuario:"cuenta@example.invalid"`, `nombre:"Cuenta de demostración"`; escenario alternativo de error. Nunca abrir Outlook, resolver hosts ni autenticar. Capa demo sustituye el texto «Outlook abierto…» por «Comprobación simulada…». |
| POST `/api/prueba` | `{config:cfg,fila,para}` | `{ok:true,nombre}` o `{ok:false,error}` | Validación de formato y simulación de 700 ms; sin envío. Prefijar resultado «Prueba simulada» y eliminar instrucción de revisar bandeja de entrada. Precargar `paraPrueba` con `prueba@example.invalid`. |
| POST `/api/ejecutar` | `{config:cfg,filas:envios.map(e=>e.fila),indices,modo,reutilizar}`; modo enviar/generar; reutilizar puede omitirse | `{ok:true}`; errores 409/400 | Crear lote en memoria, respetar índices de `envios`, no índices originales del Excel. 409 si ocupado; 400 si no hay índices válidos. Temporizadores descritos en §3; `reutilizar:true` inicia nuevo lote de fallidos. |
| GET `/api/estado` | Ninguno | `{}` sin lote; después objeto job de §3 | Snapshot profundo del estado actual; no avanzar por cada consulta. La UI sondea cada 800 ms mientras `corriendo`. |
| POST `/api/parar` | `{}` | `{ok:true}` | Marcar `parar:true`, cancelar siguiente paso, dejar `corriendo:false`, `fin`, contadores parciales y aviso «Simulación detenida». Idempotente. |
| POST `/api/abrir` | `{}` (la UI no manda ruta) | `{ok:true}` | Mostrar panel «Archivos de demostración» con descargas locales; no abrir explorador. Cambiar etiqueta a «Ver descargas demo». |
| POST `/api/rebotes` | `{config:cfg,dias}`; dias omitido en botón de lote, número en búsqueda independiente | `{ok:true,rebotes:[{nombre,email,motivo,codigo,fecha}],marcados,conJob}` o `{ok:false,error}` | Rebote ficticio 550 5.1.1, motivo «Destinatario inexistente (simulado)». Si hay lote final de envío, convertir una entrada Enviado en Rebotado y actualizar contadores una sola vez. Sin lote, resultado ficticio independiente con `marcados:0,conJob:false`; respetar periodo. Preset distinto de Outlook devuelve error explicativo simulado. |
| POST `/api/recibidos?nombre=…` | **File binario crudo**, no JSON ni FormData; una llamada por archivo | `{docs:[{id,archivo,nombre,dni,cargo,horas,creditos,error?}]}` | ZIP devuelve catálogo ficticio: coincidencia por documento, coincidencia por nombre, sin asignar y documento con error; PDF suelto devuelve uno. IDs únicos por carga. La UI añade `asig:null,como:null` y empareja localmente. No extraer archivos ajenos. Escenario ZIP vacío: 400 `{error:"El ZIP de demostración no contiene PDF"}`. |
| GET `/api/recibido?id=…` | Ninguno; **`<a target="_blank">`**, no fetch | PDF en pestaña nueva | Preparar Blob PDF ficticio por ID y sustituir `href` antes de interacción, conservando ID en `data-demo-id`. El dispatcher también responde al GET con ese PDF por si se usa fetch; ID desconocido, 404. No dejar enlaces HTTP `/api/recibido` navegables. |
| POST `/api/excel` | `{hoja,filaEncabezado,columnas,filas,extra,editables}`; extra es array por fila con certificados/estado/fecha; editables son nombres de columnas correo/DNI | Blob XLSX; UI descarga `… - actualizado.xlsx` | Generar XLSX válido localmente con columnas, cambios ficticios y `extra`; usar biblioteca empaquetada localmente, nunca CDN. No devolver CSV con extensión XLSX. Sanitizar celdas como texto para evitar fórmulas. |
| POST `/api/salir` | `{}` | `{ok:true}`; después la UI reemplaza `document.body` | Cancelar temporizadores; mostrar «Demostración finalizada. Recarga para empezar». La capa demo restaura aviso fijo tras el reemplazo del body; no cerrar pestaña ni proceso. |

**Detección de columnas:** la hace `usarHoja()` en la propia UI, no una API adicional. Conservar encabezados reconocibles, objetos por fila y selector de hoja; comprobar selección automática de correo/DNI y plantilla `{Nombre} {Apellidos}`. Pegado, edición, duplicados, selección, asignación de certificados y unión por persona son locales. No inventar rutas para estos controles ni para reintentar: `bReintentar` filtra Error/Rebotado por nombre y llama a `/api/ejecutar` con `reutilizar:true`.

**Vista previa:** generar SVG sin scripts, enlaces, fuentes ni imágenes externas; escapar todo texto XML. Reflejar nombre/fecha/título/color y explicar «Vista orientativa; no reproduce el generador PDF». No incrustar SVG aportado por usuarios. Diferenciar certificado y justificante y probar el iframe con su fragmento PDF heredado (inocuo para SVG). Para «Ver PDF» y descargas, usar PDF real de ejemplo creado en build, marcado DEMOSTRACIÓN / SIN VALIDEZ; no disfrazar SVG como PDF. Revocar URLs Blob al reemplazar o reiniciar; mantener vivos los de pestañas/documentos mientras puedan usarse.

**Otras descargas, sin API:** `bExport` descarga JSON (ya elimina `smtp.pass`); conservarlo solo con contenido ficticio. `bImport` lee JSON local; limitarlo a proyecto demo validado. Añadir botones de demo para descargar Excel inicial, ZIP de certificados ficticios y PDFs de ejemplo usando bytes embebidos. La UI original no tiene endpoint de descarga de lote/ZIP generado: el panel de `/api/abrir` ofrece un ZIP creado localmente con PDFs de muestra y registro ficticio, identificado como muestras, sin prometer composición PDF completa.

## 2. Intercepción y aislamiento de red

«Sin servidor» significa sin backend ni comunicación de ejecución: el hosting solo entrega el documento estático inicial. No es posible abrir una URL alojada sin esa carga inicial. Objetivo comprobable: **cero peticiones de red iniciadas por la demo después de cargar su documento**, incluidas `/api/*`, loopback y recursos de terceros. Empaquetar scripts, estilos, biblioteca XLSX y fixtures dentro del HTML final para que también funcione desconectado tras la carga.

1. Inyectar `mock-api.js` como script inline síncrono antes de cualquier script original. No conservar camino de fallback al fetch nativo. Normalizar string/URL/Request, método de Request y overrides de init, cuerpo y query. Aceptar únicamente combinación método/ruta de la tabla en el origen actual; la query solo admite nombre/id donde corresponda. Origen ajeno (también localhost/127.0.0.1), credenciales en URL, esquemas ajenos o ruta desconocida: rechazar localmente con error «Petición bloqueada en demostración». No redirigir ni reintentar mediante red. Respetar AbortSignal.
2. Actualmente no hay XMLHttpRequest, EventSource ni FormData. Bloquear XHR, EventSource, WebSocket, `sendBeacon`, Worker/SharedWorker y registro de Service Worker, además de fetch desconocido. Si una versión futura usa FormData, fallar explícitamente hasta definir su contrato; no reenviarlo. Usar origen de despliegue dedicado, sin service workers previos, y navegador/contexto limpio en QA.
3. Añadir CSP antes de recursos: `default-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; frame-src blob:; object-src 'none'; font-src 'none'; media-src 'none'; worker-src 'none'; manifest-src 'none'; form-action 'none'; base-uri 'none'`. Inline es necesario por handlers originales. Añadir favicon data, sin analítica, CDN, preconnect ni prefetch. No presentar esta CSP como aislamiento frente a código arbitrario: es defensa adicional para este artefacto auditado.
4. `fetch` y `connect-src` **no interceptan navegaciones**. Para Ver PDF, reescribir los enlaces dinámicos de forma síncrona al acabar `pintarRecibidos()` mediante adaptador demo, además de observar cambios como respaldo; cubrir clic, teclado, clic central y menú contextual con href Blob ya preparado. Capturar navegación residual y formularios; permitir solo fragmentos internos y Blobs creados por la demo. Bloquear `window.open` ajeno y auditar ausencia de location/recursos dinámicos externos. No confiar únicamente en un listener de clic o MutationObserver.
5. La capa UI de demo se instala tras el script principal y antes de interacción; solo actúa en la copia generada y conserva IDs, cfg, norm/fill y lógica original. Si el mock no queda listo, bloquear la app con aviso de error, sin continuar silenciosamente (el arranque original traga fallos de `/api/info`).
6. Test de navegador: registrar peticiones desde antes de navegar, permitir solo documento inicial y abortar/fallar cualquier otra HTTP(S)/WS. Ejercitar todos los flujos, enlaces y descargas; afirmar cero intentos inesperados, no solo cero respuestas. Probar fetch Request/string, ruta desconocida, origen externo, loopback, XHR/beacon/EventSource/WebSocket/formulario y enlace central: ninguno llega al servidor. Escanear artefacto por URLs externas, imports, src/href y APIs nuevas; comparar inventario de rutas con esta tabla. Repetir flujos con red offline después de cargar.

## 3. Estado y guion reproducible

Todo en memoria por pestaña; recargar reinicia. Sin localStorage, IndexedDB, cookies ni escritura de configuración. Estado: `config`, hojas/filas ficticias, catálogo de documentos por ID, mapas de Blobs, `job`, historial de intentos por identificador ficticio estable y temporizadores. No almacenar cuerpo/base64/contraseña en logs. La UI mantiene su selección, asignaciones y `envios`; el mock conserva el snapshot recibido para que el índice `i` del log sea coherente.

Fixture de seis personas: **Persona Demo Uno…Seis**, apellidos ficticios distintos y nombres completos únicos para evitar la ambigüedad del reintento por nombre. Correos `demo1@example.invalid`…`demo4@example.invalid`, quinta fila vacía, sexta `correo-invalido`; documentos `DEMO-001`…`DEMO-006` (no identidades reales; puede aparecer «Otro»). Evento «Taller ficticio de demostración». No reutilizar asistentes, firmas, logos ni configuración del repositorio. Un escenario aparte añade duplicado y DNI vacío para revisar advertencias.

Job compatible: `{id,modo,total,hechos,ok,fallos,actual,log,carpeta,registro,corriendo,parar,error,inicio,fin,aviso,rebotados,rebotesComprobados}`. `id` numérico creciente; tiempos epoch ms. Log: `{i,nombre,email,estado,error,adjuntos,hora}`; `hora` texto HH:mm:ss, adjuntos número. `carpeta:"Descargas de demostración"`, `registro:"registro-demo.csv"`, aviso permanente de simulación. Invariantes: `0<=hechos<=total`, `ok+fallos=hechos`, sin duplicar entradas por índice; Saltado no cuenta como procesado ni como fallo del lote.

Secuencia de envío por defecto:

1. Confirmación original con anotación demo «Esta acción solo simula el envío». Cancelar no crea lote.
2. La UI excluye quinta/sexta por email y guarda `_t6Saltados`. Envía cuatro índices; job `total:4,hechos:0,corriendo:true,actual:"Preparando simulación…"`. La UI dibuja Pendiente desde `_t6Lote`, no desde log.
3. Cada 1000 ms procesar uno: Uno→Enviado, Dos→Enviado, Tres→Error («Fallo temporal simulado»), Cuatro→Enviado. `hechos:4,ok:3,fallos:1`, `corriendo:false`, `fin:Date.now()`. Motivo de Saltado calculado por UI: «Sin correo válido: no se ha enviado». No agregar Saltado al log y duplicarlo en pantalla.
4. A los 1200 ms del fin, temporizador propio llama al flujo de comprobación de rebotes de la UI y convierte Dos→Rebotado: `ok:2,fallos:2,rebotados:1`, hechos sigue 4. Guardar `rebotesComprobados` e invalidar el temporizador por ID si cambió el lote. La UI original programa otra consulta a 150 s: puede responder sin cambios, idempotentemente; no alterar reloj global para acelerarla. El botón manual hace lo mismo y nuevas consultas tienen `marcados:0`.
5. Reintentar fallidos reconstruye envios y crea **otro job**, solo para Dos/Tres, con contadores a cero e índices originales de ese nuevo array. En segundo intento ambos terminan Enviado y no se vuelve a sembrar rebote. Conservar historial de intentos por persona demo, no por posición, para resistir reordenación. No reintentar Uno/Cuatro ni saltados; tras corregir email ficticio de saltados podrán entrar en un envío nuevo.
6. Detener cancela pasos pendientes y conserva resultados; al empezar nuevo job se cancelan todos los timers del anterior. En `generar`, procesar todas las personas seleccionadas incluso sin email y terminar Generado, sin conexión, rebotes ni Saltado. En modo solo correo, adjuntos cero. En recibidos, respetar `fila.__adjuntos`/`__cargos` y agrupación existente.

Las filas Pendiente/Saltado son estado de ventana según QA; recargar reinicia toda la demo deliberadamente. Añadir escenarios controlados «lista vacía», «error de carga», «conexión fallida» y «vista fallida» en controles exclusivos de demo; no resultados aleatorios.

## 4. Aviso visible y datos ficticios

Texto exacto, siempre visible y **sin cierre**:

> DEMOSTRACIÓN · Datos ficticios. No se envían correos ni se conecta con Outlook. No introduzcas datos personales ni contraseñas.

Barra fija superior a todo el ancho, `role="note"`, texto ajustable, fondo sólido y contraste AA. Medir altura real con ResizeObserver y reservarla mediante `--demo-banner-height` en el layout; desplazar nav sticky, límites de altura y scroll-padding por esa altura. No usar altura fija ni superponer al botón de menú en 360 px. Con zoom 200 %, texto sin truncar; si necesita varias líneas crece el espacio reservado. Diálogos centrados en el área restante (top layer puede superar z-index: verificar que no cubren el aviso); toasts quedan visibles. Restaurar barra tras `/api/salir`.

Para asegurar contenido 100 % ficticio, la demo no importa libremente datos personales: sustituye cargas por fixtures, limita importación JSON al proyecto demo y ofrece pegado de ejemplo en lugar de incorporar texto libre de listas. Imágenes/firma/plantilla propias se desactivan con «En esta demo se utiliza un recurso ficticio». Correos editables solo admiten `.invalid` o vacío y nombres/documentos proceden del catálogo demo; evitar que el editor muestre datos externos como si fueran muestras. Contraseña deshabilitada con valor ficticio; nunca pedir credenciales. La capa UI añade notas junto a conexión/prueba/envío para corregir mensajes heredados que afirman envío real.

## 5. Archivos y build propuestos

```text
demo/
  DEMO.md
  build-demo.mjs
  src/
    mock-api.js       # dispatcher, estado, timers y adaptadores DOM demo
    demo.css          # aviso y ajustes solo de demo
    vendor/          # biblioteca XLSX local y licencia, versión fijada
  datos/
    personas.json
    config-demo.json
    recibidos.json
    proyecto-demo.json
    certificado-demo.pdf
    justificante-demo.pdf
    asistentes-demo.xlsx
    certificados-demo.zip
  tests/
    demo.spec.mjs
  dist/              # generado: index.html autocontenido
```

Construcción prevista desde raíz: `node demo/build-demo.mjs`. Implementar con Node LTS y módulos estándar fs/path/crypto; dependencias de formato vendorizadas, sin instalación o descarga durante build. Resolver rutas desde `import.meta.url`, leer fuente UTF-8, calcular SHA-256, verificar marcadores esperados y abortar si cambiaron. Insertar CSP primero en head, CSS y mock antes de scripts originales, y bootstrap de adaptadores tras script principal. Serializar fixtures escapando `<`/cierres script; no interpolar JSON crudo en HTML. Mantener contenido original intacto salvo inserciones delimitadas de demo.

Generar únicamente dentro de `demo/dist` con ruta absoluta verificada; no copiar `trabajo`, extracted, ejecutables, archivos de usuario o configuración del sistema. Volver a comprobar SHA-256 de fuente tras build. Build repetible, sin fechas aleatorias embebidas. Publicar solo `demo/dist/`, compatible con subruta sin rutas absolutas de assets. El hosting no necesita funciones, proxy API, Outlook ni Node en producción. Esta tarea entrega solo este documento; script, fixtures y tests son trabajo de implementación posterior.

## 6. Dependencias y riesgos

| Dependencia/riesgo | Tratamiento |
|---|---|
| Outlook COM, SMTP, remitente delegado y bandeja de rebotes | Simular estados y respuestas; contraseña bloqueada y mensajes explícitos de simulación. |
| Rutas Windows, abrir carpeta, adjuntos extra y salida en disco | Ruta virtual; selector de carpeta/extra desactivado con explicación. Descargas exclusivamente Blob tras gesto del usuario. |
| PDFs, logos, firmas y plantillas | SVG orientativo más PDF fijo ficticio; sin extracción PDF real, firmas institucionales ni recursos remotos. |
| ZIP/PDF de entrada y Excel arbitrario | Fixtures en lugar de procesar contenido externo; explicar sustitución y probar error/vacío mediante escenarios. |
| Enlace PDF fuera de fetch | Reescritura síncrona a Blob, controles de navegación y test de clic central/contextual. |
| Mensajes originales de envío/cierre y autosondeo de 150 s | Adaptadores solo en copia; avisos locales, rebote acelerado idempotente, limpieza de timers. |
| XLSX actualizado y exportar proyecto | Formatos auténticos con datos ficticios; estados actuales reflejados; contraseña excluida. |
| Cambios futuros del HTML | Build falla si no encuentra puntos de inserción; comparar rutas/IDs/cfg y ejecutar pruebas antes de publicar. |
| Hallazgos QA existentes | No prometer corregir todos: probar especialmente controles táctiles pequeños y menú a 360 px. No modificar UI fuente como parte de la demo. |
| SVG/HTML generado o proyecto importado | Escape de texto, catálogo cerrado y MIME permitido; no ejecutar marcado importado. |

## 7. Aceptación verificable de la implementación futura

- Build termina con Node, produce solo dist autocontenido; hash de `trabajo/ui/index.html` idéntico antes/después; git sin cambios fuera de demo, rama demo-web, sin push/merge.
- Inventario automatizado encuentra exactamente las 15 rutas de la tabla y verifica método/payload/MIME/cabeceras; cuerpos JSON y File crudo cubiertos, API desconocida bloqueada.
- Las cuatro opciones de inicio recorren sus pasos sin errores de consola. Carga demo detecta Nombre/Apellidos, correo/DNI; selector de hojas, vacío/error y recuperación funcionan.
- Certificado/justificante cambian de persona y título, llevan marca demo y funcionan offline. «Ver PDF» abre PDF auténtico local con teclado, clic normal y central, sin `/api/recibido` en red.
- ZIP devuelve coincidencias y sin asignar; asignación manual, nueva persona, agrupación y descarga XLSX conservan coherencia. XLSX abre sin reparación y refleja ediciones ficticias y estado; ZIP y PDFs son válidos.
- Enviar muestra Pendiente, avance, Error, Rebotado y dos Saltados con motivos, contadores y secuencia de §3; cancelar no inicia; detener no sigue avanzando; reintentar solo fallidos termina correctamente; generar no necesita email.
- Conexión y prueba muestran éxito/error **simulados**, no abren Outlook y no sugieren esperar un correo real. Cerrar cancela trabajo y mantiene aviso.
- Captura de red antes de cargar: solo documento inicial permitido, cero peticiones posteriores/terceros/API/loopback en todos los recorridos; pruebas negativas de §2 sin salida de red y recorrido offline correcto.
- Aviso íntegro no descartable, sin tapar navegación, formulario, diálogos o descargas a 360/768/1280 px y zoom 200 %; navegación por teclado y foco visibles.
- Inspección de artefacto y descargas confirma catálogo ficticio, `.invalid`, sin contraseña, identidades/documentos reales, rutas de usuario, binarios del servidor ni recursos externos; recargar restaura el escenario inicial.
