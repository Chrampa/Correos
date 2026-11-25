# Auditoría de la UI (solo lectura)

Fuente: `trabajo/ui/index.html` (1 184 líneas, CSS en L8–L105, HTML en L107–L437, JS en L439–L1181).
Contexto leído: `trabajo/RESUMEN.md`, `Entrega/Entrega/LEEME.txt`. No se ha editado ningún archivo existente.
Las líneas citadas son del archivo tal como está ahora. Los recuentos se hicieron con grep sobre el archivo.

---

## 1. Tokens actuales

### 1.1 Variables de color (`:root`, L9–L10)

| Variable | Valor | Usos `var()` |
|---|---|---|
| `--bg` | `#f4f5f7` | 1 |
| `--panel` | `#fff` | 2 |
| `--ink` | `#1d2129` | 2 |
| `--muted` | `#626a76` | 5 |
| `--line` | `#e1e4e9` | 7 |
| `--soft` | `#f0f2f5` | 4 |
| `--acc` | `#1f4e79` | 8 |
| `--acc-ink` | `#fff` | 1 |
| `--acc-soft` | `#e7eef6` | 4 |
| `--ok` / `--ok-soft` | `#1a7f4b` / `#e5f4ec` | 4 / 2 |
| `--warn` / `--warn-soft` | `#9a6400` / `#fdf3e1` | 1 / 2 |
| `--bad` / `--bad-soft` | `#b42318` / `#fdeceb` | 5 / 2 |
| `--r` (radio) | `10px` | 3 |

- 15 variables de color; **53 usos** de `var(--…)` en total (50 de color + 3 del radio).
- Hay **61 literales hex** en el archivo: 15 en `:root`, 42 fuera de `:root` (CSS y HTML), y 3 en los valores por defecto de documento del JS (`#1f4e79` L509, `#1f2328` L512, `#4d4d4d` L515; son colores del certificado, no de la UI).
- **Literales de color fuera de las variables (21 distintos, 42 apariciones)**: `#fff` ×13 (además de las 2 de `:root`), `#8fa3b9` ×3 (L20, L28, L94), `#14273b` ×3 (nav L18, toast L99, L25), `#d8e1ec` ×2 (L18, L23…), `#25476b` ×2 (L23, L24), `#c5cbd3` ×2 (L77, L78…), `#525659` ×2 (fondo del visor, L71–72), `#173b5c` ×2 (L62, L69), `#fafbfc` ×2 (L54, L74), y una vez cada uno: `#1d3550` (L22), `#2e9c63` (L26, paso hecho), `#35506d` (L29), `#d3e1ef` (L70), `#cdd2d9` (L42), `#b8c2ce` (L54), `#9cc0e4` (L44, foco), `#5b8fc4` (L44, foco), `#e7b4ae` (L52), `#6b4600` (L62), `#8a1c12` (L62), `#11553a` (L62).
- Colores en `rgba()`: 4 (sombras L88, L99, L101 y backdrop L102).
- Dos colores de la nav (`#14273b`, `#25476b`) y el verde `#2e9c63` no tienen variable.

### 1.2 Tipografía

- Familia de texto (L15): `"Segoe UI", system-ui, -apple-system, Arial, sans-serif`. Una sola pila.
- Monoespaciada: `ui-monospace, Consolas, monospace` (chips, L69) y `Consolas, monospace` inline (detalles del justificante, L283).
- Pesos usados: 400 (L20, L169), 500 (L40, L47), 600 (L24, L59, L66); además los `<b>`, `h2/h3` y `nav h1` con el peso por defecto del navegador.
- Interlineado: 1.5 (body, L15), 1.45 (textarea, L43), 1.3 (`nav h1`, L19), 1 (chips, L69).

### 1.3 Tamaños de fuente (25 declaraciones `font-size` + 2 `font:` con tamaño)

| Tamaño | Apariciones | Dónde (ejemplo) |
|---|---|---|
| 12px | 5 | `nav h1 small` L20, `nav .foot` L28, `.step .n` L24, `.pill` L59, `.modoAct` L94 |
| 12.5px | 3 | `label.f` L40, `.small` L58, `.modo ul` L93 |
| 13px | 4 | `table` L64, detalles L283 (inline) |
| 13.5px | 2 | `.note` L61, `.modo p` L92 |
| 14px | 2 | `body` L15, input L42 |
| 15px | 3 | `nav h1` L19, `.card h3` L36, `.btn.big` L51 |
| 16px | 2 | `.drop b` L56 y otra |
| 17px | 1 | `.modo h3` L91 |
| 22px | 3 | `h2` L33, `.stat b` L82 y otra |
| 12px monoespaciada | 1 | `.chip` L69 (`font:12px/1`) |

Escala real: 12 / 12.5 / 13 / 13.5 / 14 / 15 / 16 / 17 / 22 px. Son nueve tamaños, con medios pasos (12.5, 13.5) sin patrón claro.

### 1.4 Espaciados (padding, margin, gap; CSS L8–L105)

