# Sistema de diseÃ±o Â· EnvÃ­o de certificados

VersiÃ³n 1 Â· 25-11-2026 Â· Ãmbito: `trabajo/ui/index.html` (8 pantallas, CSS y JS incrustados).
Archivos: `tokens.css` (variables listas para pegar), `iconos.svg` (sprite), `muestra.html` (validaciÃ³n visual).

RestricciÃ³n tÃ©cnica que condiciona todo: el servidor solo sirve `GET /`, asÃ­ que **nada puede venir de fuera**:
ni fuentes web, ni CDN de iconos, ni CSS externo. Todo va incrustado en el Ãºnico HTML (ver `RESUMEN.md`, riesgo 5).

---

## 1. Principios

1. **Herramienta de oficina, no escaparate.** La app la usa una delegaciÃ³n para mandar documentos oficiales a
   cientos de personas. Debe transmitir control y fiabilidad: superficies planas, bordes finos y poco color.
2. **El color significa algo.** Azul = Â«puedes actuar aquÃ­Â». Verde = Â«esto ya estÃ¡ hecho/bienÂ». Ãmbar y rojo
   solo para avisos y errores. Nada de color decorativo, degradados ni fondos de color en bloques enteros.
3. **Una acciÃ³n principal por pantalla.** Solo un botÃ³n relleno en azul visible a la vez (p. ej. Â«Generar y
   enviar a todosÂ»). El resto, botones con borde.
4. **Decir lo que pasa, con datos.** Los textos dicen cuÃ¡ntos, cuÃ¡les y quÃ© hacer despuÃ©s (Â«3 personas sin correo.
   CorrÃ­gelas en la lista o se saltarÃ¡nÂ»), no frases genÃ©ricas (Â«Â¡Algo saliÃ³ mal!Â»).
5. **Bordes, no sombras.** La separaciÃ³n se hace con bordes de 1 px y espacio. Solo flotan (con sombra) el
   diÃ¡logo de confirmaciÃ³n y el aviso flotante (toast).
6. **Iconos solo donde ayudan a reconocer.** Un icono acompaÃ±a al texto; nunca lo sustituye salvo en botones
   de icono con `aria-label`. Sin emojis.
7. **Funciona sin internet y sin instalar nada.**

### QuÃ© evitar expresamente (lo que delata una interfaz genÃ©rica)
- Degradados (morados, azules o Â«auroraÂ»), brillos, vidrio esmerilado.
- Rejillas de tarjetas idÃ©nticas con sombra suave y radio grande. La pantalla de inicio tiene 4 opciones: se
  presentan como **lista de filas con borde**, no como 4 tarjetas flotantes.
- Radios de 12â€“24 px, pÃ­ldoras en todo, iconos dentro de cuadrados de color (`.modo .ic` actual).
- Emojis como iconos (ðŸ… ðŸ“„ ðŸ“¦ âœ‰ï¸ âŒ‚ actuales).
- TÃ­tulos de relleno (Â«BienvenidoÂ», Â«Todo listo para empezar ðŸš€Â»), exclamaciones, mayÃºsculas en botones.

---

## 2. Color

### 2.1 Dos colores base

| Rol | Token | Valor | Por quÃ© |
|---|---|---|---|
| **Acento** (acciÃ³n, selecciÃ³n, foco, enlace) | `--azul-600` | `#1f4e79` | Ya es el color de la app y lo reconocen quienes la usan; es un azul sobrio, cercano al azul institucional universitario, sin ser el logotipo de nadie. Contraste alto (8,66:1 con blanco), asÃ­ que sirve igual para texto, botÃ³n relleno y anillo de foco. |
| **Estado** (segundo acento: hecho, correcto, enviado, paso completado) | `--verde-600` | `#13704f` | Un verde algo azulado y oscuro que convive con el azul sin competir. Se usa para *cerrar* tareas (paso completado en la barra, Â«EnviadoÂ», barra de progreso al terminar). Es a la vez el color semÃ¡ntico Â«okÂ», asÃ­ el usuario aprende una sola regla: verde = terminado/bien. Sustituye a los dos verdes actuales (`#1a7f4b` y `#2e9c63`). |

