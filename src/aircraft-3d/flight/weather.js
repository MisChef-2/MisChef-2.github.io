/** Open-Meteo model weather, NOT station observations or aviation weather.
 * Official contracts checked 2026-11-22:
 * https://open-meteo.com/en/docs
 * https://open-meteo.com/en/docs/historical-forecast-api
 * Data attribution: Open-Meteo / originating national weather services, CC BY 4.0.
 * Surface fields must not be interpreted as wind/visibility at aircraft altitude.
 */
const HOUR = 3600000, DAY = 24 * HOUR;
const EARLIEST = Date.UTC(2022, 0, 1);
const FIELDS = ['cloud_cover', 'precipitation', 'visibility', 'wind_speed_10m',
  'wind_direction_10m', 'temperature_2m'];
const LIVE = 'https://api.open-meteo.com/v1/forecast';
const HISTORY = 'https://historical-forecast-api.open-meteo.com/v1/forecast';
const MODEL_LABEL = 'Open-Meteo 모델 기상 · 실제 관측 아님 · 지표/10m 자료';
const finite = v => typeof v === 'number' && Number.isFinite(v);
const day = t => Math.floor(t / DAY) * DAY;
const date = t => new Date(t).toISOString().slice(0, 10);

export class WeatherError extends Error {
  constructor(code, message) { super(message); this.name = 'WeatherError'; this.code = code; }
}
function coordinate(lat, lon) {
  if (!finite(lat) || !finite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
    throw new WeatherError('COORDINATE', '위도(-90..90)·경도(-180..180)를 확인하세요.');
}
function value(field, v) {
  if (!finite(v)) return null; // No coercion: null must never become zero.
  if (field === 'cloud_cover' && (v < 0 || v > 100)) return null;
  if (['precipitation', 'visibility', 'wind_speed_10m'].includes(field) && v < 0) return null;
  if (field === 'wind_direction_10m') return v >= 0 && v <= 360 ? v % 360 : null;
  return v;
}
async function request(url, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new WeatherError('HTTP', `기상 API HTTP ${response.status}: 데이터를 불러오지 못했습니다.`);
    const payload = await response.json();
    if (payload?.error) throw new WeatherError('API', `기상 API 오류: ${payload.reason || '지원되지 않는 요청'}`);
    return payload;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timedOut) throw new WeatherError('TIMEOUT', '기상 조회가 30초 안에 완료되지 않았습니다.');
    if (error instanceof WeatherError) throw error;
    throw new WeatherError('NETWORK', `기상 조회 실패: ${error.message || error}. 대체 날씨를 생성하지 않았습니다.`);
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}

/** Fetch all route points together, splitting archive/live at UTC today minus5 days.
 * Inclusive startMs/endMs. Bracketing floor/ceil hours are required for interpolation.
 * Missing variable values remain null; missing HOURS/endpoints reject the whole request.
 * fetchedAt is epoch milliseconds. samples retain requested coordinates (grid positions
 * are separately returned); arrays contain exactly the bracketing hourly interval.
 */
