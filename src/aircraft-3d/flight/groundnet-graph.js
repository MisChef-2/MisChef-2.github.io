/** FlightGear source-node graph; geometry is community simulator scenery, not an AIP.
 * Keep source node IDs and directed arcs. No inferred junctions or stand connectors.
 */
import {buildTaxiGraph} from './taxi-route.js';
const EPS=1e-8,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
function nearest(p,a,b){const v=sub(b,a),d=v[0]**2+v[1]**2,t=d?Math.max(0,Math.min(1,((p[0]-a[0])*v[0]+(p[1]-a[1])*v[1])/d)):0;return dist(p,mix(a,b,t));}
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(nearest(p,a,b)<.001)return false;if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
function intersection(a,b,c,d){const r=sub(b,a),s=sub(d,c),den=cross(r,s);if(Math.abs(den)<EPS)return null;const ca=sub(c,a),t=cross(ca,s)/den,u=cross(ca,r)/den;return t>=-EPS&&t<=1+EPS&&u>=-EPS&&u<=1+EPS?Math.max(0,Math.min(1,t)):null;}
function cutsFor(a,b,rings){const cuts=[0,1];for(const ring of rings)for(let i=0;i<ring.length;i++){const t=intersection(a,b,ring[i],ring[(i+1)%ring.length]);if(t!==null)cuts.push(t);}return [...new Set(cuts.map(t=>Math.round(t*1e12)/1e12))].sort((a,b)=>a-b);}
function crossesInterior(a,b,rings){for(const ring of rings){const cuts=cutsFor(a,b,[ring]);for(let i=1;i<cuts.length;i++)if(inside(mix(a,b,(cuts[i-1]+cuts[i])/2),ring))return true;}return false;}
export function buildGroundnetGraph({airport,record,runways}={}){
 const context=(record?.features||[]).filter(f=>f.geometry?.type==='Polygon'&&(f.properties?.kind==='terminal'||f.properties?.aeroway==='terminal'||f.properties?.building));
 const base=buildTaxiGraph({airport,features:context,runways,snapToleranceM:0,standAccessToleranceM:0});
 const nodes=[],edges=[],stands=[],ids=new Map(),boundaryNodes=new Map(),heldReasons=[],source=record?.groundnet||{};
 const valid=p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;
 for(const n of source.nodes||[]){const id=String(n.id);if(!valid(n)||ids.has(id)){heldReasons.push('INVALID_OR_DUPLICATE_SOURCE_NODE:'+id);continue;}ids.set(id,nodes.length);nodes.push({p:base.project([n.lon,n.lat]),edges:[],sourceId:id,source:n});}
 function nodeAt(begin,end,t){if(t<=EPS)return begin;if(t>=1-EPS)return end;const p=mix(nodes[begin].p,nodes[end].p,t),pair=[nodes[begin].sourceId,nodes[end].sourceId].sort().join('|'),key=pair+'@'+p.map(x=>x.toFixed(6)).join(',');if(boundaryNodes.has(key))return boundaryNodes.get(key);const id=nodes.length;nodes.push({p,edges:[],sourceArcEndpoints:[nodes[begin].sourceId,nodes[end].sourceId],boundarySplit:true});boundaryNodes.set(key,id);return id;}
 let invalidArcs=0,buildingArcs=0,removedRunwaySegments=0;
 for(const [i,arc]of(source.arcs||[]).entries()){
  const begin=ids.get(String(arc.begin)),end=ids.get(String(arc.end));if(begin===undefined||end===undefined||begin===end){invalidArcs++;continue;}
  const a=nodes[begin].p,b=nodes[end].p;if(dist(a,b)<.001)continue;
  if(crossesInterior(a,b,base.buildings)){buildingArcs++;continue;}
  const rings=base.runwayAreas.map(r=>r.ring),cuts=cutsFor(a,b,rings);
  for(let k=1;k<cuts.length;k++){const from=cuts[k-1],to=cuts[k];if(to-from<EPS)continue;if(rings.some(r=>inside(mix(a,b,(from+to)/2),r))){removedRunwaySegments++;continue;}
   const u=nodeAt(begin,end,from),v=nodeAt(begin,end,to),length=dist(nodes[u].p,nodes[v].p);if(length<.001)continue;
   const id=edges.length;edges.push({a:u,b:v,length,sourceId:`groundnet:${airport.icao}:arc:${i}`,kind:'taxiway',directed:true,isPushBackRoute:arc.isPushBackRoute===true||arc.isPushBackRoute==='1'||arc.isPushBackRoute===1,sourceArc:arc});nodes[u].edges.push(id);nodes[v].edges.push(id);
  }
 }
 for(const [id,index]of ids){const n=nodes[index].source;if(!n.parking)continue;const type=String(n.type||'').toLowerCase();if(!['gate','cargo'].includes(type))continue;
  const feature=(record?.features||[]).find(f=>(f.properties?.groundnetId===id||f.properties?.sourceNodeId===id)&&f.geometry?.type==='Point')||{type:'Feature',id:`groundnet:${airport.icao}:parking:${id}`,properties:{aeroway:'parking_position',ref:n.name||null,sourceType:'FLIGHTGEAR_SIMULATION_GROUNDNET',heading:n.heading,radius:n.radius},geometry:{type:'Point',coordinates:[n.lon,n.lat]}};
  const stand={id:`groundnet:${airport.icao}:parking:${id}`,label:n.name||`번호 미확인 주기 위치 · ${id}`,ref:n.name||null,p:nodes[index].p,source:feature,connectionGapM:0,passengerGate:null,standDefinition:'FlightGear source parking node with explicit directed taxi arcs; simulator scenery, not surveyed AIP',sourceNodeId:id,heading:n.heading,radius:n.radius,type,pushBackRoute:n.pushBackRoute};
  if(nodes[index].edges.length)stand.node=index;else stand.hold='SOURCE_PARKING_HAS_NO_VALID_CONNECTED_ARC';stands.push(stand);
 }
 if(!stands.length)heldReasons.push('NO_SOURCE_GATE_OR_CARGO_PARKING');if(!edges.length)heldReasons.push('NO_VALID_EXPLICIT_TAXI_ARCS');
 if(invalidArcs)heldReasons.push(`INVALID_SOURCE_ARCS:${invalidArcs}`);if(buildingArcs)heldReasons.push(`SOURCE_ARCS_BLOCKED_BY_BUILDINGS:${buildingArcs}`);
 return {...base,nodes,edges,stands,heldReasons,metadata:{...base.metadata,sourceType:'FLIGHTGEAR_SIMULATION_GROUNDNET',sourceLineCount:(source.arcs||[]).length,sourceNodeCount:ids.size,directed:true,explicitTopologyOnly:true,syntheticStandConnectors:0,intersectionJunctionsInferred:0,removedRunwaySegments,buildingArcs,snapToleranceM:0,standAccessToleranceM:0,advisoryOnly:true}};
}
