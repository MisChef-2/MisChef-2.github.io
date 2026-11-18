// node tools/make-acc-news.js <news.json> : 사건사고 관련 보도 링크로 src/acc-news.js(ACC_NEWS)를 쓴다.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, ".."), src = process.argv[2];
const d = src && fs.existsSync(src) ? JSON.parse(fs.readFileSync(src, "utf8")) : {};
const out = {}; Object.keys(d).forEach(k => { const L = (d[k] || []).filter(n => /^https:\/\//.test(n.url || "")).slice(0, 2).map(n => ({ outlet: n.outlet, title: n.title, date: n.date || "", url: n.url })); if (L.length) out[k] = L; });
fs.writeFileSync(path.join(root, "src/acc-news.js"), "  /* 사건사고 관련 보도 링크 (tools/make-acc-news.js 로 만든다). 사진은 언론사 페이지에서 본다 */\n  const ACC_NEWS = " + JSON.stringify(out, null, 1).replace(/\n/g, "\n  ") + ";\n");
console.log("acc news:", Object.keys(out).length);