Variantes de cada uno: `-700` (hover del botÃ³n), `-800` (texto sobre el fondo suave), `-50` (fondo suave).

### 2.2 SemÃ¡nticos de estado

| Estado | Texto/icono | Fondo | Texto sobre fondo | Uso |
|---|---|---|---|---|
| Correcto | `--verde-600 #13704f` | `--verde-50 #e6f3ed` | `--verde-800 #0f5c41` | Enviado, conexiÃ³n correcta, prueba recibida |
| Aviso | `--ambar-600 #8a5a00` | `--ambar-50 #fdf3e1` | `--ambar-800 #6b4600` | Sin correo, duplicados, campos vacÃ­os que no bloquean |
| Error | `--rojo-600 #b42318` | `--rojo-50 #fdeceb` | `--rojo-800 #8a1c12` | Fallo de envÃ­o, rebote, archivo ilegible, acciÃ³n destructiva |
| InformaciÃ³n | `--azul-600` | `--azul-50 #e8eef5` | `--azul-800 #173b5c` | Notas de ayuda (`.note.info`) |

Regla: un aviso nunca se distingue solo por el color; lleva icono **y** una palabra (Â«AvisoÂ», Â«ErrorÂ») o un
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

Calculados con la fÃ³rmula de luminancia relativa de WCAG (script de comprobaciÃ³n en Node, no estimados a ojo).
Umbral: 4,5:1 texto normal, 3:1 texto grande (â‰¥18,66 px negrita / 24 px) y componentes de interfaz (1.4.11).

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
| `#ffffff` / `#1f4e79` botÃ³n principal | 8,66 | AA/AAA |
| `#ffffff` / `#183f63` botÃ³n principal (hover) | 10,88 | AA/AAA |
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
| `#9fc3e6` anillo de foco / `#14273b` | 8,26 | â‰¥3 (1.4.11) |
| `#868e9a` borde de campo / `#ffffff` | 3,31 | â‰¥3 (1.4.11) |
| `#868e9a` borde de campo / `#f4f5f7` | 3,03 | â‰¥3 (1.4.11) |

Problemas del CSS actual que esto corrige:
- Borde de campos `#cdd2d9` sobre blanco: **1,52:1** (no cumple 1.4.11) â†’ `#868e9a`.
- Texto secundario de la barra `#8fa3b9`: 5,86:1 (cumple, pero justo con 12 px) â†’ `#9fb1c5`, 6,92:1.
- Foco de campos `outline:2px solid #9cc0e4`: claro y poco visible sobre blanco â†’ anillo `#1f4e79`.
- `#868e9a` sobre `#eef0f3` da 2,90:1: **no** poner campos dentro de superficies `--gris-75`.

---

## 3. TipografÃ­a

**Una sola familia: la del sistema**, mÃ¡s una monoespaciada para variables.

```css
--f-texto: "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;
--f-mono:  "Cascadia Mono",Consolas,ui-monospace,"SF Mono",Menlo,monospace;
```

Por quÃ©:
- La app es un `.exe` para Windows 10/11: Segoe UI estÃ¡ siempre instalada (Segoe UI Variable en Windows 11), con
  buena legibilidad a 13â€“14 px, acentos y Â«Ã±Â» completos, y las cifras se leen bien en tablas.
- Cero bytes y cero peticiones. Una fuente embebida en base64 (p. ej. Inter, OFL) sumarÃ­a 80â€“300 KB al Ãºnico HTML
  por cada peso y no mejorarÃ­a la lectura en Windows; se descarta.
- Monoespaciada (Cascadia Mono en Windows 11, Consolas en Windows 10) solo para variables `{nombre}`, rutas y
  cÃ³digos, para que se distingan de texto normal.
- Cifras en tablas y contadores: `font-variant-numeric: tabular-nums`.

### Escala (base 14 px)

