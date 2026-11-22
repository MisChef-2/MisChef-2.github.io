/** Illustrative stars and precipitation; see ENVIRONMENT-README.txt. */
const DEG=Math.PI/180,TAU=Math.PI*2,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),mod=(x,n)=>((x%n)+n)%n;
const finite=(x,f=0)=>Number.isFinite(x)?x:f;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function siderealRadians(time,longitude=0){
 const ms=time instanceof Date?time.getTime():typeof time==='string'?Date.parse(time):time;
 if(!Number.isFinite(ms))return null;
 const jd=ms/86400000+2440587.5,j0=Math.floor(jd-.5)+.5,h=(jd-j0)*24,d=j0-2451545,T=(jd-2451545)/36525;
 return mod((6.697375+.065709824279*d+1.0027379*h+.0000258*T*T+finite(longitude)/15)/24*TAU,TAU);
}
export function equatorialDirection(ra,dec,lst,latitude,heading=0){
 const H=lst-ra,p=latitude*DEG,h=heading*DEG,e=-Math.cos(dec)*Math.sin(H),n=Math.sin(dec)*Math.cos(p)-Math.cos(dec)*Math.cos(H)*Math.sin(p),up=Math.sin(dec)*Math.sin(p)+Math.cos(dec)*Math.cos(H)*Math.cos(p);
 return {x:n*Math.cos(h)+e*Math.sin(h),y:up,z:e*Math.cos(h)-n*Math.sin(h)};
}
export function precipitationState(weather={},altitude=0,groundElevation=0){
 const total=Number.isFinite(weather.rain)?Math.max(0,weather.rain):null,temp=Number.isFinite(weather.temp)?weather.temp:null;
 const snow=temp===null?0:1-smooth(0,2,temp),height=Math.max(0,finite(altitude)-finite(groundElevation));
 return {total,snow,type:total===null?'unavailable':total<=.02?'none':temp===null?'unclassified':snow>.95?'snow':snow<.05?'rain':'mixed',strength:total===null?0:clamp(Math.log1p(total)/Math.log(16),0,1)*(1-smooth(2500,4500,height))};
}
/** Appearance model, not measured light pollution or limiting stellar magnitude. */
export function nightSkyVisibility({daylight=1,solarAltitude,weather={},altitude=0,groundElevation=0,cloudImmersion=0,lightPollution}={}){
 const cloud=clamp(finite(weather?.cloud,.5),0,1),height=Math.max(0,finite(altitude)-finite(groundElevation));
 const darkness=Number.isFinite(solarAltitude)?1-smooth(-18*DEG,-6*DEG,solarAltitude):1-smooth(.02,.32,finite(daylight,1));
 const pollution=clamp(finite(lightPollution,.8*Math.exp(-height/1800)),0,1);
 const haze=Number.isFinite(weather?.visibility)?smooth(800,18000,weather.visibility):.65;
 return {darkness,pollution,transmission:darkness*(1-cloud)**3*(1-clamp(finite(cloudImmersion),0,1))**2*Math.exp(-Math.max(0,finite(weather?.rain))*.16)*haze};
}
export function createEnvironment(THREE,scene){
 let seed=987123;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const root=new THREE.Group();root.name='flight_environment';scene.add(root);
 const NS=2400,NP=600,starCatalog=Array.from({length:NS},()=>{const b=random();return {ra:random()*TAU,dec:Math.asin(random()*2-1),brightness:.13+.87*b**3,size:1.35+2.8*b**5};});
 const starPos=new Float32Array(NS*3),starAlpha=new Float32Array(NS),starSize=new Float32Array(NS),starGeo=new THREE.BufferGeometry();
 starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3).setUsage(THREE.DynamicDrawUsage));starGeo.setAttribute('strength',new THREE.BufferAttribute(starAlpha,1).setUsage(THREE.DynamicDrawUsage));starGeo.setAttribute('diameter',new THREE.BufferAttribute(starSize,1));starCatalog.forEach((s,i)=>starSize[i]=s.size);
 const starMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,toneMapped:false,uniforms:{pixelRatio:{value:typeof devicePixelRatio==='number'?Math.min(2,devicePixelRatio):1}},vertexShader:`
 uniform float pixelRatio;
 attribute float strength;attribute float diameter;varying float alpha;
 #include <common>
 #include <logdepthbuf_pars_vertex>
 void main(){alpha=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=diameter*pixelRatio;
 #include <logdepthbuf_vertex>
 }`,fragmentShader:`
 varying float alpha;
 #include <common>
 #include <logdepthbuf_pars_fragment>
 void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.||alpha<.002)discard;
 #include <logdepthbuf_fragment>
 gl_FragColor=vec4(vec3(.9,.94,1.),alpha*exp(-2.*r*r)*(1.-smoothstep(.7,1.,r)));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const stars=new THREE.Points(starGeo,starMat);stars.name='illustrative_sidereal_stars';stars.frustumCulled=false;stars.renderOrder=-20;root.add(stars);
 const particles=Array.from({length:NP},()=>({x:12+random()*128,y:-30+random()*80,z:-60+random()*120,seed:random(),fall:.7+random()*.6}));
 const rainPos=new Float32Array(NP*6),rainAlpha=new Float32Array(NP*2),snowPos=new Float32Array(NP*3),snowAlpha=new Float32Array(NP),snowSize=new Float32Array(NP);
 const rainGeo=new THREE.BufferGeometry(),snowGeo=new THREE.BufferGeometry();
 for(const [g,pos,alpha] of [[rainGeo,rainPos,rainAlpha],[snowGeo,snowPos,snowAlpha]]){g.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));g.setAttribute('strength',new THREE.BufferAttribute(alpha,1).setUsage(THREE.DynamicDrawUsage));}
 particles.forEach((p,i)=>snowSize[i]=1.2+p.seed*2.4);snowGeo.setAttribute('diameter',new THREE.BufferAttribute(snowSize,1));
 const rainMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,uniforms:{light:{value:1}},vertexShader:`
 attribute float strength;varying float alpha;
 #include <common>
 #include <logdepthbuf_pars_vertex>
 void main(){alpha=strength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
 #include <logdepthbuf_vertex>
 }`,fragmentShader:`
 uniform float light;varying float alpha;
 #include <common>
 #include <logdepthbuf_pars_fragment>
 void main(){if(alpha<.002)discard;
 #include <logdepthbuf_fragment>
 gl_FragColor=vec4(mix(vec3(.18,.23,.31),vec3(.63,.73,.79),light),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const snowMat=starMat.clone();const rain=new THREE.LineSegments(rainGeo,rainMat),snow=new THREE.Points(snowGeo,snowMat);rain.name='external_rain_streaks';snow.name='external_snow_flakes';rain.frustumCulled=snow.frustumCulled=false;root.add(rain,snow);
 let disposed=false,lastElapsed=null,lastSkyKey='',starCount=0;
 function update({time,elapsed=0,lat=0,lon=0,heading=0,altitude=0,groundElevation=0,daylight=1,solarAltitude,cloudImmersion=0,lightPollution,weather={},phase='',speed=0}={}){
  if(disposed)return {weatherLabel:'환경 해제됨',starCount:0};weather=weather||{};
  const day=clamp(finite(daylight,1),0,1),cover=clamp(finite(weather.cloud,.5),0,1),precip=precipitationState(weather,altitude,groundElevation),lst=siderealRadians(time,lon),h=finite(heading),latitude=clamp(finite(lat),-90,90);
  const visibility=nightSkyVisibility({daylight:day,solarAltitude,weather,altitude,groundElevation,cloudImmersion,lightPollution}),skyKey=[lst,latitude,h,visibility.transmission,visibility.pollution].join('/');
  if(skyKey!==lastSkyKey){lastSkyKey=skyKey;starCount=0;
   for(let i=0;i<NS;i++){const s=starCatalog[i],p=equatorialDirection(s.ra,s.dec,lst??0,latitude,h),urban=smooth(visibility.pollution*.3,visibility.pollution*.55+.12,s.brightness),a=lst===null?0:Math.min(1,s.brightness*1.5)*visibility.transmission*urban*smooth(.01,.14,p.y);starPos.set([p.x*180000,p.y*180000,p.z*180000],i*3);starAlpha[i]=a;if(a>.015)starCount++;}
   starGeo.attributes.position.needsUpdate=starGeo.attributes.strength.needsUpdate=true;
  }
  stars.visible=starCount>0;const now=finite(elapsed),dt=lastElapsed===null?0:clamp(now-lastElapsed,0,1);lastElapsed=now;
  const wind=clamp(finite(weather.wind),0,100),wd=finite(weather.windDirection)*DEG,angle=h*DEG,e=-Math.sin(wd)*wind,n=-Math.cos(wd)*wind,vx=n*Math.cos(angle)+e*Math.sin(angle)-clamp(finite(speed),0,700)*.514444,vz=e*Math.cos(angle)-n*Math.sin(angle);
  const minY=finite(groundElevation)-finite(altitude)+.15;
  for(let i=0;i<NP;i++){const p=particles[i],fall=(9*(1-precip.snow)+1.1*precip.snow)*p.fall;p.x=12+mod(p.x-12+vx*dt,128);p.y=-30+mod(p.y+30-fall*dt,80);p.z=-60+mod(p.z+60+vz*dt,120);
   const edge=smooth(12,20,p.x)*(1-smooth(115,140,p.x))*(1-smooth(45,60,Math.abs(p.z)))*smooth(-30,-23,p.y)*(1-smooth(42,50,p.y))*smooth(minY,minY+.6,p.y),selection=1-smooth(precip.strength-.1,precip.strength+.05,p.seed),alpha=edge*selection*precip.strength*(.22+.22*day);
   const exposure=.035,endX=clamp(p.x-vx*exposure,12,140),endY=p.y+fall*exposure,endZ=clamp(p.z-vz*exposure,-60,60);rainPos.set([p.x,p.y,p.z,endX,endY,endZ],i*6);rainAlpha[i*2]=alpha*(1-precip.snow);rainAlpha[i*2+1]=alpha*(1-precip.snow)*.12;
   snowPos.set([p.x,p.y,p.z],i*3);snowAlpha[i]=alpha*precip.snow*1.8;
  }
  rain.visible=precip.strength>.001&&precip.snow<.999;snow.visible=precip.strength>.001&&precip.snow>.001;rainMat.uniforms.light.value=day;
  for(const g of [rainGeo,snowGeo])g.attributes.position.needsUpdate=g.attributes.strength.needsUpdate=true;
  const typeLabels={unavailable:'강수 자료 없음',none:'강수 없음',unclassified:'강수 표현 · 종류 미확인',snow:'눈 연출 · 지상기온 기반 근사',rain:'비 연출 · 지상기온 기반 근사',mixed:'눈·비 혼합 연출 · 근사'};
  return {weatherLabel:typeLabels[precip.type]+' · 별 배치는 예시',starCount,precipitationType:precip.type,precipitationVisible:rain.visible||snow.visible,approximate:true};
 }
 function dispose(){if(disposed)return;disposed=true;scene.remove(root);for(const g of [starGeo,rainGeo,snowGeo])g.dispose();for(const m of [starMat,rainMat,snowMat])m.dispose();}
 return {update,dispose};
}
