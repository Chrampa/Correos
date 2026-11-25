// Extrae el recurso PE NODE_SEA_BLOB de un ejecutable Node SEA y lo parsea.
// Uso: node extract-sea.js <exe> <outdir>
const fs = require('fs'), path = require('path');
const [exe, out] = process.argv.slice(2);
const b = fs.readFileSync(exe);
const pe = b.readUInt32LE(0x3c);
if (b.toString('latin1', pe, pe + 4) !== 'PE\0\0') throw new Error('no PE');
const nsec = b.readUInt16LE(pe + 6), optSize = b.readUInt16LE(pe + 20);
const opt = pe + 24, magic = b.readUInt16LE(opt);
const ddOff = opt + (magic === 0x20b ? 112 : 96);
const resRva = b.readUInt32LE(ddOff + 2 * 8);
const secs = [];
for (let i = 0; i < nsec; i++) {
  const s = opt + optSize + i * 40;
  secs.push({ name: b.toString('latin1', s, s + 8).replace(/\0+$/, ''), vsize: b.readUInt32LE(s + 8), va: b.readUInt32LE(s + 12), rsize: b.readUInt32LE(s + 16), raw: b.readUInt32LE(s + 20) });
}
const rva2off = r => { for (const s of secs) if (r >= s.va && r < s.va + Math.max(s.vsize, s.rsize)) return r - s.va + s.raw; throw new Error('rva ' + r); };
const resBase = rva2off(resRva);
function readName(o) { const len = b.readUInt16LE(resBase + o); return b.toString('utf16le', resBase + o + 2, resBase + o + 2 + len * 2); }
function walk(dirOff, depth, pathParts, acc) {
  const n = b.readUInt16LE(resBase + dirOff + 12) + b.readUInt16LE(resBase + dirOff + 14);
  for (let i = 0; i < n; i++) {
    const e = resBase + dirOff + 16 + i * 8;
    const nameF = b.readUInt32LE(e), offF = b.readUInt32LE(e + 4);
    const name = (nameF & 0x80000000) ? readName(nameF & 0x7fffffff) : nameF;
    if (offF & 0x80000000) walk(offF & 0x7fffffff, depth + 1, [...pathParts, name], acc);
    else { const d = resBase + offF; acc.push({ path: [...pathParts, name], rva: b.readUInt32LE(d), size: b.readUInt32LE(d + 4) }); }
  }
  return acc;
}
const res = walk(0, 0, [], []);
for (const r of res) console.log('res', r.path.join('/'), 'off', rva2off(r.rva), 'size', r.size);
const sea = res.find(r => String(r.path[1]).toUpperCase() === 'NODE_SEA_BLOB');
if (!sea) throw new Error('no NODE_SEA_BLOB');
const off = rva2off(sea.rva);
const blob = b.subarray(off, off + sea.size);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'sea-blob.bin'), blob);
console.log('blob offset', off, 'size', sea.size, 'magic', blob.readUInt32LE(0).toString(16), 'flags', blob.readUInt32LE(4).toString(16));
// Layout del blob (Node 26): u32 magic 0x0143da20 | u32 flags | u8 | u8 | u64 len + code_path | u64 len + codigo principal
const pl = Number(blob.readBigUInt64LE(10));
const codePath = blob.toString('utf8', 18, 18 + pl);
let o = 18 + pl; const cl = Number(blob.readBigUInt64LE(o)); o += 8;
if (o + cl !== blob.length) console.warn('AVISO: hay datos tras el codigo principal (assets/code cache?)');
fs.writeFileSync(path.join(out, 'app.js'), blob.subarray(o, o + cl));
console.log('code_path', codePath, 'app.js', cl, 'bytes');
