# T7 · Revisión de textos visibles (ui/index.html)

Fecha: 25-11-2026. Solo se ha cambiado texto visible (HTML y cadenas del JS). Sin cambios en ids, clases, data-*, claves de cfg, URLs /api, marcadores de variables ni comparaciones JS. Única adición de marcado: icono `i-upload` en el botón «Elegir archivo…» de `pintarAsset`.

## Antes → después, por pantalla

### Pestaña y barra lateral
| Antes | Después |
|---|---|
| `Envío de certificados` (título de página) | `Envío de certificados y justificantes` |
| Modo «Certificados ya creados»: pasos «Excel con los correos» / «Certificados (ZIP)» | «Lista de personas» / «Certificados recibidos» |
| Modo «Solo correo»: paso «Excel con los correos» | «Lista de personas» |

### 0 · Inicio
| Antes | Después |
|---|---|
| «Antes del envío revisas todo y te mandas una prueba; después se envía a todas las personas de una vez.» | «Antes de enviar revisas todo y te mandas una prueba; después el envío llega a todas las personas de una vez.» |
| «…con vuestro diseño o plantilla» → «…con vuestra plantilla» | «…con tu plantilla» |
| Recibidos: «Repartir certificados que ya os han entregado hechos (…) sin modificarlos, así conservan la firma electrónica.» | «Repartir entre las personas los certificados ya hechos que te han entregado (…). Se envían sin modificar, así conservan la firma electrónica.» |
| Viñeta «Excel con los correos» (modos Recibidos y Solo correo) | «Lista de personas» |

### 1 · Lista de personas
| Antes | Después |
|---|---|
| «Carga el Excel o CSV con las personas…» | «Carga el Excel o el CSV con las personas…» |
| Botón «Elegir archivo» | «Elegir archivo…» |
| «Comprueba qué columna es cada dato. Se han detectado automáticamente; cámbialas…» | «Comprueba qué columna contiene cada dato. La app las ha detectado sola; cámbialas…» |
| Contador «N de M seleccionadas» | «N de M marcadas» (igual que «Marcar todas») |
| Aviso «persona seleccionada sin correo válido… o se marcarán como error.» | «persona marcada sin correo válido… o se saltarán al enviar.» |
| Aviso «Cargado: archivo» | «Lista cargada: archivo» |
| Error «No hay lista cargada» | «Primero carga la lista de personas» |
| Consejo al repartir sin lista: «Consejo: carga primero la lista (paso 1)…» | «Carga antes la lista (paso 1) para que se asignen…» |

### 2 · Datos del evento
| Antes | Después |
|---|---|
| «…se usa el valor de cada persona.» | «…la app usa el valor de cada persona.» |

### 3-4 · Certificado y justificante
| Antes | Después |
|---|---|
| Justificante, selector de papel: «Papel:» | «Membrete:» |
| «Elegir archivo…» (asset, sin icono) | «Elegir archivo…» con icono `i-upload`; «Ninguna» → «Ningún archivo» |

### 5 · Certificados recibidos
| Antes | Después |
|---|---|
| «Variables extra: {cargos} reúne… y resulta útil en el texto del correo.» | «Variable extra: {cargos} reúne todos los cargos de la persona. Úsala en el texto del correo.» |
| «“Posible” marca las personas de la lista cuyo nombre se parece al del PDF.» | «“Posible” indica una persona de la lista cuyo nombre se parece al del PDF. Revísala antes de enviar.» |
| «Elegir ZIP o PDF» | «Elegir ZIP o PDF…» |
| Carga: «N certificado(s) cargado(s)» | «1 certificado cargado» / «N certificados cargados» |
| Aviso: «N certificado(s) no se han podido asignar: … (luego escribe su correo…)» | «1 certificado no se ha podido asignar» / «N certificados no se han podido asignar: … (después escribe su correo…)» |
| «N asignado(s) por nombre…» / «N persona(s) tienen varios certificados…» | Plural correcto según N |
| Toast «N persona(s) añadida(s) a la lista…» | Plural correcto según N |

