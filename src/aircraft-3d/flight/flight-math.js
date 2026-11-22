/** Visual flight approximation, not certified navigation or flight dynamics.
 * Coordinates: degrees. elapsed/total are simulation seconds.
 * Animation time is compressed: displayed knots do not equal route km / real time.
 */
const RAD = Math.PI / 180;
const EARTH_KM = 6371.0088;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const wrap = (v, period) => ((v % period) + period) % period;
const smooth = t => t * t * (3 - 2 * t);
function coordinate(p) {
  if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon) || Math.abs(p.lat) > 90)
    throw new RangeError('Expected finite lat/lon in degrees, latitude within [-90,90].');
  return p;
}

export function haversine(a, b) {
  coordinate(a); coordinate(b);
  const lat1 = a.lat * RAD, lat2 = b.lat * RAD;
  const x = Math.sin((lat2 - lat1) / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin((b.lon - a.lon) * RAD / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(clamp(x, 0, 1)));
}

export function routeDistance(points) {
  if (!Array.isArray(points)) throw new TypeError('Route must be an array.');
  points.forEach(coordinate);
  return points.slice(1).reduce((sum, p, i) => sum + haversine(points[i], p), 0);
}

const vector = p => [Math.cos(p.lat * RAD) * Math.cos(p.lon * RAD),
  Math.cos(p.lat * RAD) * Math.sin(p.lon * RAD), Math.sin(p.lat * RAD)];
const dot = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);
const normalize = v => { const n = Math.hypot(...v); return v.map(x => x / n); };

/** Great-circle interpolation; heading is degrees clockwise from true north.
 * Duplicate waypoints are skipped. Exact antipodes use a deterministic great circle.
 * At route joins heading follows the outgoing leg (no artificial corner rounding).
 */
export function interpolateRoute(points, fraction) {
  const distance = routeDistance(points);
  if (!points.length) throw new RangeError('A route needs at least one point.');
  if (!Number.isFinite(fraction)) throw new RangeError('Route fraction must be finite.');
  const f = clamp(fraction, 0, 1);
  if (distance < 1e-8) return { lat: points[0].lat, lon: wrap(points[0].lon + 180, 360) - 180, heading: 0 };
  let remaining = f * distance, a, b, t;
  for (let i = 1; i < points.length; i++) {
    const d = haversine(points[i - 1], points[i]);
    if (d < 1e-8) continue;
    a = points[i - 1]; b = points[i]; t = clamp(remaining / d, 0, 1);
    if (remaining < d || i === points.length - 1) break;
    remaining -= d;
  }
  const u = vector(a), v = vector(b), cosine = clamp(dot(u, v), -1, 1);
  const angle = Math.acos(cosine);
  let tangent = v.map((x, i) => x - cosine * u[i]);
  if (Math.hypot(...tangent) < 1e-10) {
    const axis = Math.abs(u[2]) < 0.8 ? [0, 0, 1] : [1, 0, 0];
    tangent = axis.map((x, i) => x - dot(axis, u) * u[i]);
  }
  tangent = normalize(tangent);
  const q = u.map((x, i) => x * Math.cos(angle * t) + tangent[i] * Math.sin(angle * t));
  const direction = u.map((x, i) => -x * Math.sin(angle * t) + tangent[i] * Math.cos(angle * t));
  const lat = Math.atan2(q[2], Math.hypot(q[0], q[1])), lon = Math.atan2(q[1], q[0]);
  const east = [-Math.sin(lon), Math.cos(lon), 0];
  const north = [-Math.sin(lat) * Math.cos(lon), -Math.sin(lat) * Math.sin(lon), Math.cos(lat)];
  return { lat: lat / RAD, lon: lon / RAD, heading: wrap(Math.atan2(dot(direction, east), dot(direction, north)) / RAD, 360) };
}

/** Geometric solar center; no atmospheric refraction or terrain correction.
 * Low-order astronomical approximation, suitable for lighting rather than ephemerides.
 * altitude and azimuth are radians; azimuth runs clockwise from north.
 */