| Token | TamaÃ±o | Peso | Interlineado | Uso |
|---|---|---|---|---|
| `--t-24` | 24 px | 600 | 1,25 | TÃ­tulo de pantalla (`h2`) |
| `--t-20` | 20 px | 600 | 1,25 | Cifras de resumen; `h2` en mÃ³vil |
| `--t-16` | 16 px | 600 | 1,25 | TÃ­tulo de bloque (`h3`); botÃ³n grande; campos en mÃ³vil |
| `--t-14` | 14 px | 400 | 1,5 | Cuerpo, campos, botones |
| `--t-13` | 13 px | 400/500 | 1,5 | Tablas, etiquetas de campo, ayudas |
| `--t-12` | 12 px | 500/600 | 1,5 | Etiquetas de estado, pie de la barra |

Solo tres pesos: 400, 500 (etiquetas, botones) y 600 (tÃ­tulos). Sin cursivas ni mayÃºsculas sostenidas.
Las medias tallas actuales (12,5 px, 13,5 px, 15 px, 17 px, 22 px) se redondean a esta escala.

---

## 4. Espaciado, radios, bordes, capas

**Espaciado base 4:** `--s-1` 4 Â· `--s-2` 8 Â· `--s-3` 12 Â· `--s-4` 16 Â· `--s-5` 24 Â· `--s-6` 32 Â· `--s-7` 48 px.

- Dentro de un control: 4â€“8. Entre campos: 12 (vertical) Ã— 16 (horizontal). Relleno de bloque: 16 / 24.
- Entre bloques de una pantalla: 16. Entre tÃ­tulo de pantalla y contenido: 24. MÃ¡rgenes de `main`: 32 (escritorio), 16 (mÃ³vil).

**Radios (dos valores):**
- `--r-s: 4px` â†’ botones, campos, casillas, chips de variable, etiquetas de estado, interruptor segmentado.
- `--r-l: 8px` â†’ bloques (`.card`), tablas, zona de arrastre, vista previa, diÃ¡logo, toast.
- Sin cÃ­rculos ni pÃ­ldoras. Los nÃºmeros de paso de la barra pasan a cuadrados de 24 px con `--r-s`.

**Bordes en vez de sombras:**
- Bloque: `1px solid --gris-100` sobre fondo `--gris-50`.
- Control: `1px solid --gris-300`.
- SelecciÃ³n (opciÃ³n de inicio elegida, fila marcada): borde izquierdo de 3 px `--azul-600` + fondo `--azul-50`.
- Sombra solo en `dialog` y `.toast`: `--sombra-overlay: 0 8px 24px rgba(20,39,59,.18)`. Se elimina el
  `box-shadow` del hover de `.modo`.

**Capas (`z-index`):** `--z-sticky 10` (cabeceras de tabla) Â· `--z-nav 20` (barra de pasos en mÃ³vil) Â·
`--z-overlay 40` Â· `--z-toast 50`. `dialog` con `showModal()` ya va en la capa superior.

**Movimiento:** 150 ms, solo color/borde/opacidad y la barra de progreso; `--dur:0` con `prefers-reduced-motion`.

---

## 5. Iconos

**LibrerÃ­a Ãºnica: Lucide** (`lucide-static` v0.460.0, licencia **ISC**, compatible con uso y redistribuciÃ³n
incrustada; incluye la atribuciÃ³n de Feather, MIT). Motivos: trazo de lÃ­nea de 2 px que casa con una interfaz
sobria, rejilla de 24 px, mÃ¡s de 1 500 iconos y SVG puro que se pega como `<symbol>`. Phosphor (MIT) serÃ­a igual
de vÃ¡lida, pero tiene un estilo mÃ¡s redondeado; no se mezclan.

Los 32 iconos ya estÃ¡n en `iconos.svg` (9 KB, sin CDN). Uso: pegar el `<svg style="display:none">â€¦</svg>` al
principio del `<body>` y referenciar:

```html
<svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>
```
```css
.ic{width:var(--icono);height:var(--icono);flex:none;vertical-align:-3px}
```

