// Extrae el HTML de la UI incrustado en app.js.
// En el bundle (esbuild, loader "text") el HTML es el modulo:
//   var WW=Tt((Vpe,vfe)=>{vfe.exports=`<!doctype html> ... </html>\n`});
// Uso: node extract-ui.js <app.js> <out.html>
const fs = require('fs');
const [src, out] = process.argv.slice(2);
const s = fs.readFileSync(src, 'utf8');
const START = 'vfe.exports=`<!doctype html>', END = '</html>\n`}';
const a = s.indexOf(START);
const e = s.indexOf(END, a);
if (a < 0 || e < 0 || s.indexOf(START, a + 1) >= 0) throw new Error('marcadores no encontrados o no unicos');
const litStart = a + 'vfe.exports='.length;      // posicion del ` inicial
const litEnd = e + END.length - 2;                 // posicion del ` final
const lit = s.slice(litStart, litEnd + 1);
// Comprobacion: dentro no puede haber ` ni ${ sin escapar (seria codigo, no texto)
const inner = lit.slice(1, -1);
const BS = String.fromCharCode(92);
for (let i = 0; i < inner.length; i++) {
  if (inner[i] === BS) { i++; continue; }
  if (inner[i] === '`' || (inner[i] === '$' && inner[i + 1] === '{')) throw new Error('interpolacion en ' + i);
}
const html = new Function('return ' + lit)();
fs.writeFileSync(out, html);
console.log(JSON.stringify({ litStart, litEnd, litChars: lit.length, htmlChars: html.length }));
