# Sistema de diseño · Envío de certificados

Versión 1 · 25-11-2026 · Ámbito: `trabajo/ui/index.html` (8 pantallas, CSS y JS incrustados).
Archivos: `tokens.css` (variables listas para pegar), `iconos.svg` (sprite), `muestra.html` (validación visual).

Restricción técnica que condiciona todo: el servidor solo sirve `GET /`, así que **nada puede venir de fuera**:
ni fuentes web, ni CDN de iconos, ni CSS externo. Todo va incrustado en el único HTML (ver `RESUMEN.md`, riesgo 5).

---

## 1. Principios

1. **Herramienta de oficina, no escaparate.** La app la usa una delegación para mandar documentos oficiales a
   cientos de personas. Debe transmitir control y fiabilidad: superficies planas, bordes finos y poco color.
2. **El color significa algo.** Azul = «puedes actuar aquí». Verde = «esto ya está hecho/bien». Ámbar y rojo
   solo para avisos y errores. Nada de color decorativo, degradados ni fondos de color en bloques enteros.
3. **Una acción principal por pantalla.** Solo un botón relleno en azul visible a la vez (p. ej. «Generar y
   enviar a todos»). El resto, botones con borde.
4. **Decir lo que pasa, con datos.** Los textos dicen cuántos, cuáles y qué hacer después («3 personas sin correo.
   Corrígelas en la lista o se saltarán»), no frases genéricas («¡Algo salió mal!»).
5. **Bordes, no sombras.** La separación se hace con bordes de 1 px y espacio. Solo flotan (con sombra) el
   diálogo de confirmación y el aviso flotante (toast).
6. **Iconos solo donde ayudan a reconocer.** Un icono acompaña al texto; nunca lo sustituye salvo en botones
   de icono con `aria-label`. Sin emojis.
7. **Funciona sin internet y sin instalar nada.**

### Qué evitar expresamente (lo que delata una interfaz genérica)
- Degradados (morados, azules o «aurora»), brillos, vidrio esmerilado.
- Rejillas de tarjetas idénticas con sombra suave y radio grande. La pantalla de inicio tiene 4 opciones: se
  presentan como **lista de filas con borde**, no como 4 tarjetas flotantes.
- Radios de 12–24 px, píldoras en todo, iconos dentro de cuadrados de color (`.modo .ic` actual).
- Emojis como iconos (🏅 📄 📦 ✉️ ⌂ actuales).
- Títulos de relleno («Bienvenido», «Todo listo para empezar 🚀»), exclamaciones, mayúsculas en botones.

---

## 2. Color

### 2.1 Dos colores base

| Rol | Token | Valor | Por qué |
|---|---|---|---|
| **Acento** (acción, selección, foco, enlace) | `--azul-600` | `#1f4e79` | Ya es el color de la app y lo reconocen quienes la usan; es un azul sobrio, cercano al azul institucional universitario, sin ser el logotipo de nadie. Contraste alto (8,66:1 con blanco), así que sirve igual para texto, botón relleno y anillo de foco. |
| **Estado** (segundo acento: hecho, correcto, enviado, paso completado) | `--verde-600` | `#13704f` | Un verde algo azulado y oscuro que convive con el azul sin competir. Se usa para *cerrar* tareas (paso completado en la barra, «Enviado», barra de progreso al terminar). Es a la vez el color semántico «ok», así el usuario aprende una sola regla: verde = terminado/bien. Sustituye a los dos verdes actuales (`#1a7f4b` y `#2e9c63`). |

Variantes de cada uno: `-700` (hover del botón), `-800` (texto sobre el fondo suave), `-50` (fondo suave).

### 2.2 Semánticos de estado

