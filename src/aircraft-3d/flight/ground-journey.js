/** OSM-connected ground movement with an explicit on-runway fallback.
 * Source connectivity does not establish operational clearance or surveyed hold lines.
 */
import {createTrajectory,bearing} from './trajectory.js';
import {haversine,interpolateRoute} from './flight-math.js';

const clamp=x=>Math.max(0,Math.min(1,x));
const ease=u=>u*u*u*(10+u*(-15+6*u));
const derivative=u=>30*u*u*(1-u)*(1-u);
const metres=(a,b)=>haversine(a,b)*1000;
export function createGroundJourney(departure,arrival,via=[],options={}) {
  return wrapGroundJourney(createTrajectory(departure,arrival,via,{departureStartOffsetM:options.departureTaxi?.departureStartOffsetM}),options);
}

function wrapFallback(base,options={}) {
  if(!base?.anchors?.groundStart||!base.anchors.stop||typeof base.sample!=='function')
    throw new TypeError('A runway trajectory with ground anchors is required.');
  if(base.groundJourney) throw new TypeError('Ground journey is already wrapped.');
  const positive=(value,fallback)=>Number.isFinite(value)&&value>=0?value:fallback;
  const a=base.departure.start,b=base.anchors.groundStart,c=base.anchors.stop;
  const remaining=metres(c,base.arrival.end);
  const postLength=Math.min(300,Math.max(0,remaining-50));
  const end=postLength>0?interpolateRoute([c,base.arrival.end],postLength/remaining):c;
  const preLength=metres(a,b),speedLimit=7; // m/s, visualization limit, not a procedure
  const preDuration=Math.max(25,positive(options.departureMoveSeconds,25),1.875*preLength/speedLimit);
  const holdDuration=positive(options.holdSeconds,8);
  const postDuration=postLength>0?Math.max(30,1.875*postLength/speedLimit):0;
  const offset=preDuration+holdDuration,postStart=offset+base.total;
  const total=postStart+postDuration,length=preLength+base.distance*1000+postLength;
  const first=base.sample(0),last=base.sample(base.total);
  const stages=[
    {phase:'이륙 전 활주로 저속 이동',start:0,end:preDuration,distanceStart:0,distanceEnd:preLength,v0:0,v1:0},
    {phase:'이륙 전 정렬 대기',start:preDuration,end:offset,distanceStart:preLength,distanceEnd:preLength,v0:0,v1:0},
    ...base.stages.filter(s=>s.end>s.start).map(s=>({...s,start:s.start+offset,end:s.end+offset,distanceStart:s.distanceStart+preLength,distanceEnd:s.distanceEnd+preLength})),
    ...(postDuration?[{phase:'착륙 후 활주로 저속 이동',start:postStart,end:total,distanceStart:length-postLength,distanceEnd:length,v0:0,v1:0}]:[]),
    {phase:'정지',start:total,end:total,distanceStart:length,distanceEnd:length,v0:0,v1:0}
  ];
  function ground(from,to,u,duration,distance,distanceStart,altitude,phase,heading,alignEnd=false) {
    const f=ease(u),position=interpolateRoute([from,to],f),s=distanceStart+distance*f;
    const boundaryBearing=interpolateRoute([from,to],alignEnd?1:0).heading;
    const continuousHeading=wrapHeading(position.heading+angleDelta(boundaryBearing,heading)*(alignEnd?f:1-f));
    return {point:{...position,heading:distance>1e-6?continuousHeading:heading},state:{progress:s/length,distanceM:s,altitude,groundElevation:altitude,speed:duration?distance*derivative(u)/duration*1.943844:0,pitch:0,bank:0,phase,phaseProgress:u}};
  }
  function sample(time) {
    if(!Number.isFinite(time))throw new RangeError('Time must be finite.');
    const t=Math.max(0,Math.min(total,time));
    if(t<preDuration)return ground(a,b,clamp(t/preDuration),preDuration,preLength,0,first.state.altitude,stages[0].phase,first.point.heading,true);
    if(t<offset)return {point:{...first.point},state:{...first.state,groundElevation:first.state.altitude,progress:preLength/length,distanceM:preLength,speed:0,pitch:0,bank:0,phase:stages[1].phase,phaseProgress:holdDuration?(t-preDuration)/holdDuration:1}};
    if(t<postStart){const result=base.sample(t-offset),s=preLength+(result.state.distanceM??result.state.progress*base.distance*1000);return {point:{...result.point},state:{...result.state,distanceM:s,progress:s/length}};}
    if(t<total)return ground(c,end,(t-postStart)/postDuration,postDuration,postLength,length-postLength,last.state.altitude,'착륙 후 활주로 저속 이동',last.point.heading);
    return ground(c,end,1,postDuration,postLength,length-postLength,last.state.altitude,'정지',last.point.heading);
  }
  return {...base,sample,total,stages,points:[a,...base.points,...(postLength?[end]:[])],distance:length/1000,
    anchors:{...base.anchors,groundJourneyStart:a,groundJourneyStop:end},
    groundJourney:{mode:'on-runway-fallback',label:'실제 활주로 안 저속 이동 예시 · 유도로 경로 미확인',departureDistanceM:preLength,arrivalDistanceM:postLength,holdSeconds:holdDuration,baseTimeOffset:offset,baseTotal:base.total,taxiwayRoutingStatus:'HOLD_UNVERIFIED_CONNECTIVITY_AND_CLEARANCE'},
    limitations:[...(base.limitations||[]),'Ground movement is an illustrative on-runway sequence, not an actual taxi route or clearance. It includes a stop before the final slow roll.']};
}

