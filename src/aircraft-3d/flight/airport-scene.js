import {getRunwayEnds} from './airports.js';
import {terrainLocalPosition} from './terrain.js';
const RAD=Math.PI/180,R=6371008.8,finite=Number.isFinite;
const deltaLon=(a,b)=>((a-b+540)%360)-180;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
/** Optical approximation from model precipitation, not measured surface wetness. */
export function airportAppearance({daylight=1,wetness,weather={}}={}){
 const day=finite(daylight)?clamp(daylight,0,1):1;
 const wet=finite(wetness)?clamp(wetness,0,1):finite(weather?.rain)?clamp(weather.rain/3,0,1):0;
 return {wetness:wet,pavedRoughness:.94-.56*wet,windowEmission:(1-day)**2*.8};
}
/** Real plan geometry; inferred widths/heights are visual approximations, not survey data. */
export function createAirportScene(THREE,scene,{airports=[],runways={},features={}}={}){
 const root=new THREE.Group();root.name='source_airport_surfaces';scene.add(root);
 const all=Array.isArray(airports)?airports:airports.airports||[],records=[],textures=[];
 const materials={runway:new THREE.MeshStandardMaterial({color:0x373b3d,roughness:.94}),grass:new THREE.MeshStandardMaterial({color:0x646b48,roughness:1}),apron:new THREE.MeshStandardMaterial({color:0x92948e,roughness:.95}),taxiway:new THREE.MeshStandardMaterial({color:0x525755,roughness:.95}),terminal:new THREE.MeshStandardMaterial({color:0xaeb9ba,roughness:.7}),mark:new THREE.MeshBasicMaterial({color:0xe9e9df}),light:new THREE.MeshBasicMaterial({color:0xfff3cf,toneMapped:false})};
 materials.windows=new THREE.MeshStandardMaterial({color:0x334c58,roughness:.3,metalness:.15,emissive:0xffd29b,emissiveIntensity:0});
 let disposed=false,annotationsVisible=false;
 function local(a,p){const q=terrainLocalPosition(p.lat,p.lon,p.elevationM??a.elevationM,a.lat,a.lon,0);return [q.east,q.up,q.south];}
 function bucketGeometry(buckets,key,geometry){const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position;const b=buckets[key]??(buckets[key]=[]);for(let i=0;i<p.count;i++)b.push(p.getX(i),p.getY(i),p.getZ(i));if(g!==geometry)g.dispose();geometry.dispose();}
 function triangles(buckets,key,points){(buckets[key]??(buckets[key]=[])).push(...points.flat());}
 function strip(buckets,key,a,b,width){const dx=b[0]-a[0],dz=b[2]-a[2],len=Math.hypot(dx,dz);if(len<.01)return;const x=-dz/len*width/2,z=dx/len*width/2,p=[a[0]+x,a[1],a[2]+z],q=[a[0]-x,a[1],a[2]-z],r=[b[0]-x,b[1],b[2]-z],s=[b[0]+x,b[1],b[2]+z];triangles(buckets,key,[p,s,r,p,r,q]);}
 function surfaceLabel(record,text,pos,forward,width){
  if(!text)return;const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,256);ctx.fillStyle='#efefe5';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 120px sans-serif';ctx.fillText(text,128,128,230);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});const g=new THREE.PlaneGeometry(Math.min(width*.55,18),24);g.rotateX(-Math.PI/2);
  const mesh=new THREE.Mesh(g,material);mesh.name='runway_ident_'+text;mesh.position.set(...pos);mesh.rotation.y=Math.atan2(-forward[0],-forward[1]);mesh.userData={label:text,placement:'Illustrative surface label, not surveyed paint geometry'};record.group.add(mesh);
 }
 function polygon(record,buckets,kind,rings,properties){
  if(!rings?.[0]?.length)return;const points=rings.map(r=>r.filter(p=>finite(p[0])&&finite(p[1])).map(p=>local(record.airport,{lon:p[0],lat:p[1]})));
  if(points[0].length<3)return;const shape=new THREE.Shape(points[0].map(p=>new THREE.Vector2(p[0],-p[2])));for(const hole of points.slice(1))if(hole.length>=3)shape.holes.push(new THREE.Path(hole.map(p=>new THREE.Vector2(p[0],-p[2]))));
  const terminal=kind==='terminal',height=finite(properties.heightM)&&properties.heightM>0?properties.heightM:12;
  const geometry=terminal?new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,steps:1,curveSegments:1}):new THREE.ShapeGeometry(shape,1);geometry.rotateX(-Math.PI/2);geometry.translate(0,record.airport.elevationM+(terminal?.10:.045),0);bucketGeometry(buckets,kind,geometry);
  if(terminal&&!finite(properties.heightM))record.approximateBuildingCount++;
  if(terminal){
   // Decorative bands follow the preserved OSM footprint, never extending the
   // building footprint. Facade subdivision and floors are illustrative.
   for(let ri=0;ri<points.length;ri++){
    const ring=points[ri],area=ring.reduce((s,p,i)=>{const q=ring[(i+1)%ring.length];return s+p[0]*q[2]-q[0]*p[2];},0);
    const outward=(area>=0?1:-1)*(ri===0?1:-1);
    for(let i=0;i<ring.length;i++){
     const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz);if(length<2)continue;
     const nx=outward*dz/length*.025,nz=-outward*dx/length*.025;
     for(let level=1.2;level+1.6<height-.4&&record.facadeBandCount<1200;level+=3.6){
      const lo=record.airport.elevationM+.1+level,hi=lo+1.6;
      const p=[a[0]+dx*.03+nx,lo,a[2]+dz*.03+nz],q=[b[0]-dx*.03+nx,lo,b[2]-dz*.03+nz],r=[q[0],hi,q[2]],s=[p[0],hi,p[2]];
      triangles(buckets,'windows',outward>0?[p,r,q,p,s,r]:[p,q,r,p,r,s]);record.facadeBandCount++;
     }
    }
   }
  }
 }
 function labels(record,points){
  const names=[...new Set(points.map(p=>p.name))].slice(0,128);if(!names.length)return;
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const ctx=c.getContext('2d');
  names.forEach((name,i)=>{const x=i%8*128,y=Math.floor(i/8)*64;ctx.fillStyle='#162329';ctx.fillRect(x+2,y+2,124,60);ctx.fillStyle='#f2d477';ctx.font='bold 28px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,x+64,y+32,116);});
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);
  const material=new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true,depthWrite:false});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(8*6*3),3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(8*6*2),2));geometry.setDrawRange(0,0);
  const mesh=new THREE.Mesh(geometry,material);mesh.name=record.airport.icao+'_OSM_taxiway_name_annotations';mesh.frustumCulled=false;mesh.userData={placement:'OSM label anchors; not surveyed physical signs',maxVisible:8};record.group.add(mesh);
  mesh.visible=annotationsVisible;record.labels={mesh,points:points.filter(p=>names.includes(p.name)).map(p=>({...p,index:names.indexOf(p.name)})),last:null};
 }
 function updateLabels(record,lat,lon){
  const labels=record.labels;if(!labels)return;
  const q=terrainLocalPosition(lat,lon,0,record.airport.lat,record.airport.lon,0);
  if(labels.last&&Math.hypot(q.east-labels.last[0],q.south-labels.last[1])<20)return;labels.last=[q.east,q.south];
  const selected=labels.points.map(p=>({...p,distance:Math.hypot(p.pos[0]-q.east,p.pos[2]-q.south)})).filter(p=>p.distance<1200).sort((a,b)=>a.distance-b.distance).slice(0,8);
  const pos=labels.mesh.geometry.attributes.position,uv=labels.mesh.geometry.attributes.uv;
  selected.forEach((p,i)=>{const dx=q.east-p.pos[0],dz=q.south-p.pos[2],len=Math.max(.001,Math.hypot(dx,dz)),rx=dz/len*2.6,rz=-dx/len*2.6,y=record.airport.elevationM+3;
   const a=[p.pos[0]-rx,y,p.pos[2]-rz],b=[p.pos[0]+rx,y,p.pos[2]+rz],c=[b[0],y+1.3,b[2]],d=[a[0],y+1.3,a[2]];
   pos.array.set([...a,...b,...c,...a,...c,...d],i*18);const x=p.index%8/8,v=1-Math.floor(p.index/8)/16;
   uv.array.set([x,v-1/16,x+1/8,v-1/16,x+1/8,v,x,v-1/16,x+1/8,v,x,v],i*12);
  });pos.needsUpdate=true;uv.needsUpdate=true;labels.mesh.geometry.setDrawRange(0,selected.length*6);
 }
 function build(airport){
  const record={airport,group:new THREE.Group(),runwayCount:0,thresholdCount:0,approximateBuildingCount:0,facadeBandCount:0,controlTowerCount:0,taxiwayWidthApproximationM:18,holds:[]},buckets={},labelPoints=[];record.group.name='airport_'+airport.icao;root.add(record.group);
  const ends=getRunwayEnds(airport,runways).filter(r=>r.canVisualize&&!r.closed),seen=new Set();
  for(const end of ends){if(seen.has(end.runwayId))continue;seen.add(end.runwayId);if(!finite(end.start.elevationM)||!finite(end.end.elevationM)){record.holds.push(`${end.runwayId}: elevation unavailable`);continue;}
   const a=local(airport,end.start),b=local(airport,end.end);a[1]+=.12;b[1]+=.12;strip(buckets,/grass|turf|gravel|dirt/i.test(end.surface)?'grass':'runway',a,b,end.widthM);record.runwayCount++;
   // Display-only paint dimensions: not an airport-specific marking survey.
   const paved=/^(ASP|CON|PEM|BIT|TAR|MAC|TREATED|PAVED)/i.test(end.surface);
   if(paved){
    const dx=b[0]-a[0],dz=b[2]-a[2],length=Math.hypot(dx,dz),ux=dx/length,uz=dz/length;
    const point=(distance,side=0,lift=.045)=>{const t=distance/length;return [a[0]+dx*t-uz*side,a[1]+(b[1]-a[1])*t+lift,a[2]+dz*t+ux*side];};
    for(let d=70;d<length-70;d+=60)strip(buckets,'mark',point(d),point(Math.min(d+30,length-70)),.45);
    for(const sign of [-1,1])strip(buckets,'mark',point(0,sign*(end.widthM/2-.65)),point(length,sign*(end.widthM/2-.65)),.25);
    if(end.lighted===true)for(let d=0;d<=length;d+=60)for(const sign of [-1,1]){
     const pos=point(d,sign*(end.widthM/2+1.0),.12),geometry=new THREE.BoxGeometry(.28,.14,.28);geometry.translate(...pos);bucketGeometry(buckets,'light',geometry);
    }
   }
   for(const direction of ends.filter(e=>e.runwayId===end.runwayId)){
    const p=local(airport,direction.start),q=local(airport,direction.end),dx=q[0]-p[0],dz=q[2]-p[2],d=Math.hypot(dx,dz),f=[dx/d,dz/d];
    const threshold=direction.threshold;
    if(threshold&&finite(threshold.elevationM)){const t=local(airport,threshold);t[1]+=.16;strip(buckets,'mark',[t[0]-f[1]*end.widthM*.44,t[1],t[2]+f[0]*end.widthM*.44],[t[0]+f[1]*end.widthM*.44,t[1],t[2]-f[0]*end.widthM*.44],1.2);record.thresholdCount++;}
    const label=threshold&&finite(threshold.elevationM)?local(airport,threshold):p;surfaceLabel(record,direction.ident,[label[0]+f[0]*50,label[1]+.18,label[2]+f[1]*50],f,end.widthM);
   }
  }
  const fc=(features.airports||features)[airport.icao];
  for(const feature of fc?.features||[]){const g=feature.geometry,props=feature.properties||{},kind=props.kind;
   if(kind==='taxiway_label'&&g?.type==='Point'&&typeof props.name==='string'&&g.coordinates?.every(finite))labelPoints.push({name:props.name.slice(0,24),pos:local(airport,{lon:g.coordinates[0],lat:g.coordinates[1]})});
   if(kind==='control_tower'&&g?.type==='Point'&&g.coordinates?.every(finite)&&record.controlTowerCount<4){
    const p=local(airport,{lon:g.coordinates[0],lat:g.coordinates[1]}),h=finite(props.heightM)&&props.heightM>0?props.heightM:25;
    const shaft=new THREE.CylinderGeometry(2.5,3,h,8);shaft.translate(p[0],airport.elevationM+h/2,p[2]);bucketGeometry(buckets,'terminal',shaft);
    const cab=new THREE.CylinderGeometry(5,4,3,8);cab.translate(p[0],airport.elevationM+h,p[2]);bucketGeometry(buckets,'windows',cab);record.controlTowerCount++;
    record.holds.push('Control tower source point retained; shaft/cab proportions and unknown 25m height are illustrative.');
   }
   if((kind==='apron'||kind==='terminal')&&g?.type==='Polygon')polygon(record,buckets,kind,g.coordinates,props);
   if((kind==='apron'||kind==='terminal')&&g?.type==='MultiPolygon')for(const rings of g.coordinates)polygon(record,buckets,kind,rings,props);
   if((kind==='taxiway'||kind==='taxilane')&&(g?.type==='LineString'||g?.type==='MultiLineString')){const lines=g.type==='LineString'?[g.coordinates]:g.coordinates;for(const line of lines)for(let i=1;i<line.length;i++){const a=local(airport,{lon:line[i-1][0],lat:line[i-1][1]}),b=local(airport,{lon:line[i][0],lat:line[i][1]});a[1]+=.075;b[1]+=.075;strip(buckets,'taxiway',a,b,finite(props.widthM)&&props.widthM>0?props.widthM:18);}}
  }
  labels(record,labelPoints);
  for(const [kind,data] of Object.entries(buckets)){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(data,3));geometry.computeVertexNormals();const mesh=new THREE.Mesh(geometry,materials[kind]);mesh.name=airport.icao+'_'+kind;record.group.add(mesh);}
  record.group.userData={source:'OurAirports + OpenStreetMap contributors',airport:airport.icao,thresholdMarkers:'Source displacement verified position; simple line marker is not authentic surveyed striping',terminalHeight:'Unknown heights shown as 12m illustrative blocks',facade:'Generic 1.6m window bands on source footprint edges; floor layout, glass and night lighting are not surveyed',taxiwayLabels:'Nearest eight OSM label anchors within 1200m; annotations, not physical surveyed signs',taxiwayWidth:'Unknown widths shown as 18m illustrative ribbons',runwayPaint:'Generic 30m dashes / 30m gaps and edge lines, not surveyed paint layout',runwayEdgeLights:'Source lighted=true only; illustrative 60m spacing, not surveyed lamp locations or photometry',airportBoundaryCreated:false};return record;
 }
 function clear(){for(const r of records){r.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(!Object.values(materials).includes(o.material))o.material.dispose();}});root.remove(r.group);}records.length=0;for(const t of textures)t.dispose();textures.length=0;}
 function setAirports(selected=[]){if(disposed)return [];clear();const seen=new Set();for(const value of selected){const a=typeof value==='string'?all.find(a=>a.icao===value||a.iata===value):value;if(!a?.icao||seen.has(a.icao))continue;seen.add(a.icao);if(!finite(a.lat)||!finite(a.lon)||!finite(a.elevationM))continue;records.push(build(a));}return records.map(r=>({icao:r.airport.icao,runwayCount:r.runwayCount,thresholdCount:r.thresholdCount,approximateBuildingCount:r.approximateBuildingCount,facadeBandCount:r.facadeBandCount,controlTowerCount:r.controlTowerCount,holds:r.holds}));}
 // Tangent-frame transport preserves local airport orientation while observer moves.
 function basis(lat,lon){const p=lat*RAD,l=lon*RAD;return [[-Math.sin(l),Math.cos(l),0],[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],[Math.sin(p)*Math.cos(l),Math.sin(p)*Math.sin(l),-Math.cos(p)]];}
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 function update({lat,lon,heading=0,altitude=0,weather,daylight=1,wetness}){if(disposed||!finite(lat)||!finite(lon))return;const appearance=airportAppearance({weather,daylight,wetness});for(const key of ['runway','apron','taxiway'])materials[key].roughness=appearance.pavedRoughness;materials.windows.emissiveIntensity=appearance.windowEmission;root.rotation.y=heading*RAD-Math.PI/2;const observer=basis(lat,lon);for(const r of records){const a=r.airport,origin=terrainLocalPosition(a.lat,a.lon,0,lat,lon,altitude),axes=basis(a.lat,a.lon);r.group.matrixAutoUpdate=false;r.group.matrix.set(dot(observer[0],axes[0]),dot(observer[0],axes[1]),dot(observer[0],axes[2]),origin.east,dot(observer[1],axes[0]),dot(observer[1],axes[1]),dot(observer[1],axes[2]),origin.up,dot(observer[2],axes[0]),dot(observer[2],axes[1]),dot(observer[2],axes[2]),origin.south,0,0,0,1);r.group.matrixWorldNeedsUpdate=true;r.group.visible=Math.hypot(origin.east,origin.south)<150000;if(r.group.visible)updateLabels(r,lat,lon);}}
 function dispose(){if(disposed)return;clear();for(const m of Object.values(materials))m.dispose();scene.remove(root);disposed=true;}
 return {setAirports,update,dispose,setAnnotationsVisible(value){annotationsVisible=!!value;for(const r of records)if(r.labels)r.labels.mesh.visible=annotationsVisible;}};
}

