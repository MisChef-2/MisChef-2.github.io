// node tools/serve.js [port] : 저장소 폴더를 http://127.0.0.1:<port>/ 로 보여 주는 미리보기용 정적 파일 서버
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, ".."), port = +(process.argv[2] || 8766);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".webp": "image/webp" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!f.startsWith(root + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "text/plain", "Cache-Control": "no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}/`));
