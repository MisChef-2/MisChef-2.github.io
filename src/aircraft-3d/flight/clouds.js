/** Illustrative deterministic clouds; no observed cloud-base/voxel meteorology.
 * Coverage controls occupied cells, not the opacity of every individual cloud. */
const R=6371000,RAD=Math.PI/180,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const hash=(x,y,s=0)=>{let n=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
function noise(x,y,s){const i=Math.floor(x),j=Math.floor(y),a=smooth(0,1,x-i),b=smooth(0,1,y-j);return (hash(i,j,s)*(1-a)+hash(i+1,j,s)*a)*(1-b)+(hash(i,j+1,s)*(1-a)+hash(i+1,j+1,s)*a)*b;}
function texture(THREE,layer){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),im=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const u=x/255,v=y/255;let n=0,a=.55;for(let o=0;o<5;o++){const f=3*2**o;n+=a*noise(u*f,v*f,13+layer*19+o);a*=.5;}
 const edge=1-smooth(.34,1,Math.hypot((u-.5)*2,(v-.5)*2)),wisps=layer===2?.45+.55*noise(u*2,v*16,71):1,shade=clamp(.67+.27*(1-v)+.13*(n-.5),0,1),i=(y*256+x)*4;
 im.data[i]=im.data[i+1]=im.data[i+2]=Math.round(shade*255);im.data[i+3]=Math.round(smooth(.22,.72,n)*edge*wisps*255);}
 ctx.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.NoColorSpace;return t;
}
export function createClouds(THREE,scene,camera=null){
 const configs=[{base:1500,depth:650,cell:6200,width:2900,height:950,opacity:.64},{base:4800,depth:1100,cell:9000,width:4200,height:1100,opacity:.47},{base:9800,depth:650,cell:12500,width:6500,height:450,opacity:.30}],HALF=6,PUFFS=4,MAX=13*13*PUFFS;
 const group=new THREE.Group();group.name='flight_procedural_clouds';scene.add(group);
 const layers=configs.map((cfg,index)=>{const geometry=new THREE.PlaneGeometry(1,1),map=texture(THREE,index),detail=new THREE.InstancedBufferAttribute(new Float32Array(MAX*4),4);detail.setUsage(THREE.DynamicDrawUsage);geometry.setAttribute('cloudDetail',detail);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,uniforms:{cloudMap:{value:map},daylight:{value:1}},vertexShader:`
 attribute vec4 cloudDetail;varying vec2 vUv;varying vec2 vCloud;
 #include <common>
 #include <logdepthbuf_pars_vertex>
 void main(){vUv=uv;vCloud=cloudDetail.zw;vec4 center=modelViewMatrix*instanceMatrix*vec4(0.,0.,0.,1.);center.xy+=position.xy*cloudDetail.xy;gl_Position=projectionMatrix*center;
 #include <logdepthbuf_vertex>
 }`,fragmentShader:`
 uniform sampler2D cloudMap;uniform float daylight;varying vec2 vUv;varying vec2 vCloud;
 #include <common>
 #include <logdepthbuf_pars_fragment>
 void main(){vec4 tex=texture2D(cloudMap,vUv);float alpha=tex.a*vCloud.x;if(alpha<.003)discard;
 #include <logdepthbuf_fragment>
 vec3 tint=mix(vec3(.025,.034,.058),vec3(.97,.985,1.),daylight);gl_FragColor=vec4(tint*tex.rgb*vCloud.y,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const mesh=new THREE.InstancedMesh(geometry,material,MAX);mesh.name=`cloud_layer_${index}`;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.frustumCulled=false;mesh.count=0;group.add(mesh);return {cfg,index,mesh,geometry,material,map,detail};});
 const matrix=new THREE.Matrix4(),eye=new THREE.Vector3();let disposed=false,lastTime=null,driftE=0,driftN=0;
 function update({timeSeconds=0,lat=0,lon=0,heading=0,altitude=0,cloudCover=0,windSpeed=0,windDirection=0,daylight=1,precipitation=0}={}){
 if(disposed)return {immersion:0};
 const latitude=clamp(Number.isFinite(lat)?lat:0,-80,80),cos=Math.cos(latitude*RAD),north=R*Math.log(Math.tan(Math.PI/4+latitude*RAD/2)),east=R*(Number.isFinite(lon)?lon:0)*RAD,cover=clamp(Number.isFinite(cloudCover)?cloudCover:0,0,1),h=(Number.isFinite(heading)?heading:0)*RAD;
 const t=Number.isFinite(timeSeconds)?timeSeconds:0,w=clamp(Number.isFinite(windSpeed)?windSpeed:0,0,150),wd=(Number.isFinite(windDirection)?windDirection:0)*RAD;
 // Meteorological wind direction is FROM, so advect toward the opposite direction.
 const dt=lastTime===null?0:t-lastTime;
 if(dt>=0){driftE-=Math.sin(wd)*w*dt/cos;driftN-=Math.cos(wd)*w*dt/cos;}
 else {driftE=-Math.sin(wd)*w*t/cos;driftN=-Math.cos(wd)*w*t/cos;}
 lastTime=t;
 if(camera)camera.getWorldPosition(eye);else eye.set(0,0,0);let immersion=0;
 for(const layer of layers){const {cfg,index,mesh,detail,material}=layer,cell=cfg.cell,columns=Math.round(2*Math.PI*R/cell),eastCell=2*Math.PI*R/columns,cx=Math.floor((east-driftE)/eastCell),cy=Math.floor((north-driftN)/cell),radius=cell*cos*(HALF-.5),sprites=[],opacity=cfg.opacity*(.85+.15*cover);
 material.uniforms.daylight.value=clamp(Number.isFinite(daylight)?daylight:1,0,1);
 for(let iy=cy-HALF;iy<=cy+HALF;iy++)for(let ix=cx-HALF;ix<=cx+HALF;ix++){const key=((ix%columns)+columns)%columns,threshold=hash(key,iy,index+1)*.85,density=smooth(threshold,threshold+.08,cover);if(density<.002)continue;
 for(let k=0;k<PUFFS;k++){const s=index*17+k+101,e=((ix+.12+.76*hash(key,iy,s))*eastCell+driftE-east)*cos,n=((iy+.12+.76*hash(key,iy,s+11))*cell+driftN-north)*cos,dist=Math.hypot(e,n),fade=1-smooth(radius*.66,radius,dist);if(fade<=0)continue;
 const wet=clamp(precipitation/5,0,1),base=cfg.base-(index===0?700*wet:0);const z=base+(hash(key,iy,s+31)-.5)*cfg.depth,dy=z-altitude,width=cfg.width*(.65+.7*hash(key,iy,s+41)),height=cfg.height*(.7+.6*hash(key,iy,s+51))*(1+(index===0?wet*.4:0)),d=Math.hypot(dist,dy);
 immersion=Math.max(immersion,(1-smooth(height*.15,height*.7,Math.abs(dy)))*(1-smooth(width*.12,width*.55,dist))*density*opacity);
 sprites.push({x:n*Math.cos(h)+e*Math.sin(h),y:dy,z:e*Math.cos(h)-n*Math.sin(h),width,height,alpha:opacity*density*fade*smooth(12,160,d),shade:(.86+.14*hash(key,iy,s+61))*(1-wet*.25),distance:d});}}
 sprites.sort((a,b)=>b.distance-a.distance);mesh.count=sprites.length;
 for(let i=0;i<sprites.length;i++){const s=sprites[i];matrix.makeTranslation(s.x+eye.x,s.y+eye.y,s.z+eye.z);mesh.setMatrixAt(i,matrix);detail.setXYZW(i,s.width,s.height,s.alpha,s.shade);}mesh.instanceMatrix.needsUpdate=true;detail.needsUpdate=true;}
 return {immersion:clamp(immersion*1.8,0,1),illustrative:true};}
 function dispose(){if(disposed)return;disposed=true;scene.remove(group);for(const l of layers){l.geometry.dispose();l.material.dispose();l.map.dispose();}}
 return {update,dispose};
}
