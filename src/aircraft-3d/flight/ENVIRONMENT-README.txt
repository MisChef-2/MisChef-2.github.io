ENVIRONMENT MODULE — INTEGRATION

const environment = createEnvironment(THREE, scene);
const result = environment.update({time, elapsed, lat, lon, heading, altitude,
  groundElevation, daylight, weather, phase, speed});
environment.dispose();

Inputs: time=UTC epoch milliseconds, Date or ISO timestamp; elapsed=simulation
seconds; lat/lon/heading=degrees; altitude=metres MSL INCLUDING eye height;
groundElevation=metres MSL; daylight=0..1; speed=KNOTS as flightState.speed.
weather follows weather.js: cloud=0..1, rain=TOTAL precipitation mm/preceding
hour, wind=m/s, windDirection=meteorological FROM degrees, temp=2m Celsius.
phase is accepted for caller compatibility, not interpreted as meteorology.
Return: {weatherLabel,starCount,precipitationType,precipitationVisible,
approximate:true}. starCount is visible-strength count above horizon, not a
catalogue count or count inside the user's current field of view.

STARS
Original seeded 1800-point fictional star distribution; NOT true constellations,
real named stars, catalogue magnitudes, planets or astronomical sky imagery.
Their Earth-rotation transform uses approximate Greenwich mean sidereal time
and observer longitude/latitude, followed by local aircraft-heading rotation.
USNO formula reference, consulted 2026-11-22:
https://aa.usno.navy.mil/faq/GAST
UTC substitutes for UT1/TT; no nutation, precession or refraction modelling.
Stars fade below/near horizon, in daylight, total cloud cover and precipitation.
Cloud attenuation is globally approximate because no 3D weather volume exists.
Soft point sprites vary brightness and diameter. No fictitious moon phase or
unverified lightning is added. Existing caller sky/sun rendering is untouched.

PRECIPITATION
Total precipitation and surface temperature choose a visual rain/snow blend:
<=0C snow-style; >=2C rain-style; intervening mix; missing temperature gets
unclassified streaks. THIS DOES NOT DETERMINE ACTUAL PRECIPITATION TYPE.
Vertical temperature profiles are required to distinguish snow, sleet and
freezing rain: https://www.weather.gov/arx/why_wintrymix
No atmospheric lapse rate or freezing-rain diagnosis is inferred.
Particles only occupy X=12..140m ahead of the observer, outside the cockpit,
with depth testing and edge fades. Snow and rain advect with supplied surface
wind transformed into aircraft coordinates minus forward speed. The wind at
altitude is NOT known; the supplied 10m wind is only a visual approximation.
Ground-level clipping and an illustrative AGL fade from2500 to4500m prevent
unlimited precipitation at cruise. This is NOT a measured cloud ceiling.
No windshield droplets, wiper interaction, particle/cabin collision simulation,
physical drop sizes/photometry or ground-wet material changes are implemented.
Caller may adjust ground wetness separately. Large timeline jumps/fast playback
cap local particle integration at1second per update for stable visual motion.

Performance: 1800 stars +600 streaks +600 snow points; at most3 draw calls.
No external textures/assets/network fetches. Log-depth/tone mapping supported.
Tests: actual Three.js buffers, J2000 GMST, sidereal daily advance, zenith
transform, day/overcast suppression, precipitation type missing-data handling,
cruise fade, finite coordinates, all particles X>=12m and disposal events.
Actual WebGL shader/render integration remains a separate browser check.