- **Padding** distintos: 4, 5, 6, 7, 8, 9, 10, 14, 16, 18, 20, 22, 24, 28, 30, 34, 60 px (y 3px 6px inline en tablas). 20 valores distintos.
- **Gap**: 4, 6, 8, 10, 12, 16, 18 px (y `12px 16px` en `.grid`, L37).
- **Margin**: 0, 2, 4, 6, 8, 10, 12, 16, 18, 20 px (y negativos `-6px` inline).
- Repetidos más veces: `8px` (20 apariciones entre todas las propiedades), `10px` (16), `12px` (14), `18px` (7), `20px` (9), `14px` (9).
- Conclusión: no hay escala. Aparecen 5, 7, 9, 11, 13, 15 px sueltos.
- **Atributos `style=""` inline**: 68 en el HTML. Los más frecuentes: `margin-top:10px` ×5, `margin-top:12px` ×4, `width:100%` ×3, `padding:3px 6px` ×3, `height:36px` ×3 (color pickers), `justify-content:space-between` ×3.

### 1.5 Radios

| Valor | Apariciones | Uso |
|---|---|---|
| 8px | 8 | `.seg`, `.step`, `.btn`, `.stat`, `.asset`, `.tbl`, `.bar-prog`… |
| `var(--r)` = 10px | 3 | `.card`, `.drop`, `.preview` |
| 14px | 1 | `.modo` (L87) |
| 12px | 2 | `.modo .ic` (L90), `dialog` (L101) |
| 7px | 1 | inputs (L42) |
| 6px | 2 | `.chip` (L69), botón de la nav (L29) |
| 99px | 2 | `.pill` (L59), barra de progreso (L83) |
| 50% | 1 | `.step .n` (L24) |

Hay cinco radios distintos (6, 7, 8, 10, 12, 14 px) sin patrón.

### 1.6 Sombras

- `.modo:hover` → `0 6px 18px rgba(20,39,59,.08)` (L88)
- `.toast` → `0 6px 20px rgba(0,0,0,.2)` (L99)
- `dialog` → `0 20px 60px rgba(0,0,0,.3)` (L101)
- `dialog::backdrop` → `rgba(10,20,30,.45)` (L102)

Tres sombras distintas, ninguna en tarjetas (`.card` no tiene sombra, sólo borde).

### 1.7 Bordes

- `1px solid var(--line)` ×4 (`.card` L35, `.tbl` L63, `th,td` L65, `.preview .bar` L73, `.asset`)
- `1px solid #c5cbd3` ×2 (botón L47, `.seg` L77): literal, no variable.
- `1px solid #cdd2d9` (inputs L42) y `1px solid #35506d` (botón nav L29): literales.
- `2px dashed #b8c2ce` (`.drop` L54).
- `2px solid var(--line)` (`.modo` L87; cambia a `var(--acc)` al pasar y al estar activo).
- `border: 0` ×5; `border-bottom` en `th/td`.
- Foco: `outline: 2px solid #9cc0e4` + `border-color: #5b8fc4` (L44).

---

## 2. Iconos, emojis y símbolos

| Carácter | Línea | Pantalla / función | Notas |
|---|---|---|---|
| `⌂` | L111 | Nav, paso 0 «Inicio» (círculo `.n`) | Único icono de la nav; los pasos 1–7 usan dígitos que JS renumera (L612). |
| `🏅` | L134 | Pantalla 0, tarjeta «Crear certificados» (`.modo .ic`) | Emoji, depende de la fuente del SO. |
| `📄` | L135 | Pantalla 0, «Crear justificantes» | Idem. |
| `📦` | L136 | Pantalla 0, «Certificados ya creados» | Idem. |
| `✉️` | L137 | Pantalla 0, «Solo correo» (con selector de variación U+FE0F) | Idem. |
| `➕` | L903 | Pantalla 5, opción «Añadir como persona nueva» en el select de la tabla | Dentro de `<option>`. |
| `★` | L903 | Pantalla 5, prefijo de candidatos por nombre en el select | Significado no explicado en la UI. |
| `✓` | L911 | Pantalla 5, columna «Enviar» de personas | Texto/símbolo sin etiqueta accesible. |
| `✓` | L1059 | Pantalla 7, checklist (`.pill.ok`) | |
| `!` | L1059 | Pantalla 7, checklist (`.pill.warn`) | |
| `!` | L902 | Pantalla 5, certificado con error (`.pill.bad`) | Sólo `title=` como explicación. |
| `📎` | L1030 | Pantalla 6, vista previa del correo (lista de adjuntos) | |
| `—` | L420, L755–756, L902–903, L1030, L1136 | Placeholders de vacío («—») | No es icono, pero hace de «vacío». |
| `·` | L146, 398, 407, 801, 911, 1030, 1133 | Separadores | |
| `…` | varios | Puntos suspensivos en textos de carga («Leyendo…», «Conectando…», «Enviando prueba…») | Son el único indicador de carga. |

Sin iconos SVG ni librería. Los iconos son todos caracteres Unicode o emojis.

---

## 3. Por pantalla

Convención: **Vacío** = qué se ve sin datos; **Carga** = indicador mientras espera; **Error** = cómo se muestra un fallo.

