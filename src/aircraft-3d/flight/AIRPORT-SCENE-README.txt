AIRPORT SCENE MODULE

import {createAirportScene} from './airport-scene.js';
const scenery = createAirportScene(THREE, scene, {airports, runways, features});
const summary = scenery.setAirports([departureAirport, arrivalAirport]);
scenery.update({lat, lon, heading, altitude});
scenery.dispose();

Inputs: airports array from loadAirportData(), raw runway mapping or wrapper,
features from loadAirportFeatures(). setAirports accepts airport objects or
ICAO/IATA strings, deduplicates them and disposes previous scenery. Returned
summary lists runwayCount, thresholdCount, approximateBuildingCount, holds.
heading degrees true; altitude metres MSL including observer eye height.
The scene uses the same spherical east/up/south projection as terrain.js,
with heading - PI/2 rotation into +X forward / +Z right / +Y up. Airport
local tangent frames are transported when the observer moves. No camera
model or aircraft coordinates are changed. Objects >150km away are hidden.

DATA AND LIMITS
- Physical runway ends and widths: OurAirports public-domain data through
  airports.js getRunwayEnds. All canVisualize && !closed runways at the
  chosen airports are drawn once per physical runway. Unknown closure is
  not confirmation that a runway is available. Missing elevation is held;
  explicit airport-elevation fallbacks in normalized data remain approximate.
- Threshold reference lines appear ONLY where normalized threshold data
  exists. A simple transverse line is a POSITION MARKER, not a reconstruction
  of certified/photographed threshold paint patterns. Missing displacements
  never become zero-displacement thresholds automatically.
- Real runway identifiers use canvas labels; paint font, dimensions and
  label offsets are illustrative, not surveyed. No approach lights, PAPI,
  aiming points, touchdown-zone strips or airport fence/boundary are invented.
- Aprons, taxiway centrelines and terminal footprints: existing decoded
  OpenStreetMap derivative. Attribution: © OpenStreetMap contributors,
  https://www.openstreetmap.org/copyright (ODbL-1.0). Display this attribution.
- Unmeasured taxiway width is drawn as an illustrative 18m ribbon. Unmeasured
  terminal height is drawn as a simple 12m extrusion. Neither number is
  asserted to be airport-specific. No fabricated architectural details.
- OSM derivative previously simplified vertices and discarded some holes;
  this module preserves holes when supplied but cannot recover missing data.
- Feature surfaces use airport elevation without a surveyed apron DEM.
  Runway endpoint elevations are linearly joined; true camber, crossfall and
  detailed runway profiles are unavailable. Terrain clipping/airport flattening
  is the terrain caller's responsibility. Features have small render offsets
  (4.5–18cm), which are not physical construction heights.
- Material colors are generic display colors, not current satellite imagery.
  No operational navigation, availability or landing-distance claim is made.

Validation: JavaScript syntax check and actual Three.js geometry generation
for RKSI/RJTT, verified runway/threshold counts, finite vertices/transforms,
duplicate airport selection and repeated disposal. Browser visual integration
requires a separate final check with terrain and flight camera.

PAVED RUNWAY VISUAL MARKINGS
Generic 30m white centreline dashes with 30m gaps and narrow edge stripes
follow the physical endpoint slope. These display dimensions/paint locations
are illustrative rather than an airport-specific marking survey. Small opaque
emissive edge fixtures at approximate 60m intervals are included ONLY when
the runway source explicitly says lighted=true; actual lamp position, color
sequence, operational state and photometric output are unverified. No light
source is inferred from a missing/unknown lighted field.