| Id | Nombre Lucide | DÃ³nde |
|---|---|---|
| `i-house` | house | Paso Â«InicioÂ» (sustituye âŒ‚) |
| `i-users` | users | Paso Â«Lista de personasÂ» |
| `i-calendar` | calendar | Paso Â«Datos del eventoÂ» |
| `i-award` | award | Paso Â«CertificadoÂ», opciÃ³n A (sustituye ðŸ…) |
| `i-file-text` | file-text | Paso Â«JustificanteÂ», opciÃ³n B (sustituye ðŸ“„) |
| `i-archive` | archive | Paso Â«Certificados recibidosÂ», opciÃ³n C, ZIP (sustituye ðŸ“¦) |
| `i-mail` | mail | Paso Â«CorreoÂ», opciÃ³n D (sustituye âœ‰ï¸) |
| `i-send` | send | Paso Â«Revisar y enviarÂ», botÃ³n Â«Generar y enviar a todosÂ» |
| `i-upload` | upload | Zonas de arrastre, Â«ImportarÂ» |
| `i-file-spreadsheet` | file-spreadsheet | Archivo Excel cargado, Â«Descargar Excel actualizadoÂ» |
| `i-download` | download | Descargas, Â«Exportar proyectoÂ» |
| `i-folder-open` | folder-open | Â«Abrir carpetaÂ» |
| `i-eye` | eye | Vista previa, Â«Ver PDFÂ» |
| `i-search` | search | Filtro de la tabla |
| `i-paperclip` | paperclip | Adjunto adicional por persona |
| `i-signature` | signature | Firmas (imagen de firma) |
| `i-image` | image | Logotipo, membrete |
| `i-plus` | plus | Â«AÃ±adir los no encontrados como personas nuevasÂ» |
| `i-trash-2` | trash-2 | Â«QuitarÂ», Â«Quitar todosÂ» |
| `i-refresh-cw` | refresh-cw | Â«Reintentar fallidosÂ», Â«ActualizarÂ» |
| `i-circle-stop` | circle-stop | Â«DetenerÂ» envÃ­o |
| `i-mail-x` | mail-x | Rebotes, Â«Comprobar rebotesÂ» |
| `i-circle-check` | circle-check | Estado correcto / enviado |
| `i-triangle-alert` | triangle-alert | Aviso |
| `i-circle-x` | circle-x | Error / fallo |
| `i-info` | info | Nota informativa |
| `i-check` | check | Paso completado (dentro del cuadrado verde) |
| `i-loader-circle` | loader-circle | Cargando (gira; estÃ¡tico con movimiento reducido) |
| `i-chevron-right` | chevron-right | Fila de opciÃ³n de inicio, Â«IrÂ» en comprobaciones |
| `i-x` | x | Cerrar diÃ¡logo / aviso |
| `i-menu` | menu | Abrir pasos en mÃ³vil (si se usa menÃº desplegable) |
| `i-log-out` | log-out | Â«Cerrar aplicaciÃ³nÂ» |

---

## 6. Componentes (resumen)

| Componente | EspecificaciÃ³n |
|---|---|
| BotÃ³n principal `.btn.pri` | Fondo `--azul-600`, texto blanco 14/500, alto 36 (44 en mÃ³vil), radio 4, hover `--azul-700`. Uno por pantalla. |
| BotÃ³n secundario `.btn` | Fondo blanco, borde `--gris-300`, texto `--gris-900`; hover fondo `--gris-75`. |
| BotÃ³n destructivo `.btn.danger` | Igual que secundario con texto y borde `--rojo-600`; siempre con confirmaciÃ³n (`dialog`). |
| BotÃ³n de icono | 36Ã—36 (44Ã—44 mÃ³vil), `aria-label` obligatorio. |
| Campo | Alto 36, borde `--gris-300`, radio 4, etiqueta encima 13/500 `--gris-600`; ayuda debajo 13 `--gris-600`; error: borde `--rojo-600` + texto con icono `i-circle-x` y `aria-describedby`. |
| Bloque `.card` | Fondo blanco, borde `--gris-100`, radio 8, relleno 16â€“24, sin sombra. `h3` 16/600. |
| Etiqueta de estado `.pill` | Radio 4, 12/600, fondo `-50` + texto `-600`, con icono de 14 px. |
| Nota `.note` | Radio 4, borde izquierdo 3 px del color del estado, fondo `-50`, texto `-800`, icono al inicio. |
| Tabla | Borde 1 px, radio 8, cabecera fija `--gris-75` 13/600, filas de 36 px, cifras tabulares. |
| Zona de arrastre `.drop` | Borde 1 px discontinuo `--gris-300`, radio 8, fondo `--gris-25`; al arrastrar: borde `--azul-600` sÃ³lido + `--azul-50`. |
| Interruptor segmentado `.seg` | Borde `--gris-300`, radio 4, opciÃ³n activa fondo `--azul-600`. |
| Barra de progreso | Alto 8, radio 4, carril `--gris-75`, relleno `--azul-600` en curso â†’ `--verde-600` al terminar sin fallos. |