| Estado | Texto/icono | Fondo | Texto sobre fondo | Uso |
|---|---|---|---|---|
| Correcto | `--verde-600 #13704f` | `--verde-50 #e6f3ed` | `--verde-800 #0f5c41` | Enviado, conexión correcta, prueba recibida |
| Aviso | `--ambar-600 #8a5a00` | `--ambar-50 #fdf3e1` | `--ambar-800 #6b4600` | Sin correo, duplicados, campos vacíos que no bloquean |
| Error | `--rojo-600 #b42318` | `--rojo-50 #fdeceb` | `--rojo-800 #8a1c12` | Fallo de envío, rebote, archivo ilegible, acción destructiva |
| Información | `--azul-600` | `--azul-50 #e8eef5` | `--azul-800 #173b5c` | Notas de ayuda (`.note.info`) |

Regla: un aviso nunca se distingue solo por el color; lleva icono **y** una palabra («Aviso», «Error») o un
texto que lo deje claro (WCAG 1.4.1).

### 2.3 Neutros

| Token | Valor | Uso |
|---|---|---|
| `--gris-0` | `#ffffff` | Paneles, campos, tablas |
| `--gris-25` | `#f7f8fa` | Zona de arrastre, filas alternas |
| `--gris-50` | `#f4f5f7` | Fondo de la app |
| `--gris-75` | `#eef0f3` | Cabecera de tabla, cifras |
| `--gris-100` | `#e1e4e9` | Separadores y borde de bloques (decorativos) |
| `--gris-300` | `#868e9a` | Borde de campos, casillas y botones secundarios |
| `--gris-600` | `#5b6472` | Texto secundario (antes `#626a76`) |
| `--gris-900` | `#1d2129` | Texto principal |
| `--navy-900/800/700` | `#14273b` / `#1d3550` / `#25476b` | Barra lateral: fondo / hover / paso activo |
| `--navy-txt` / `--navy-muted` | `#d8e1ec` / `#9fb1c5` | Texto de la barra lateral (antes `#8fa3b9`) |

### 2.4 Contrastes comprobados (WCAG 2.1 AA)

Calculados con la fórmula de luminancia relativa de WCAG (script de comprobación en Node, no estimados a ojo).
Umbral: 4,5:1 texto normal, 3:1 texto grande (≥18,66 px negrita / 24 px) y componentes de interfaz (1.4.11).

| Primer plano / fondo | Ratio | Resultado |
|---|---|---|
| `#1d2129` texto / `#ffffff` | 16,13 | AA/AAA |
| `#1d2129` texto / `#f4f5f7` fondo app | 14,79 | AA/AAA |
| `#5b6472` secundario / `#ffffff` | 5,98 | AA |
| `#5b6472` secundario / `#f4f5f7` | 5,48 | AA |
| `#5b6472` secundario / `#eef0f3` | 5,24 | AA |
| `#5b6472` secundario / `#e8eef5` | 5,12 | AA |
| `#1f4e79` acento / `#ffffff` | 8,66 | AA/AAA |
| `#1f4e79` acento / `#f4f5f7` | 7,94 | AA/AAA |
| `#ffffff` / `#1f4e79` botón principal | 8,66 | AA/AAA |
| `#ffffff` / `#183f63` botón principal (hover) | 10,88 | AA/AAA |
| `#173b5c` / `#e8eef5` nota info, chip | 9,90 | AA/AAA |
| `#13704f` estado / `#ffffff` | 6,07 | AA |
| `#ffffff` / `#13704f` paso completado | 6,07 | AA |
| `#0f5c41` / `#e6f3ed` nota ok | 7,01 | AA/AAA |
| `#13704f` / `#e6f3ed` etiqueta ok | 5,32 | AA |
| `#8a5a00` aviso / `#ffffff` | 5,93 | AA |
| `#8a5a00` / `#fdf3e1` etiqueta aviso | 5,39 | AA |
| `#6b4600` / `#fdf3e1` nota aviso | 7,63 | AA/AAA |
| `#b42318` error / `#ffffff` | 6,57 | AA |
| `#b42318` / `#fdeceb` etiqueta error | 5,75 | AA |
| `#8a1c12` / `#fdeceb` nota error | 8,15 | AA/AAA |
| `#d8e1ec` / `#14273b` barra lateral | 11,50 | AA/AAA |
| `#9fb1c5` / `#14273b` secundario barra | 6,92 | AA |
| `#ffffff` / `#25476b` paso activo | 9,58 | AA/AAA |
| `#9fc3e6` anillo de foco / `#14273b` | 8,26 | ≥3 (1.4.11) |
| `#868e9a` borde de campo / `#ffffff` | 3,31 | ≥3 (1.4.11) |
| `#868e9a` borde de campo / `#f4f5f7` | 3,03 | ≥3 (1.4.11) |

