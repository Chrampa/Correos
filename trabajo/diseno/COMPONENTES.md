# Componentes base · guía para quien rehace pantallas

Capa base aplicada en `ui/index.html` (T3, 25-11-2026). Complementa `SISTEMA.md`. Todo es CSS/HTML incrustado:
sin CDN. **Usa tokens (`var(--…)`), nunca colores, radios o espaciados sueltos.** No cambies IDs, `data-*`
ni las clases que usa el JS (`AUDITORIA-UI.md` §5).

## Iconos
El sprite (`diseno/iconos.svg`, 32 símbolos Lucide) está pegado al inicio de `<body>`.
```html
<svg class="ic" aria-hidden="true"><use href="#i-send"/></svg>        <!-- 18 px, junto a texto -->
<svg class="ic ic-l" aria-hidden="true"><use href="#i-award"/></svg>   <!-- 24 px: inicio, estados -->
<svg class="ic ic-giro" aria-hidden="true"><use href="#i-loader-circle"/></svg> <!-- gira; quieto con movimiento reducido -->
```
Icono + texto: `<button class="btn"><svg …/>Descargar</button>` (el botón ya es flex con `gap`).
Botón solo con icono: `<button class="btn icono" aria-label="Cerrar">…</button>`.
Texto solo para lectores de pantalla: `<span class="sr">Aviso</span>`.
Lista de ids: `SISTEMA.md` §5. Si falta uno, añadir el `<symbol>` a `iconos.svg` y al sprite del HTML.

## Botones
| Clase | Uso |
|---|---|
| `.btn` | Secundario (borde). Por defecto. |
| `.btn.pri` | Primario relleno. **Uno por pantalla.** |
| `.btn.danger` | Destructivo; siempre con confirmación (`confirmar()`). |
| `.btn.texto` | Acción terciaria sin borde. |
| `.btn.small` / `.btn.big` | Tamaños (36 px / 44 px). |
| `.btn.icono` | Cuadrado de icono con `aria-label`. |
Estados: hover, `:active`, foco visible (anillo `--c-foco`), `:disabled`/`aria-disabled="true"` (50 %, sin puntero).
Objetivo táctil: 36 px en escritorio, 44 px en ≤760 px (automático).

## Campos
`<label class="f">Texto <input type="text"></label>` en `.grid` (columnas automáticas; `.full` ocupa la fila).
`input`, `select`, `textarea` ya llevan borde `--c-borde-control`, radio 4 y foco visible. Casillas: `<label class="chk"><input type="checkbox"> Texto</label>`.
Ayuda: `<span class="ayuda">…</span>`. Error de campo: `aria-invalid="true"` en el control (borde rojo) +
`<span class="error-campo"><svg class="ic" …><use href="#i-circle-x"/></svg>Mensaje</span>` enlazado con `aria-describedby`.
Rango + número: `.rng`. Interruptor segmentado: `.seg` con `button[data-v]` (`.on` = activo).

## Avisos
`<div class="note info|ok|warn|bad">Texto</div>` → borde izquierdo de 3 px, fondo suave, **icono automático** (CSS) y texto
en color de estado. Quita el icono con `.sin-icono`. Un `.note` vacío se oculta solo. Para avisos tras una acción, añade
`role="alert"`. Etiquetas en línea: `<span class="pill ok|warn|bad|info"><svg class="ic" …/>Texto</span>` (icono **y** palabra).

## Tablas
`<div class="tbl"><table>…</table></div>`: `.tbl` es el contenedor con scroll propio (nunca desplaza la página);
cabecera fija, cifras tabulares, filas de 36 px (44 px en móvil), hover. `tr.off` atenúa una fila. En ≤760 px la primera
columna queda fija (`sticky`) y una sombra a la derecha indica que hay más columnas. Pon en la primera columna lo que
identifica la fila (casilla + nombre).

## Barra de pasos, cabecera, diálogo y aviso flotante
- **Pasos** (`nav .step`): `.on` actual (el JS ya lo pone; la capa base añade `aria-current="step"`), `.done` = cuadrado verde.
- **≤760 px**: la barra pasa a cabecera fija con el paso actual («3 de 5 · Certificado») y un botón (`#navToggle`) que abre
  el panel de pasos, «Exportar/Importar/Cerrar» incluidos. Se cierra al elegir un paso o con `Esc`. Sin carrusel.
- **Diálogo**: usar `confirmar(titulo, html, textoSi)` existente; ya tiene sombra, radio 8 y ancho adaptable.
- **Toast**: `toast(texto, ms)` existente; `role="status"`; en móvil ocupa el ancho inferior.
- Otros: `.card` (bloque), `.chip` (variable), `.drop` (zona de arrastre), `.stats > .stat`, `.bar-prog` (añade `.fin` al
  terminar sin fallos para ponerla verde), `.modos > .modo` (filas de inicio), `.preview`, `.asset`.

## Estados vacío / carga / error
Estructura común (icono 24 px · título · texto · acción), centrada, relleno 32. Tono: segunda persona, dato concreto,
qué hacer. Textos modelo en `SISTEMA.md` §8.

```html
<!-- Vacío -->
<div class="estado-vacio">
  <svg class="ic" aria-hidden="true"><use href="#i-users"/></svg>
  <div class="estado-titulo">Todavía no hay ninguna lista</div>
  <p class="estado-texto">Arrastra aquí el Excel o CSV con las personas. Cada fila será un envío.</p>
  <div class="estado-accion"><button class="btn">Elegir archivo</button></div>
</div>

<!-- Carga (aria-live para anunciarlo) -->
<div class="estado-carga" role="status" aria-live="polite">
  <svg class="ic ic-giro" aria-hidden="true"><use href="#i-loader-circle"/></svg>
  <div class="estado-titulo">Leyendo asistentes.xlsx…</div>
</div>

<!-- Error (role="alert" solo si aparece tras una acción) -->
<div class="estado-error" role="alert">
  <svg class="ic" aria-hidden="true"><use href="#i-circle-x"/></svg>
  <div class="estado-titulo">No se ha podido leer «lista.pdf»</div>
  <p class="estado-texto">Usa un archivo .xlsx, .xls, .ods o .csv.</p>
  <div class="estado-accion"><button class="btn">Elegir otro archivo</button></div>
</div>
```
- Dentro de una tabla vacía: `<tr><td class="estado-vacio" colspan="N">…</td></tr>` (misma estructura, se comporta como celda).
- Dentro de un `.card` basta con el bloque; no hace falta envoltorio. El icono es el primer hijo directo.
- Iconos recomendados: vacío `i-users`/`i-archive`/`i-search`; carga `i-loader-circle` + `ic-giro`; error `i-circle-x`; rebotes sin
  resultados `i-circle-check` (buena noticia, no usar `.estado-error`).

## Reglas de oro
1. Solo tokens de `:root`. Si falta uno, añádelo a `tokens.css` y al `:root` del HTML.
2. Radios: `--r-s` (controles) o `--r-l` (contenedores). Sombras: solo diálogo y toast.
3. Foco siempre visible; no uses `outline:none`.
4. No dependas del color: icono + texto en estados.
5. Comprueba a 360, 768 y 1280 px (`node diseno/comprobar-t3.js <url> <carpeta> [prefijo]` mide desbordamiento, errores de consola y hace capturas).
