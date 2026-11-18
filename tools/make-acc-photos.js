// node tools/make-acc-photos.js : photos/accidents/credits.json 으로 src/acc-photos.js(ACC_PHOTOS)를 다시 쓴다.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, ".."), c = JSON.parse(fs.readFileSync(path.join(root, "photos/accidents/credits.json"), "utf8"));
const out = {}; Object.keys(c).forEach(k => { if (fs.existsSync(path.join(root, "photos/accidents", k + ".webp"))) out[k] = { title: c[k].title, license: c[k].license, page: c[k].page }; });
fs.writeFileSync(path.join(root, "src/acc-photos.js"), "  /* 사건사고 카드 사진 출처 (tools/make-acc-photos.js 로 만든다) */\n  const ACC_PHOTOS = " + JSON.stringify(out, null, 1).replace(/\n/g, "\n  ") + ";\n");
console.log("acc photos:", Object.keys(out).length);