### Pantalla 0 — Inicio (`data-page="0"`, L130–L139)
- **Componentes**: cuadrícula `.modos` con 4 `button.modo` (`.ic`, `h3`, `p`, `ul`); `#modoAct` en la nav.
- **Vacío**: no aplica (siempre hay 4 opciones).
- **Carga**: no hay. Hasta que llega `/api/info` (L1173) se muestra la pantalla por defecto sin indicador.
- **Error**: no hay (el fallo de `/api/info` se traga en `catch {}`, L1176).
- **Textos**: correctos en general. «Solo correo» describe bien el caso.

### Pantalla 1 — Lista de personas (L142–L177)
- **Componentes**: `.drop#drop` (zona de arrastre), `input#fLista` oculto, `details` con `textarea#pegado` y `#bPegar`; tras cargar, `#listaInfo`: `select#hoja`, `select#selEmail`, `select#selDni`, `input` nombre, dos `checkbox`, `#colsChips`; tarjeta «Personas» con `#bTodos`, `#bNinguno`, `#filtro`, `#avisosLista` y `table#tabla`.
- **Vacío**: sólo se ve la zona de arrastre. `#listaInfo` está oculto (L153). Si el filtro no encuentra nada, la tabla queda vacía sin mensaje (L792–L810).
- **Carga**: no hay. `cargar()` (L741–L745) lee el archivo sin indicador; la tabla aparece al terminar.
- **Error**: `toast` «No se pudo leer el archivo: …» (L744, 5 s). Aviso de correos no válidos en `#avisosLista` (L805–L808).
- **Textos poco claros o genéricos**:
  - L146: «Arrastra aquí el archivo» (no dice qué formatos hasta la línea siguiente).
  - L160: «Nombre que aparece en los documentos (puedes combinar columnas)» con placeholder `{Nombre} {Apellidos}` (L161): sintaxis de plantilla sin explicar.
  - L162: «Si el nombre viene como «Apellidos, Nombre», …» (larga, dos conceptos en una casilla).
  - L165: «Columnas disponibles como variables:» con chips sin contexto de cómo se usan.
  - L169: «Personas» con contador `#cuenta` (L801): «· N de M seleccionadas».
  - L170: `#filtro` con placeholder «Buscar…» (no indica qué busca).

### Pantalla 2 — Datos del evento (L180–L211)
- **Componentes**: tarjeta con 8 `label.f` (texto), tarjeta «Firmas» (2 firmantes, 2 cargos, 2 `data-asset` de imagen), tarjeta «Logotipo» (`data-asset` recursos.logo).
- **Vacío**: campos vacíos con placeholders de ejemplo («Jornada de Bienvenida 2026», L185).
- **Carga / Error**: no hay.
- **Textos poco claros**:
  - L199 y L202: dos etiquetas idénticas «Cargo», la segunda (L202) sin placeholder: ambigua.
  - L192: «Fecha de emisión» sin valor (`#fEmision` muestra `hoy()` sólo como placeholder, L673): el valor por defecto es invisible.
  - L182: el lead explica las variables con `<code>{evento}</code>`, pero los campos no indican qué variable generan.

### Pantalla 3 — Certificado (L214–L262)
- **Componentes**: `.two` con columna de formulario y `.preview[data-preview=certificado]` (sticky). Control `.seg#segModo` (Diseño incluido / Mi plantilla); `#cfgDiseno` (6 campos + checkbox); `#cfgPlantilla` (asset + 6 rangos `input[type=range]` con `input[type=number]` y 5 checkboxes); tarjeta de nombre de archivo con chips.
- **Vacío**: si no hay lista, la vista previa usa «Persona de ejemplo» (L1003) y el nombre de ejemplo de L1009.
- **Carga**: la vista previa no tiene indicador: el iframe conserva la imagen anterior hasta que llega la nueva (L1016).
- **Error**: `.pill.bad` con el mensaje crudo del servidor (L1017). Campos sin valor: `.pill.warn` «Sin valor: …» (L1014).
- **Textos poco claros**:
  - L233 «Código de verificación» y L250 «Escribir el código de verificación»: dos checkboxes para lo mismo (uno por diseño, otro por plantilla).
  - L230 «Texto bajo el nombre» y L246 «Texto»: mismo campo (`certificado.cuerpo`), dos etiquetas.
  - L239 «Posición vertical del nombre (% desde arriba)», L240 «Posición horizontal (centro, %)», L241 «Tamaño del nombre» sin unidad.
  - L256 «Variables (clic para insertar en el último campo usado):»; si no hay campo previo, el clic copia al portapapeles con toast «Copiado …» (L705–L713).
  - L220 (`label.chk.hide`): el checkbox «Generar y adjuntar certificado» está oculto por clase, así que no es usable.