const angleDelta=(a,b)=>((b-a+540)%360)-180;
const wrapHeading=h=>((h%360)+360)%360;
function routeObject(value){return Array.isArray(value)?{points:value}:value||{};}
function validPoints(value){
 const points=routeObject(value).points||routeObject(value).coordinates;
 return Array.isArray(points)&&points.length>1&&points.every(p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180)?points:null;
}
/** Source polyline corners are rounded within <=2m of their source segments.
 * This is a visual steering approximation, not surveyed taxi clearance/turn radii.
 */
export function createTaxiMotion(input,{arrival=false,holdSeconds=8,altitude=0,startHeading=null,endHeading=null}={}){
 const route=routeObject(input),source=validPoints(route);
 if(!source)throw new TypeError('Taxi route needs finite {lat,lon} points.');
 const raw=source.filter((p,i)=>i===0||metres(p,source[i-1])>.05);
 if(raw.length<2)throw new RangeError('Taxi route has no length.');
 const curve=[raw[0]];
 for(let i=1;i<raw.length-1;i++){
  const a=raw[i-1],b=raw[i],c=raw[i+1],da=metres(a,b),db=metres(b,c);
  if(Math.abs(angleDelta(bearing(a,b),bearing(b,c)))<3){curve.push(b);continue;}
  const h=Math.min(4,da*.2,db*.2),entry=interpolateRoute([a,b],1-h/da),exit=interpolateRoute([b,c],h/db);
  curve.push(entry);
  for(let j=1;j<=8;j++){const t=j/8,q=interpolateRoute([entry,b],t),r=interpolateRoute([b,exit],t);curve.push(interpolateRoute([q,r],t));}
 }
 curve.push(raw.at(-1));
 const points=[curve[0]];
 for(let i=1;i<curve.length;i++){const steps=Math.max(1,Math.ceil(metres(curve[i-1],curve[i])/4));for(let j=1;j<=steps;j++)points.push(interpolateRoute([curve[i-1],curve[i]],j/steps));}
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances.at(-1)+metres(points[i-1],points[i]));
 const distance=distances.at(-1);
 // Airport-mean pavement approximation, not surveyed taxiway vertical geometry.
 // Share runway endpoint elevation at the join; blend over <=100m of source path.
 const airportElevation=Number.isFinite(route.elevationM)?route.elevationM:altitude;
 const groundAt=s=>{
  const f=ease(clamp((arrival?s:distance-s)/Math.min(100,distance)));
  return altitude+(airportElevation-altitude)*f;
 };
 const pushback= !arrival&&route.verifiedPushback===true&&Number.isFinite(route.pushbackDistanceM)
   ?Math.min(distance,Math.max(0,route.pushbackDistanceM)):0;
 const headings=points.map((p,i)=>{
  let heading=bearing(points[Math.max(0,i-1)],points[Math.min(points.length-1,i+1)]);
  if(pushback>0){const u=clamp((distances[i]-pushback)/Math.min(50,Math.max(5,distance-pushback)));heading+=180*(1-ease(u));}
  return wrapHeading(heading);
 });
 // Source projection and great-circle runway bearings can differ slightly.
 // Blend the accepted boundary attitude, never snap it at the flight join.
 const initialCorrection=Number.isFinite(startHeading)?angleDelta(headings[0],startHeading):0;
 const finalCorrection=Number.isFinite(endHeading)?angleDelta(headings.at(-1),endHeading):0;
 for(let i=0;i<headings.length;i++){
  const span=Math.min(50,distance/2);
  headings[i]=wrapHeading(headings[i]+initialCorrection*(1-ease(clamp(distances[i]/span)))+finalCorrection*(1-ease(clamp((distance-distances[i])/span))));
 }
 let holdIndex=points.length-1;
 if(!arrival&&Number.isInteger(route.holdIndex)&&source[route.holdIndex]){
  let best=Infinity;points.forEach((p,i)=>{const d=metres(p,source[route.holdIndex]);if(d<best){best=d;holdIndex=i;}});
 }
 const speeds=points.map((_,i)=>{
  let turn=0;
  for(const j of [i-1,i])if(j>=0&&j+1<points.length)turn=Math.max(turn,Math.abs(angleDelta(headings[j],headings[j+1]))/Math.max(.001,distances[j+1]-distances[j]));
  const limit=turn>.2?Math.min(3,6/turn):8;
  return distances[i]<pushback?Math.min(limit,1.5):limit;
 });
 speeds[0]=0;speeds[speeds.length-1]=0;if(!arrival)speeds[holdIndex]=0;
 const acceleration=.5;
 for(let i=1;i<speeds.length;i++)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[i-1]**2+2*acceleration*(distances[i]-distances[i-1])));
 for(let i=speeds.length-2;i>=0;i--)speeds[i]=Math.min(speeds[i],Math.sqrt(speeds[i+1]**2+2*acceleration*(distances[i+1]-distances[i])));
 const pieces=[],stages=[];let time=0;
 function add(piece){
  piece.start=time;piece.end=time+piece.duration;time=piece.end;pieces.push(piece);
  const last=stages.at(-1);if(last&&last.phase===piece.phase){last.end=piece.end;last.distanceEnd=piece.s1;last.v1=piece.v1;}
  else stages.push({phase:piece.phase,start:piece.start,end:piece.end,distanceStart:piece.s0,distanceEnd:piece.s1,v0:piece.v0,v1:piece.v1});
 }
 for(let i=0;i<points.length-1;i++){
  if(!arrival&&i===holdIndex&&holdSeconds>0)add({index:i,duration:holdSeconds,s0:distances[i],s1:distances[i],v0:0,v1:0,phase:'활주로 진입 대기(예시)'});
  const ds=distances[i+1]-distances[i];if(ds<1e-6)continue;
  // A very short isolated stop-to-stop segment uses a symmetric triangular speed envelope.
  const stopped=speeds[i]+speeds[i+1]<1e-8,duration=stopped?2*Math.sqrt(ds/acceleration):2*ds/(speeds[i]+speeds[i+1]);
  const phase=arrival?'도착 유도로·게이트 이동':distances[i]<pushback?'게이트 후진(확인된 연결 경로)':i>=holdIndex?'활주로 정렬':'출발 유도로 이동';
  add({index:i,duration,s0:distances[i],s1:distances[i+1],v0:speeds[i],v1:speeds[i+1],stopped,phase});
 }
 if(!arrival&&holdIndex===points.length-1&&holdSeconds>0)add({index:holdIndex,duration:holdSeconds,s0:distance,s1:distance,v0:0,v1:0,phase:'이륙 전 정렬 대기'});
 function sample(elapsed){
  if(!Number.isFinite(elapsed))throw new RangeError('Time must be finite.');
  const t=Math.max(0,Math.min(time,elapsed));
  if(t>=time)return {point:{...points.at(-1),heading:headings.at(-1)},state:{distanceM:distance,progress:1,altitude:groundAt(distance),groundElevation:groundAt(distance),speed:0,pitch:0,bank:0,phase:'정지',phaseProgress:1}};
  let lo=0,hi=pieces.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(pieces[mid].end<=t)lo=mid+1;else hi=mid;}
  const p=pieces[lo],dt=t-p.start,ds=p.s1-p.s0;let traveled=0,speed=0;
  if(ds>0){
   if(p.stopped){const half=p.duration/2;if(dt<=half){speed=acceleration*dt;traveled=.5*acceleration*dt*dt;}else{const remain=p.duration-dt;speed=acceleration*remain;traveled=ds-.5*acceleration*remain*remain;}}
   else{const a=(p.v1-p.v0)/p.duration;speed=p.v0+a*dt;traveled=p.v0*dt+.5*a*dt*dt;}
  }
  const f=ds>0?clamp(traveled/ds):0,index=p.index;
  const point=ds>0?interpolateRoute([points[index],points[index+1]],f):{...points[index]};
  point.heading=wrapHeading(headings[index]+(ds>0?angleDelta(headings[index],headings[index+1])*f:0));
  const stage=stages.find(s=>t>=s.start&&t<s.end)||stages.at(-1);
  const groundElevation=groundAt(p.s0+traveled);
  return {point,state:{distanceM:p.s0+traveled,progress:(p.s0+traveled)/distance,altitude:groundElevation,groundElevation,speed:speed*1.943844,pitch:0,bank:0,phase:p.phase,phaseProgress:clamp((t-stage.start)/(stage.end-stage.start))}};
 }
 return {sample,total:time,distance,points,stages,verifiedPushback:pushback>0,gateLabel:route.gateLabel||null,limits:{straightSpeedMps:8,turnSpeedMps:3,headingRateDegPerSecond:6,cornerDeviationM:2}};
}

