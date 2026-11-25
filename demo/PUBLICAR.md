# Publicar la demo web (sin ejecutar nada automáticamente)

Este documento explica cómo publicar **solo** la demo estática de `demo/dist/`. **No se ha publicado ni subido nada** al preparar este paquete.

## Qué se publica

- Carpeta a publicar: `demo\dist\`
- Contenido: `index.html` y `_headers` (2 archivos, ~198 KiB en total, según `demo/REVISION-7e.md`)
- **No** subir la carpeta `demo` completa, ni `src`, `tests`, `datos`, `capturas`, `build-demo.js` ni nada fuera de `demo\dist\`.

## Antes de publicar

- Revisión local: `demo/REVISION-7e.md` concluye publicable como demo pública estática **publicando exclusivamente `demo/dist/`**, con datos ficticios y `noindex`, dentro del alcance probado en Chrome 158 sobre Windows.
- La URL pública será accesible por quien tenga el enlace, aunque lleve `noindex`. `noindex` pide a buscadores no indexarla; **no** es control de acceso.
- Los archivos `_headers` contienen cabeceras de seguridad/CSP y `X-Robots-Tag: noindex`. Cloudflare Pages los admite en despliegues estáticos; conviene verificar tras publicar que las cabeceras llegan tal cual.

## Opción A — Sin comandos (Cloudflare Pages, subida directa)

> Comprobar en la documentación oficial de Cloudflare si los nombres exactos del panel cambian. Los pasos siguientes son la ruta habitual de Direct Upload en Pages.

1. Entra en el panel de Cloudflare y ve a **Workers & Pages** (o la sección equivalente de Pages).
2. Pulsa **Create** / **Crear** y elige **Pages**.
3. Selecciona la opción de **Upload assets** / **Direct Upload** / subida directa de archivos (el nombre exacto puede variar; **comprobar en la documentación de Cloudflare**).
4. Nombre de proyecto sugerido: `demo-correos`. Si ya existe, elige otro nombre.
5. Arrastra o selecciona **el contenido de la carpeta `demo\dist\`** (o la carpeta `demo\dist\` si el panel lo pide). **Importante:** no arrastres la carpeta `demo` completa.
6. Completa la creación/publicación. Cloudflare mostrará una URL del proyecto cuando termine.
7. Guarda la URL para las comprobaciones posteriores.

## Opción B — Con PowerShell (Wrangler, listo para pegar)

Estos comandos los ejecuta **el usuario** en su equipo. No uses este documento para ejecutar despliegues automáticos.

1. Abre PowerShell.
2. Ve a la raíz del repositorio (ajusta la ruta si tu copia está en otro sitio):

```powershell
cd "C:\ruta\a\tu\carpeta\correos"
```

3. Inicia sesión en Cloudflare (lo ejecuta el usuario; abrirá el flujo de autenticación):

```powershell
npx wrangler login
```

4. Despliega solo `demo\dist`:

```powershell
npx wrangler pages deploy demo\dist --project-name demo-correos --branch main
```

- Para usar otro nombre de proyecto, sustituye `demo-correos` por el nombre deseado.
- Si Wrangler pregunta algo no previsto, **comprobar en la documentación de Cloudflare** antes de aceptar opciones.

## Comprobar tras publicar

1. **Abrir la URL** en el móvil y en escritorio. Debe cargar la página con el aviso **«Demostración»**.
2. **Probar el flujo básico**: ir a la pantalla de lista/subida, subir el Excel de demo `demo\datos\asistentes-demo.xlsx`, revisar que se cargan filas ficticias, y usar la acción de **simular envío** (no envía correos reales; es la simulación de la demo).
3. **Verificar cabeceras reales** con PowerShell (sustituye `<url>` por la URL publicada):

```powershell
Invoke-WebRequest -Method Head <url> | Select-Object -ExpandProperty Headers
```

Comprueba que aparezcan, al menos:
- `Content-Security-Policy` (CSP) coherente con `_headers`.
- `X-Robots-Tag` con `noindex` (o valor equivalente que incluya `noindex`).

Si las cabeceras no aparecen como se espera, revisa la configuración de Cloudflare Pages para archivos `_headers` / cabeceras personalizadas y **comprobar en la documentación de Cloudflare**.

## Visibilidad y despublicación

- **La URL es pública con enlace** aunque tenga `noindex`. No compartas la URL si no quieres acceso público.
- **Despublicar/borrar**: en Cloudflare Pages, entra en el proyecto y usa la opción de eliminar/borrar el proyecto o despliegue según el panel ofrezca. El nombre exacto de la opción puede cambiar; **comprobar en la documentación de Cloudflare**. Tras borrar, verifica que la URL deja de responder.

## Lo que NO se ha probado

- Hosting real / despliegue efectivo en Cloudflare u otro proveedor.
- Firefox, Safari, Edge.
- Móviles físicos (solo alcance indicado por revisión previa en Chrome 158/Windows; las capturas incluyen viewports móviles simulados).
- Accesibilidad WCAG completa.
- Que las cabeceras de `_headers` sean aplicadas por el hosting elegido hasta verificarlo tras publicar.
