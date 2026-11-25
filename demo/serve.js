const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, 'dist');
const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.zip': 'application/zip'
};

function headersFor(pathname) {
  const headersFile = fs.readFileSync(path.join(root, '_headers'), 'utf8');
  const headers = {};
  for (const line of headersFile.split(/\r?\n/)) {
    const match = /^\s{2}([^:]+):\s*(.*)$/.exec(line);
    if (match) headers[match[1]] = match[2];
  }
  headers['Content-Type'] = types[path.extname(pathname).toLowerCase()] || 'application/octet-stream';
  return headers;
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  } catch {
    response.writeHead(400).end('Solicitud no válida');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const filename = path.resolve(root, `.${pathname}`);
  if (!filename.startsWith(root + path.sep)) {
    response.writeHead(403).end('Prohibido');
    return;
  }
  fs.readFile(filename, (error, content) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500).end('No encontrado');
      return;
    }
    response.writeHead(200, headersFor(filename));
    response.end(content);
  });
});

server.listen(0, '127.0.0.1', () => {
  console.log(`Servidor local: http://127.0.0.1:${server.address().port}`);
});
