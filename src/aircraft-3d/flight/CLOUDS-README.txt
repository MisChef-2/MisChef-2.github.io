CLOUD RENDERER — INTEGRATION AND LIMITS

import {createClouds} from './clouds.js';
const clouds = createClouds(THREE, scene, camera);
const {immersion} = clouds.update({timeSeconds, lat, lon, heading,
  altitude, cloudCover, windSpeed, windDirection, daylight});
clouds.dispose();

Units: lat/lon/heading and meteorological FROM windDirection in degrees;
altitude in metres MSL INCLUDING pilot eye height; windSpeed m/s;
cloudCover and daylight 0..1. timeSeconds is simulation elapsed seconds.
Local axes +X forward, +Z right, +Y up. Camera is optional; supplying it
supports camera translation while GPU billboards follow viewing rotation.

Three instanced draw calls, at most 676 planes per layer (2028 total).
Canvas textures: seeded five-octave value noise, soft silhouettes,
underside shading and high-level wisps. No external assets or downloads.
Depth testing retains cockpit occlusion; clouds do not write depth.
Logarithmic depth and renderer tone mapping/color conversion supported.
World-fixed Mercator cells have periodic longitude seeds (date line
continuous) and distance edge fading. Forward simulation integrates wind,
so changing wind does not teleport the entire cloud field. Backward seeks
restart approximate wind displacement; these are not historical wind data.

Low/middle/high centres 1500 / 4800 / 9800 metres are ILLUSTRATIVE, not
measured cloud bases, ceiling, cloud type classification or aviation weather.
Single total cloud-cover input cannot determine separate vertical layers.
Returned immersion (0..1) is an approximate visibility blend; caller may
use it to increase fog, but this module does not overwrite scene fog.
Billboard depth shading is not volumetric scattering; sheets may be visible
at intersections. Sorting is per layer, not globally across cockpit glass.
Latitude is clamped to +/-80 degrees; polar rendering is approximate and
visible patch radius contracts at high latitudes. Ground clearance is not
terrain-aware: layer heights are MSL, not AGL. No thunderstorm physics,
turbulence or navigable/operational weather information is represented.

Source: original procedural visual implementation. No copied cloud photos,
no fetched meteorological cloud volume, no external reference assets.
