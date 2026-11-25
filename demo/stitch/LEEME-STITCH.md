# Guía para pasar la demo a Stitch

Guía breve para usar [Stitch](https://stitch.google.com/) como apoyo para mejorar la interfaz de la demo. **No se ha comprobado que Stitch lea URLs**; si no puede, usa las capturas como alternativa.

## Qué aportar

1. **URL pública** de la demo, una vez publicada (ver `demo/PUBLICAR.md`). Solo si Stitch acepta URLs.
2. **Capturas** en `demo/stitch/capturas/` (ver `INDICE.md`): pantallas 360 px y 1280 px, diálogo de envío y toast.
3. **Documento de diseño**: `demo/stitch/DISENO.md`, resumen del sistema actual (colores, tipografía, espaciado, radios, iconos, estados).

## Prompt listo para copiar

```text
Quiero mejorar la interfaz visual de esta demo web de “Envío de certificados” conservando su funcionalidad actual.

Contexto:
- Es una demo estática con datos ficticios. No debe enviar correos reales ni conectarse a servicios reales.
- Te aporto [URL pública / capturas adjuntas] y un resumen del sistema de diseño actual.

Necesito que propongas mejoras de UI manteniendo estas restricciones:
- Conserva la funcionalidad y el flujo de las pantallas (inicio, lista/Excel, evento, certificado, justificante, recibidos, correo, envío simulado).
- Mantén el sistema de diseño: 2 colores base + neutros, 1-2 tipografías, radios 4/8, sin degradados morados/azules, sin emojis como iconos, iconos de una sola librería, sin sombras salvo diálogo/aviso.
- Conserva y mejora los estados vacío, carga y error, haciéndolos claros.
- Optimiza para móvil de 360 a 430 px de ancho, con objetivos táctiles de 44 px.
- Mantén apariencia de herramienta de oficina fiable, sobria y accesible.
- No añadas datos reales, rutas de usuario, ni integraciones externas.

Entrega: propuesta visual y cambios concretos por pantalla, indicando qué se conserva y qué cambia, con atención especial a móvil.
```

## Alternativa si Stitch no lee la URL

Adjunta las imágenes de `demo/stitch/capturas/` (empieza por las de 360 px y añade las de 1280 px) junto con `demo/stitch/DISENO.md`. Indica en el prompt: “No puedo compartir URL; te adjunto capturas y el resumen de diseño”.