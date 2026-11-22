// Geographic cinematic trajectory. Runway alignment is data-based, not an approved procedure.
import {haversine,interpolateRoute} from './flight-math.js';
const R=6371008.8,D=Math.PI/180,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function destination(p,bearing,meters){const a=meters/R,b=bearing*D,lat=p.lat*D,lon=p.lon*D;const q=Math.asin(Math.sin(lat)*Math.cos(a)+Math.cos(lat)*Math.sin(a)*Math.cos(b));return {lat:q/D,lon:((lon+Math.atan2(Math.sin(b)*Math.sin(a)*Math.cos(lat),Math.cos(a)-Math.sin(lat)*Math.sin(q)))/D+540)%360-180};}
export function bearing(a,b){return interpolateRoute([a,b],0).heading;}
const xyz=p=>[Math.cos(p.lat*D)*Math.cos(p.lon*D),Math.cos(p.lat*D)*Math.sin(p.lon*D),Math.sin(p.lat*D)];
const geo=v=>({lat:Math.atan2(v[2],Math.hypot(v[0],v[1]))/D,lon:Math.atan2(v[1],v[0])/D});
const smooth=t=>t*t*(3-2*t);
function curvedRoute(input,entryHeading,exitHeading){
 const points=[input[0]];
 for(let i=1;i<input.length;i++){const a=points.at(-1),b=input[i],n=Math.max(1,Math.ceil(haversine(a,b)/1500));if(haversine(a,b)<.00001)continue;for(let j=1;j<=n;j++)points.push(interpolateRoute([a,b],j/n));}
 const ps=points.map(xyz),lens=points.slice(1).map((p,i)=>haversine(points[i],p)*1000);
 const hv=(p,h)=>{const lat=p.lat*D,lon=p.lon*D,t=h*D;return [-Math.sin(lat)*Math.cos(lon)*Math.cos(t)-Math.sin(lon)*Math.sin(t),-Math.sin(lat)*Math.sin(lon)*Math.cos(t)+Math.cos(lon)*Math.sin(t),Math.cos(lat)*Math.cos(t)];};
 const tangents=ps.map((p,i)=>{let v;if(!i)v=hv(points[i],entryHeading);else if(i===ps.length-1)v=hv(points[i],exitHeading);else{v=ps[i+1].map((x,k)=>x-ps[i-1][k]);const dot=v.reduce((a,x,k)=>a+x*p[k],0);v=v.map((x,k)=>x-dot*p[k]);const m=Math.hypot(...v);v=m>1e-10?v.map(x=>x/m):hv(points[i],bearing(points[i],points[i+1]));}const scale=Math.min(lens[i-1]??Infinity,lens[i]??Infinity,400000)*.55/R;return v.map(x=>x*scale);});
 return ps.slice(1).map((p2,i)=>{const p1=ps[i],m1=tangents[i],m2=tangents[i+1];return {n:Math.max(160,Math.ceil(lens[i]/1500)),at:t=>geo(p1.map((x,k)=>(2*t**3-3*t*t+1)*x+(t**3-2*t*t+t)*m1[k]+(-2*t**3+3*t*t)*p2[k]+(t**3-t*t)*m2[k]))};});
}
function line(a,b){return {n:Math.max(2,Math.ceil(haversine(a,b)*2)),at:t=>interpolateRoute([a,b],t)};}
function buildPath(segments){let length=0;const points=[];for(const segment of segments){segment.start=length;segment.table=[{t:0,s:0}];let previous=segment.at(0);if(!points.length)points.push(previous);for(let i=1;i<=segment.n;i++){const t=(1-Math.cos(Math.PI*i/segment.n))/2,p=segment.at(t);length+=haversine(previous,p)*1000;segment.table.push({t,s:length-segment.start});points.push(p);previous=p;}segment.end=length;}
 function pointAt(s){s=clamp(s,0,length);const seg=segments.find(x=>s<=x.end)||segments.at(-1),d=s-seg.start,tab=seg.table;let lo=0,hi=tab.length-1;while(hi-lo>1){const m=(hi+lo)>>1;if(tab[m].s<=d)lo=m;else hi=m;}return seg.at(tab[lo].t+(tab[hi].t-tab[lo].t)*(d-tab[lo].s)/(tab[hi].s-tab[lo].s||1));}return {length,points,pointAt};
}
export function createTrajectory(departure,arrival,via=[],options={}){
 for(const r of [departure,arrival])if(!r?.start||!r.end||![r.start,r.end].every(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180)||!Number.isFinite(r.elevationM)||!(r.lengthM>900)||haversine(r.start,r.end)*1000<=900||r.closed)throw Error('활주로 끝 좌표·표고·900m 이상 길이 자료가 필요합니다.');
 if(!Array.isArray(via)||!via.every(p=>p&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180))throw new RangeError('Invalid via coordinates');
 const dh=bearing(departure.start,departure.end),ah=bearing(arrival.start,arrival.end);
 const depLength=haversine(departure.start,departure.end)*1000,arrLength=haversine(arrival.start,arrival.end)*1000;
 const threshold=arrival.threshold||arrival.start,offset=haversine(arrival.start,threshold)*1000,angle=(bearing(arrival.start,threshold)-ah)*D;
 if(offset*Math.cos(angle)<-.1||offset*Math.cos(angle)>arrLength-200||Math.abs(offset*Math.sin(angle))>Math.max(arrival.widthM||0,50))throw new RangeError('Threshold outside runway');
 const liftOffset=Math.min(depLength*.65,2200),startOffset=options.departureStartOffsetM??100;if(!Number.isFinite(startOffset)||startOffset<0||startOffset>liftOffset-400)throw new RangeError('Runway entry leaves insufficient visual takeoff roll');const groundStart=destination(departure.start,dh,startOffset),lift=destination(departure.start,dh,liftOffset);
 const departureOut=destination(departure.end,dh,9000),touch=destination(threshold,ah,Math.min(300,arrLength*.12,(arrLength-offset)*.2));
 const finalStart=destination(threshold,ah+180,18000),stop=destination(touch,ah,Math.min(1600,haversine(touch,arrival.end)*1000*.85));
 const outbound=line(lift,departureOut),inbound=line(finalStart,touch),curve=curvedRoute([departureOut,...via,finalStart],outbound.at(1).heading,inbound.at(0).heading);
 const path=buildPath([line(groundStart,lift),outbound,...curve,inbound,line(touch,stop)]),points=path.points,dist=[path.length];
 const groundDistance=haversine(groundStart,lift)*1000,landingDistance=haversine(touch,stop)*1000,approachDistance=haversine(finalStart,touch)*1000;
 const airborne=dist.at(-1)-groundDistance-landingDistance,cruiseAltitude=Math.max(departure.elevationM,arrival.elevationM)+Math.min(11000,Math.max(1800,airborne*.035));
 const beforeApproach=airborne-approachDistance,takeoffDistance=Math.min(5000,beforeApproach*.1),climbDistance=Math.min(100000,beforeApproach*.3),descentDistance=Math.min(190000,beforeApproach*.35),cruiseDistance=beforeApproach-takeoffDistance-climbDistance-descentDistance;
 const lengths=[groundDistance,takeoffDistance,climbDistance,cruiseDistance,descentDistance,approachDistance,landingDistance],speeds=[0,75,95,220,220,90,68,0],names=['地上','이륙','상승','순항','하강','착륙 접근·플레어','착륙 활주'];names[0]='지상 활주';
 let at=0,ds=0;const stages=lengths.map((length,i)=>{const duration=2*length/(speeds[i]+speeds[i+1]);const stage={phase:names[i],start:at,end:at+duration,distanceStart:ds,distanceEnd:ds+length,v0:speeds[i],v1:speeds[i+1]};at+=duration;ds+=length;return stage;});stages.push({phase:'정지',start:at,end:at,distanceStart:ds,distanceEnd:ds,v0:0,v1:0});
 const pointAt=path.pointAt;
 function distanceAt(time){if(!Number.isFinite(time))throw new RangeError('Time must be finite');const t=clamp(time,0,at),stage=stages.find(s=>t<s.end)||stages.at(-1),duration=stage.end-stage.start,u=duration?clamp((t-stage.start)/duration):1;return {s:stage.distanceStart+duration*(stage.v0*u+(stage.v1-stage.v0)*(u**3-u**4/2)),v:stage.v0+(stage.v1-stage.v0)*smooth(u),stage,u};}
 const altAt=s=>{const d=stages;const startApproach=d[5].distanceStart,touchD=d[5].distanceEnd,remaining=touchD-s;const approachH=Math.max(0,approachDistance-300)*Math.tan(3*D);if(s<=d[0].distanceEnd)return departure.elevationM;if(s<=d[1].distanceEnd)return departure.elevationM+350*smooth((s-d[1].distanceStart)/(d[1].distanceEnd-d[1].distanceStart));if(s<=d[2].distanceEnd)return departure.elevationM+350+(cruiseAltitude-departure.elevationM-350)*smooth((s-d[2].distanceStart)/(d[2].distanceEnd-d[2].distanceStart));if(s<=d[3].distanceEnd)return cruiseAltitude;if(s<startApproach){const length=startApproach-d[4].distanceStart,u=(s-d[4].distanceStart)/length;return cruiseAltitude+(arrival.elevationM+approachH-cruiseAltitude)*smooth(u)-(u**3-u*u)*length*Math.tan(3*D);}if(s<touchD){const linear=Math.max(0,remaining-300)*Math.tan(3*D);return arrival.elevationM+(remaining>600?linear:Math.max(0,remaining/600)**2*(300*Math.tan(3*D)));}return arrival.elevationM;};
 function sample(time){const {s,v,stage,u}=distanceAt(time),point=pointAt(s),pre=pointAt(Math.max(0,s-60)),post=pointAt(Math.min(ds,s+60));const heading=bearing(pre,post),h0=bearing(pointAt(Math.max(0,s-250)),pointAt(Math.max(1,s-50))),h1=bearing(pointAt(Math.min(ds-1,s+50)),pointAt(Math.min(ds,s+250)));let turn=((h1-h0+540)%360)-180;const bank=clamp(Math.atan(v*v*(turn*D/300)/9.81)/D,-22,22);const slope=Math.atan2(altAt(Math.min(ds,s+1))-altAt(Math.max(0,s-1)),Math.min(ds,s+1)-Math.max(0,s-1)||1)/D;const pitch=stage.phase==='지상 활주'?3*smooth(clamp((u-.8)/.2)):stage.phase==='착륙 활주'?3*(1-smooth(u)):stage.phase==='정지'?0:clamp(slope+3,-4,13);
  return {point:{...point,heading},state:{progress:s/ds,distanceM:s,altitude:altAt(s),speed:v*1.943844,pitch,bank:bank*smooth(clamp((s-groundDistance)/500))*smooth(clamp((stages[5].distanceStart-s)/1000)),phase:stage.phase,phaseProgress:u}};
 }
 return {sample,total:at,stages,points,distance:ds/1000,departure,arrival,cruiseAltitude,anchors:{groundStart,lift,departureOut,finalStart,touch,stop},limitations:['Cinematic route, not a published procedure or aircraft performance model.','Runway slope is approximated by airport elevation.']};
}