---

## 7. JerarquÃ­a por pantalla

PatrÃ³n comÃºn: **tÃ­tulo (h2) â†’ una frase de quÃ© hacer â†’ bloques en orden de uso â†’ acciÃ³n principal al final**.
La barra lateral muestra los pasos del modo con su estado (pendiente: nÃºmero; actual: fondo `--navy-700`;
completado: cuadrado verde con `i-check`).

| # | Pantalla | Lo primero que se ve | AcciÃ³n principal | Secundario |
|---|---|---|---|---|
| 0 | Inicio | Â«Â¿QuÃ© quieres hacer?Â» + 4 filas (icono, tÃ­tulo, una lÃ­nea, pasos en gris) | Elegir una fila | â€” |
| 1 | Lista de personas | Zona de arrastre (si no hay datos) / resumen Â«212 personas Â· 3 sin correoÂ» | Corregir avisos en la tabla | Columnas, pegar filas, marcar/desmarcar |
| 2 | Datos del evento | Campos de evento en una rejilla de 2â€“3 columnas | (Guardado automÃ¡tico) | Firmas, logotipo |
| 3 | Certificado | Vista previa del PDF a la derecha, fija | Ver la vista previa | DiseÃ±o, textos, plantilla |
| 4 | Justificante | Igual que 3 | Ver la vista previa | Textos, membrete |
| 5 | Certificados recibidos | Zona de arrastre del ZIP / resumen de emparejados | Â«AÃ±adir los no encontradosâ€¦Â» si hay | Excel actualizado, quitar |
| 6 | Correo | CÃ³mo se envÃ­a (Outlook/SMTP) + estado de la conexiÃ³n | Â«Probar conexiÃ³nÂ» | Mensaje, firma, adjunto, vista previa |
| 7 | Revisar y enviar | Comprobaciones (lista de ok/aviso/error) | Â«Generar y enviar a todosÂ» (Ãºnico botÃ³n relleno) | Prueba, solo generar, rebotes |

Durante el envÃ­o (pantalla 7) la jerarquÃ­a cambia: el bloque de progreso sube arriba, el botÃ³n principal se
desactiva y Â«DetenerÂ» pasa a ser la acciÃ³n visible.

---

## 8. Estados vacÃ­o, carga y error

Estructura: icono 24 px `--gris-600` (o del color del estado) Â· tÃ­tulo 16/600 Â· una o dos frases 14 `--gris-600` Â·
una acciÃ³n. Centrado dentro del bloque, relleno 32. Tono: segunda persona (Â«tÃºÂ»), frases cortas, sin
exclamaciones, diciendo quÃ© ha pasado y quÃ© hacer.

### VacÃ­o
- **Lista de personas:** Â«TodavÃ­a no hay ninguna listaÂ» Â· Â«Arrastra aquÃ­ el Excel o CSV con las personas
  (por ejemplo, la exportaciÃ³n de Microsoft Forms). Cada fila serÃ¡ un envÃ­o.Â» Â· [Elegir archivo]
- **Certificados recibidos:** Â«No has cargado certificadosÂ» Â· Â«Arrastra el ZIP o los PDF. Se asignan a cada
  persona por DNI/NIE o por nombre y se envÃ­an sin modificar.Â» Â· [Elegir ZIP o PDF]