Problemas del CSS actual que esto corrige:
- Borde de campos `#cdd2d9` sobre blanco: **1,52:1** (no cumple 1.4.11) → `#868e9a`.
- Texto secundario de la barra `#8fa3b9`: 5,86:1 (cumple, pero justo con 12 px) → `#9fb1c5`, 6,92:1.
- Foco de campos `outline:2px solid #9cc0e4`: claro y poco visible sobre blanco → anillo `#1f4e79`.
- `#868e9a` sobre `#eef0f3` da 2,90:1: **no** poner campos dentro de superficies `--gris-75`.

---

## 3. Tipografía

**Una sola familia: la del sistema**, más una monoespaciada para variables.

```css
--f-texto: "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
--f-mono:  "Cascadia Mono",Consolas,ui-monospace,"SF Mono",Menlo,monospace;
```

Por qué:
- La app es un `.exe` para Windows 10/11: Segoe UI está siempre instalada (Segoe UI Variable en Windows 11), con
  buena legibilidad a 13–14 px, acentos y «ñ» completos, y las cifras se leen bien en tablas.
- Cero bytes y cero peticiones. Una fuente embebida en base64 (p. ej. Inter, OFL) sumaría 80–300 KB al único HTML
  por cada peso y no mejoraría la lectura en Windows; se descarta.
- Monoespaciada (Cascadia Mono en Windows 11, Consolas en Windows 10) solo para variables `{nombre}`, rutas y
  códigos, para que se distingan de texto normal.
- Cifras en tablas y contadores: `font-variant-numeric: tabular-nums`.

### Escala (base 14 px)

| Token | Tamaño | Peso | Interlineado | Uso |
|---|---|---|---|---|
| `--t-24` | 24 px | 600 | 1,25 | Título de pantalla (`h2`) |
| `--t-20` | 20 px | 600 | 1,25 | Cifras de resumen; `h2` en móvil |
| `--t-16` | 16 px | 600 | 1,25 | Título de bloque (`h3`); botón grande; campos en móvil |
| `--t-14` | 14 px | 400 | 1,5 | Cuerpo, campos, botones |
| `--t-13` | 13 px | 400/500 | 1,5 | Tablas, etiquetas de campo, ayudas |
| `--t-12` | 12 px | 500/600 | 1,5 | Etiquetas de estado, pie de la barra |

Solo tres pesos: 400, 500 (etiquetas, botones) y 600 (títulos). Sin cursivas ni mayúsculas sostenidas.
Las medias tallas actuales (12,5 px, 13,5 px, 15 px, 17 px, 22 px) se redondean a esta escala.

---

## 4. Espaciado, radios, bordes, capas