export async function fetchWeather(points, startMs, endMs, { signal } = {}) {
  if (!Array.isArray(points) || !points.length)
    throw new WeatherError('POINTS', '기상 조회 위치를 하나 이상 지정하세요.');
  points.forEach(p => coordinate(p?.lat, p?.lon));
  if (!finite(startMs) || !finite(endMs) || endMs < startMs)
    throw new WeatherError('TIME_RANGE', '출발·도착 UTC 시각 범위를 확인하세요.');
  const now = Date.now(), today = day(now), split = today - 5 * DAY;
  const first = Math.floor(startMs / HOUR) * HOUR;
  const last = Math.ceil(endMs / HOUR) * HOUR;
  const maximum = today + 16 * DAY - HOUR;
  if (first < EARLIEST || last > maximum)
    throw new WeatherError('DATE_RANGE', `지원 범위는 2022-01-01T00:00Z부터 ${new Date(maximum).toISOString()}까지입니다. 종료 시각의 다음 정시도 필요합니다.`);
  const segments = [];
  if (first < split) segments.push({ endpoint: HISTORY, from: first, to: Math.min(last, split - HOUR), kind: 'historical-forecast' });
  if (last >= split) segments.push({ endpoint: LIVE, from: Math.max(first, split), to: last, kind: 'forecast' });
  const samples = points.map(p => ({ lat: p.lat, lon: p.lon, hourly: { time: [], ...Object.fromEntries(FIELDS.map(k => [k, []])) }, modelGrid: [] }));
  const warnings = new Set();
  // Sequential segments avoid abandoned requests after an archive failure.
  for (const segment of segments) {
    const params = new URLSearchParams({ latitude: points.map(p => p.lat).join(','), longitude: points.map(p => p.lon).join(','),
      hourly: FIELDS.join(','), start_date: date(segment.from), end_date: date(segment.to),
      timezone: 'GMT', timeformat: 'unixtime', wind_speed_unit: 'ms', temperature_unit: 'celsius', precipitation_unit: 'mm' });
    const payload = await request(`${segment.endpoint}?${params}`, signal);
    const responses = Array.isArray(payload) ? payload : [payload];
    if (responses.length !== points.length) throw new WeatherError('RESPONSE', '요청 위치 수와 기상 응답 수가 다릅니다.');
    responses.forEach((result, pointIndex) => {
      if (result?.error) throw new WeatherError('API', result.reason || '위치별 기상 조회 실패');
      const hourly = result?.hourly, times = hourly?.time;
      if (!Array.isArray(times) || !times.length) throw new WeatherError('NO_DATA', '해당 위치·날짜의 시간별 기상 자료가 없습니다.');
      const units = result.hourly_units || {};
      const expected = { time: 'unixtime', cloud_cover: '%', precipitation: 'mm', visibility: 'm', wind_speed_10m: 'm/s', wind_direction_10m: '°', temperature_2m: '°C' };
      for (const [key, unit] of Object.entries(expected)) {
        if (units[key] != null && units[key] !== unit) throw new WeatherError('UNIT', `예상과 다른 기상 단위: ${key}=${units[key]}`);
      }
      for (const key of FIELDS) {
        if (hourly[key] != null && (!Array.isArray(hourly[key]) || hourly[key].length !== times.length))
          throw new WeatherError('RESPONSE', `${key} 기상 배열 길이가 시간 배열과 다릅니다.`);
      }
      const index = new Map();
      times.forEach((seconds, i) => {
        const t = seconds * 1000;
        if (!finite(seconds) || t % HOUR !== 0 || (i && t <= times[i - 1] * 1000))
          throw new WeatherError('TIME_GRID', '기상 응답 시간축이 올바른 UTC 시간순 정시 자료가 아닙니다.');
        index.set(t, i);
      });
      const sample = samples[pointIndex];
      sample.modelGrid.push({ endpoint: segment.endpoint, lat: result.latitude ?? null, lon: result.longitude ?? null, elevation: result.elevation ?? null });
      for (let t = segment.from; t <= segment.to; t += HOUR) {
        if (!index.has(t)) throw new WeatherError('COVERAGE', `${points[pointIndex].lat},${points[pointIndex].lon}: ${new Date(t).toISOString()} 자료가 없습니다. 날짜 전체 지원을 가정하지 않습니다.`);
        const i = index.get(t); sample.hourly.time.push(t);
        for (const key of FIELDS) {
          const v = value(key, hourly[key]?.[i]); sample.hourly[key].push(v);
          if (v === null) warnings.add(`${key}: 일부 위치·시간 자료 없음`);
        }
      }
    });
  }
  if (samples.some(s => s.hourly.time[0] !== first || s.hourly.time.at(-1) !== last || s.hourly.time.length !== (last - first) / HOUR + 1))
    throw new WeatherError('COVERAGE', '요청 최소·최대 시각 또는 중간 시간 자료가 누락됐습니다.');
  if (samples.some(s => FIELDS.every(k => s.hourly[k].every(v => v === null))))
    throw new WeatherError('NO_DATA', '조회 위치 중 하나에 사용할 수 있는 모델 기상 값이 전혀 없습니다.');
  return { samples, source: 'Open-Meteo', label: `${MODEL_LABEL} · ${segments.map(s => s.kind === 'forecast' ? '예보' : '과거 예보 아카이브').join(' + ')}`,
    fetchedAt: Date.now(), startMs, endMs, coverageStartMs: first, coverageEndMs: last,
    endpoints: segments.map(s => s.endpoint), warnings: [...warnings],
    units: { cloud: 'fraction', rain: 'mm/preceding hour (total precipitation)', visibility: 'm', wind: 'm/s at10m', windDirection: 'degrees from north, meteorological FROM', temp: '°C at2m' },
    attributionUrl: 'https://open-meteo.com/', documentationUrls: ['https://open-meteo.com/en/docs', 'https://open-meteo.com/en/docs/historical-forecast-api'] };
}