### 6 · Correo
| Antes | Después |
|---|---|
| Nota de firma: «Rellena {firmante} y {cargo_firmante} en el texto de los certificados recibidos.» | «Se insertan en {firmante} y {cargo_firmante} del texto del correo.» |
| Prueba: «Recibirás el mismo correo, con sus adjuntos, que la persona que elijas.» | «…con sus adjuntos y los datos de la persona que elijas.» |
| Vista previa sin valor: «Sin valor: …» | «Faltan datos: …» |
| Error de prueba: «No se ha enviado la prueba. <error>» | Añade «Revisa la cuenta en el paso «Correo» y vuelve a intentarlo.» |
| Resultado de prueba: «carpeta de spam» | «carpeta de correo no deseado» |

### 7 · Revisar y enviar
| Antes | Después |
|---|---|
| «…a quién se salta, y tendrás que confirmarlo.» | «…a quién se salta. Tendrás que confirmarlo.» |
| Resumen: «N persona(s) recibirán N certificado(s)» / «persona(s) seleccionada(s) de M» | Plural correcto; «persona marcada de M» |
| Resumen: «certificado(s) recibido(s) sin asignar» / «persona(s) sin DNI/NIE» / «persona(s) sin correo válido» | Plural correcto |
| «Elegiste «Mi plantilla»… (se usará el diseño incluido)» | «Has elegido «Mi plantilla» para el certificado, pero no has subido el archivo: se usará el diseño incluido» |
| Cifra «Seleccionadas de M» | «Marcadas de M»; «ninguna está seleccionada» → «ninguna está marcada» |
| Diálogo de envío: «Una vez enviados no se pueden recuperar.» | «Una vez enviados, no se pueden recuperar.» |
| Botón por defecto de diálogos y botón de HTML «Aceptar» | «Continuar» |
| Diálogo «¿Cerrar la aplicación?», botón «Cerrar» | «Cerrar aplicación» |
| Sin destinatarios: «No hay personas seleccionadas» | «No hay personas marcadas» |
| Rebotes: «Busca en la bandeja de entrada del buzón… Tras cada envío se comprueba solo…» | «…Tras cada envío, la app lo comprueba sola…» |
| Rebotes: «correo(s) no se entregaron» | Plural correcto |
| Toast final: «Terminado: N fallido(s), M rebotado(s)» | Plural correcto |
| Excel: «No se pudo crear el Excel» | «No se ha podido crear el Excel» |
| Botón «Elegir otro archivo» (error de lista) | «Elegir otro archivo…» |

## Textos que NO se han tocado (por regla)
- Valores por defecto de asunto y cuerpo (certificado, justificante, «Solo correo», recibidos). Errata evidente: ninguna. Hay un signo de exclamación, `¡Nos vemos!`, en el texto por defecto de «Solo correo» (TEXTO_CORREO). Se deja para decidir.
- Textos de ayuda de los proveedores SMTP (PRESETS) y la cabecera de columna «Certificados recibidos» del Excel exportado (es un dato, no un texto de la interfaz).

## Comprobaciones
- `node diseno/comprobar-ids-t3.js <original> ui/index.html`: OK en IDs (133), atributos data-* (21), valores data-bind/go/page/modo/v/asset/var/preview (113), clases (139) y en los seis marcadores de plantilla ({nombre_pila} 5, {evento} 13, {fecha} 4, {horario} 2, {lugar} 5, {cargos} 3).
- Falla, como se esperaba: «textos visibles del HTML sin cambios» y «JS: solo cambian 3 líneas de marcado» (el JS cambia en muchas líneas y se añade una línea, la de `const nNuevas`).
- Sintaxis del JS comprobada con `new Function`: correcta.
- Marcadores de variables: sin cambios. El único `{nNuevas}` que aparece en el recuento es una plantilla `${nNuevas}` de JS, no un marcador.

## Dudas
1. Modo «Certificados ya creados» frente al paso «Certificados recibidos»: el nombre del modo no se ha tocado. ¿Lo unificamos?
2. Botón principal «Generar y enviar a N personas»: se mantiene «persona» como término único. ¿Prefieres «Enviar N correos», como en el ejemplo?
3. Tuteo: «vuestro/os» pasa a «tu» en 3 sitios. Si la app se dirige a la delegación en plural, hay que revertirlo.
4. «Entendido» (diálogo «Nadie tiene correo») se deja porque solo informa.
5. ¿Quitamos «¡Nos vemos!» del texto por defecto de «Solo correo»? Es una plantilla que sale a terceros, así que no se ha tocado.
