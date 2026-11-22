import {getRunwayEnds} from './airports.js';
import {terrainLocalPosition} from './terrain.js';
const RAD=Math.PI/180,finite=Number.isFinite,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const local=(a,p)=>{const q=terrainLocalPosition(p[1],p[0],0,a.lat,a.lon,0);return [q.east,q.south];};
function distance(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],d=dx*dx+dz*dz,t=d?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dz)/d,0,1):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
function inRing(p,r){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
/** Source centreline geometry; lamp locations, widths and spacing are schematic, NOT surveyed assets. */
export function buildTaxiLighting({airport,features=[],runways=[],maxLights=24000}={}){
 const result={edge:[],centre:[],sourceLines:0,physicalSigns:0,placement:'SCHEMATIC_ON_SOURCE_TAXI_GEOMETRY',rejected:0};
 if(!airport||![airport.lat,airport.lon,airport.elevationM].every(finite))return result;
 const segments=[],polygons=[],runwayAreas=[];
 for(const r of runways){if(!r.start||!r.end||!finite(r.widthM))continue;runwayAreas.push({a:local(airport,[r.start.lon,r.start.lat]),b:local(airport,[r.end.lon,r.end.lat]),half:r.widthM/2+15});}
 for(const f of features){const g=f.geometry,p=f.properties||{},kind=p.kind||p.aeroway;if(!g)continue;
  if(kind==='terminal'){for(const poly of g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[]){if(poly?.[0]?.length)polygons.push(poly.map(r=>r.map(q=>local(airport,q))));}}
  if(!['taxiway','taxilane'].includes(kind))continue;const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
  for(const line of lines){const id=result.sourceLines++;for(let i=1;i<line.length;i++){if(![...line[i],...line[i-1]].every(finite))continue;const a=local(airport,line[i-1]),b=local(airport,line[i]),length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length>.2&&length<5000)segments.push({a,b,length,id,width:finite(p.widthM)&&p.widthM>=3&&p.widthM<=100?p.widthM:18});}}
 }
 const grid=new Map(),cell=50;const key=(x,z)=>`${x},${z}`;
 for(const s of segments){for(let x=Math.floor((Math.min(s.a[0],s.b[0])-s.width)/cell);x<=Math.floor((Math.max(s.a[0],s.b[0])+s.width)/cell);x++)for(let z=Math.floor((Math.min(s.a[1],s.b[1])-s.width)/cell);z<=Math.floor((Math.max(s.a[1],s.b[1])+s.width)/cell);z++){const k=key(x,z);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(s);}}
 const blocked=p=>runwayAreas.some(r=>distance(p,r.a,r.b)<r.half)||polygons.some(r=>inRing(p,r[0])&&!r.slice(1).some(h=>inRing(p,h)));
 const used=new Set();
 function add(kind,p,s){if(result.edge.length+result.centre.length>=maxLights)return;const k=kind+':'+Math.round(p[0])+':'+Math.round(p[1]);if(used.has(k))return;used.add(k);
  if(blocked(p)||(kind==='edge'&&(grid.get(key(Math.floor(p[0]/cell),Math.floor(p[1]/cell)))||[]).some(other=>other.id!==s.id&&distance(p,other.a,other.b)<other.width/2-1))){result.rejected++;return;}
  result[kind].push([p[0],airport.elevationM+(kind==='edge'?.28:.13),p[1]]);
 }
 // Arc-length sampling carries phase across each source line; vertex density cannot create a light cluster.
 let lastId=-1,offset=0;
 for(const s of segments){if(lastId!==s.id){offset=0;lastId=s.id;}const dx=(s.b[0]-s.a[0])/s.length,dz=(s.b[1]-s.a[1])/s.length;
  for(let d=Math.ceil(offset/15)*15-offset;d<s.length;d+=15){const p=[s.a[0]+dx*d,s.a[1]+dz*d];add('centre',p,s);if(Math.round((offset+d)/15)%2===0)for(const sign of [-1,1])add('edge',[p[0]-dz*sign*(s.width/2+.6),p[1]+dx*sign*(s.width/2+.6)],s);}
  offset+=s.length;
 }
 return result;
}
export function airportLightingOpacity(daylight=1,visibility=40000){return clamp((1-clamp(daylight,0,1))*.95+.015,.015,1)*(finite(visibility)?clamp(visibility/3000,.2,1):1);}
export function createAirportLighting(THREE,scene,{airports=[],runways={},features={},lightingSources={}}={}){
 const root=new THREE.Group();root.name='schematic_taxi_lighting_on_OSM_geometry';scene.add(root);const all=Array.isArray(airports)?airports:airports.airports||[],records=[];let disposed=false,enabled=true;
 const vertexShader=`
 #include <common>
 #include <logdepthbuf_pars_vertex>
 uniform float pointScale;varying float vDistance;
 void main(){vec4 p=modelViewMatrix*vec4(position,1.0);vDistance=length(p.xyz);gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointScale/max(1.0,-p.z),1.0,12.0);
 #include <logdepthbuf_vertex>
 }`;
 const fragmentShader=`
 #include <logdepthbuf_pars_fragment>
 uniform vec3 color;uniform float opacity;uniform float visibility;varying float vDistance;
 void main(){float r=length(gl_PointCoord-vec2(.5))*2.0;if(r>1.0)discard;
 #include <logdepthbuf_fragment>
 float glow=exp(-r*r*5.0);float fog=exp(-vDistance/max(100.0,visibility));gl_FragColor=vec4(color,glow*opacity*fog);}`;
 const mats={edge:new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(0x2879ff)},opacity:{value:0},visibility:{value:40000},pointScale:{value:750}},vertexShader,fragmentShader,transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending}),centre:new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(0x39ff86)},opacity:{value:0},visibility:{value:40000},pointScale:{value:500}},vertexShader,fragmentShader,transparent:true,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending})};
 const mastMaterial=new THREE.MeshStandardMaterial({color:0x77818a,roughness:.72,metalness:.4}),lampMaterial=new THREE.MeshStandardMaterial({color:0xf2eadb,emissive:0xffe0a4,emissiveIntensity:0,roughness:.3});
 function clear(){for(const r of records){root.remove(r.group);r.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});}records.length=0;}
 function setAirports(selected=[]){if(disposed)return [];clear();const seen=new Set();for(const value of selected){const a=typeof value==='string'?all.find(a=>a.icao===value||a.iata===value):value;if(!a?.icao||seen.has(a.icao))continue;seen.add(a.icao);const data=buildTaxiLighting({airport:a,features:(features.airports||features)[a.icao]?.features||[],runways:getRunwayEnds(a,runways).filter(r=>r.canVisualize&&!r.closed)}),group=new THREE.Group();group.name=a.icao+'_illustrative_taxi_lights';group.userData={placement:data.placement,centreColor:'green',edgeColor:'blue',lampSpacing:'Illustrative 15m centre, 30m edges; not a lamp survey',unknownWidthM:18,runwayConnections:'Excluded within 15m of runway pavement; no invented stopbars, lead-on/off or runway status lights'};
   for(const kind of ['edge','centre']){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data[kind].flat(),3));const mesh=new THREE.Points(geometry,mats[kind]);mesh.frustumCulled=false;group.add(mesh);}
   data.mappedMasts=0;for(const m of lightingSources.mappedMasts?.[a.icao]||[]){if(![m.lon,m.lat].every(finite))continue;const [x,z]=local(a,[m.lon,m.lat]),h=finite(m.heightM)?m.heightM:25,base=a.elevationM;const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.16,.34,h,8),mastMaterial);shaft.position.set(x,base+h/2,z);shaft.userData={sourceUrl:m.sourceUrl,heightVerified:finite(m.heightM),visualHeightM:h};group.add(shaft);const frame=new THREE.Mesh(new THREE.BoxGeometry(3.8,.18,1.1),mastMaterial);frame.position.set(x,base+h,z);group.add(frame);for(let i=0;i<4;i++){const lamp=new THREE.Mesh(new THREE.BoxGeometry(.62,.38,.55),lampMaterial);lamp.position.set(x-1.35+i*.9,base+h-.1,z);lamp.rotation.x=-.45;group.add(lamp);}data.mappedMasts++;}
   root.add(group);records.push({airport:a,group,data});}return records.map(r=>({icao:r.airport.icao,edgeLights:r.data.edge.length,centreLights:r.data.centre.length,mappedMasts:r.data.mappedMasts,rejected:r.data.rejected,placement:r.data.placement,physicalSigns:0}));}
 const basis=(lat,lon)=>{const p=lat*RAD,l=lon*RAD;return [[-Math.sin(l),Math.cos(l),0],[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],[Math.sin(p)*Math.cos(l),Math.sin(p)*Math.sin(l),-Math.cos(p)]];},dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 function update({lat,lon,heading=0,altitude=0,daylight=1,weather={}}={}){if(disposed||![lat,lon].every(finite))return;root.visible=enabled;root.rotation.y=heading*RAD-Math.PI/2;for(const m of Object.values(mats)){m.uniforms.opacity.value=airportLightingOpacity(daylight,weather.visibility);m.uniforms.visibility.value=finite(weather.visibility)?Math.max(100,weather.visibility):40000;}const observer=basis(lat,lon);for(const r of records){const a=r.airport,o=terrainLocalPosition(a.lat,a.lon,0,lat,lon,altitude),axes=basis(a.lat,a.lon);r.group.matrixAutoUpdate=false;r.group.matrix.set(dot(observer[0],axes[0]),dot(observer[0],axes[1]),dot(observer[0],axes[2]),o.east,dot(observer[1],axes[0]),dot(observer[1],axes[1]),dot(observer[1],axes[2]),o.up,dot(observer[2],axes[0]),dot(observer[2],axes[1]),dot(observer[2],axes[2]),o.south,0,0,0,1);r.group.matrixWorldNeedsUpdate=true;r.group.visible=Math.hypot(o.east,o.south)<25000;}}
 const updateWithMasts=frame=>{update(frame);lampMaterial.emissiveIntensity=(1-clamp(frame?.daylight??1,0,1))*3;};
 return {setAirports,update:updateWithMasts,setVisible(v){enabled=!!v;root.visible=enabled;},dispose(){if(disposed)return;clear();for(const m of Object.values(mats))m.dispose();mastMaterial.dispose();lampMaterial.dispose();scene.remove(root);disposed=true;}};
}
