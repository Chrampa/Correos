# Datos de demostración (ficticios)

> **Aviso: todos los datos de esta carpeta son inventados.** No corresponden a personas reales, correos reales, identificadores reales ni eventos reales. Se han creado únicamente para la demostración web de la app de envío de certificados y justificantes.

## Qué archivo usa el build

- **`mock-fixtures.json`**: **fuente real usada por el build/demo** (`demo/build-demo.js` y `demo/src/mock-api.js`). Contiene el catálogo activo que la interfaz carga en la simulación.

## Archivos auxiliares / de ejemplo

- `asistentes-demo.xlsx`: Excel de ejemplo/activación para pruebas. Conserva el nombre, la hoja `Respuestas` y las mismas cabeceras (`Marca temporal`, `Nombre`, `Apellidos`, `DNI`, `Correo electrónico`, `Titulación`) para compatibilidad con tests. El mock no lee su contenido binario; devuelve fixtures de `mock-fixtures.json`.
- `demo-datos.json`: dataset auxiliar ficticio (personas, eventos y textos por defecto) con la misma estructura de ejemplo. No lo usa el build.
- `estados-envio.json`: ejemplo ficticio de estados/progreso de envío simulado. No lo usa el build.

## Cómo regenerar el Excel y datasets auxiliares

Generados con Node.js y el paquete `xlsx` en una carpeta temporal local (sin instalación global).

Desde la raíz del repo:

```powershell
New-Item -ItemType Directory -Force -Path "demo\datos\tmp" | Out-Null
Set-Location "demo\datos\tmp"
npm init -y > $null
npm i --silent xlsx@0.18.5
# crear/usar aquí un script que regenere asistentes-demo.xlsx, demo-datos.json y estados-envio.json
node "regen.js"
Set-Location ..\..\..
Remove-Item -Recurse -Force "demo\datos\tmp"
```

El Excel debe mantener hoja `Respuestas` y cabeceras exactas: `Marca temporal`, `Nombre`, `Apellidos`, `DNI`, `Correo electrónico`, `Titulación`.

## Privacidad / reglas

- Correos: solo dominio reservado **`@demo.invalid`** (o `.invalid` en general). No usar dominios reservados de ejemplo (`example.*`) ni dominios reales.
- Identificadores: usar **`DEMO-NNN`** u otros identificadores claramente ficticios. No usar DNI/NIE con formato real.
- Nombres: claramente ficticios/de prueba (p. ej. `Persona Demo 01`, `Ñandú Árbol Demo`).
- Sin teléfonos reales, claves, tokens, rutas personales ni datos de personas reales.