### Pantalla 4 — Justificante (L265–L294)
- **Componentes**: `.two`; `.seg#segMembrete` (Plantilla DECG / Otra plantilla / Sin plantilla); `#membretePropio` (asset); `#membreteMargen` (rango); tarjeta de textos (cabecera, título, cuerpo, detalles en monoespaciado, cierre, color, nombre de archivo) con chips; vista previa sticky.
- **Vacío / Carga / Error**: igual que pantalla 3.
- **Textos poco claros**:
  - L267: «Usa **texto** para negrita» (sintaxis markdown sin explicar al usuario, que no suele conocerla).
  - L272: «Obligatorio el DNI/NIE (si falta, no se envía a esa persona y se marca como error)»: largo.
  - L276: «Margen izquierdo del texto (% del ancho, para dejar libre la franja lateral)»: jerga.
  - L283: «Recuadro de datos (una línea por dato, «Etiqueta: valor»; se omiten los que queden vacíos)».
  - L274: «Otra plantilla» (en certificado la misma opción es «Mi plantilla», L222): nombre distinto para lo mismo.
  - L271 (`label.chk.hide`): checkbox «Generar y adjuntar justificante» oculto.

### Pantalla 5 — Certificados recibidos (L297–L327)
- **Componentes**: `.drop#dropRec` (ZIP/PDF múltiple), `input#fRec`, `#recCarga`, botón «Quitar todos» (`#bRecVaciar`); `#recInfo` oculto hasta cargar: `#recStats` (4 `.stat`), `#recAvisos`, botones «Añadir los no encontrados como personas nuevas» y «Descargar Excel actualizado», campo de nombre de archivo, chips extra (`data-var`); tarjeta «Certificados» con `select#recFiltro` y `table#tablaRec` (un `select` por fila); tarjeta «Personas que recibirán certificados» con `table#tablaPers`.
- **Vacío**: sólo la zona de arrastre. Las tablas no tienen mensaje de vacío.
- **Carga**: `#recCarga` muestra texto «Leyendo {nombre}…» (L856). Sin spinner ni barra.
- **Error**: `toast` «{archivo}: {mensaje}» (L861, 5 s). Por fila: `.pill.bad` «!» sólo con `title=` (L902), no legible sin pasar el ratón.
- **Textos poco claros**:
  - L299 y L302: «Repartir certificados recibidos» (casilla oculta por clase en L301, pero el concepto aparece como título).
  - L311: «Añadir los no encontrados como personas nuevas»: largo, y el paso siguiente no es obvio (lo explica el toast L945).
  - L315: «Variables extra» + «({cargos} = todos los cargos de la persona, útil en el correo)».
  - L319: «Asignados por nombre (revisar)»: no dice qué significa «revisar».
  - L903: `★` como candidato sin explicación en la UI.
  - L902: `Ver PDF` como enlace sin contexto.
  - Pill «Sin asignar» (L895) y «Nombre» (L895): la etiqueta «Nombre» no indica «asignado por nombre».

### Pantalla 6 — Correo (L330–L390)
- **Componentes**: tarjeta «Cómo se envía» con `.seg#segSmtp` (4 opciones), `#ayudaSmtp` (HTML de `PRESETS`, L534–L537), `#olGrid` (remitente «Enviar como» + `#bDeleg`), `#smtpGrid` (servidor, puerto, seguridad, usuario, contraseña, recordar) y `#bSmtp` con `#smtpRes`. Debajo, `.two`: tarjeta «Mensaje» (remitente, responder a, CCO, asunto, texto de 9 filas, pausa, chips) y, a la derecha, `#firmaCorreo` (sólo en modo «recibidos», L617), tarjeta oculta de adjunto extra (L375), y `#mailPrev` (vista previa).
- **Vacío**: `#mailPrev` vacío hasta cargar lista; la vista usa `filas[0] || {}` (L1023), así que con lista vacía aparecen variables sin rellenar.
- **Carga**: L1033 escribe «Conectando…» en `#smtpRes`.
- **Error**: `#smtpRes` muestra `.pill.bad` «Error» + mensaje (L1035) cuando el servidor responde JSON con `ok:false`. **Riesgo:** `api()` lanza si la respuesta no es OK y trae `error` (L554), o si falla la red; `bSmtp` no tiene `try/catch` (L1032–L1036). En ese caso «Conectando…» se queda para siempre, sin mensaje.
- **Textos poco claros**:
  - L336: «Otro» como método, y «Outlook de este ordenador» / «Outlook / Microsoft 365» / «Gmail»: nombres mezclados (método vs. proveedor).
  - L339 «Enviar como (buzón compartido)» con placeholder «vacío = se envía desde tu propia cuenta» (L339) y texto en L340: repetido.
  - L357 «Correo del remitente» con placeholder «(el del usuario)» (L357): ambiguo.
  - L362 «Pausa entre correos (segundos)»: sin explicar que es para no superar el límite de Outlook (la ayuda sí lo dice en L534).
  - L368 «Firma del correo»: sólo aparece en modo recibidos; el usuario no sabe por qué no la ve en otros modos.