function distanceKm(a, b, c, d) {
  const r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, x))));
}
function circular(values) {
  let x = 0, y = 0, w = 0;
  for (const [angle, weight] of values) if (finite(angle)) { x += Math.cos(angle * Math.PI / 180) * weight; y += Math.sin(angle * Math.PI / 180) * weight; w += weight; }
  if (!w || Math.hypot(x, y) / w < 1e-8) return null; // Opposing directions have no defined average.
  return ((Math.atan2(y, x) * 180 / Math.PI) % 360 + 360) % 360;
}
function atTime(sample, t) {
  const h = sample.hourly, times = h?.time;
  if (!Array.isArray(times) || !times.length || t < times[0] || t > times.at(-1))
    throw new WeatherError('COVERAGE', '조회한 시간 범위를 벗어나 보간할 수 없습니다.');
  let lo = 0, hi = times.length - 1;
  while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if (times[mid] < t) lo = mid + 1; else hi = mid; }
  const right = lo, left = times[right] === t ? right : right - 1;
  if (left !== right && times[right] - times[left] !== HOUR) throw new WeatherError('TIME_GRID', '누락된 시간 구간을 건너 보간하지 않습니다.');
  const f = left === right ? 0 : (t - times[left]) / HOUR;
  return Object.fromEntries(FIELDS.map(k => {
    const a = value(k, h[k]?.[left]), b = value(k, h[k]?.[right]);
    return [k, a === null || b === null ? null : k === 'wind_direction_10m' ? circular([[a, 1 - f], [b, f]]) : a + (b - a) * f];
  }));
}

/** Linear hourly + inverse-distance interpolation of up to4 nearest requested points.
 * Exact requested point uses only that point; null does not become clear sky or calm.
 * rain is TOTAL precipitation (including snow water equivalent), not rain-only sensing.
 * These interpolated values are visualization inputs, not a new observation/forecast.
 */
export function sampleWeather(bundle, lat, lon, timeMs) {
  coordinate(lat, lon);
  if (!finite(timeMs) || !bundle?.samples?.length) throw new WeatherError('SAMPLE', '기상 자료와 UTC 시각이 필요합니다.');
  if (finite(bundle.startMs) && (timeMs < bundle.startMs || timeMs > bundle.endMs))
    throw new WeatherError('TIME_RANGE', '요청한 비행 시간 밖의 날씨는 반환하지 않습니다.');
  const nearest = bundle.samples.map(sample => ({ sample, distance: distanceKm(lat, lon, sample.lat, sample.lon) })).sort((a, b) => a.distance - b.distance);
  const chosen = nearest[0].distance < 1e-6 ? nearest.slice(0, 1) : nearest.slice(0, 4);
  const weighted = chosen.map(p => ({ ...p, weight: 1 / Math.max(0.01, p.distance) ** 2, values: atTime(p.sample, timeMs) }));
  const total = weighted.reduce((s, p) => s + p.weight, 0);
  const fields = Object.fromEntries(FIELDS.map(k => {
    // Missing a contributing endpoint/location stays unknown, rather than silently
    // replacing it with a distant location's clear-sky value.
    if (weighted.some(p => p.values[k] === null)) return [k, null];
    return [k, k === 'wind_direction_10m' ? circular(weighted.map(p => [p.values[k], p.weight / total])) : weighted.reduce((s, p) => s + p.values[k] * p.weight / total, 0)];
  }));
  const result = { cloud: fields.cloud_cover === null ? null : fields.cloud_cover / 100, rain: fields.precipitation,
    visibility: fields.visibility, wind: fields.wind_speed_10m, windDirection: fields.wind_direction_10m, temp: fields.temperature_2m };
  const missing = Object.keys(result).filter(k => result[k] === null);
  return { ...result, label: `${bundle.label || MODEL_LABEL} · 시공간 보간${missing.length ? ' · 일부 자료 없음' : ''}`,
    missing, nearestDistanceKm: nearest[0].distance, contributingPoints: chosen.length, timeMs,
    interpolation: 'hourly-linear / nearest4 inverse-distance-squared; wind direction circular',
    precipitationMeaning: '직전 1시간 총강수량(mm)의 보간값; 비·눈을 구분한 관측값 아님' };
}