**Espaciado base 4:** `--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 · `--s-7` 48 px.

- Dentro de un control: 4–8. Entre campos: 12 (vertical) × 16 (horizontal). Relleno de bloque: 16 / 24.
- Entre bloques de una pantalla: 16. Entre título de pantalla y contenido: 24. Márgenes de `main`: 32 (escritorio), 16 (móvil).

**Radios (dos valores):**
- `--r-s: 4px` → botones, campos, casillas, chips de variable, etiquetas de estado, interruptor segmentado.
- `--r-l: 8px` → bloques (`.card`), tablas, zona de arrastre, vista previa, diálogo, toast.
- Sin círculos ni píldoras. Los números de paso de la barra pasan a cuadrados de 24 px con `--r-s`.

**Bordes en vez de sombras:**
- Bloque: `1px solid --gris-100` sobre fondo `--gris-50`.
- Control: `1px solid --gris-300`.
- Selección (opción de inicio elegida, fila marcada): borde izquierdo de 3 px `--azul-600` + fondo `--azul-50`.
- Sombra solo en `dialog` y `.toast`: `--sombra-overlay: 0 8px 24px rgba(20,39,59,.18)`. Se elimina el
  `box-shadow` del hover de `.modo`.

**Capas (`z-index`):** `--z-sticky 10` (cabeceras de tabla) · `--z-nav 20` (barra de pasos en móvil) ·
`--z-overlay 40` · `--z-toast 50`. `dialog` con `showModal()` ya va en la capa superior.

**Movimiento:** 150 ms, solo color/borde/opacidad y la barra de progreso; `--dur:0` con `prefers-reduced-motion`.

---

## 5. Iconos

**Librería única: Lucide** (`lucide-static` v0.460.0, licencia **ISC**, compatible con uso y redistribución
incrustada; incluye la atribución de Feather, MIT). Motivos: trazo de línea de 2 px que casa con una interfaz
sobria, rejilla de 24 px, más de 1 500 iconos y SVG puro que se pega como `<symbol>`. Phosphor (MIT) sería igual
de válida, pero tiene un estilo más redondeado; no se mezclan.

Los 32 iconos ya están en `iconos.svg` (9 KB, sin CDN). Uso: pegar el `<svg style="display:none">…</svg>` al
principio del `<body>` y referenciar:

```html
<svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>
```
```css
.ic{width:var(--icono);height:var(--icono);flex:none;vertical-align:-3px}
```

| Id | Nombre Lucide | Dónde |
|---|---|---|
| `i-house` | house | Paso «Inicio» (sustituye ⌂) |
| `i-users` | users | Paso «Lista de personas» |
| `i-calendar` | calendar | Paso «Datos del evento» |
| `i-award` | award | Paso «Certificado», opción A (sustituye 🏅) |
| `i-file-text` | file-text | Paso «Justificante», opción B (sustituye 📄) |
| `i-archive` | archive | Paso «Certificados recibidos», opción C, ZIP (sustituye 📦) |
| `i-mail` | mail | Paso «Correo», opción D (sustituye ✉️) |
| `i-send` | send | Paso «Revisar y enviar», botón «Generar y enviar a todos» |
| `i-upload` | upload | Zonas de arrastre, «Importar» |
| `i-file-spreadsheet` | file-spreadsheet | Archivo Excel cargado, «Descargar Excel actualizado» |
| `i-download` | download | Descargas, «Exportar proyecto» |
| `i-folder-open` | folder-open | «Abrir carpeta» |
| `i-eye` | eye | Vista previa, «Ver PDF» |
| `i-search` | search | Filtro de la tabla |
| `i-paperclip` | paperclip | Adjunto adicional por persona |
| `i-signature` | signature | Firmas (imagen de firma) |
| `i-image` | image | Logotipo, membrete |
| `i-plus` | plus | «Añadir los no encontrados como personas nuevas» |
| `i-trash-2` | trash-2 | «Quitar», «Quitar todos» |
| `i-refresh-cw` | refresh-cw | «Reintentar fallidos», «Actualizar» |
| `i-circle-stop` | circle-stop | «Detener» envío |
| `i-mail-x` | mail-x | Rebotes, «Comprobar rebotes» |
| `i-circle-check` | circle-check | Estado correcto / enviado |
| `i-triangle-alert` | triangle-alert | Aviso |
| `i-circle-x` | circle-x | Error / fallo |
| `i-info` | info | Nota informativa |
| `i-check` | check | Paso completado (dentro del cuadrado verde) |
| `i-loader-circle` | loader-circle | Cargando (gira; estático con movimiento reducido) |
| `i-chevron-right` | chevron-right | Fila de opción de inicio, «Ir» en comprobaciones |
| `i-x` | x | Cerrar diálogo / aviso |
| `i-menu` | menu | Abrir pasos en móvil (si se usa menú desplegable) |
| `i-log-out` | log-out | «Cerrar aplicación» |

---

## 6. Componentes (resumen)

| Componente | Especificación |
|---|---|
| Botón principal `.btn.pri` | Fondo `--azul-600`, texto blanco 14/500, alto 36 (44 en móvil), radio 4, hover `--azul-700`. Uno por pantalla. |
| Botón secundario `.btn` | Fondo blanco, borde `--gris-300`, texto `--gris-900`; hover fondo `--gris-75`. |
| Botón destructivo `.btn.danger` | Igual que secundario con texto y borde `--rojo-600`; siempre con confirmación (`dialog`). |
| Botón de icono | 36×36 (44×44 móvil), `aria-label` obligatorio. |
| Campo | Alto 36, borde `--gris-300`, radio 4, etiqueta encima 13/500 `--gris-600`; ayuda debajo 13 `--gris-600`; error: borde `--rojo-600` + texto con icono `i-circle-x` y `aria-describedby`. |
| Bloque `.card` | Fondo blanco, borde `--gris-100`, radio 8, relleno 16–24, sin sombra. `h3` 16/600. |
| Etiqueta de estado `.pill` | Radio 4, 12/600, fondo `-50` + texto `-600`, con icono de 14 px. |
| Nota `.note` | Radio 4, borde izquierdo 3 px del color del estado, fondo `-50`, texto `-800`, icono al inicio. |
| Tabla | Borde 1 px, radio 8, cabecera fija `--gris-75` 13/600, filas de 36 px, cifras tabulares. |
| Zona de arrastre `.drop` | Borde 1 px discontinuo `--gris-300`, radio 8, fondo `--gris-25`; al arrastrar: borde `--azul-600` sólido + `--azul-50`. |
| Interruptor segmentado `.seg` | Borde `--gris-300`, radio 4, opción activa fondo `--azul-600`. |
| Barra de progreso | Alto 8, radio 4, carril `--gris-75`, relleno `--azul-600` en curso → `--verde-600` al terminar sin fallos. |

---

## 7. Jerarquía por pantalla

Patrón común: **título (h2) → una frase de qué hacer → bloques en orden de uso → acción principal al final**.
La barra lateral muestra los pasos del modo con su estado (pendiente: número; actual: fondo `--navy-700`;
completado: cuadrado verde con `i-check`).

| # | Pantalla | Lo primero que se ve | Acción principal | Secundario |
|---|---|---|---|---|
| 0 | Inicio | «¿Qué quieres hacer?» + 4 filas (icono, título, una línea, pasos en gris) | Elegir una fila | — |
| 1 | Lista de personas | Zona de arrastre (si no hay datos) / resumen «212 personas · 3 sin correo» | Corregir avisos en la tabla | Columnas, pegar filas, marcar/desmarcar |
| 2 | Datos del evento | Campos de evento en una rejilla de 2–3 columnas | (Guardado automático) | Firmas, logotipo |
| 3 | Certificado | Vista previa del PDF a la derecha, fija | Ver la vista previa | Diseño, textos, plantilla |
| 4 | Justificante | Igual que 3 | Ver la vista previa | Textos, membrete |
| 5 | Certificados recibidos | Zona de arrastre del ZIP / resumen de emparejados | «Añadir los no encontrados…» si hay | Excel actualizado, quitar |
| 6 | Correo | Cómo se envía (Outlook/SMTP) + estado de la conexión | «Probar conexión» | Mensaje, firma, adjunto, vista previa |
| 7 | Revisar y enviar | Comprobaciones (lista de ok/aviso/error) | «Generar y enviar a todos» (único botón relleno) | Prueba, solo generar, rebotes |

Durante el envío (pantalla 7) la jerarquía cambia: el bloque de progreso sube arriba, el botón principal se
desactiva y «Detener» pasa a ser la acción visible.

---

## 8. Estados vacío, carga y error

Estructura: icono 24 px `--gris-600` (o del color del estado) · título 16/600 · una o dos frases 14 `--gris-600` ·
una acción. Centrado dentro del bloque, relleno 32. Tono: segunda persona («tú»), frases cortas, sin
exclamaciones, diciendo qué ha pasado y qué hacer.

### Vacío
- **Lista de personas:** «Todavía no hay ninguna lista» · «Arrastra aquí el Excel o CSV con las personas
  (por ejemplo, la exportación de Microsoft Forms). Cada fila será un envío.» · [Elegir archivo]
- **Certificados recibidos:** «No has cargado certificados» · «Arrastra el ZIP o los PDF. Se asignan a cada
  persona por DNI/NIE o por nombre y se envían sin modificar.» · [Elegir ZIP o PDF]
- **Filtro sin resultados:** «Ninguna persona coincide con «garcía lópez»» · [Borrar búsqueda]
- **Rebotes:** «No hay rebotes en los últimos 7 días» (con `i-circle-check` en verde; es una buena noticia).

### Carga
- **Leyendo Excel:** «Leyendo asistentes.xlsx…» (icono `i-loader-circle` + `aria-live="polite"`).
- **Vista previa:** «Generando la vista previa…» (el marco mantiene su tamaño para que no salte la página).
- **Probando conexión:** botón desactivado con texto «Probando…».
- **Envío:** «Enviando 37 de 212 · quedan unos 3 min» + barra; al terminar: «Enviados 209 de 212. 3 fallos.»

### Error
- **Archivo ilegible:** «No se ha podido leer «lista.pdf»» · «Usa un archivo .xlsx, .xls, .ods o .csv.» · [Elegir otro archivo]
- **Sin columna de correo:** «No encuentro la columna del correo» · «Elige en «Columna con el correo» cuál es.»
- **Conexión:** «Outlook no responde» · «Abre Outlook (classic), inicia sesión con tu cuenta UPV y vuelve a
  pulsar «Probar conexión».»
- **Fallos de envío:** «3 correos no se han enviado» · «Revisa la dirección en la lista y pulsa «Reintentar fallidos».»
- **Rebote:** «Rebotado: la dirección no existe (ana.garcia@upv.es)».

Los errores van en `role="alert"` (o `aria-live="assertive"`) solo cuando aparecen tras una acción; los avisos
persistentes, en `aria-live="polite"`.

---

## 9. Comportamiento móvil

La app se abre en el navegador de un PC, pero debe ser usable en ventana estrecha o portátil pequeño.

| Ancho | Cambios |
|---|---|
| > 1100 px | Barra lateral 240 px + contenido (máx. 1200 px). Pantallas 3, 4 y 6 a dos columnas con vista previa fija. |
| ≤ 1100 px | Una columna; la vista previa va debajo del formulario y deja de ser fija. |
| ≤ 1000 px | Las 4 opciones de inicio ya son una lista de una columna (sin cambio). |
| ≤ 760 px | **Navegación:** la barra lateral pasa a una barra superior fija (`--z-nav`) de 56 px con el paso actual («3 de 6 · Certificado») y botones «Anterior/Siguiente»; la lista completa de pasos se abre con `i-menu` en un panel desplegable (no carrusel horizontal: el actual obliga a desplazarse para encontrar pasos). Exportar/Importar/Cerrar van al final de ese panel. `main` con relleno 16. Controles y filas de tabla a 44 px. Campos a 16 px para evitar el zoom en iOS. `h2` a 20 px. Cifras de resumen 2×2. |

**Tablas en ≤ 760 px:** se mantiene la tabla con desplazamiento horizontal dentro de su contenedor
(`overflow-x:auto`), primera columna (casilla + nombre) fija con `position:sticky; left:0`, y una pista visual
(borde/sombra interior a la derecha) de que hay más columnas. No se convierten en tarjetas: se editan correos en
línea y hay que poder comparar filas. Nunca desplazamiento horizontal de la página entera.

---

## 10. Accesibilidad

- **Foco visible siempre:** `:focus-visible{outline:2px solid var(--c-foco);outline-offset:2px}` en botones,
  enlaces, campos, casillas, `summary` y filas seleccionables. En la barra lateral, anillo `--navy-foco`. Nunca
  `outline:none` sin sustituto.
- **Objetivos táctiles:** mínimo 44×44 px en ≤ 760 px (botones, pasos, casillas con su etiqueta clicable,
  chips de variable). En escritorio 36 px de alto con separación ≥ 8 px.
- **Etiquetas:** todo campo con `<label>` asociado; botones de icono con `aria-label`; iconos decorativos con
  `aria-hidden="true"`.
- **Estado de pasos:** `aria-current="step"` en el paso actual; «completado» anunciado en texto oculto, no solo
  con color.
- **Progreso:** `<progress>` o `role="progressbar"` con `aria-valuenow`; texto «37 de 212» visible.
- **Mensajes:** `toast` con `role="status"`; errores tras acción con `role="alert"`.
- **Diálogos:** `dialog.showModal()` (atrapa el foco), foco inicial en la acción segura («Cancelar») cuando la
  principal es destructiva o masiva, `Esc` cierra.
- **Color:** contraste AA según §2.4; los estados llevan icono y texto.
- **Movimiento:** respetar `prefers-reduced-motion` (`--dur:0`, sin giro del icono de carga).
- **Idioma:** `lang="es"` ya presente; mantener textos de botón como verbos en infinitivo («Enviar», «Descargar»).

---

## 11. Cómo aplicarlo a `index.html` (para quien implemente)

1. Sustituir el bloque `:root{…}` por el contenido de `tokens.css` (los alias mantienen el CSS actual funcionando).
2. Pegar el sprite de `iconos.svg` tras `<body>` y cambiar los emojis de `.modo .ic` y el `⌂` por `<svg><use>`.
3. Ajustar, por este orden: bordes de campos (`#cdd2d9` → `var(--c-borde-control)`), foco (`:focus-visible`),
   radios (`10/12/14/99px/50%` → `--r-s`/`--r-l`), quitar `box-shadow` de `.modo:hover`, tamaños 12,5/13,5/15/17/22 → escala.