### Pantalla 7 — Revisar y enviar (L393–L432)
- **Componentes**: `#checklist` (filas con `.pill` ✓/! y botón «Ir»); tarjeta «1 · Prueba» (`#paraPrueba`, `#filaPrueba`, `#bPrueba`, `#pruebaRes`); tarjeta «2 · Envío» (`#carpetaSalida`, `#bGenerar`, `#bEnviar`); tarjeta `#progreso` oculta (botones Detener / Abrir carpeta / Comprobar rebotes / Reintentar fallidos / Descargar Excel; barra `#progBar`; 4 `.stat`; `#progActual`; `#progError`; `#rebotesRes`; `#tablaLog`); tarjeta `#cardRebotes` (sólo modo Outlook).
- **Vacío**: `#checklist` con «No hay nadie a quien enviar (carga la lista en el paso 1)» (L1045). `#tablaLog` sin filas muestra sólo la cabecera (L1152).
- **Carga**: `#progTitulo` «Enviando… X%» / «Generando… X%» (L1133); `#sEta` «…» (L1136); `#bPrueba` «Enviando prueba…» (L1070).
- **Error**: `#progError` (`.note.bad`, L1138); `#pruebaRes` (`.note.bad`, L1076); toast en `lanzar` (L1097).
- **Textos poco claros o genéricos**:
  - L1059: botón «Ir» sin destino («Ir» a qué paso).
  - L1059: checklist sin acción principal ni orden de prioridad.
  - L409: «Carpeta de salida (vacío = Documentos\Certificados)» con placeholder `salidaDef` (L674): el valor real por defecto sólo aparece como placeholder.
  - L412 «Solo generar los PDF» / L413 «Generar y enviar a todos» (en modo correo cambia a «Enviar» en L1065): cambio de texto en función del modo sin aviso.
  - L418: cinco botones en una fila (Detener, Abrir carpeta, Comprobar rebotes, Reintentar fallidos, Descargar Excel actualizado) sin jerarquía.
  - L1133: «Terminado · X de Y correctos» (sin «correos»).
  - L1148: «Dentro de unos minutos se comprobará si algún correo ha rebotado…».
  - L428: explicación larga de rebotes en la misma tarjeta.

### Transversal (nav, toast, diálogo)
- Nav (L109–L126): título «Envío de certificados» / «y justificantes en lote»; pie con «Exportar proyecto», «Importar», «Cerrar aplicación» (L122–L123) y versión `#ver`.
- Toast (L435, L549): un solo tipo visual; sin cierre manual; `innerHTML` con texto sin escapar en algunos casos (L549 recibe texto ya escapado con `esc`).
- Diálogo `#dlg` (L436): botones «Cancelar» / «Aceptar» por defecto; el texto de confirmación se pasa como `html` (L556) y cambia según el caso («Sí, enviar», «Entendido», «Cerrar», «Sí, solo los recibidos»).

### Resumen de estados por pantalla

| Pantalla | Vacío | Carga | Error |
|---|---|---|---|
| 0 Inicio | No aplica | Ninguna | Ninguno visible |
| 1 Lista | Sólo zona de arrastre; tabla vacía sin mensaje | Ninguna (sin indicador al leer) | Toast; avisos de correo |
| 2 Evento | Sólo placeholders | — | — |
| 3 Certificado | «Persona de ejemplo» | Ninguna (iframe anterior) | `.pill.bad` con texto crudo |
| 4 Justificante | Igual que 3 | Ninguna | Igual que 3 |
| 5 Recibidos | Sólo zona de arrastre; tablas sin mensaje | Texto «Leyendo…» | Toast; «!» sólo con `title` |
| 6 Correo | `mailPrev` con variables sin rellenar | «Conectando…» (queda colgado si falla) | `.pill.bad` (si la promesa no falla) |
| 7 Revisar | Checklist con texto; `tablaLog` sin mensaje | Título «Enviando… X%»; «Enviando prueba…» | `.note.bad` en progreso y prueba |

---

## 4. Responsive

### 4.1 Reglas `@media` actuales

| Línea | Regla | Efecto |
|---|---|---|
| L96 | `(max-width:1000px)` | `.modos` pasa a 1 columna |
| L103 | `(max-width:1100px)` | `.two` a 1 columna; `.sticky` a `static` |
| L104 | `(max-width:760px)` | `.app` a 1 columna y `height:auto`; `nav` pasa a fila con scroll horizontal; se ocultan `nav h1`, `nav .sp` y `nav .foot`; `.step` `width:auto` y `nowrap`; `main` padding 18px 16px; `.stats` a 2 columnas |

No hay regla para `.seg`, `.row`, `.tbl`, `.grid`, `.preview` ni para `dialog`/`.toast`.

### 4.2 Qué se rompe a 360 px (por lectura del CSS, sin navegador)

Cálculo: en 360 px, la regla de 760 px aplica. `main` queda con 360 − 32 = **328 px** de contenido, y `.card` tiene 18/20 px de padding, así que el área útil es unos **288 px**.

