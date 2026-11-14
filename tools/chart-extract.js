// node tools/chart-extract.js <chartsrc dir> src/pilot.js : OurAirports 표에서 허브 공항 66곳의 활주로·주파수·표고만 뽑아 chartsrc/oa.json 에 쓴다.
const fs = require("fs"), path = require("path");
const SRC = process.argv[2], PJ = process.argv[3];
function parseCSV(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (c !== "\r") f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  const h = rows.shift();
  return rows.map(r => Object.fromEntries(h.map((k, i) => [k, r[i] === undefined ? "" : r[i]])));
}
const pj = fs.readFileSync(PJ, "utf8");
const icaos = [...pj.matchAll(/\["([A-Z]{3})", "([A-Z0-9]{4})", "/g)].map(m => m[2]);
const want = new Set(icaos);
console.log("airports in hub:", icaos.length);
const read = n => parseCSV(fs.readFileSync(path.join(SRC, n), "utf8"));
const out = {};
for (const a of read("airports.csv")) if (want.has(a.ident) || want.has(a.gps_code) || want.has(a.icao_code)) {
  const k = want.has(a.ident) ? a.ident : want.has(a.icao_code) ? a.icao_code : a.gps_code;
  if (out[k] && out[k].ident === k) continue;
  out[k] = { ident: a.ident, name: a.name, city: a.municipality, elev: a.elevation_ft === "" ? null : +a.elevation_ft, lat: +a.latitude_deg, lon: +a.longitude_deg, type: a.type, rw: [], fq: [] };
}
const idents = {}; for (const k in out) idents[out[k].ident] = k;
for (const r of read("runways.csv")) {
  const k = idents[r.airport_ident]; if (!k) continue;
  if (r.closed === "1" || r.le_latitude_deg === "" || r.he_latitude_deg === "") { if (r.closed !== "1" && !/^H/.test(r.le_ident)) out[k].rwNoPos = (out[k].rwNoPos || 0) + 1; continue; }
  out[k].rw.push({ le: r.le_ident, he: r.he_ident, len: +r.length_ft || null, wid: +r.width_ft || null, sfc: r.surface, lit: r.lighted === "1",
    a: [+r.le_latitude_deg, +r.le_longitude_deg], b: [+r.he_latitude_deg, +r.he_longitude_deg],
    ae: r.le_elevation_ft === "" ? null : +r.le_elevation_ft, be: r.he_elevation_ft === "" ? null : +r.he_elevation_ft,
    ah: r.le_heading_degT === "" ? null : +r.le_heading_degT, bh: r.he_heading_degT === "" ? null : +r.he_heading_degT,
    ad: +r.le_displaced_threshold_ft || 0, bd: +r.he_displaced_threshold_ft || 0 });
}
for (const f of read("airport-frequencies.csv")) {
  const k = idents[f.airport_ident]; if (!k) continue;
  out[k].fq.push({ t: f.type, d: f.description, m: +f.frequency_mhz });
}
const miss = icaos.filter(i => !out[i]);
console.log("missing airports:", miss.join(" ") || "none");
for (const i of icaos) if (out[i]) console.log(i.padEnd(5), "rw", String(out[i].rw.length).padStart(2), out[i].rwNoPos ? "(+" + out[i].rwNoPos + " no pos)" : "", "fq", String(out[i].fq.length).padStart(3), "elev", out[i].elev, "|", out[i].rw.map(r => r.le + "/" + r.he).join(" "));
fs.writeFileSync(path.join(SRC, "oa.json"), JSON.stringify({ order: icaos, apt: out }));
