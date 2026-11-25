# Cómo se extrajo `ui/index.html`

1. **El blob SEA es un recurso PE, no un offset fijo.** `tools/extract-sea.js` lee la tabla de recursos
   del .exe (tipo `RT_RCDATA` = 10, nombre `NODE_SEA_BLOB`). En el `EnviaCertificados.exe` original:
   - offset en el fichero = **100 222 552**, tamaño = **4 844 081** bytes
     (el offset ~96 756 113 que se manejaba antes no es el inicio del blob).
   - Node embebido: **v26.13.0** (recurso VERSIONINFO). Fusible `NODE_SEA_FUSE_…:1`.
2. **Layout del blob** (Node 26): `u32 magic 0x0143DA20 | u32 flags=1 (sin aviso experimental) | u8 | u8 |
   u64 len + "dist/app.js" | u64 len (4 844 044) + código`. No hay assets SEA, ni code cache, ni snapshot:
   todo es un único bundle `dist/app.js` (esbuild, CommonJS).
3. **El HTML es un módulo esbuild de tipo texto** dentro de `app.js`:
   ```js
   var WW=Tt((Vpe,vfe)=>{vfe.exports=`<!doctype html>\n<html lang="es">…</html>\n`});
   ```
   y el servidor lo usa como `Qfe=WW()` → `"GET /": (a,r)=>zi(r,200,Qfe,"text/html; charset=utf-8")`.
4. **Límite exacto** (`tools/extract-ui.js`): marcador inicial único `` vfe.exports=`<!doctype html> ``
   y marcador final `` </html>\n`} `` (el primero tras el inicial). El literal de plantilla va del
   `` ` `` en el byte **3 197 858** al `` ` `` en el byte **3 291 882** de `app.js` (94 025 bytes;
   en el .exe original: bytes 103 420 447–103 514 471).
   Se comprueba que dentro no hay `` ` `` ni `${` sin escapar (sería código, no texto) y se evalúa el
   literal para deshacer los escapes → 92 549 caracteres / 92 896 bytes UTF-8, 1 184 líneas.
5. **Verificación:** el servidor original/reconstruido sirve en `GET /` exactamente 92 896 bytes,
   igual que este fichero.

El HTML tiene CSS (`<style>`) y JS (`<script>`, desde la línea 439) incrustados; se deja en un solo
fichero porque así lo sirve el servidor (no hay rutas para .css/.js estáticos: cualquier otra ruta da 404).
