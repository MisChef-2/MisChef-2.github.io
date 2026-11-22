import fs from 'node:fs';import assert from 'node:assert/strict';
import {buildGroundnetGraph} from '../../outputs/flight-mode/groundnet-graph.js';
import {findTaxiRoute,shortestTaxiPath} from '../../outputs/flight-mode/taxi-route.js';
import {getRunwayEnds} from '../../outputs/flight-mode/airports.js';
import {createTrajectory} from '../../outputs/flight-mode/trajectory.js';
import {createGroundJourney} from '../../outputs/flight-mode/ground-journey.js';
import {haversine} from '../../outputs/flight-mode/flight-math.js';
const root='outputs/flight-mode/',read=f=>JSON.parse(fs.readFileSync(root+f));
const airports=read('airports-v2.json').airports,runways=read('runways.json').runways,index=read('ground-reference-index.json'),report=[];
const graph={nodes:[{edges:[0]},{edges:[0,1]},{edges:[1]}],edges:[{a:0,b:1,directed:true,length:5},{a:1,b:2,directed:true,length:5}]};
assert(shortestTaxiPath(graph,0,2));assert.equal(shortestTaxiPath(graph,2,0),null);
for(const a of airports){const info=index.airports[a.icao];if(!info)continue;
 if(!info.asset){report.push({icao:a.icao,iata:a.iata,status:info.status,departures:[],arrivals:[]});continue;}
 const record=read(info.asset),ends=getRunwayEnds(a,runways).filter(r=>r.canVisualize&&!r.closed&&r.lengthM>900),g=buildGroundnetGraph({airport:a,record,runways:ends});
 const departures=[],arrivals=[],held=[];
 for(const r of ends){
  const d=findTaxiRoute(g,{runway:r,mode:'departure'});
  if(d.status==='READY'){d.elevationM=a.elevationM;const j=createGroundJourney(r,r,[],{departureTaxi:d});assert(j.groundJourney.departureTaxi,a.icao+' rejected departure wrapper');departures.push({runway:r.ident,stand:d.gateLabel,distanceM:Math.round(d.distanceM)});}else held.push({mode:'departure',runway:r.ident,reasons:d.heldReasons});
  const base=createTrajectory(r,r,[]);const ar=findTaxiRoute(g,{runway:r,mode:'arrival',startPoint:base.anchors.stop,minimumAlongM:haversine(r.start,base.anchors.stop)*1000+2});
  if(ar.status==='READY'){ar.elevationM=a.elevationM;const j=createGroundJourney(r,r,[],{arrivalTaxi:ar});assert(j.groundJourney.arrivalTaxi,a.icao+' rejected arrival wrapper');arrivals.push({runway:r.ident,stand:ar.gateLabel,distanceM:Math.round(ar.distanceM)});}else held.push({mode:'arrival',runway:r.ident,reasons:ar.heldReasons});
 }
 const status=departures.length&&arrivals.length?'REFERENCE_ROUTES_VERIFIED':'HOLD_NO_COMPLETE_REFERENCE_ROUTE';
 info.routeValidation={status,departureRunways:departures.map(r=>r.runway),arrivalRunways:arrivals.map(r=>r.runway),connectedStands:g.stands.filter(s=>s.node!==undefined).length};
 const row={icao:a.icao,iata:a.iata,status,standCount:g.stands.length,connectedStands:info.routeValidation.connectedStands,departures,arrivals,held};report.push(row);
 console.log(a.icao,status,departures.length,arrivals.length);
}
fs.writeFileSync(root+'ground-reference-index.json',JSON.stringify(index));
fs.writeFileSync(root+'ground-reference-coverage.json',JSON.stringify({checkedAt:new Date().toISOString(),airportCount:report.length,usableReferenceAirports:report.filter(r=>r.status==='REFERENCE_ROUTES_VERIFIED').length,airports:report},null,2));
console.log('PASS directed routing, actual reference routes and journey acceptance');