export function solarPosition(timeMs, lat, lon) {
  coordinate({ lat, lon });
  if (!Number.isFinite(timeMs)) throw new RangeError('Expected a finite Unix timestamp in milliseconds.');
  const d = timeMs / 86400000 + 2440587.5 - 2451545;
  const g = wrap(357.529 + 0.98560028 * d, 360) * RAD;
  const longitude = (wrap(280.459 + 0.98564736 * d, 360) + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * RAD;
  const obliquity = (23.439 - 0.00000036 * d) * RAD;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude));
  const hourAngle = wrap((280.46061837 + 360.98564736629 * d + lon) * RAD - rightAscension + Math.PI, 2 * Math.PI) - Math.PI;
  const phi = lat * RAD;
  const altitude = Math.asin(clamp(Math.sin(phi) * Math.sin(declination)
    + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle), -1, 1));
  const azimuth = wrap(Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi)
    - Math.tan(declination) * Math.cos(phi)) + Math.PI, 2 * Math.PI);
  return { altitude, azimuth };
}

function sample(keys, t) {
  for (let i = 1; i < keys.length; i++) {
    const [a, x] = keys[i - 1], [b, y] = keys[i];
    if (t <= b) return x + (y - x) * smooth(clamp((t - a) / (b - a), 0, 1));
  }
  return keys.at(-1)[1];
}
function integral(keys, t) {
  let result = 0;
  for (let i = 1; i < keys.length; i++) {
    const [a, x] = keys[i - 1], [b, y] = keys[i];
    const u = clamp((t - a) / (b - a), 0, 1);
    result += (b - a) * (x * u + (y - x) * (u ** 3 - u ** 4 / 2));
  }
  return result;
}

/** Simulation-second phase boundaries. Final stop is a zero-duration terminal stage.
 * Short flights use proportional caps, so every airborne phase still has time.
 */
export function flightTimings(total) {
  if (!Number.isFinite(total)) throw new RangeError('Flight duration must be finite seconds.');
  total = Math.max(0, total);
  const ground = Math.min(90, total * .06);
  const takeoff = Math.min(60, total * .04);
  const climb = Math.min(900, total * .22);
  const descent = Math.min(1200, total * .22);
  const approach = Math.min(180, total * .08);
  const landing = Math.min(60, total * .035);
  const cruise = Math.max(0, total - ground - takeoff - climb - descent - approach - landing);
  const durations = [ground, takeoff, climb, cruise, descent, approach, landing, 0];
  const phases = ['지상 활주', '이륙', '상승', '순항', '하강', '착륙 접근·플레어', '착륙 활주', '정지'];
  let start = 0;
  const stages = durations.map((duration, i) => {
    const end = i >= 6 ? total : start + duration;
    const stage = { phase: phases[i], start, end };
    start = end;
    return stage;
  });
  return { stages };
}

/** Smooth cinematic flight envelope. Route progress integrates the speed curve.
 * Short routes use lower cruise altitude/speed; runway/aircraft performance is not simulated.
 */
export function flightState(elapsed, total, distanceKm) {
  if (![elapsed, total, distanceKm].every(Number.isFinite) || distanceKm < 0)
    throw new RangeError('Flight times and nonnegative distance must be finite.');
  if (distanceKm === 0 || total <= 0 || elapsed >= total)
    return { progress: distanceKm === 0 ? 0 : 1, altitude: 0, speed: 0, pitch: 0, phase: '정지', phaseProgress: 1 };
  const t = clamp(elapsed, 0, total);
  const { stages } = flightTimings(total);
  const [ground, takeoff, climb, cruisePhase, descent, approach] = stages;
  const g = ground.end, r = takeoff.end, c = climb.end, d = cruisePhase.end, a = descent.end, l = approach.end;
  const ceiling = clamp(35 * distanceKm ** 0.85, 60, 11000);
  const cruise = 150 + 310 * (1 - Math.exp(-distanceKm / 350));
  const rotation = Math.min(145, cruise * 0.78);
  const speeds = [[0, 0], [g, rotation], [r, rotation + 12], [c, cruise], [d, cruise], [a, rotation], [l, rotation * .86], [total, 0]];
  const flare = a + (l - a) * .8;
  const altitude = ceiling * sample([[0, 0], [g, 0], [r, .065], [c, 1], [d, 1], [a, .035], [flare, .0015], [l, 0], [total, 0]], t);
  const pitch = sample([[0, 0], [g * .7, 0], [g, 7], [r, 12], [c, 0], [d, 0], [d + (a - d) * .5, -3], [a, -3], [flare, 3], [l, 0], [total, 0]], t);
  const stage = stages.find(s => t < s.end);
  return { progress: clamp(integral(speeds, t) / integral(speeds, total), 0, 1), altitude, speed: sample(speeds, t), pitch,
    phase: stage.phase, phaseProgress: clamp((t - stage.start) / (stage.end - stage.start), 0, 1) };
}
