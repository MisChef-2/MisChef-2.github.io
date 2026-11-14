// node tools/chart-osm.js <chartsrc dir> [rev] : 공항마다 OpenStreetMap(Overpass)에서 유도로·계류장·터미널·관제탑 도형을 받아 chartsrc/osm/<ICAO>.json 에 둔다.
// 이미 받은 공항은 건너뛴다. 한 번에 한 요청씩, 사이에 쉬면서 보낸다.
const fs = require("fs"), path = require("path");
const SRC = process.argv[2], OUT = path.join(SRC, "osm");
fs.mkdirSync(OUT, { recursive: true });
const oa = JSON.parse(fs.readFileSync(path.join(SRC, "oa.json"), "utf8"));
const EP = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
const sleep = ms => new Promise(r => setTimeout(r, ms));
function bbox(a) {
  let s = a.lat, n = a.lat, w = a.lon, e = a.lon;
  for (const r of a.rw) for (const p of [r.a, r.b]) { s = Math.min(s, p[0]); n = Math.max(n, p[0]); w = Math.min(w, p[1]); e = Math.max(e, p[1]); }
  const my = 1500 / 111320, mx = 1500 / (111320 * Math.cos(a.lat * Math.PI / 180));
  return [s - my, w - mx, n + my, e + mx].map(v => +v.toFixed(5));
}
(async () => {
  const order = process.argv[3] === "rev" ? oa.order.slice().reverse() : oa.order;
  const EPS = process.argv[3] === "rev" ? EP.slice(1).concat(EP.slice(0, 1)) : EP;
  for (const icao of order) {
    const f = path.join(OUT, icao + ".json");
    if (fs.existsSync(f) && fs.statSync(f).size > 100) continue;
    const a = oa.apt[icao], bb = bbox(a).join(",");
    const q = `[out:json][timeout:120];way["aeroway"~"^(taxiway|taxilane|apron|terminal|runway)$"](${bb});out tags geom;relation["aeroway"~"^(apron|terminal)$"](${bb});out geom;nwr["aeroway"="control_tower"](${bb});out tags center;`;
    let ok = false;
    for (let t = 0; t < 8 && !ok; t++) {
      const ep = EPS[t % EPS.length];
      try {
        const res = await fetch(ep, { method: "POST", headers: { "User-Agent": "JetlinerHubBuilder/1.0 (site build script)", "Content-Type": "application/x-www-form-urlencoded" }, body: "data=" + encodeURIComponent(q) });
        const txt = await res.text();
        if (res.status === 200 && txt.trim().startsWith("{")) { fs.writeFileSync(f, txt); const j = JSON.parse(txt); console.log(icao, "ok", j.elements.length, "elements", (txt.length / 1024).toFixed(0) + "KB"); ok = true; }
        else { console.log(icao, "retry", ep.split("/")[2], res.status); await sleep(6000 + 4000 * t); }
      } catch (e) { console.log(icao, "error", e.message); await sleep(10000); }
    }
    if (!ok) console.log(icao, "FAILED");
    await sleep(2500);
  }
  console.log("done");
})();