export function wrapGroundJourney(base,options={}){
 const fallback=wrapFallback(base,options),first=base.sample(0),last=base.sample(base.total),holds=[];
 for(const [label,route] of [['Departure',options.departureTaxi],['Arrival',options.arrivalTaxi]])
  if(route?.status==='HOLD')holds.push(...(route.heldReasons||['Source route unavailable']).map(reason=>label+': '+reason));
 const dep=validPoints(options.departureTaxi),arr=validPoints(options.arrivalTaxi);
 let departureTaxi=null,arrivalTaxi=null;
 if(dep){
  if(metres(dep.at(-1),base.anchors.groundStart)>.5)holds.push('Departure taxi endpoint does not match takeoff ground anchor (0.5m tolerance).');
  else if(Math.abs(angleDelta(bearing(dep.at(-2),dep.at(-1)),first.point.heading))>5)holds.push('Departure final taxi heading is not runway-aligned.');
  else departureTaxi=createTaxiMotion({...routeObject(options.departureTaxi),points:[...dep.slice(0,-1),base.anchors.groundStart]},{holdSeconds:Number.isFinite(options.holdSeconds)?Math.max(0,options.holdSeconds):8,altitude:first.state.altitude,endHeading:first.point.heading});
 }
 if(arr){
  if(metres(arr[0],base.anchors.stop)>.5)holds.push('Arrival taxi route does not start at landing stop (0.5m tolerance); no invented connector.');
  else if(Math.abs(angleDelta(last.point.heading,bearing(arr[0],arr[1])))>5)holds.push('Arrival route initially reverses or turns away from runway at landing-stop boundary.');
  else arrivalTaxi=createTaxiMotion({...routeObject(options.arrivalTaxi),points:[base.anchors.stop,...arr.slice(1)]},{arrival:true,altitude:last.state.altitude,startHeading:last.point.heading});
 }
 if(!departureTaxi&&!arrivalTaxi){fallback.groundJourney.routeHolds=holds;return fallback;}
 const oldOffset=fallback.groundJourney.baseTimeOffset,oldPost=oldOffset+base.total;
 const preDuration=departureTaxi?.total??oldOffset,postDuration=arrivalTaxi?.total??(fallback.total-oldPost);
 const preDistance=departureTaxi?.distance??fallback.groundJourney.departureDistanceM,postDistance=arrivalTaxi?.distance??fallback.groundJourney.arrivalDistanceM;
 const postStart=preDuration+base.total,total=postStart+postDuration,distance=preDistance+base.distance*1000+postDistance;
 const preStages=departureTaxi?.stages??fallback.stages.filter(s=>s.end<=oldOffset);
 const postStages=arrivalTaxi?.stages??fallback.stages.filter(s=>s.start>=oldPost&&s.end>s.start).map(s=>({...s,start:s.start-oldPost,end:s.end-oldPost,distanceStart:s.distanceStart-fallback.distance*1000+postDistance,distanceEnd:s.distanceEnd-fallback.distance*1000+postDistance}));
 const stages=[...preStages,...base.stages.filter(s=>s.end>s.start).map(s=>({...s,start:s.start+preDuration,end:s.end+preDuration,distanceStart:s.distanceStart+preDistance,distanceEnd:s.distanceEnd+preDistance})),...postStages.map(s=>({...s,start:s.start+postStart,end:s.end+postStart,distanceStart:s.distanceStart+preDistance+base.distance*1000,distanceEnd:s.distanceEnd+preDistance+base.distance*1000})),{phase:'정지',start:total,end:total,distanceStart:distance,distanceEnd:distance,v0:0,v1:0}];
 function sample(elapsed){
  if(!Number.isFinite(elapsed))throw new RangeError('Time must be finite.');
  const t=Math.max(0,Math.min(total,elapsed));let result,s;
  if(t<preDuration){result=departureTaxi?departureTaxi.sample(t):fallback.sample(t);s=result.state.distanceM;}
  else if(t<postStart){result=base.sample(t-preDuration);s=preDistance+result.state.distanceM;}
  else{result=arrivalTaxi?arrivalTaxi.sample(t-postStart):fallback.sample(oldPost+t-postStart);s=preDistance+base.distance*1000+(arrivalTaxi?result.state.distanceM:result.state.distanceM-fallback.groundJourney.departureDistanceM-base.distance*1000);}
  return {point:{...result.point},state:{...result.state,distanceM:s,progress:distance?s/distance:0,...(t>=total?{phase:'정지',phaseProgress:1,speed:0}:{})}};
 }
 return {...base,sample,total,stages,distance:distance/1000,points:[...(departureTaxi?.points??[fallback.anchors.groundJourneyStart]),...base.points,...(arrivalTaxi?.points??[fallback.anchors.groundJourneyStop])],anchors:{...base.anchors,groundJourneyStart:departureTaxi?.points[0]??fallback.anchors.groundJourneyStart,groundJourneyStop:arrivalTaxi?.points.at(-1)??fallback.anchors.groundJourneyStop},groundJourney:{mode:'osm-ground-route-visualization',label:'OSM 연결 경로 지상 이동 예시 · 실제 운항 허가 아님',departureGateLabel:departureTaxi?.gateLabel,arrivalGateLabel:arrivalTaxi?.gateLabel,departureTaxi:!!departureTaxi,arrivalTaxi:!!arrivalTaxi,verifiedPushback:departureTaxi?.verifiedPushback??false,departureDistanceM:preDistance,arrivalDistanceM:postDistance,baseTimeOffset:preDuration,baseTotal:base.total,routeHolds:holds,taxiwayRoutingStatus:'OSM_CONNECTIVITY_NOT_OPERATIONAL_CLEARANCE'},limitations:[...(base.limitations||[]),'OSM routing does not prove operational clearance, wingspan clearance, active runway crossings or surveyed holding positions.','Taxi corners use <=2m visual rounding, bounded speed and heading rate. Gate paths represent the camera reference rather than a measured aircraft nosewheel offset.',...(departureTaxi?.verifiedPushback?['Reverse movement is limited to the source-confirmed parking-position lead line; subsequent tug/steering attitude is approximate.']:['No verified reverse lead line: pushback is not claimed.']),...holds]};
}