1. **Se pierden funciones, no sólo diseño.** `nav .foot` tiene `display:none` (L104): desaparecen «Exportar proyecto», «Importar», «Cerrar aplicación» y la versión. Tampoco se ve el título de la app (`nav h1`). Para cerrar la app en móvil no queda ningún control.
2. **Nav horizontal.** Los 8 pasos están en una fila con `overflow-x:auto` (L104). No hay indicador de desplazamiento y el paso activo puede quedar fuera de la vista. `#modoAct` (L112) queda como un bloque más de la fila.
3. **`.seg` no envuelve.** Los controles segmentados (`segModo`, `segMembrete`, `segSmtp`, L77–L79) son `inline-flex` sin regla de ajuste. En 288 px, `segSmtp` (4 botones, el primero «Outlook de este ordenador») se comprime y las etiquetas se parten en varias líneas (sin scroll), con altura desigual. No es un desbordamiento de página, pero sí se ve forzado.
4. **Vista previa al final.** En ≤1100 px `.sticky` pasa a `static` (L103): la vista previa de certificado y justificante aparece después de todo el formulario. Además el iframe mide **560 px fijos** (L72), que en un móvil ocupa casi toda la pantalla.
5. **Tablas.** `.tbl` tiene scroll interno (L63) y `th,td` `nowrap` (L65): correcto, pero la tabla de la pantalla 1 tiene 6+ columnas y un `input type=email` con `min-width:210px` (L795). Hay que desplazarse horizontalmente dentro de un recuadro de 288 px.
6. **`.stats`** pasa a 2 columnas (L104) con `.stat b` a 22 px: funciona, pero los valores tipo «12/340» (`#sHechos`) pueden partirse.
7. **`label.f` inline con `min-width:240px`** (L400–L401): en 288 px ocupan la línea completa; funciona porque `.row` envuelve.
8. **`dialog` y `.toast`**: sin problemas por lectura (dialog con `max-width:520px`, toast con `right:20px`).

**Problema en 1101–1125 px (no es de 360, pero está en la misma regla):** `.two` usa `minmax(380px,1fr) minmax(420px,1.1fr)` con `gap:18px` (L38). Con la nav de 240 px y el padding de `main` de 68 px, el contenido mide `vw − 308`. Las dos columnas necesitan 380 + 420 + 18 = **818 px**, que sólo caben a partir de vw = 1126 px. La regla de 1100 px sólo cubre hasta 1100, así que entre 1101 y 1125 px el grid **desborda horizontalmente** dentro de `main`.

### 4.3 Otros puntos de lectura
- `.grid` (L37) usa `repeat(auto-fill, minmax(230px,1fr))`: a 328 px queda en 1 columna (correcto).
- `.stats` a 4 columnas (L80) entre 761 y 1100 px: con 453 px de contenido, cada columna mide ~105 px.
- `.modo` (L87) con `padding:22px` y `.modos` a 1 columna en ≤1000: correcto.
- Sin `viewport` problemático: el `<meta viewport>` está en L5.

---

## 5. Lo que NO se puede tocar

### 5.1 IDs (todos son referenciados por el JS; ver `getElementById`/`$()`)

Lista completa de `id=` en el HTML, con línea: `modoAct` 112 · `bExport` `bImport` `bSalir` `ver` 122–124 · `drop` 146 · `fLista` 147 · `pegado` 149 · `bPegar` 150 · `listaInfo` 153 · `hojaWrap` `hoja` 157 · `selEmail` 158 · `selDni` 159 · `colsChips` 165 · `cuenta` 169 · `bTodos` `bNinguno` `filtro` 170 · `avisosLista` 172 · `tabla` 174 · `fEmision` 192 · `segModo` 222 · `cfgDiseno` 224 · `cfgPlantilla` 236 · `segMembrete` 274 · `membretePropio` 275 · `membreteMargen` 276 · `cabeceraJust` 280 · `dropRec` 302 · `fRec` 303 · `recCarga` `bRecVaciar` 304 · `recInfo` 306 · `recStats` 308 · `recAvisos` 309 · `bRecNuevas` 311 · `bExcel` 312 · `recFiltro` 319 · `tablaRec` 320 · `tablaPers` 324 · `segSmtp` 336 · `ayudaSmtp` 337 · `olGrid` 338 · `olVacio` `bDeleg` 340 · `smtpGrid` 342 · `smtpUser` 346 · `smtpPass` 347 · `bSmtp` `smtpRes` 350 · `remNombre` 356 · `remCorreo` 357 · `firmaCorreo` 368 · `selExtra` 381 · `mailPrev` 386 · `checklist` 396 · `paraPrueba` 400 · `filaPrueba` 401 · `bPrueba` 402 · `pruebaRes` 404 · `carpetaSalida` 409 · `bGenerar` 412 · `bEnviar` 413 · `progreso` 416 · `progTitulo` 417 · `bParar` `bCarpeta` `bRebotes` `bReintentar` `bExcel2` 418 · `progBar` 419 · `sHechos` `sOk` `sFallos` `sEta` 420 · `progActual` 421 · `progError` 422 · `rebotesRes` 423 · `tablaLog` 424 · `cardRebotes` 426 · `rebDias` `bRebotes2` 429 · `rebotesRes2` 430 · `toast` 435 · `dlg` `dlgT` `dlgB` `dlgNo` `dlgSi` 436 · `fImport` 437.
Dinámicos (generados por JS): `bQuitarDup` (L806), `#toast` ya es estático.

### 5.2 Atributos `data-*`

