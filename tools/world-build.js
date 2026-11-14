// node tools/world-build.js <countries-110m.json> : world-atlas(Natural Earth 1:110m) 국가 경계를 지구본용 src/world.js 로 줄여 쓴다.
// 원본: https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json (Natural Earth, 퍼블릭 도메인 · world-atlas ISC)
const fs = require("fs"), path = require("path");
const src = process.argv[2] || path.join(__dirname, "..", "chartsrc", "world", "countries-110m.json");
const t = JSON.parse(fs.readFileSync(src, "utf8"));
const out = {
  type: "Topology", transform: t.transform, arcs: t.arcs,
  objects: { countries: { type: "GeometryCollection", geometries: t.objects.countries.geometries.map(g => ({ type: g.type, id: String(g.id == null ? "" : g.id).padStart(3, "0"), arcs: g.arcs })) } }
};
const js = "/* 세계 국가 경계 (Natural Earth 1:110m, world-atlas 2.0.2 에서 변환) */\nconst WORLD_TOPO = " + JSON.stringify(out) + ";\n";
fs.writeFileSync(path.join(__dirname, "..", "src", "world.js"), js);
console.log("src/world.js", (js.length / 1024).toFixed(0) + "KB", out.objects.countries.geometries.length, "countries");
