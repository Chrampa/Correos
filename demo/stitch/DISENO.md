# Resumen de diseño — Envío de certificados

Resumen de 1 página extraído de `trabajo/diseno/SISTEMA.md` y `trabajo/diseno/tokens.css`. Sin datos personales ni rutas.

## Dirección visual

Herramienta de oficina fiable y sobria. Superficies planas, bordes finos, poco color. 2 colores base + neutros; semánticos solo para estado. Sin degradados, sin emojis como iconos, sin sombras salvo diálogo/aviso.

## Colores (tokens)

| Rol | Token | Valor | Uso |
|---|---|---:|---|
| Acento | `--azul-600` | `#1f4e79` | Acción principal, enlaces, foco, selección |
| Acento hover | `--azul-700` | `#183f63` | Hover/pulsado botón principal |
| Acento texto | `--azul-800` | `#173b5c` | Texto sobre fondo suave azul |
| Acento suave | `--azul-50` | `#e8eef5` | Fondos suaves informativos/selección |
| Estado OK | `--verde-600` | `#13704f` | Hecho/enviado/correcto |
| OK texto/suave | `--verde-800/50` | `#0f5c41/#e6f3ed` | Texto y fondo suave OK |
| Aviso | `--ambar-600/800/50` | `#8a5a00/#6b4600/#fdf3e1` | Avisos |
| Error | `--rojo-600/800/50` | `#b42318/#8a1c12/#fdeceb` | Errores/destructivo |
| Fondo | `--gris-50` | `#f4f5f7` | Fondo app |
| Superficie | `--gris-0` | `#ffffff` | Paneles/campos |
| Superficie 2 | `--gris-75` | `#eef0f3` | Cabeceras tabla/cifras |
| Texto | `--gris-900` | `#1d2129` | Texto principal |
| Texto 2 | `--gris-600` | `#5b6472` | Texto secundario |
| Borde | `--gris-100` | `#e1e4e9` | Separadores |
| Borde control | `--gris-300` | `#868e9a` | Campos/botones secundarios |
| Nav | `--navy-900/800/700` | `#14273b/#1d3550/#25476b` | Barra lateral / hover / activo |
| Nav texto | `--navy-txt/muted/foco` | `#d8e1ec/#9fb1c5/#9fc3e6` | Texto y foco en nav |

## Tipografía

Pila del sistema, sin descargas: `--f-texto: "Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif`; mono `Cascadia Mono/Consolas/ui-monospace...`. Escala: 12/13/14/16/20/24 px. Base cuerpo 14 px, línea 1.5; pesos 400/500/600.

## Espaciado (base 4)

`--s-1:4px`, `--s-2:8px`, `--s-3:12px`, `--s-4:16px`, `--s-5:24px`, `--s-6:32px`, `--s-7:48px`.

## Radios y bordes

Solo dos radios: `--r-s:4px` (controles: botones, campos, chips, casillas) y `--r-l:8px` (contenedores: bloques, tablas, drop zone, diálogos). Bordes 1 px (`--c-borde` / `--c-borde-control`).

## Iconos

Iconos de una sola librería/sprite propio (`iconos.svg`), estilo contorno coherente. Tamaños: 18 px en línea, 24 px en inicio/vacíos. Sin emojis como iconos.

## Elevación y foco

Sin sombras en general. Única sombra permitida: `--sombra-overlay: 0 8px 24px rgba(20,39,59,.18)` solo para diálogo y toast. Foco visible: `2px solid var(--c-foco)` con offset 2 px.

## Patrones de estado

- **Vacío**: mensaje claro, explicación breve y acción siguiente; superficie neutra.
- **Carga/progreso**: indicar qué está pasando; evitar bloqueos ambiguos.
- **Error**: rojo solo para el estado/error; texto explicativo y recuperación posible.
- **OK/completado**: verde para hecho/enviado; no decorar con verde fuera de estado.
- **Aviso**: ámbar para atención no bloqueante.

## Responsive / táctil

Objetivo táctil mínimo `44px` en <=760 px. Altura control escritorio 36 px. Contenido máx. 1200 px; nav 240 px. Diseñar móvil 360–430 px con objetivos táctiles de 44 px. Movimento reducido respetado con `prefers-reduced-motion`.