- `data-page` (8, L130–L393): 0–7. Lo lee `ir()` y `onPage()` (L641, L643–L645).
- `data-go` (8, nav L110–L119): 0–7. Lo lee `ir()` (L642).
- `data-modo` (4, L134–L137): `certificados`, `justificantes`, `recibidos`, `correo` (los mismos valores van en `cfg.modo` guardado y en `MODOS`, L596–L601).
- `data-v` (9): `diseno`/`plantilla` (L222), `decg`/`propio`/`ninguno` (L274), `outlook`/`gmail`/`office365`/`otro` (L336). Son valores guardados en `config.json`.
- `data-bind` (80): **todas las rutas son claves del `cfg`**. Ver 5.4.
- `data-asset` (5): `recursos.firma1` (L200), `recursos.firma2` (L203), `recursos.logo` (L209), `certificado.fondo` (L237), `justificante.membreteArchivo` (L275).
- `data-accept` (2): L237, L275. Lo lee `pintarAsset` (L718).
- `data-preview` (2): `certificado` (L260), `justificante` (L292). Lo usa `montarPreview` (L994).
- `data-var` (6): chips de variables (L315 ×4; y las plantillas JS en L701 y L703). Lo lee el listener de clic (L706).
- `data-edit` (2), `data-i`, `data-fila`, `data-rec`, `data-pv`, `data-rf`, `data-warn`, `data-quitar`, `data-elegir`, `data-bwignore`: generados o leídos por JS (L795–L796, L803-L819, L916, L995–L1017, L726, L671).

### 5.3 Clases que usa el JS (`querySelector`, `$()`, `classList`, o strings de marcado)

- Estructura: `.page`, `.page.on`, `.step` (con hijos `.n` y `.tx`, L612), `.modo` (+ `.on`), `main` (`$('main')`, L641).
- Estado: `.hide` (23 `toggle` y más), `.on` (6 `toggle` + `add`/`remove`), `.over` (L734–L736), `.off` (en `tr`, L794, y en CSS L67).
- Selectores: `.varChips` (L702), `.pl-cuerpo` (L653), `.pl-codigo` (L654), `.chip` (L706), `.page.on` (L689), `.modo`, `.step`.
- Clases en marcado JS (no se pueden renombrar sin tocar el JS): `pill` (+ `ok`, `warn`, `bad`), `note` (+ `ok`, `warn`, `bad`, `info`), `btn` (+ `small`), `small`, `muted`, `row`, `asset` (+ `nm`), `chips`, `chip`, `stat`, `stats`, `tbl`, `bar`, `hide`.
- Atributos usados como selector en `$$`: `[data-bind]`, `[data-asset]`, `[data-preview="…"]`, `[data-go]`, `[data-page]`, `[data-modo]`, `[data-v]`, `[data-var]`, `[data-fila]`, `[data-edit]`, `[data-rec]`, `[data-pv]`, `[data-rf]`, `[data-warn]`, `[data-quitar]`, `[data-elegir]`, `[data-accept]`, `input[type=text][data-bind]`, `textarea[data-bind]`, `#segModo button`, `#segSmtp button`, `#segMembrete button`.

### 5.4 `data-bind` (rutas del `cfg` que el servidor también lee)

Rutas en uso (80 atributos, varias repetidas): `datos.{email, nombre, dni, capitalizar, invertirComa}`; `evento.{evento, fecha, horario, horas, lugar, organizador, lugar_firma, fecha_emision, firmante, cargo_firmante, firmante2, cargo_firmante2}`; `certificado.{activo, modo, archivo, color, titulo, subtitulo, encabezado, intro, cuerpo, lugarFecha, mostrarCodigo, plantilla.{x, fuente, colorTexto, nombreY, nombreSize, nombreNegrita, cuerpoActivo, cuerpoY, cuerpoSize, cuerpoAncho, codigoActivo, codigoY}}`; `justificante.{activo, requiereDni, membrete, cabecera, titulo, cuerpo, detalles, cierre, color, archivo, margenIzq}`; `recibidos.{activo, archivo}`; `extra.{activo, carpeta, columna}`; `correo.{remitenteNombre, remitenteEmail, responderA, cco, asunto, cuerpo, pausa}`; `smtp.{host, port, seguridad, user, pass, recordar}`; `salida.carpeta`.

**Duplicados detectados** (el mismo `data-bind` en dos controles): `certificado.cuerpo` (L230 y L246), `evento.firmante` (L198 y L371), `evento.cargo_firmante` (L199 y L372), `correo.remitenteEmail` (L339 y L357). Cualquier rediseño debe conservar los dos o unificarlos sin romper el enlace.

