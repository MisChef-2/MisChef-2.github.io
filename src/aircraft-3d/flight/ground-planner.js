import {buildTaxiGraph,findTaxiRoute} from './taxi-route.js';
import {buildGroundnetGraph} from './groundnet-graph.js';
import {haversine} from './flight-math.js';
import {createTrajectory} from './trajectory.js';
import {getRunwayEnds} from './airports.js';
const cache=new Map();
export function groundGraph(airport,data,runways){const record=data?.airports?.[airport?.icao];if(!record?.features?.some(f=>(f.properties?.aeroway||f.properties?.kind)==='parking_position'))return null;const key=record;if(!cache.has(key))cache.set(key,record.groundnet?buildGroundnetGraph({airport,record,runways:getRunwayEnds(airport,runways)}):buildTaxiGraph({airport,features:record.features,runways:getRunwayEnds(airport,runways),snapToleranceM:5,standAccessToleranceM:10}));return cache.get(key);}
export function planGateJourney({from,to,departure,arrival,via=[],departureStand,arrivalStand,data,runways}){
 for(const airport of [from,to])if(data?.airports?.[airport.icao]?.status==='OFFICIAL_REFERENCE_POINTS_ONLY')throw Error(`${airport.iata}: 도면의 주기 위치만 확보되어 있습니다. 유도로 연결 자료가 없어 자동 이동을 보류합니다. 활주로 모드를 사용할 수 있습니다.`);
 const a=groundGraph(from,data,runways),b=groundGraph(to,data,runways);if(!a||!b)throw Error(`${!a?from.iata:to.iata}: 게이트·유도로 원자료가 아직 없습니다. 다른 공항 또는 활주로 모드를 선택해 주세요.`);
 const dep=findTaxiRoute(a,{runway:departure,mode:'departure',standId:departureStand||undefined});if(dep.status!=='READY')throw Error(`${from.iata} ${departure.ident}: 연결 가능한 출발 주기장 경로를 찾지 못했습니다. 다른 활주로나 주기장을 선택해 주세요. (${(dep.heldReasons||[]).join(', ')})`);
 const base=createTrajectory(departure,arrival,via,{departureStartOffsetM:dep.departureStartOffsetM});
 const arr=findTaxiRoute(b,{runway:arrival,mode:'arrival',standId:arrivalStand||undefined,startPoint:base.anchors.stop,minimumAlongM:haversine(arrival.start,base.anchors.stop)*1000+2});if(arr.status!=='READY')throw Error(`${to.iata} ${arrival.ident}: 착륙 정지 위치 이후의 출구와 주기장이 연결되지 않습니다. 다른 활주로나 주기장을 선택해 주세요. (${(arr.heldReasons||[]).join(', ')})`);
 dep.elevationM=from.elevationM;arr.elevationM=to.elevationM;return {departure:dep,arrival:arr};
}
