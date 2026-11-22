import {terrainLocalPosition} from './terrain.js';
const RAD=Math.PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sourceDimension(value,fallback,min,max){const n=typeof value==='number'?value:/^\d+(\.\d+)?\s*(m)?$/.test(String(value||''))?parseFloat(value):NaN;return Number.isFinite(n)&&n>=min&&n<=max?n:fallback;}
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
/** Added structures retain mapped plan geometry; small architectural details are explicitly illustrative. */
export function createAirportStructures(THREE,scene,{airports=[],features={},data={}}={}){
 function basis(lat,lon){const p=lat*RAD,l=lon*RAD;return [[-Math.sin(l),Math.cos(l),0],[Math.cos(p)*Math.cos(l),Math.cos(p)*Math.sin(l),Math.sin(p)],[Math.sin(p)*Math.cos(l),Math.sin(p)*Math.sin(l),-Math.cos(p)]];}
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
 const root=new THREE.Group();root.name='mapped_airport_structures';scene.add(root);const records=[];let disposed=false;
 const mats={metal:new THREE.MeshStandardMaterial({color:0xb8c4ca,roughness:.48,metalness:.35}),roof:new THREE.MeshStandardMaterial({color:0xc5cbcc,roughness:.65}),glass:new THREE.MeshStandardMaterial({color:0x426777,roughness:.22,metalness:.2,emissive:0xffc789,emissiveIntensity:0}),rubber:new THREE.MeshStandardMaterial({color:0x20272b,roughness:.95}),building:new THREE.MeshStandardMaterial({color:0x9fa9ac,roughness:.82})};
 const all=Array.isArray(airports)?airports:airports.airports||[];
 function local(a,p){const q=terrainLocalPosition(p[1],p[0],a.elevationM,a.lat,a.lon,0);return new THREE.Vector3(q.east,q.up,q.south);}
 function add(b,k,geometry){const g=geometry.index?geometry.toNonIndexed():geometry;const a=b[k]??(b[k]=[]),p=g.attributes.position;for(let i=0;i<p.count;i++)a.push(p.getX(i),p.getY(i),p.getZ(i));if(g!==geometry)g.dispose();geometry.dispose();}
 function box(b,k,x,y,z,pos,angle=0){const g=new THREE.BoxGeometry(x,y,z);g.rotateY(angle);g.translate(pos.x,pos.y,pos.z);add(b,k,g);}
 function beam(b,k,a,z,width,height,lift){const d=z.clone().sub(a),len=Math.hypot(d.x,d.z);if(len<.1||len>300)return;const p=a.clone().add(z).multiplyScalar(.5);p.y+=lift;box(b,k,width,height,len,p,Math.atan2(d.x,d.z));}
 function build(a){const group=new THREE.Group();group.name=a.icao+'_structures';root.add(group);const b={},rec={airport:a,group,bridgeCount:0,bridgeSegments:0,buildingCount:0,facadeEdges:0,omittedBuildings:0};
  const terminals=((features.airports||features)[a.icao]?.features||[]).filter(f=>f.properties?.kind==='terminal'&&f.geometry?.type==='Polygon');
  // Frames and roof fascia stay on the already rendered terminal footprint, with no second solid shell.
  for(const f of terminals){const ring=f.geometry.coordinates[0],h=sourceDimension(f.properties.heightM,12,3,100);for(let i=1;i<ring.length;i++){const p=local(a,ring[i-1]),q=local(a,ring[i]),len=p.distanceTo(q);if(len<2||len>1000)continue;beam(b,'roof',p,q,.5,.45,h+.1);rec.facadeEdges++;
   const n=Math.min(80,Math.floor(len/5));for(let j=1;j<=n;j++){const t=j/(n+1),v=p.clone().lerp(q,t);v.y+=h/2;box(b,'metal',.13,h-.35,.13,v);}
  }}
  const sourced=(data.airports||{})[a.icao];
  for(const f of sourced?.features||[]){const p=f.properties||{};
   if(p.kind==='jet_bridge'&&f.geometry.type==='LineString'){
    const ps=f.geometry.coordinates.map(c=>local(a,c));if(ps.length<2)continue;const floor=sourceDimension(p.min_height,4.2,1.5,15),w=sourceDimension(p.width,2.8,1.5,8),height=sourceDimension(p.height,2.7,2,4);rec.bridgeCount++;
    for(let i=1;i<ps.length;i++){const u=ps[i-1],v=ps[i],d=v.clone().sub(u),len=Math.hypot(d.x,d.z);if(len<.2||len>150)continue;const nx=d.z/len,nz=-d.x/len;beam(b,'metal',u,v,w,.25,floor);beam(b,'roof',u,v,w+.15,.22,floor+height);beam(b,'glass',u,v,w-.12,height-.3,floor+height/2);for(const side of[-1,1]){const x=u.clone().add(new THREE.Vector3(nx*side*w/2,0,nz*side*w/2)),z=v.clone().add(new THREE.Vector3(nx*side*w/2,0,nz*side*w/2));beam(b,'metal',x,z,.11,.16,floor+.65);beam(b,'metal',x,z,.11,.16,floor+height-.35);for(let t=0;t<=len;t+=2.5){const q=x.clone().lerp(z,t/len);q.y+=floor+height/2;box(b,'metal',.09,height,.09,q);}}rec.bridgeSegments++;
    }
    // Generic support column and wheel carriage only on mapped bridge nodes. No aircraft attachment assumed.
    for(const [i,v]of ps.entries()){if(i!==0&&i!==ps.length-1)continue;const p=v.clone();p.y+=floor/2;box(b,'metal',.65,floor,.65,p);if(i===ps.length-1){p.y=a.elevationM+.65;box(b,'metal',w+1,.35,1,p);for(const side of[-1,1]){const g=new THREE.CylinderGeometry(.46,.46,.3,10);g.rotateZ(Math.PI/2);g.translate(v.x+side*(w/2+.3),a.elevationM+.46,v.z);add(b,'rubber',g);}}}
   }
   if(p.kind==='building'&&f.geometry.type==='Polygon'){
    const ring=f.geometry.coordinates[0],center=ring.reduce((q,c)=>[q[0]+c[0]/ring.length,q[1]+c[1]/ring.length],[0,0]);if(terminals.some(t=>inside(center,t.geometry.coordinates[0]))){rec.omittedBuildings++;continue;}
    const pts=ring.map(c=>local(a,c));let area=0;for(let i=1;i<pts.length;i++)area+=pts[i-1].x*pts[i].z-pts[i].x*pts[i-1].z;if(Math.abs(area)/2<50)continue;
    const levels=sourceDimension(p['building:levels'],0,1,30),h=sourceDimension(p.height,levels?levels*3.6:8,2,150),shape=new THREE.Shape(pts.map(p=>new THREE.Vector2(p.x,-p.z))),g=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1,curveSegments:1});g.rotateX(-Math.PI/2);g.translate(0,a.elevationM+.1,0);add(b,'building',g);rec.buildingCount++;
   }
  }
  for(const [k,positions]of Object.entries(b)){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.computeVertexNormals();const m=new THREE.Mesh(g,mats[k]);m.name=a.icao+'_structure_'+k;group.add(m);}
  group.userData={airport:a.icao,source:'OSM mapped footprints / bridge centerlines',bridgeCount:rec.bridgeCount,buildingCount:rec.buildingCount,details:'Bridge cross sections, support structure, glazing, wheels and facade mullions are illustrative; no exact survey or docking claim',buildingOverlapFilter:'Buildings whose centroid lies in an existing terminal omitted'};return rec;
 }
 function clear(){for(const r of records){r.group.traverse(o=>o.geometry?.dispose());root.remove(r.group);}records.length=0;}
 return{setAirports(selected=[]){if(disposed)return[];clear();const seen=new Set();for(const value of selected){const a=typeof value==='string'?all.find(x=>x.icao===value||x.iata===value):value;if(!a||seen.has(a.icao))continue;seen.add(a.icao);records.push(build(a));}return records.map(({airport,bridgeCount,bridgeSegments,buildingCount,facadeEdges,omittedBuildings})=>({icao:airport.icao,bridgeCount,bridgeSegments,buildingCount,facadeEdges,omittedBuildings}));},update(frame){if(disposed)return;mats.glass.emissiveIntensity=(1-clamp(frame.daylight??1,0,1))**2*.55;root.rotation.y=(frame.heading||0)*RAD-Math.PI/2;for(const r of records){const q=terrainLocalPosition(r.airport.lat,r.airport.lon,0,frame.lat,frame.lon,frame.altitude);const observer=basis(frame.lat,frame.lon),axes=basis(r.airport.lat,r.airport.lon);r.group.matrixAutoUpdate=false;r.group.matrix.set(dot(observer[0],axes[0]),dot(observer[0],axes[1]),dot(observer[0],axes[2]),q.east,dot(observer[1],axes[0]),dot(observer[1],axes[1]),dot(observer[1],axes[2]),q.up,dot(observer[2],axes[0]),dot(observer[2],axes[1]),dot(observer[2],axes[2]),q.south,0,0,0,1);r.group.matrixWorldNeedsUpdate=true;r.group.visible=Math.hypot(q.east,q.south)<35000;}},dispose(){if(disposed)return;disposed=true;clear();for(const m of Object.values(mats))m.dispose();scene.remove(root);}};
}