Las claves de `DEF` (L504–L531) son el esquema del `config.json` de `%APPDATA%\EnviaCertificados\` y lo lee `GET /api/info`. Renombrarlas rompe la configuración guardada. `migrar()` (L1165) sólo cubre `evento.cargo` → `cargo_firmante` y `cargo2` → `cargo_firmante2`.

Valores que se guardan y no deben cambiar: `smtp.preset` (`outlook`, `gmail`, `office365`, `otro`), `smtp.seguridad` (`ssl`, `starttls`, `ninguna`), `certificado.modo` (`diseno`, `plantilla`), `certificado.plantilla.fuente` (`serif`, `sans`), `justificante.membrete` (`decg`, `propio`, `ninguno`), `cfg.modo` (`certificados`, `justificantes`, `recibidos`, `correo`).

### 5.5 Marcadores de plantilla

Son los que el texto del usuario escribe entre llaves. Los resuelve `fill()` (L564) con `norm()` (L563), que la UI declara «mismo criterio que el servidor». No cambiar `norm`, `fill` ni el regex `\{([^{}]+)\}`.

- **`{nombre_pila}`**: primer nombre. `vars()` L582; usado en `DEF.correo.cuerpo` (L527), `TEXTO_RECIBIDOS` (L532), `TEXTO_CORREO` (L602) y en los textos de `elegirModo` (L627–L630).
- **`{evento}`**: nace de `cfg.evento.evento` (L185) a través de `norm(k)` en `vars()` (L572). Aparece en `DEF.certificado.intro/cuerpo` (L510), en `DEF.justificante.cuerpo/detalles` (L517–L518), en `DEF.correo.asunto` (L526), en `TEXTO_CORREO` (L602) y en el asunto de L1094 y el checklist L1050.
- **`{fecha}`**: `evento.fecha` (L186). Usado en `DEF.certificado.cuerpo` (L510), `DEF.justificante.cuerpo/detalles` (L517–L518) y `TEXTO_CORREO` (L602).
- **`{horario}`**: `evento.horario` (L187). Usado en `DEF.justificante.detalles` (L518) y `TEXTO_CORREO` (L602).
- **`{lugar}`**: `evento.lugar` (L189). Usado en `DEF.certificado.cuerpo` (L510), `DEF.justificante.cabecera` (L516), `cuerpo`/`detalles` (L517–L518) y `TEXTO_CORREO` (L602).
- **`{cargos}`**: `row.__cargos`, construido en L965 (`construirEnvios`) y en `vars()` L577. Usado en `TEXTO_RECIBIDOS` (L532) y en el chip de L315.
- Otras variables derivadas de `cfg.evento` (mismo mecanismo, no las sustituyas): `{organizador}` (L190), `{lugar_firma}` (L191), `{fecha_emision}` (L192), `{horas}` (L188), `{firmante}` (L198), `{cargo_firmante}` (L199), `{firmante2}`, `{cargo_firmante2}` (L201–L202).
- Otras variables del sistema: `{nombre}`, `{dni}`, `{dni_nie}`, `{email}`, `{codigo}` (L583) y `{cargo_certificado}`, `{horas_certificado}`, `{creditos_certificado}` (L1026, L315). Estas últimas vienen de los datos del PDF recibido.
- Nombres de columna del Excel como variables: `{Nombre}`, `{Apellidos}` (placeholder L161; generado en L771).

**Trampa:** `elegirModo()` (L632–L635) compara el texto actual con `DEF.correo` y con los textos de `TX` (L626–L631) para saber si el usuario ya lo personalizó. Si se cambian esos literales, cambia el comportamiento de «texto sin tocar».

### 5.6 Contrato con el servidor (ver `RESUMEN.md`, L33–L53)

Rutas que llama la UI (no se pueden renombrar ni cambiar su forma): `GET /`, `GET /api/info`, `POST /api/config`, `POST /api/lista`, `POST /api/vista` (cabecera `X-Faltan`, L1013), `POST /api/smtp`, `POST /api/prueba`, `POST /api/ejecutar`, `GET /api/estado`, `POST /api/parar`, `POST /api/abrir`, `POST /api/rebotes`, `POST /api/recibidos?nombre=`, `GET /api/recibido?id=` (L902), `POST /api/excel`, `POST /api/salir`. La UI debe seguir servida por el propio servidor (el origen se valida).

### 5.7 Funciones JS que no conviene renombrar sin revisar

`merge set toast esc api confirmar descargar nombreDe vars validarDoc aplicarModo elegirModo ir onPage pintar guardar cambio pintarChips pintarAsset zona cargar opcionesColumnas usarHoja estadoFilas pintarTabla calcPersonas asegurarColDni reemparejar sugerirRecibidos nombrePersona pintarRecibidos nuevaPersona filaFusionada construirEnvios excelActualizado montarPreview vista mailPrev revisar cuentaLista quien lanzar tablaRebotes comprobarRebotes sondear migrar`, más las constantes `get`, `norm`, `fill`, `capit`, `hoy`, `EMP`. `onclick="ir(${p})"` (L1059) es el único manejador inline que genera JS. El HTML estático no tiene `onclick`: los manejadores se asignan en JS (p. ej. L640, L642, L1164).

---

## Anexo: lo que no se ha comprobado

- No se ha abierto la página en navegador: los puntos de responsive son por lectura del CSS (sección 4).
- No se han leído `NOTA-EXTRACCION.md` ni el servidor; el contrato de la sección 5.6 viene de `RESUMEN.md`.
- Los recuentos de tamaños, radios y colores son de grep sobre el archivo tal como está.