- **Filtro sin resultados:** Â«Ninguna persona coincide con Â«garcÃ­a lÃ³pezÂ»Â» Â· [Borrar bÃºsqueda]
- **Rebotes:** Â«No hay rebotes en los Ãºltimos 7 dÃ­asÂ» (con `i-circle-check` en verde; es una buena noticia).

### Carga
- **Leyendo Excel:** Â«Leyendo asistentes.xlsxâ€¦Â» (icono `i-loader-circle` + `aria-live="polite"`).
- **Vista previa:** Â«Generando la vista previaâ€¦Â» (el marco mantiene su tamaÃ±o para que no salte la pÃ¡gina).
- **Probando conexiÃ³n:** botÃ³n desactivado con texto Â«Probandoâ€¦Â».
- **EnvÃ­o:** Â«Enviando 37 de 212 Â· quedan unos 3 minÂ» + barra; al terminar: Â«Enviados 209 de 212. 3 fallos.Â»

### Error
- **Archivo ilegible:** Â«No se ha podido leer Â«lista.pdfÂ»Â» Â· Â«Usa un archivo .xlsx, .xls, .ods o .csv.Â» Â· [Elegir otro archivo]
- **Sin columna de correo:** Â«No encuentro la columna del correoÂ» Â· Â«Elige en Â«Columna con el correoÂ» cuÃ¡l es.Â»
- **ConexiÃ³n:** Â«Outlook no respondeÂ» Â· Â«Abre Outlook (classic), inicia sesiÃ³n con tu cuenta UPV y vuelve a
  pulsar Â«Probar conexiÃ³nÂ».Â»
- **Fallos de envÃ­o:** Â«3 correos no se han enviadoÂ» Â· Â«Revisa la direcciÃ³n en la lista y pulsa Â«Reintentar fallidosÂ».Â»
- **Rebote:** Â«Rebotado: la direcciÃ³n no existe (persona.demo@demo.invalid)Â».

Los errores van en `role="alert"` (o `aria-live="assertive"`) solo cuando aparecen tras una acciÃ³n; los avisos
persistentes, en `aria-live="polite"`.

---

## 9. Comportamiento mÃ³vil

La app se abre en el navegador de un PC, pero debe ser usable en ventana estrecha o portÃ¡til pequeÃ±o.

| Ancho | Cambios |
|---|---|
| > 1100 px | Barra lateral 240 px + contenido (mÃ¡x. 1200 px). Pantallas 3, 4 y 6 a dos columnas con vista previa fija. |
| â‰¤ 1100 px | Una columna; la vista previa va debajo del formulario y deja de ser fija. |
| â‰¤ 1000 px | Las 4 opciones de inicio ya son una lista de una columna (sin cambio). |
| â‰¤ 760 px | **NavegaciÃ³n:** la barra lateral pasa a una barra superior fija (`--z-nav`) de 56 px con el paso actual (Â«3 de 6 Â· CertificadoÂ») y botones Â«Anterior/SiguienteÂ»; la lista completa de pasos se abre con `i-menu` en un panel desplegable (no carrusel horizontal: el actual obliga a desplazarse para encontrar pasos). Exportar/Importar/Cerrar van al final de ese panel. `main` con relleno 16. Controles y filas de tabla a 44 px. Campos a 16 px para evitar el zoom en iOS. `h2` a 20 px. Cifras de resumen 2Ã—2. |

**Tablas en â‰¤ 760 px:** se mantiene la tabla con desplazamiento horizontal dentro de su contenedor
(`overflow-x:auto`), primera columna (casilla + nombre) fija con `position:sticky; left:0`, y una pista visual
(borde/sombra interior a la derecha) de que hay mÃ¡s columnas. No se convierten en tarjetas: se editan correos en
lÃ­nea y hay que poder comparar filas. Nunca desplazamiento horizontal de la pÃ¡gina entera.

---

## 10. Accesibilidad

- **Foco visible siempre:** `:focus-visible{outline:2px solid var(--c-foco);outline-offset:2px}` en botones,
  enlaces, campos, casillas, `summary` y filas seleccionables. En la barra lateral, anillo `--navy-foco`. Nunca
  `outline:none` sin sustituto.