4. No cambiar ids, clases usadas por el JS, `data-*` ni el contrato con el servidor (ver `RESUMEN.md`).

Nota de implementación móvil: el contenedor de contenido de la rejilla (`main`) necesita `min-width:0`; sin él, una
tabla o un grupo de botones anchos estiran la columna `1fr` y la página entera se desplaza en horizontal (detectado
al validar `muestra.html` a 390 px).

---

## 12. Decisiones clave (resumen)

1. **Se conserva el azul `#1f4e79`** como único acento: continuidad para quien ya usa la app y contraste 8,66:1.
2. **Segundo color = verde de estado `#13704f`**, que es a la vez el «ok» semántico: una sola regla (verde = hecho)
   en lugar de dos verdes distintos como ahora.
3. **Sin fuente embebida:** Segoe UI (siempre presente en Windows 10/11) + Cascadia Mono/Consolas. 0 KB extra.
4. **Dos radios (4/8 px), cero sombras** salvo diálogo y toast; la pantalla de inicio pasa de 4 tarjetas a una lista.
5. **Lucide (ISC)** en sprite de 32 símbolos y 9 KB, incrustable en el HTML; sustituye a todos los emojis.
6. **Bordes de campo a `#868e9a`** (3,31:1) y foco `:focus-visible` azul: corrige dos fallos AA del CSS actual.
7. **Móvil ≤ 760 px:** barra superior con paso actual + panel de pasos, controles de 44 px, tablas con scroll propio
   y primera columna fija.
8. **Compatibilidad:** `tokens.css` mantiene todos los nombres antiguos de variables como alias.

Validación de `muestra.html` (Chrome headless, 25-11-2026): 0 errores de JavaScript, 32 símbolos, 60 `<use>` sin
referencias rotas, fuente resuelta a la pila Segoe, sin desplazamiento horizontal a 375 px (solo la tabla dentro
de su contenedor).
