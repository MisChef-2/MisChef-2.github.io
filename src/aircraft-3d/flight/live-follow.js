// Observations only: interpolate between received samples, never predict beyond them.
const finite = v => typeof v === 'number' && Number.isFinite(v);
const mix = (a,b,t) => a+(b-a)*t;
const wrap = x => ((x+180)%360+360)%360-180;
export function normalizeLiveFrame(value,hex,now=Date.now()) {
 if(!value || value.hex!==hex || !finite(value.lat) || Math.abs(value.lat)>90 || !finite(value.lon) || Math.abs(value.lon)>180 || !finite(value.altitudeM) || value.altitudeM < -500 || value.altitudeM>25000 || !finite(value.heading) || !finite(value.speedMps) || value.speedMps<0 || value.speedMps>600 || !finite(value.observedAt) || value.observedAt>now+5000 || now-value.observedAt>3600000)return null;
 return {hex,flight:String(value.flight||hex).slice(0,40),aircraftId:String(value.aircraftId||''),lat:value.lat,lon:value.lon,altitudeM:value.altitudeM,speedMps:value.speedMps,heading:((value.heading%360)+360)%360,verticalSpeedMps:finite(value.verticalSpeedMps)?value.verticalSpeedMps:null,observedAt:value.observedAt,demo:value.demo===true};
}
export function createLiveTrack(hex,{delayMs=10000,staleMs=30000}={}) {
 let frames=[];
 return {
  push(value,now=Date.now()) {const frame=normalizeLiveFrame(value,hex,now);if(!frame || (frames.length && frame.observedAt<=frames.at(-1).observedAt))return false;if(frames.length&&frames.at(-1).demo!==frame.demo)frames=[];frames.push(frame);if(frames.length>120)frames.shift();return true;},
  sample(now=Date.now()) {if(!frames.length)return null;const latest=frames.at(-1),target=now-delayMs;let left=frames[0],right=left;for(const frame of frames){if(frame.observedAt<=target)left=frame;if(frame.observedAt>=target){right=frame;break;}right=frame;}const t=right.observedAt>left.observedAt?Math.max(0,Math.min(1,(target-left.observedAt)/(right.observedAt-left.observedAt))):0;return {...latest,lat:mix(left.lat,right.lat,t),lon:wrap(left.lon+wrap(right.lon-left.lon)*t),altitudeM:mix(left.altitudeM,right.altitudeM,t),speedMps:mix(left.speedMps,right.speedMps,t),heading:(left.heading+wrap(right.heading-left.heading)*t+360)%360,displayedAt:mix(left.observedAt,right.observedAt,t),ageSeconds:Math.max(0,(now-latest.observedAt)/1000),stale:now-latest.observedAt>staleMs,buffering:frames.length<2};},
  clear(){frames=[];}
 };
}
// The rendered observation can predate the request, because both source delay
// and our interpolation buffer are intentional. Include that time explicitly.
export function liveWeatherWindow(frame,now=Date.now()) {
 const times=[now,frame?.observedAt,frame?.displayedAt].filter(finite);
 return {startMs:Math.min(...times)-60000,endMs:now+3600000};
}
export function sampleLiveWeather(bundle,point,timeMs,sampler) {
 if(!bundle||!finite(timeMs)||timeMs<bundle.startMs||timeMs>bundle.endMs)return null;
 try{return sampler(bundle,point.lat,point.lon,timeMs);}catch{return null;}
}