- **Objetivos tÃ¡ctiles:** mÃ­nimo 44Ã—44 px en â‰¤ 760 px (botones, pasos, casillas con su etiqueta clicable,
  chips de variable). En escritorio 36 px de alto con separaciÃ³n â‰¥ 8 px.
- **Etiquetas:** todo campo con `<label>` asociado; botones de icono con `aria-label`; iconos decorativos con
  `aria-hidden="true"`.
- **Estado de pasos:** `aria-current="step"` en el paso actual; Â«completadoÂ» anunciado en texto oculto, no solo
  con color.
- **Progreso:** `<progress>` o `role="progressbar"` con `aria-valuenow`; texto Â«37 de 212Â» visible.
- **Mensajes:** `toast` con `role="status"`; errores tras acciÃ³n con `role="alert"`.
- **DiÃ¡logos:** `dialog.showModal()` (atrapa el foco), foco inicial en la acciÃ³n segura (Â«CancelarÂ») cuando la
  principal es destructiva o masiva, `Esc` cierra.
- **Color:** contraste AA segÃºn Â§2.4; los estados llevan icono y texto.
- **Movimiento:** respetar `prefers-reduced-motion` (`--dur:0`, sin giro del icono de carga).
- **Idioma:** `lang="es"` ya presente; mantener textos de botÃ³n como verbos en infinitivo (Â«EnviarÂ», Â«DescargarÂ»).

---

## 11. CÃ³mo aplicarlo a `index.html` (para quien implemente)

1. Sustituir el bloque `:root{â€¦}` por el contenido de `tokens.css` (los alias mantienen el CSS actual funcionando).
2. Pegar el sprite de `iconos.svg` tras `<body>` y cambiar los emojis de `.modo .ic` y el `âŒ‚` por `<svg><use>`.
3. Ajustar, por este orden: bordes de campos (`#cdd2d9` â†’ `var(--c-borde-control)`), foco (`:focus-visible`),
   radios (`10/12/14/99px/50%` â†’ `--r-s`/`--r-l`), quitar `box-shadow` de `.modo:hover`, tamaÃ±os 12,5/13,5/15/17/22 â†’ escala.
4. No cambiar ids, clases usadas por el JS, `data-*` ni el contrato con el servidor (ver `RESUMEN.md`).

Nota de implementaciÃ³n mÃ³vil: el contenedor de contenido de la rejilla (`main`) necesita `min-width:0`; sin Ã©l, una
tabla o un grupo de botones anchos estiran la columna `1fr` y la pÃ¡gina entera se desplaza en horizontal (detectado
al validar `muestra.html` a 390 px).

---

## 12. Decisiones clave (resumen)

1. **Se conserva el azul `#1f4e79`** como Ãºnico acento: continuidad para quien ya usa la app y contraste 8,66:1.
2. **Segundo color = verde de estado `#13704f`**, que es a la vez el Â«okÂ» semÃ¡ntico: una sola regla (verde = hecho)
   en lugar de dos verdes distintos como ahora.
3. **Sin fuente embebida:** Segoe UI (siempre presente en Windows 10/11) + Cascadia Mono/Consolas. 0 KB extra.
4. **Dos radios (4/8 px), cero sombras** salvo diÃ¡logo y toast; la pantalla de inicio pasa de 4 tarjetas a una lista.
5. **Lucide (ISC)** en sprite de 32 sÃ­mbolos y 9 KB, incrustable en el HTML; sustituye a todos los emojis.
6. **Bordes de campo a `#868e9a`** (3,31:1) y foco `:focus-visible` azul: corrige dos fallos AA del CSS actual.
7. **MÃ³vil â‰¤ 760 px:** barra superior con paso actual + panel de pasos, controles de 44 px, tablas con scroll propio
   y primera columna fija.
8. **Compatibilidad:** `tokens.css` mantiene todos los nombres antiguos de variables como alias.

ValidaciÃ³n de `muestra.html` (Chrome headless, 25-11-2026): 0 errores de JavaScript, 32 sÃ­mbolos, 60 `<use>` sin
referencias rotas, fuente resuelta a la pila Segoe, sin desplazamiento horizontal a 375 px (solo la tabla dentro
de su contenedor).


