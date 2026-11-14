// core.js + draw-a.js + draw-b.js → core2.js (빌드 때마다 다시 만든다)
const fs = require("fs"), path = require("path"), at = f => path.join(__dirname, f);
const core = fs.readFileSync(at("core.js"), "utf8").split("\n");
const head = core.slice(0, 22), dims = core.slice(95, 99), rest = core.slice(114);
if (!head[16].includes("도면: 파라미터") || !dims[0].includes("치수선") || !rest[0].includes("객실 단면도")) { console.error("core.js layout changed"); process.exit(1); }
fs.writeFileSync(at("core2.js"), head.join("\n") + "\n" + fs.readFileSync(at("draw-a.js"), "utf8") + dims.join("\n") + "\n" + fs.readFileSync(at("draw-b.js"), "utf8") + rest.join("\n"));
