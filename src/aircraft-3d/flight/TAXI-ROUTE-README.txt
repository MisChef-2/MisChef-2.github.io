TAXI ROUTE — ADVISORY SOURCE GRAPH

import {buildTaxiGraph,findTaxiRoute,shortestTaxiPath} from './taxi-route.js';
const graph = buildTaxiGraph({airport, features: groundData.airports[icao],
  runways, snapToleranceM:5, standAccessToleranceM:10});
const departure = findTaxiRoute(graph,{runway,mode:'departure',standId});
const arrival = findTaxiRoute(graph,{runway,mode:'arrival',
  minimumAlongM:actualStopAlongM,baseStop:actualLandingStop});

runway is a getRunwayEnds normalized direction or its id/ident string.
runways accepts raw map/wrapper or normalized direction array. Selected closed
or geometrically unavailable runway is held. startPoint/baseStop and
minAlongM/minimumAlongM and maxAlongM/maximumAlongM are aliases. Successful status='READY', advisoryOnly=true;
otherwise status='HOLD', heldReasons[] and empty points/coordinates.

Results: points===coordinates [{lat,lon}], gateLabel, sourceStand/gate containing
OSM source feature/id, distanceM, runwayAccess {alongM,point,projectedCenter},
departureStartOffsetM and holdIndex. Graph public stands {id,ref,label,source,passengerGate,
node?,hold?} allows connected stand selection. Identifiers may be OSM IDs when
no actual stand ref is available; those must not be displayed as gate numbers.

GEOMETRY RULES
- Sources are real taxiway/taxilane LineStrings and mapped parking lead-in ways.
- True segment crossings are split. Collinear overlaps and endpoint-to-segment
  near joins are split; maximum vertex snap5m, reported in graph.metadata.
- Different mapped layers/bridge/tunnel states do not join. Unspecified layers
  default to ground-level and cannot establish missing grade-separation data.
- Parking position POINTS represent aircraft stands. Terminal GATE points do
  not. Stand-point access requires actual mapped line within at most10m; this
  small source-coordinate-tolerance link is explicitly approximate.
- A parking_position WAY is usable only when its first endpoint connects to
  actual taxiway/taxilane and its final endpoint is isolated from taxiway lines AND all other mapped parking lead-in segments.
  Both-end or disconnected/contradictory cases are held. Mapping convention:
  https://wiki.openstreetmap.org/wiki/Tag:aeroway%3Dparking_position
  An initial reverse traversal of accepted directional parking lead-in edges
  may supply geometry-qualified pushback metadata; tug operation remains unverified.
- Every runway physical interior is removed from the taxi graph, including
  unselected runway crossings. Terminal/building polygon crossings are blocked.
- Departure chooses reachable access before min(1500, min(.65*length,2200)-600)m;
  the caller may reduce maximumAlongM for its performance model. It joins
  selected runway centreline and advances100m, never backtracks to an old
  fixed takeoff-start. Use returned departureStartOffsetM in the trajectory.
- Arrival only chooses accesses at/after minimumAlongM. Optional actual stop
  must lie on the runway, before the chosen exit; centreline continuation is
  allowed, backwards rollout is not. All added centreline joins are checked
  against other runways/buildings and labelled approximate pavement joins.
- holdIndex is an illustrative stop at graph/runway boundary, NOT a surveyed
  holding-position marking or clearance point.

LIMITS
This is NOT approved taxi guidance or ATC clearance. One-way/clearance,
current closures, wingspan/gear restrictions, jet blast and traffic are not
verified. A shortest geometric route does not establish operational suitability.
Taxi centreline geometry does not guarantee wingtip clearance. Incomplete
source networks return HOLD; no long grass/building shortcuts are fabricated.
Coordinates use a local WGS84 equirectangular projection for airport-scale
intersection computations. OSM attribution/license must remain visible:
© OpenStreetMap contributors, https://www.openstreetmap.org/copyright,
ODbL-1.0. OurAirports runway data is public domain; operational currency is not
asserted. No source geometry modified by this pure routing module.

TESTS
work/test-taxi-route.mjs covers shortest path, disconnected graph, protected
runway crossing, collinear splitting, actual stand-way direction, arrival
forward-only exits and departure offset. work/test-taxi-real.mjs runs initial
RKSI/RJAA/RKPC source datasets; results work/taxi-route-real-test.json. Statuses
reflect current source availability and must be rerun if data changes.

AUTO STAND PREFERENCE
When no standId is selected, reachable aircraft stands with an identical
nonempty ref to a mapped passenger gate within150m get preference. The gate
point is never used as the aircraft position. sourceStand.passengerGate
records this association and distance; sourceStand.ref is original ref or null.
If no such stand is reachable without a forbidden runway crossing, a reachable
remote stand may be returned, explicitly under its actual source identifier.
Unknown ref is labelled '번호 미확인 주기 위치' plus original OSM way/node ID.
The default departure bound leaves at least500m between the returned lineup
anchor and min(.65*runwayLength,2200)m illustrative lift station; aircraft
performance is not certified. The caller must still validate its trajectory.

LEAD-LINE REVERSE SEGMENT
verifiedPushback=true means ONLY that the initial departure graph path follows
accepted directional parking_position way edges in reverse, continuously for
more than5m and at most150m. pushbackDistanceM is that actual graph length,
sourceLeadLineIds identifies the source ways. A first taxiway or tolerance-link
edge, mixed/ambiguous duplicate edge, forward-direction edge or longer prefix
does not qualify. Route coordinates are unchanged. This is NOT confirmation
of an operational pushback procedure, tug assignment or clearance.
