/** OurAirports public-domain runway data + separately licensed OSM chart geometry.
 * Physical ends are NOT automatically landing thresholds. Unknown displacement stays
 * null. Airport-elevation fallback is explicit and never alters source values.
 * Not an aeronautical navigation or operational runway-availability source.
 */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const radians = n => n * Math.PI / 180;
const degrees = n => n * 180 / Math.PI;
const R = 6371000;
async function jsonFile(name, signal) {
  const response = await fetch(new URL(name, import.meta.url), { signal });
  if (!response.ok) throw new Error(`공항 데이터 ${name}: HTTP ${response.status}`);
  return response.json();
}
export async function loadAirportData(signal) {
  const [a, r] = await Promise.all([jsonFile('airports-v2.json', signal), jsonFile('runways.json', signal)]);
  if (!Array.isArray(a.airports) || !r.runways || typeof r.runways !== 'object')
    throw new Error('공항·활주로 데이터 형식이 올바르지 않습니다.');
  return { airports: a.airports, runways: r.runways, metadata: { airports: a.metadata, runways: r.metadata }, held: r.held || [] };
}
export async function loadAirportFeatures(signal) {
  const data = await jsonFile('airports-features.json', signal);
  if (!data.airports || !data.metadata) throw new Error('공항 시설 도형 데이터 형식이 올바르지 않습니다.');
  return data;
}
function validEnd(e) {
  return e && finite(e.lat) && finite(e.lon) && Math.abs(e.lat) <= 90 && Math.abs(e.lon) <= 180;
}
function bearing(a, b) {
  const p = radians(a.lat), q = radians(b.lat), d = radians(b.lon - a.lon);
  return (degrees(Math.atan2(Math.sin(d) * Math.cos(q), Math.cos(p) * Math.sin(q) - Math.sin(p) * Math.cos(q) * Math.cos(d))) + 360) % 360;
}
function separation(a, b) {
  const p = radians(a.lat), q = radians(b.lat), d = radians(b.lon - a.lon);
  const h = Math.sin((q - p) / 2) ** 2 + Math.cos(p) * Math.cos(q) * Math.sin(d / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(Math.max(0, Math.min(1, h))));
}
function along(a, heading, metres) {
  const p = radians(a.lat), l = radians(a.lon), h = radians(heading), d = metres / R;
  const lat = Math.asin(Math.sin(p) * Math.cos(d) + Math.cos(p) * Math.sin(d) * Math.cos(h));
  const lon = l + Math.atan2(Math.sin(h) * Math.sin(d) * Math.cos(p), Math.cos(d) - Math.sin(p) * Math.sin(lat));
  return { lat: degrees(lat), lon: ((degrees(lon) + 540) % 360) - 180 };
}
function point(end, airport) {
  const sourceElevationM = finite(end?.elevationM) ? end.elevationM : null;
  const fallback = sourceElevationM === null && finite(airport.elevationM);
  return { lat: finite(end?.lat) ? end.lat : null, lon: finite(end?.lon) ? end.lon : null,
    elevationM: sourceElevationM ?? (fallback ? airport.elevationM : null), sourceElevationM,
    elevationSource: sourceElevationM !== null ? 'runway_endpoint' : fallback ? 'airport_elevation_fallback_not_endpoint_measurement' : 'missing' };
}

/** Both runway directions, including held/closed entries with explicit flags.
 * Consumers MUST filter canVisualize && !closed before choosing a demo runway.
 * start/end = physical surface ends. threshold=null must be displayed as unverified;
 * using start for a visual demo is not a confirmed landing-threshold placement.
 * lengthM includes any source overruns/displaced sections; it is NOT declared LDA/TORA.
 */
export function getRunwayEnds(airport, runways) {
  if (!airport || typeof airport.icao !== 'string') throw new TypeError('ICAO 공항 객체가 필요합니다.');
  const map = runways?.runways || runways;
  const list = Array.isArray(map) ? map : map?.[airport.icao] || [];
  if (!Array.isArray(list)) throw new TypeError('공항별 활주로 배열이 필요합니다.');
  return list.flatMap(runway => ['le', 'he'].map(side => {
    const original = runway.ends?.[side], other = runway.ends?.[side === 'le' ? 'he' : 'le'];
    const start = point(original, airport), end = point(other, airport);
    const coordinatesOK = validEnd(original) && validEnd(other);
    const distance = coordinatesOK ? separation(start, end) : null;
    const heading = coordinatesOK && distance > 1 ? bearing(start, end) : null;
    const canVisualize = coordinatesOK && distance > 1 && finite(runway.widthM) && runway.widthM > 0 && finite(runway.lengthM) && runway.lengthM > 0 && Boolean(runway.surface);
    const displaced = finite(original?.displacedThresholdM) ? original.displacedThresholdM : null;
    let threshold = null, thresholdStatus = displaced === null ? 'DISPLACEMENT_MISSING_PHYSICAL_END_ONLY' : 'HOLD_INVALID_THRESHOLD';
    if (coordinatesOK && heading !== null && displaced !== null && displaced >= 0 && displaced < distance) {
      const pos = displaced === 0 ? { lat: start.lat, lon: start.lon } : along(start, heading, displaced);
      const haveSourceElevations = finite(original.elevationM) && finite(other.elevationM);
      const elevationM = haveSourceElevations ? original.elevationM + (other.elevationM - original.elevationM) * displaced / distance : finite(airport.elevationM) ? airport.elevationM : null;
      threshold = { ...pos, elevationM, elevationSource: haveSourceElevations ? (displaced === 0 ? 'runway_endpoint' : 'linear_endpoint_elevation_interpolation') : finite(airport.elevationM) ? 'airport_elevation_fallback_not_threshold_measurement' : 'missing',
        coordinateSource: displaced === 0 ? 'explicit_zero_displacement_physical_end' : 'derived_geodesic_offset_from_source_displacement' };
      thresholdStatus = displaced === 0 ? 'EXPLICIT_ZERO_DISPLACEMENT' : 'DERIVED_FROM_SOURCE_DISPLACEMENT';
    }
    return { id: `${airport.icao}:${runway.id}:${original?.ident || side}`, airport: airport.icao, runwayId: runway.id,
      ident: original?.ident || null, reciprocalIdent: other?.ident || null, direction: side,
      start, end, threshold, thresholdStatus,
      lengthM: runway.lengthM, widthM: runway.widthM, surface: runway.surface,
      elevationM: start.elevationM, elevationSource: start.elevationSource,
      headingTrueDeg: finite(original?.headingTrueDeg) ? original.headingTrueDeg % 360 : null,
      geometricHeadingTrueDeg: heading, endpointDistanceM: distance, displacedThresholdM: displaced,
      closed: runway.closed, lighted: runway.lighted, canVisualize,
      status: !canVisualize ? 'HOLD_MISSING_GEOMETRY' : runway.closed === true ? 'CLOSED' : runway.closed == null ? 'CLOSURE_STATUS_UNVERIFIED' : 'SOURCE_GEOMETRY_AVAILABLE',
      source: 'OurAirports', sourceUrl: airport.sourceUrl, warnings: [...(runway.warnings || [])],
      limitations: ['Source full surface length is not a declared takeoff/landing distance.', ...(threshold === null ? ['Landing threshold unverified; physical-end-based demo must be labelled approximate.'] : []),
        ...(start.elevationSource.includes('fallback') || end.elevationSource.includes('fallback') ? ['Missing endpoint elevation uses published airport elevation only for visualization.'] : [])] };
  }));
}
