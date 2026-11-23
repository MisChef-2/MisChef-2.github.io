import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const $ = id => document.getElementById(id);
const host = $('canvas-host');
const lightLabel=document.createElement('label');
lightLabel.innerHTML='<input type="checkbox" id="neutral-light" checked> 중립 조명';
lightLabel.title='외부 도색과 재질 비교용 백색 조명. 실제 도료의 측색값을 인증하지 않습니다.';
document.querySelector('.tools').append(lightLabel);
$('neutral-light').addEventListener('change',()=>{if(model)applyVisibility();});
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (error) {
  $('loading').querySelector('strong').textContent = '3D 화면을 시작할 수 없습니다';
  $('load-detail').textContent = 'WebGL을 지원하는 브라우저에서 하드웨어 가속을 켜고 다시 열어주세요.';
  $('loading').querySelector('.spinner').hidden = true;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x101a25, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;
host.appendChild(renderer.domElement);
const scene = new THREE.Scene();
// Local procedural studio: no HDR downloads or third-party asset requests.
const studio = new RoomEnvironment();
const pmrem = new THREE.PMREMGenerator(renderer);
const studioMap = pmrem.fromScene(studio, .04);
scene.environment = studioMap.texture;
scene.environmentIntensity = .65;
studio.dispose();
pmrem.dispose();
const camera = new THREE.PerspectiveCamera(42, 1, 0.03, 1400);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1;
controls.maxDistance = 240;
const hemi = new THREE.HemisphereLight(0xd6eaff, 0x556b71, 2.5);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffefd7, 3.5);
key.position.set(35, 55, 30);
scene.add(key);
const rim = new THREE.DirectionalLight(0x97caff, 2.8);
rim.position.set(-35, 18, -35);
scene.add(rim);
const fill = new THREE.DirectionalLight(0xffffff, 1.4);
fill.position.set(5, 8, 45);
scene.add(fill);
const cabinLight = new THREE.PointLight(0xfff1dc, 25, 16, 1);
scene.add(cabinLight);
const grid = new THREE.GridHelper(160, 32, 0x374b5b, 0x273743);
grid.material.transparent = true;
grid.material.opacity = 0.55;
scene.add(grid);
const ground = new THREE.Mesh(new THREE.CircleGeometry(90, 96), new THREE.MeshBasicMaterial({ color: 0x17242f, transparent: true, opacity: 0.22, depthWrite: false }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.02;
scene.add(ground);
window.__hubScene = { grid, ground };
// A procedural parked-aircraft environment, visible through real cockpit openings.
// This changes only the exterior scene; no aircraft shell is hidden for cockpit view.
const flightdeckWorld = new THREE.Group(); flightdeckWorld.visible = false;
const sky = new THREE.Mesh(new THREE.SphereGeometry(650,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:'varying vec3 vWorld; void main(){ vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',fragmentShader:'varying vec3 vWorld; void main(){float h=normalize(vWorld-cameraPosition).y; vec3 horizon=vec3(.76,.84,.88);vec3 zenith=vec3(.30,.52,.73);vec3 earth=vec3(.35,.43,.38);vec3 c=h>=0.0?mix(horizon,zenith,smoothstep(0.0,.7,h)):mix(horizon,earth,smoothstep(0.0,.12,-h));gl_FragColor=vec4(c,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
sky.renderOrder=-10; flightdeckWorld.add(sky);
const apron = new THREE.Mesh(new THREE.PlaneGeometry(1250,1250),new THREE.MeshBasicMaterial({color:0x7d8c83})); apron.rotation.x=-Math.PI/2; apron.position.y=-.06; flightdeckWorld.add(apron);
const runway = new THREE.Mesh(new THREE.PlaneGeometry(1100,44),new THREE.MeshBasicMaterial({color:0x63747a})); runway.rotation.x=-Math.PI/2; runway.position.set(250,-.045,0); flightdeckWorld.add(runway);
const markingMaterial = new THREE.MeshBasicMaterial({color:0xe5e6dd});
for(let x=55;x<700;x+=36){const marking=new THREE.Mesh(new THREE.PlaneGeometry(18,.35),markingMaterial);marking.rotation.x=-Math.PI/2;marking.position.set(x,-.035,0);flightdeckWorld.add(marking);}
for(const z of [-21,21]){const edge=new THREE.Mesh(new THREE.PlaneGeometry(1100,.22),markingMaterial);edge.rotation.x=-Math.PI/2;edge.position.set(250,-.035,z);flightdeckWorld.add(edge);}
scene.add(flightdeckWorld);
const dimGroup = new THREE.Group();
dimGroup.visible = false;
scene.add(dimGroup);
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
const cutRear = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const cutFront = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
const cutBottom = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
const cutTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const cutPlanes = [clipPlane, cutRear, cutFront, cutBottom];
const loader = new GLTFLoader();
{ const draco = new DRACOLoader(); draco.setDecoderPath('vendor/three/addons/libs/draco/gltf/'); loader.setDRACOLoader(draco); }
let fleet = [], spec, meta = {}, model, token = 0, view = 'exterior', upperDeck = false;
let liveryReferences = [], liveryDefaults = {};
let variantManifest={defaults:{},variants:[]}, activeVariant=null;
const variantsReady=fetch('../variants-v8.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(data=>{variantManifest={defaults:data.defaults||{},variants:data.variants||[]};}).catch(()=>{});
function variantPath(path){return typeof path==='string' && /^(?:models|variants)\/[a-zA-Z0-9_./-]+\.(?:glb|json|blend)$/.test(path) && !path.includes('..') ? '../'+path : null;}
function builtVariant(v){return v?.buildStatus==='built' && variantPath(v.modelUrl) && variantPath(v.metadataUrl);}
function updateVariantSelector(){
  let panel=$('aircraft-versions');
  if(!panel){panel=document.createElement('div');panel.id='aircraft-versions';panel.className='aircraft-versions';panel.innerHTML='<label for="aircraft-version">항공사·기체 버전</label><select id="aircraft-version" aria-describedby="version-status"></select><small id="version-status"></small>';document.querySelector('.measurements').before(panel);$('aircraft-version').onchange=e=>loadAircraft(spec.id,e.target.value);}
  const select=$('aircraft-version');select.replaceChildren();
  const base=document.createElement('option');base.value='';base.textContent='기본 연구 모델 · 현재 제작본';select.append(base);
  for(const v of variantManifest.variants.filter(x=>x.aircraftId===spec.id)){
    const option=document.createElement('option');option.value=v.id;option.disabled=!builtVariant(v);
    option.textContent=[v.airline||v.label,v.registration,v.era].filter(Boolean).join(' · ')+(option.disabled?' — 자료 확인 중':'');select.append(option);
  }
  select.value=activeVariant?.id||'';
  const cabinEvidence=meta.interiorDetailV12?.brandConfiguration==='SOURCE_REFERENCED_CLASS_PRODUCTS_AND_ROW_COUNTS_METRIC_LAYOUT_APPROXIMATE';
  $('version-status').textContent=cabinEvidence?`${activeVariant?.airline||'현재 모델'} · 공개 좌석 구성 반영 · 좌석 형상과 설비 위치는 근사`:activeVariant?`별도 기체 파일 · ${activeVariant.interiorStatusLabel||'객실 구성은 항공사·등록기호별 실측 검증 전입니다.'}`:'기본 모델의 객실은 예시 배치입니다. 자료 확인 중인 버전은 아직 선택할 수 없습니다.';
}
const referencesReady = fetch('../livery-references.json', {cache:'no-store'}).then(r => r.ok ? r.json() : {}).then(data => { liveryReferences = data.references || []; liveryDefaults = data.defaults || {}; if (spec) updatePaintReference(); }).catch(() => {});
let shellMaterials = [], frameMeshes = [], cabinMeshes = [], linerMaterials = [], mechanicalMeshes = [], cargoMeshes = [], attachmentMaterials = [], cabinX = 0;
const keys = new Set();
const directionLabel = document.createElement('span');
directionLabel.id = 'cabin-direction'; directionLabel.hidden = true;
$('view-label').after(directionLabel);
const faceNose = document.createElement('button'); faceNose.textContent = '기수 쪽 바라보기';
faceNose.onclick = () => { controls.target.copy(camera.position).add(new THREE.Vector3(.05,0,0)); controls.update(); };
$('walk-controls').append(faceNose);
controls.addEventListener('change', () => {
  directionLabel.hidden = view !== 'cabin';
  if (view !== 'cabin') return;
  const dx = controls.target.x - camera.position.x;
  const dz = controls.target.z - camera.position.z;
  const facing = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? '기수 방향' : '꼬리 방향') : (dz > 0 ? '우현 방향' : '좌현 방향');
  directionLabel.textContent = ` · ${facing} · 좌우는 기수 기준`;
});
const viewLabels = { exterior: '외부 전체', nose: '기수·조종창', engine: '엔진 형상·연결부', equipment:'외부 조명·안테나·센서', cutaway: '객실·전후 화물칸·구조 통합 단면', cabin: '객실 탐색', cockpit: '조종실', cargo: '화물칸', facility:'기내 설비 점검', top: '평면 보기' };
viewLabels.tail='꼬리 끝·후방 동체';
for (const [mode,label] of [['nose','기수'],['tail','꼬리 끝'],['engine','엔진']]) {
  const button=document.createElement('button');button.dataset.view=mode;button.textContent=label;
  document.querySelector('.view-controls').append(button);
}
const layerTools = document.querySelector('.tools');
const cabinToggle = document.createElement('label'); cabinToggle.innerHTML = '<input type="checkbox" id="cabin-layer" checked>객실 내장'; layerTools.insertBefore(cabinToggle, $('dimensions').parentElement);
const equipmentToggle = document.createElement('label'); equipmentToggle.innerHTML = '<input type="checkbox" id="mechanical" disabled>기계 장비 <small id="mechanical-status">제작 중</small>'; layerTools.insertBefore(equipmentToggle, $('dimensions').parentElement);
const cargoButton = document.createElement('button'); cargoButton.dataset.view = 'cargo'; cargoButton.textContent = '화물칸'; cargoButton.disabled = true; document.querySelector('.view-controls').insertBefore(cargoButton, document.querySelector('[data-view="top"]'));
const cargoZoneButton = document.createElement('button'); cargoZoneButton.id = 'cargo-zone'; cargoZoneButton.textContent = '전방 / 후방 화물칸'; cargoZoneButton.hidden=true; layerTools.append(cargoZoneButton);
let cargoZoneIndex = 0;
let cockpitSeat = 'observer';
let engineEntries = [], engineIndex = 0, engineAngle = 'oblique';
let gearEntries=[], gearIndex=0;
viewLabels.gear='랜딩기어';
const gearButton=document.createElement('button');gearButton.dataset.view='gear';gearButton.textContent='랜딩기어';gearButton.disabled=true;document.querySelector('.view-controls').append(gearButton);
const gearPanel=document.createElement('div');gearPanel.className='cockpit-views';gearPanel.id='gear-inspection';gearPanel.hidden=true;gearPanel.setAttribute('role','group');gearPanel.setAttribute('aria-label','랜딩기어 검사');document.querySelector('.stage').append(gearPanel);
function prepareGearInspection(){
  gearEntries=[];gearIndex=0;gearPanel.replaceChildren();
  const wheels=meta.detailV19?.landingGear?.wheelCenters || [];
  if(!wheels.length){gearButton.disabled=true;return;}
  const front=Math.max(...wheels.map(w=>w.positionBlenderXYZ[0]));
  const selections=[['기수기어',w=>w.positionBlenderXYZ[0]>front-.1],['좌측 주기어',w=>w.positionBlenderXYZ[0]<front-.1&&w.positionBlenderXYZ[1]>0],['우측 주기어',w=>w.positionBlenderXYZ[0]<front-.1&&w.positionBlenderXYZ[1]<0]];
  for(const [label,select] of selections){
    const subset=wheels.filter(select);if(!subset.length)continue;
    const bounds=new THREE.Box3();for(const w of subset){const [x,y,z]=w.positionBlenderXYZ;bounds.expandByPoint(new THREE.Vector3(x,z,-y));}
    gearEntries.push({label,center:bounds.getCenter(new THREE.Vector3()),bounds:new THREE.Box3()});
  }
  model.updateMatrixWorld(true);
  model.traverse(o=>{if(!o.isMesh || !o.name.startsWith('gear_'))return;const a=o.geometry.getAttribute('position');if(!a)return;const point=new THREE.Vector3();for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);let closest=gearEntries[0],distance=Infinity;for(const entry of gearEntries){const d=(entry.center.x-point.x)**2+(entry.center.z-point.z)**2;if(d<distance){closest=entry;distance=d;}}closest.bounds.expandByPoint(point);}});
  gearEntries=gearEntries.filter(e=>!e.bounds.isEmpty());gearButton.disabled=!gearEntries.length;
  gearEntries.forEach((e,i)=>{const b=document.createElement('button');b.textContent=e.label;b.dataset.gear=String(i);b.onclick=()=>{gearIndex=i;setView('gear');};gearPanel.append(b);});
  const link=document.createElement('a');link.href=$('research').href;link.textContent='실사진·수정 전후 ↗';gearPanel.append(link);
}
const enginePanel=document.createElement('div');enginePanel.id='engine-inspection';enginePanel.className='cockpit-views';enginePanel.hidden=true;enginePanel.setAttribute('role','group');enginePanel.setAttribute('aria-label','엔진 형상·연결부 검사');document.querySelector('.stage').append(enginePanel);
function prepareEngineInspection(){
  engineEntries=[];engineIndex=0;engineAngle='oblique';model.updateMatrixWorld(true);
  model.traverse(o=>{if(o.isMesh && o.name.toLowerCase().startsWith('engine_pylons')){
    const bounds=new THREE.Box3().setFromObject(o),center=bounds.getCenter(new THREE.Vector3());
    // A multi-material pylon can export as several meshes; it remains one engine station.
    const existing=engineEntries.find(e=>Math.abs(e.center.z-center.z)<.15);
    if(existing){existing.bounds.union(bounds);existing.bounds.getCenter(existing.center);}
    else engineEntries.push({bounds,center});
  }});
  engineEntries.sort((a,b)=>a.center.z-b.center.z);
  for(const e of engineEntries)e.engineBounds=new THREE.Box3();
  // A single exported mesh may contain both engines. Assign actual vertices to
  // their nearest lateral engine station so the view includes inlet and exhaust.
  model.traverse(o=>{
    if(!o.isMesh || !o.name.toLowerCase().startsWith('engine_') || !engineEntries.length)return;
    const positions=o.geometry.getAttribute('position');if(!positions)return;
    const point=new THREE.Vector3();
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);
      let nearest=engineEntries[0];
      for(const e of engineEntries)if(Math.abs(e.center.z-point.z)<Math.abs(nearest.center.z-point.z))nearest=e;
      nearest.bounds.expandByPoint(point);
      if(!o.name.toLowerCase().startsWith('engine_pylons'))nearest.engineBounds.expandByPoint(point);
    }
  });
  enginePanel.replaceChildren();const title=document.createElement('span');title.textContent='엔진 선택';enginePanel.append(title);
  engineEntries.forEach((entry,i)=>{
    const side=entry.center.z<-.1?'왼쪽':entry.center.z>.1?'오른쪽':'중앙';
    const peers=engineEntries.filter(e=>side==='중앙'?Math.abs(e.center.z)<=.1:Math.sign(e.center.z)===Math.sign(entry.center.z)).sort((a,b)=>Math.abs(a.center.z)-Math.abs(b.center.z));
    entry.label=side+(peers.length>1?(peers.indexOf(entry)===0?' 안쪽':' 바깥쪽'):'');
    const button=document.createElement('button');button.textContent=entry.label;button.dataset.engine=String(i);button.onclick=()=>{engineIndex=i;setView('engine');};enginePanel.append(button);
  });
  for(const [angle,label] of [['side','측면'],['oblique','사선'],['front','흡입구'],['rear','후방 노즐']]){const button=document.createElement('button');button.textContent=label;button.dataset.engineAngle=angle;button.onclick=()=>{engineAngle=angle;setView('engine');};enginePanel.append(button);}
  const comparison=document.createElement('a');comparison.href=(meta.engineReviewV18 || meta.engineReviewV17 || meta.engineReviewV16 || meta.exteriorReviewV15)?$('research').href:`../review/pylon-v14/index.html#${spec.id}`;comparison.textContent='실제 사진·수정 전후 ↗';enginePanel.append(comparison);
}
let exteriorEquipment=[],exteriorEquipmentIndex=0,aircraftLightMaterials=[];
const equipmentButton=document.createElement('button');equipmentButton.dataset.view='equipment';equipmentButton.textContent='외부 장비';equipmentButton.disabled=true;document.querySelector('.view-controls').append(equipmentButton);
const equipmentPanel=document.createElement('div');equipmentPanel.id='exterior-equipment';equipmentPanel.className='cockpit-views';equipmentPanel.hidden=true;
equipmentPanel.innerHTML='<label>외부 장비 <select id="equipment-select" aria-label="검사할 외부 장비"></select></label><span id="equipment-note"></span><a id="equipment-source" target="_blank" rel="noopener">자료 출처 ↗</a>';
document.querySelector('.stage').append(equipmentPanel);
const lightSwitch=document.createElement('label');lightSwitch.innerHTML='<input type="checkbox" id="aircraft-lights" checked> 기체 조명';document.querySelector('.tools').append(lightSwitch);
$('aircraft-lights').addEventListener('change',()=>applyVisibility());
$('equipment-select').addEventListener('change',()=>{exteriorEquipmentIndex=Number($('equipment-select').value);setView('equipment');});
function prepareExteriorEquipment(){
  const fixtures=meta.detailV19?.fixtures || meta.engineDetailV18?.fixtures || meta.engineDetailV17?.fixtures || meta.engineDetailV16?.fixtures || meta.exteriorEquipmentV16 || [];
  exteriorEquipment=[];exteriorEquipmentIndex=0;aircraftLightMaterials=[];$('equipment-select').replaceChildren();
  model.traverse(o=>{
    if(!o.isMesh)return;
    for(const m of (Array.isArray(o.material)?o.material:[o.material])){
      if((/^exterior_light_v(?:16|17|18)_/.test(m.name) || o.name.startsWith('exterior_lights_') || o.name.startsWith('wing_navigation_lights')) && m.emissive && m.emissive.getHex()!==0){
        m.userData.aircraftEmissiveIntensity=m.emissiveIntensity;aircraftLightMaterials.push(m);
      }
    }
  });
  for(const fixture of Array.isArray(fixtures)?fixtures:[]){
    const names=fixture.objectNames || [];const bounds=new THREE.Box3();
    model.traverse(o=>{if(o.isMesh && names.some(n=>o.name===n || o.name.startsWith(n+'_')))bounds.union(new THREE.Box3().setFromObject(o));});
    if(bounds.isEmpty())continue;
    const index=exteriorEquipment.length;
    const side=(fixture.positionBlenderXYZ?.[1]??0)>0?'좌측':'우측';
    let label=['navigation','navigation_light'].includes(fixture.type)?`${side} ${side==='좌측'?'적색':'녹색'} 항법등`:fixture.type==='strobe'?`${side} 백색 스트로브`:fixture.label || fixture.id || fixture.type;
    label=label.replace('GNSS/GPS antenna','GNSS/GPS 안테나').replace('pitot bracket','피토관 받침').replace('PITOT','피토관').replace('AOA','받음각 센서').replace('STATIC','정압구').replace(/\bTAT\b/g,'온도 센서').replace(' left',' · 좌측').replace(' right',' · 우측').replace('Upper red anti-collision beacon','상부 적색 충돌방지등').replace('Lower red anti-collision beacon','하부 적색 충돌방지등').replace('Existing navigation/strobe lamp - preserved','항법등·스트로브 · 기존 위치');
    label=label.replace('NLG taxi / take-off dual-filament light','기수 기어 택시·이륙 겸용등').replace('NLG runway turn-off','기수 기어 활주로 이탈등').replace('NLG taxi light','기수 기어 택시등').replace('NLG take-off light','기수 기어 이륙등').replace('Wingtip white strobe','날개 끝 백색 스트로브').replace('Tail white navigation light','후미 백색 항법등').replace('Tail white strobe','후미 백색 스트로브').replace('Horizontal-stabilizer logo floodlight','수평꼬리날개 로고 조명').replace('Engine Scan light','엔진 점검등').replace('Wing Scan light','날개 점검등');
    if(fixture.type?.endsWith('_LIGHT') && Math.abs(fixture.positionBlenderXYZ?.[1]??0)>.1 && !label.includes('좌측') && !label.includes('우측') && !label.includes('기존 위치'))label+=` · ${side}`;
    exteriorEquipment.push({...fixture,label,bounds,center:bounds.getCenter(new THREE.Vector3())});
    const option=document.createElement('option');option.value=String(index);option.textContent=label;$('equipment-select').append(option);
  }
  equipmentButton.disabled=!exteriorEquipment.length;$('aircraft-lights').disabled=!aircraftLightMaterials.length;
}
const cockpitViews = document.createElement('div'); cockpitViews.id='cockpit-views';cockpitViews.className='cockpit-views';cockpitViews.hidden=true;cockpitViews.innerHTML='<span>조종실 시점</span><button data-pilot="left">왼쪽 좌석</button><button data-pilot="observer" class="active">중앙</button><button data-pilot="right">오른쪽 좌석</button><small>창밖은 가상 지상 환경</small>';document.querySelector('.tools').after(cockpitViews);
const facilityButton=document.createElement('button');facilityButton.dataset.view='facility';facilityButton.textContent='설비';facilityButton.disabled=true;document.querySelector('.view-controls').insertBefore(facilityButton,document.querySelector('[data-view="top"]'));
const facilitiesPanel=document.createElement('section');facilitiesPanel.id='facilities-panel';facilitiesPanel.className='facilities-panel';facilitiesPanel.hidden=true;facilitiesPanel.innerHTML='<div class="facilities-heading"><strong>기내 설비 점검</strong><small>배치와 문 개폐는 시각적 개념 표현</small></div><div id="facility-list" role="group" aria-label="설비 시점"></div><div class="door-tools"><label>탑승문 <select id="door-select" aria-label="개폐할 탑승문"></select></label><button id="door-toggle" disabled>탑승문 열기</button><span id="door-status" aria-live="polite"></span></div>';document.querySelector('.tools').after(facilitiesPanel);
let facilities=[],activeFacility=null,doorEntries=[];
const classPanel=document.createElement('div');classPanel.id='class-controls';classPanel.className='walk-controls';classPanel.hidden=true;$('walk-controls').after(classPanel);
const classLabels={first:'퍼스트',business:'프레스티지 / 비즈니스',premium:'프리미엄 이코노미',comfort:'컴포트',economy:'일반석'};
function focusCabinClass(zone){
  upperDeck=zone.deck>0;setView('cabin');
  $('deck').textContent=upperDeck?'하층으로':'상층으로';
  const preset=meta.cameras?.[zone.id];if(!preset)return;
  const rows=zone.renderedRows||[];
  const x=rows.length?rows[Math.floor(rows.length/2)].x:(zone.frontX+zone.rearX)/2;
  const z=-(zone.aisleCentersY?.[0]||0),eye=preset.position[1];
  camera.position.set(x,eye,z);controls.target.set(x+3,eye-.30,z);cabinX=x;controls.update();
  $('view-label').textContent=`${classLabels[zone.id]||zone.label} · ${zone.product}`;
  classPanel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.classId===zone.id)));
  const c=cabinInfo();$('walk-position').value=(x-c.rear)/(c.front-c.rear)*100;
}
function updateClassControls(){
  classPanel.replaceChildren();const zones=meta.cabinClasses||[];
  const title=document.createElement('span');title.textContent=zones.length?'좌석 클래스':'예시 객실 · 실제 클래스 구성 미확인';classPanel.append(title);
  for(const zone of zones){
    if(!zone.generatedCount)continue;
    const button=document.createElement('button');button.textContent=classLabels[zone.id]||zone.label;button.dataset.classId=zone.id;button.onclick=()=>focusCabinClass(zone);classPanel.append(button);
  }
  if(zones.length){const note=document.createElement('small');note.textContent='공식 좌석 상품·배열 반영 · 좌석 형상과 구역 위치는 근사';classPanel.append(note);}
}
const sectionNote = document.createElement('div'); sectionNote.id = 'section-note'; sectionNote.className = 'section-note'; sectionNote.hidden = true; sectionNote.innerHTML = '<strong>구간 개방 단면</strong><span>기수·꼬리와 반대쪽 외피 유지</span><small>장비 배치·구조는 이해를 위한 개념 표현</small>'; document.querySelector('.stage').append(sectionNote);

function disposeModel(object) {
  if (!object) return;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  object.traverse(o => {
    if (o.geometry) geometries.add(o.geometry);
    for (const m of (Array.isArray(o.material) ? o.material : [o.material]).filter(Boolean)) {
      materials.add(m);
      for (const v of Object.values(m)) if (v?.isTexture) textures.add(v);
    }
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
}
function renderFleet(query = '') {
  const nav = $('fleet'); nav.replaceChildren();
  let maker = '';
  for (const item of fleet.filter(s => `${s.name} ${s.variant} ${s.id}`.toLowerCase().includes(query.toLowerCase()))) {
    const nextMaker = item.id.startsWith('boeing') ? 'BOEING' : 'AIRBUS';
    if (nextMaker !== maker) {
      const label = document.createElement('div'); label.className = 'fleet-group'; label.textContent = nextMaker; nav.append(label); maker = nextMaker;
    }
    const button = document.createElement('button'); button.className = 'fleet-item'; button.dataset.id = item.id;
    button.classList.toggle('active', item.id === spec?.id);
    button.setAttribute('aria-current', item.id === spec?.id ? 'true' : 'false');
    const index = document.createElement('span'); index.className = 'index'; index.textContent = String(item.order).padStart(2, '0');
    const text = document.createElement('span'), strong = document.createElement('strong'), small = document.createElement('small');
    strong.textContent = item.variant.replace(/ 기준$/, ''); small.textContent = `${item.engineCount} ENGINE · ${item.doubleDeck ? 'DOUBLE DECK' : item.hump ? 'UPPER DECK' : item.seatLayout.length > 2 ? 'WIDE BODY' : 'AIRLINER'}`;
    text.append(strong, small); button.append(index, text); button.onclick = () => loadAircraft(item.id); nav.append(button);
  }
  if (!nav.children.length) { const p = document.createElement('p'); p.className = 'no-results'; p.textContent = '일치하는 기종이 없습니다.'; nav.append(p); }
}
function message(title, detail, retry = false) {
  $('loading').hidden = false;
  $('loading').querySelector('strong').textContent = title;
  $('load-detail').textContent = detail;
  $('loading').querySelector('.spinner').hidden = retry;
  $('retry').hidden = !retry;
}
function isInside(mode=view){return ['cabin','cockpit'].includes(mode)||(mode==='facility'&& activeFacility?.type!=='exterior'&&!activeFacility?.camera?.exterior);}
function prepareFacilitiesAndDoors(){
  facilities=[];activeFacility=null;doorEntries=[];model.updateMatrixWorld(true);
  const raw=Array.isArray(meta.facilities)?meta.facilities:meta.facilities?.items || [];
  facilities=raw.filter(f=>Array.isArray(f.camera?.position)&&Array.isArray(f.camera?.target)).map(f=>({...f,label:/^(Lavatory|Galley|Boarding) \d/.test(f.label||'')?`${f.camera.position[0]>0?'전방':'후방'} ${{lavatory:'화장실',galley:'갤리',boarding:'탑승 구역'}[f.type]||'설비'}`:f.label}));
  const worldRotation=model.getWorldQuaternion(new THREE.Quaternion()).invert();
  for(const d of meta.doors || []){
    if(!Array.isArray(d.hinge)||!Array.isArray(d.axis)||!Number.isFinite(d.angle))continue;
    const leaves=[];model.traverse(o=>{if(!o.isMesh)return; if(o.name===d.nodeName||(d.nodeNames||[]).includes(o.name)||(d.nodePrefix&&o.name.startsWith(d.nodePrefix)))leaves.push(o);});
    if(!leaves.length)continue;
    const pivot=new THREE.Group();pivot.name='interaction_hinge_'+d.id; pivot.position.copy(model.worldToLocal(new THREE.Vector3(...d.hinge)));model.add(pivot);pivot.updateMatrixWorld(true);
    for(const leaf of leaves)pivot.attach(leaf);
    const axis=new THREE.Vector3(...d.axis).applyQuaternion(worldRotation).normalize();
    doorEntries.push({...d,pivot,axisLocal:axis,currentAngle:0,targetAngle:0,open:false});
    if(!facilities.some(f=>f.id==='boarding-'+d.id)){
      const sign=Math.sign(d.hinge[2])||1;
      facilities.push({id:'boarding-'+d.id,label:(d.label||d.id)+' 외부',type:'exterior',doorId:d.id,camera:d.camera||{position:[d.hinge[0]+2,d.hinge[1]+1.6,d.hinge[2]+sign*4.5],target:[d.hinge[0],d.hinge[1]+.8,d.hinge[2]]}});
    }
  }
  $('facility-list').replaceChildren();
  for(const f of facilities){const button=document.createElement('button');button.textContent=f.label||f.id;button.dataset.facility=f.id;button.onclick=()=>{activeFacility=f;if(f.doorId)$('door-select').value=f.doorId;setView('facility');syncDoorUI();};$('facility-list').append(button);}
  $('door-select').replaceChildren();
  for(const d of doorEntries){const option=document.createElement('option');option.value=d.id;option.textContent=d.label||d.id;$('door-select').append(option);}
  $('door-select').disabled=doorEntries.length===0;facilityButton.disabled=facilities.length===0;
  activeFacility=facilities[0]||null;syncDoorUI();
}
function syncDoorUI(){
  const d=doorEntries.find(x=>x.id===$('door-select').value);
  $('door-toggle').disabled=!d;$('door-toggle').textContent=d?.open?'탑승문 닫기':'탑승문 열기';
  $('door-status').textContent=d?(d.open?'열림 · 시각적 개폐':'닫힘 · 실제 문 형상 연결'):'개폐 가능한 문 모델 없음';
}
function updateDoorAnimations(dt){for(const d of doorEntries){const delta=d.targetAngle-d.currentAngle;if(Math.abs(delta)<.001)continue;d.currentAngle+=Math.sign(delta)*Math.min(Math.abs(delta),dt*1.15);d.pivot.quaternion.setFromAxisAngle(d.axisLocal,d.currentAngle);}}
function updatePaintReference() {
  let panel = $('paint-reference');
  if (!panel) {
    panel = document.createElement('details'); panel.id = 'paint-reference'; panel.className = 'paint-reference';
    panel.innerHTML = '<summary><span class="material-dot"></span><span><b id="paint-label"></b><small>도색·재질 참고 · 사진과 비교</small></span><span class="reference-action">펼치기 ＋</span></summary><div class="reference-content"><a id="reference-photo-link" target="_blank" rel="noopener"><img id="reference-photo" loading="lazy" alt="기종 외부 도색 참고 사진"></a><div><h3 id="reference-name"></h3><div id="paint-swatches"></div><p id="reference-note"></p><p class="calibration-note">화면 조명과 사진 촬영 조건에 따른 근사 색상입니다. 제조사 도료 코드·광택도 실측값으로 보정한 재질은 아닙니다.</p><a id="reference-source" target="_blank" rel="noopener">사진 출처 ↗</a><small id="reference-credit"></small></div></div>';
    document.querySelector('.measurements').after(panel);
  }
  const matchingRefs = liveryReferences.filter(r => (r.aircraftId || r.id) === spec.id);
  const ref = matchingRefs.find(r=>r.id===(activeVariant?.referenceId||liveryDefaults[spec.id])) || matchingRefs.find(r=>r.isDefault) || matchingRefs.find(r=>r.selectable!==false);
  const appliedName = meta.liveryName || meta.livery?.name || (typeof meta.livery === 'string' ? meta.livery : null);
  $('paint-label').textContent = appliedName || '중립 연구 도색';
  $('reference-name').textContent = ref ? (ref.liveryName || ref.name || ref.title || '외부 도색 참고 사진') : '기준 사진 정리 중';
  $('reference-note').textContent = ref ? (Array.isArray(ref.limitations) ? ref.limitations.join(' ') : ref.notes || ref.limitations || '기종 외형과 도색 배치 비교를 위한 참고 이미지입니다.') : '현재 모델은 중립색 재질로 표시됩니다. 기종별 기준 사진과 도색 근거는 확인 후 연결됩니다.';
  const photo = ref?.photoPath ? '../' + ref.photoPath.replace(/^\.\//, '') : ref?.photoUrl;
  $('reference-photo-link').hidden = !photo;
  if (photo) { $('reference-photo').src = photo; $('reference-photo-link').href = photo; }
  const source = ref?.sourceUrl || ref?.sourcePage;
  $('reference-source').hidden = !source;
  if (source) $('reference-source').href = source;
  $('reference-credit').textContent = ref ? [ref.artist, ref.license, ref.registration].filter(Boolean).map(s => String(s).replace(/<[^>]*>/g, '')).join(' · ') : '';
  $('paint-swatches').replaceChildren();
  const palette = meta.livery?.palette || meta.livery || ref?.palette;
  for (const [label, value] of Object.entries(palette || {})) {
    const hex = typeof value === 'string' ? value : value?.hex;
    if (!hex || !/^#[0-9a-f]{3,8}$/i.test(hex)) continue;
    const swatch = document.createElement('span'); swatch.title = `${label}: ${hex}`; swatch.style.backgroundColor = hex; swatch.setAttribute('aria-label', swatch.title); $('paint-swatches').append(swatch);
  }
}
async function loadAircraft(id,variantId=null) {
  const next = fleet.find(s => s.id === id); if (!next) return;
  const currentToken = ++token; spec = next; meta = {}; upperDeck = false;
  const requested=variantId===null?variantManifest.defaults[id]:variantId;
  activeVariant=variantManifest.variants.find(v=>v.aircraftId===id && v.id===requested && builtVariant(v))||null;
  const chosenVariant=activeVariant;
  const modelUrl=variantPath(chosenVariant?.modelUrl)||`../models/${id}.glb`;
  const metadataUrl=variantPath(chosenVariant?.metadataUrl)||`../models/${id}.json`;
  const blendUrl=chosenVariant?variantPath(chosenVariant.blendUrl):`../models/${id}.blend`;
  updateVariantSelector();
  doorEntries=[];facilities=[];activeFacility=null;facilitiesPanel.hidden=true;facilityButton.disabled=true;enginePanel.hidden=true;engineEntries=[];equipmentPanel.hidden=true;exteriorEquipment=[];equipmentButton.disabled=true;aircraftLightMaterials=[];
  cargoZoneIndex = 0;
  cockpitSeat='observer';
  updatePaintReference();
  history.replaceState(null, '', `#${id}${chosenVariant?'/'+encodeURIComponent(chosenVariant.id):''}`);
  document.querySelector('.sidebar').classList.remove('open'); $('menu').setAttribute('aria-expanded', 'false');
  renderFleet($('search').value);
  $('title').textContent = next.variant.replace(/ 기준$/, '');
  $('variant').textContent = next.name;
  $('maker').textContent = `${next.id.startsWith('boeing') ? 'BOEING' : 'AIRBUS'} / STUDY ${String(next.order).padStart(2, '0')}`;
  for (const field of ['length', 'span', 'height']) $(field).textContent = `${next[field].toFixed(2)} m`;
  $('layout').textContent = next.seatLayout.join('–');
  $('sources').replaceChildren();
  for (const [i, url] of (next.sources || []).entries()) {
    const a = document.createElement('a'); a.href = url; a.textContent = `참고 문서 ${i + 1} ↗`; a.target = '_blank'; a.rel = 'noopener'; $('sources').append(a);
  }
  $('research').href = '../review/orientation-v11/index.html';
  $('download-glb').href=modelUrl;$('download-meta').href=metadataUrl;
  $('download-blend').hidden=!blendUrl;if(blendUrl)$('download-blend').href=blendUrl;
  message('기체를 불러오는 중', `${next.variant.replace(/ 기준$/, '')} · 주요 치수 기준 1:1 모델`);
  if (model) { scene.remove(model); disposeModel(model); model = null; }
  try {
    const metadata = await fetch(metadataUrl, {cache:'no-store'}).then(r => {if(!r.ok)throw new Error('Model metadata missing');return r.json();});
    if (currentToken !== token) return;
    // Builders replace the same file name during live review. Read current metadata
    // first, then key the binary request by revision and this explicit load attempt.
    const revision = encodeURIComponent(metadata.detailRevision || metadata.generatorRevision || metadata.modelingStage || 'preview');
    const gltf = await loader.loadAsync(`${modelUrl}?revision=${revision}&load=${Date.now()}`, event => { if (currentToken === token && event.total) $('load-detail').textContent = `모델 읽는 중 ${Math.round(event.loaded / event.total * 100)}%`; });
    if (currentToken !== token) { disposeModel(gltf.scene); return; }
    model = gltf.scene; meta = metadata;
    document.querySelector('.prototype').textContent=meta.pylonReviewV14?(meta.pylonReviewV14.changedGeometryOrMaterials?'엔진 연결부 v14 · 사진·도면 기반 보정':'엔진 연결부 검토 · 자료 부족으로 형상 유지'):meta.detailRevision==='2026-11-19-pylon-v13'?'A380 연결부 v13 · 세부 형상 근사':meta.detailRevision==='2026-11-19-detail-v12'?'외형·브랜드·실내 v12 · 세부 형상 근사':meta.orientationRevision==='2026-11-19-orientation-v11'?'좌우 배치 v11 수정 · 정밀 재현 미검증':meta.a380WingCorrection==='official-outline-v10'?'A380 날개 v10 · 세부 형상 근사':meta.wingRevision==='2026-11-19-wing-v9'?'날개 v9 개선 · 정밀 재현 미검증':meta.generatorRevision==='2026-11-19-detail-v8'?'v8 수정본 · 정밀 재현 미검증':'이전 모델 · 수정본 검증 중';
    if(meta.exteriorReviewV15)document.querySelector('.prototype').textContent=meta.exteriorReviewV15.changedGeometryOrMaterials?'외관 v15 · 도색·재질 보정 / 세부 형상 근사':'외관 검토 · 추가 근거 부족으로 유지';
    if(meta.engineDetailV18 || meta.engineDetailV17 || meta.engineDetailV16)document.querySelector('.prototype').textContent=`엔진 ${meta.engineDetailV18?'v18':meta.engineDetailV17?'v17':'v16'} · 도면 기반 보정 / 미확인 세부 보류`;
    $('research').href=(meta.engineDetailV18 || meta.engineDetailV17 || meta.engineDetailV16)?`../review/${meta.engineDetailV18?'engine-v18':meta.engineDetailV17?'engine-v17':'engine-v16'}/index.html#${chosenVariant?.modelUrl?.split('/').pop()?.replace('.glb','') || meta.id}`:meta.exteriorReviewV15?`../review/exterior-v15/index.html#${chosenVariant?.modelUrl?.split('/').pop()?.replace('.glb','') || meta.id}`:meta.pylonReviewV14?`../review/pylon-v14/index.html#${meta.id}`:meta.detailRevision?.startsWith('2026-11-19-')?'../review/cutaway-v13/index.html':'../review/orientation-v11/index.html';
    updateClassControls();
    if(meta.detailV19){document.querySelector('.prototype').textContent='랜딩기어·설비 v19 · 도면 기반 보정 / 세부 형상 근사';$('research').href=`../review/detail-v19/index.html#${chosenVariant?.modelUrl?.split('/').pop()?.replace('.glb','') || meta.id}`;}
    if(meta.shapeReviewV20 && meta.decalReviewV20){document.querySelector('.prototype').textContent='로고·기수·꼬리 v20 · 도면 기반 보정 / 세부 형상 근사';$('research').href=`../review/detail-v20/index.html#${chosenVariant?.modelUrl?.split('/').pop()?.replace('.glb','') || meta.id}`;}
    // A photographed variant can have winglets and a different equipped span.
    spec = {...next};
    for (const field of ['length','span','height']) {
      if (Number.isFinite(meta[field])) spec[field]=meta[field];
      $(field).textContent=`${spec[field].toFixed(2)} m`;
    }
    $('length').parentElement.querySelector('span').textContent='기체 전장 · 참고';
    $('height').parentElement.querySelector('span').textContent='전체 높이 · 참고';
    let dimensionNote=$('model-dimension-note');
    if(!dimensionNote){dimensionNote=document.createElement('small');dimensionNote.id='model-dimension-note';document.querySelector('.measurements').after(dimensionNote);}
    const finDimensions=meta.shapeReviewV20?.finPlanformCorrection || meta.shapeReviewV20?.empennageCorrection;
    const hasHeightDifference=Number.isFinite(finDimensions?.actualOverallHeightM)&&Math.abs(finDimensions.actualOverallHeightM-finDimensions.sourceOverallHeightM)>.03;
    dimensionNote.hidden=!hasHeightDifference;
    dimensionNote.textContent=hasHeightDifference?`도면 전체 높이 ${finDimensions.sourceOverallHeightM.toFixed(2)} m · 현재 모델 ${finDimensions.actualOverallHeightM.toFixed(2)} m — 동체 기준 높이 보정은 아직 남아 있습니다.`:'';
    updatePaintReference();
    let seatNote = $('seat-count-note');
    if (!seatNote) { seatNote = document.createElement('p'); seatNote.id = 'seat-count-note'; $('accuracy').after(seatNote); }
    const generatedSeats = meta.generatedSeatCount ?? meta.decks?.reduce((sum, deck) => sum + (deck.seatCount || 0), 0);
    seatNote.textContent = `사이트의 대표 정원: ${spec.seats}석 · 현재 모델에 배치된 좌석: ${Number.isFinite(generatedSeats) ? generatedSeats + '석' : '집계 미제공'}. 모델 좌석 수는 예시 배치이며 실제 항공사의 정원과 다를 수 있습니다.`;
    if(meta.cabinClasses?.length)seatNote.textContent=meta.cabinClasses.map(z=>`${classLabels[z.id]||z.label}: ${z.product} · 참고 ${z.requestedCount}석 / 생성 ${z.generatedCount}석`).join(' / ')+' — 실제 등록기호·운항 시기와의 일치는 미확인입니다.';
    shellMaterials = []; frameMeshes = []; cabinMeshes = []; linerMaterials = []; mechanicalMeshes = []; cargoMeshes = []; attachmentMaterials = [];
    model.traverse(o => {
      if (!o.isMesh) return;
      let category = o.name.toLowerCase();
      for (let p = o.parent; p && p !== model; p = p.parent) category += ' ' + p.name.toLowerCase();
      o.userData.category = category;
      const sourceMaterials = Array.isArray(o.material) ? o.material : [o.material];
      o.material = sourceMaterials.map(m => {
        const clone = m.clone(); clone.side = THREE.DoubleSide;
        clone.userData.flightdeckGlazing = m.name.toLowerCase().includes('cockpitglass');
        return clone;
      });
      if (o.material.length === 1) o.material = o.material[0];
      if (category.includes('shell_') || category.includes('brand_v12_') || category.includes('door_leaf_') || category.includes('door_frame_') || category.includes('door_exit_sign_')) shellMaterials.push(...(Array.isArray(o.material) ? o.material : [o.material]));
      if (category.includes('frames_') || category.includes('structure_')) frameMeshes.push(o);
      if (category.includes('interior_')) cabinMeshes.push(o);
      if (/interior_(liner|wall|ceiling|bin|sidewall|window)/.test(category) || category.includes('interior_v12_cockpit_aperture_lining') || category.includes('mechanical_hold_lining')) linerMaterials.push(...(Array.isArray(o.material) ? o.material : [o.material]));
      if (category.includes('mechanical_') || category.includes('systems_')) mechanicalMeshes.push(o);
      if (category.includes('cargo_')) cargoMeshes.push(o);
      if (/\b(wing_|engine_|gear_)/.test(category)) attachmentMaterials.push(...(Array.isArray(o.material) ? o.material : [o.material]));
    });
    scene.add(model);
    prepareEngineInspection();
    prepareGearInspection();
    prepareExteriorEquipment();
    prepareFacilitiesAndDoors();
    $('mechanical').disabled = mechanicalMeshes.length === 0;
    $('mechanical').checked = false;
    $('cabin-layer').checked = true;
    $('mechanical-status').textContent = mechanicalMeshes.length ? '개념 배치' : '제작 중';
    cargoButton.disabled = !(meta.cameras?.cargo || cargoMeshes.length);
    createDimensions();
    $('loading').hidden = true;
    $('deck').hidden = !(spec.doubleDeck || spec.hump);
    $('deck').textContent = '상층으로';
    setView('exterior');
  } catch (error) {
    if (currentToken !== token) return;
    message('모델을 불러오지 못했습니다', location.protocol === 'file:' ? '파일을 직접 열면 모델 요청이 제한됩니다. 제공된 서버 실행 방법으로 HTTP 주소에서 열어주세요.' : `${next.variant} GLB 파일의 생성 여부와 경로를 확인해주세요. 다른 기종을 선택할 수도 있습니다.`, true);
    console.error('Aircraft load failed:', id, error);
  }
}
function cabinInfo() {
  const c = meta.cabin || {};
  const floor = meta.cabinFloorZ ?? c.floorZ ?? meta.cabinFloor ?? (spec.diameter * 0.57 + 1.0);
  const preset = upperDeck ? (meta.cameras?.upperCabin || meta.cameras?.upperDeck || meta.cameras?.cabinUpper) : meta.cameras?.cabin;
  const startX = upperDeck ? (meta.upperCabinStartX ?? (spec.hump ? spec.length * .04 : meta.cabinStartX)) : meta.cabinStartX;
  const endX = upperDeck ? (meta.upperCabinEndX ?? meta.cabinEndX) : meta.cabinEndX;
  const minX = Math.min(startX ?? -spec.length * .33, endX ?? spec.length * .29);
  const maxX = Math.max(startX ?? -spec.length * .33, endX ?? spec.length * .29);
  return {
    floor,
    eye: preset?.position?.[1] ?? (floor + 1.55 + (upperDeck ? (meta.upperDeckFloorZ ? meta.upperDeckFloorZ - floor : spec.diameter * 0.52) : 0)),
    front: maxX - 1,
    rear: minX + 1,
    aisle: preset?.position?.[2] ?? (meta.aisleY ? -meta.aisleY : (spec.seatLayout.length > 2 ? spec.diameter * 0.18 : 0)),
    preset
  };
}
function applyVisibility() {
  if (!model || !spec) return;
  const cutaway = view === 'cutaway' || view === 'cargo';
  const inside = isInside();
  const equipment = $('mechanical').checked;
  document.querySelector('.stage').classList.toggle('interior-view', inside);
  document.querySelector('.stage').classList.toggle('cockpit-view', view==='cockpit');
  document.querySelector('.stage').classList.toggle('facility-view', view==='facility');
  document.querySelector('.stage').classList.toggle('inspection-view', ['engine','equipment','gear','tail'].includes(view));
  flightdeckWorld.visible=view==='cockpit';
  const neutral=!inside && $('neutral-light').checked;
  hemi.color.setHex(neutral?0xffffff:0xd6eaff);
  hemi.groundColor.setHex(neutral?0x686868:0x556b71);
  key.color.setHex(neutral?0xffffff:0xffefd7);
  rim.color.setHex(neutral?0xffffff:0x97caff);
  hemi.intensity = inside ? .75 : .55;
  key.intensity = inside ? .18 : 2.1;
  rim.intensity = inside ? .12 : 1.1;
  fill.intensity = inside ? .16 : .45;
  cabinLight.intensity = inside ? 3.2 : 8;
  scene.environmentIntensity = inside ? .08 : .65;
  renderer.toneMappingExposure = inside ? 1 : 1.05;
  const cabin = cabinInfo();
  cutRear.constant = cabin.rear - .3;
  cutFront.constant = -cabin.front - .3;
  cutBottom.constant = equipment ? -1 : cabin.floor - .12;
  if (view === 'cutaway') {
    // One longitudinal opening includes every hold, regardless of the selected cargo zone/deck.
    const stations = [meta.cabinStartX ?? cabin.rear, meta.cabinEndX ?? cabin.front, ...(meta.cargo?.zones || []).flat()];
    cutRear.constant = Math.min(...stations) - .5;
    cutFront.constant = -Math.max(...stations) - .5;
    cutBottom.constant = Math.min(meta.cargo?.floorZ ?? cabin.floor - 1.4, (meta.modelEnvelope?.centerZ ?? spec.height * .27) - spec.diameter / 2) - .2;
  }
  if (view==='cargo') { const c=walkBounds(); cutRear.constant=c.rear-.7; cutFront.constant=-c.front-.7; cutBottom.constant=(meta.cargo?.floorZ ?? cabin.floor-1.4)-.15; cutTop.constant=-(meta.cargo?.ceilingZ ?? cabin.floor-.15); }
  const planes=view==='cargo'?[...cutPlanes,cutTop]:cutPlanes;
  for (const m of [...shellMaterials, ...linerMaterials]) { m.clippingPlanes = cutaway ? planes : []; m.clipIntersection = true; m.clipShadows = true; m.needsUpdate = true; }
  // Remove the viewing-side wing/engine obstruction only in the overview section.
  for (const m of attachmentMaterials) { m.clippingPlanes = view === 'cutaway' ? [clipPlane] : []; m.clipIntersection = false; m.needsUpdate = true; }
  for (const mesh of frameMeshes) for (const m of (Array.isArray(mesh.material) ? mesh.material : [mesh.material])) { m.clippingPlanes = view === 'cutaway' ? planes : []; m.clipIntersection = true; m.needsUpdate = true; }
  for (const m of shellMaterials) {
    if (!m.userData.flightdeckGlazing) continue;
    // Glazing changes with the inspection viewpoint; the opaque nose skin stays intact.
    m.color.set(inside ? '#eaf5fa' : '#20323d');
    m.transparent=true; m.opacity=inside ? .035 : .88;
    m.roughness=inside ? .035 : .12; m.metalness=inside ? 0 : .18;
    if ('transmission' in m) m.transmission=inside ? 0 : .08;
    m.envMapIntensity=inside ? .03 : .8;
    m.depthWrite=!inside;
    m.needsUpdate=true;
  }
  frameMeshes.forEach(m => { m.visible = $('frames').checked && !inside; });
  cabinMeshes.forEach(m => { m.visible = view!=='cargo' && (inside || $('cabin-layer').checked || !cutaway); });
  mechanicalMeshes.forEach(m => { m.visible = (equipment && cutaway) || view === 'cargo'; });
  cargoMeshes.forEach(m => { m.visible = cutaway || view === 'cargo'; });
  $('section-note').hidden = !cutaway;
  $('section-note').querySelector('strong').textContent = view==='cargo' ? '하부 화물칸 개방' : '객실·전후 화물칸 통합 단면';
  $('section-note').querySelector('span').textContent = view==='cargo'?'외부 관찰 시점 · 전방/후방 공간 전환':'관찰 쪽 외피·날개 개방 · 구조와 장비는 아래에서 개별 표시';
  dimGroup.visible = $('dimensions').checked && !inside;
  grid.visible = !inside;
  ground.visible = grid.visible;
  controls.autoRotate = $('rotate').checked && view === 'exterior';
  cabinLight.visible = inside || ['cargo','cutaway'].includes(view);
  for(const material of aircraftLightMaterials)material.emissiveIntensity=$('aircraft-lights').checked?material.userData.aircraftEmissiveIntensity:0;
}
function sectionBounds() {
  const center = meta.modelEnvelope?.centerZ ?? spec.height * .27;
  return new THREE.Box3(new THREE.Vector3(-spec.length / 2, center - spec.diameter / 2, -spec.diameter / 2), new THREE.Vector3(spec.length / 2, center + spec.diameter * (spec.doubleDeck ? .65 : .5), spec.diameter / 2));
}
function fitModel(direction, margin = 1.15, focusBounds = null) {
  // Fit all eight world-space bounds corners at the current viewport aspect.
  // A fixed length multiplier clips wide aircraft in narrow browser panels.
  const bounds = focusBounds || new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const outward = direction.clone().normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(outward).normalize();
  const up = outward.clone().cross(right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanH = tanV * camera.aspect;
  let distance = 0;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const p = new THREE.Vector3(x, y, z).sub(center);
    const depth = p.dot(outward);
    distance = Math.max(distance, Math.abs(p.dot(right)) / tanH + depth, Math.abs(p.dot(up)) / tanV + depth);
  }
  camera.position.copy(center).addScaledVector(outward, distance * margin);
  controls.target.copy(center);
}
function setView(mode) {
  if (!model) return;
  if(mode==='facility'&&!activeFacility)return;
  if(mode==='equipment'&&!exteriorEquipment.length)return;
  if(mode==='gear'&&!gearEntries.length)return;
  if (mode === 'cutaway' && view !== 'cutaway') {
    $('frames').checked = true;
    $('cabin-layer').checked = true;
    $('mechanical').checked = !$('mechanical').disabled;
  }
  view = mode;
  document.querySelectorAll('[data-view]').forEach(b => { b.classList.toggle('active', b.dataset.view === mode); b.setAttribute('aria-pressed', String(b.dataset.view === mode)); });
  $('view-label').textContent = viewLabels[mode];
  const interior = isInside(mode);
  // Interior clearance needs a close near plane; external views need depth
  // precision so millimetre-offset wing surface panels do not flicker.
  camera.near = interior || ['equipment','gear'].includes(mode) ? 0.03 : 0.5;
  gearPanel.hidden=mode!=='gear';
  facilitiesPanel.hidden=mode!=='facility';
  enginePanel.hidden=mode!=='engine';
  equipmentPanel.hidden=mode!=='equipment';
  $('walk-controls').hidden = mode !== 'cabin';
  directionLabel.hidden = mode !== 'cabin';
  classPanel.hidden=mode!=='cabin';
  $('cockpit-views').hidden=mode!=='cockpit';
  $('deck').hidden = mode !== 'cabin' || !(spec.doubleDeck || spec.hump);
  $('cargo-zone').hidden = mode !== 'cargo' || (meta.cargo?.zones?.length || 0)<2;
  $('help').textContent = interior ? '드래그 둘러보기 · W/S 또는 ↑/↓ 이동' : '드래그 회전 · 휠 확대 · 오른쪽 드래그 이동';
  controls.enablePan = !interior; controls.enableZoom = !interior;
  controls.minDistance = interior ? 0.01 : mode==='equipment'?.2:2;
  controls.maxPolarAngle = interior ? Math.PI - 0.1 : ['equipment','gear','tail'].includes(mode) ? Math.PI*.85 : mode==='engine' ? Math.PI*.65 : Math.PI / 2 - 0.015;
  camera.fov = mode==='cockpit' ? 82 : mode==='facility' ? (activeFacility.camera.fov || (interior?78:52)) : interior ? 72 : 42; camera.updateProjectionMatrix();
  const centerY = spec.height * 0.27, dist = Math.max(spec.length, spec.span);
  if (mode === 'exterior') fitModel(new THREE.Vector3(.75, .38, .8), 1.18);
  if(mode==='gear'){
    const entry=gearEntries[gearIndex],side=entry.center.z>0?1:-1;
    fitModel(new THREE.Vector3(gearIndex===0?.65:-.65,.06,side),1.28,entry.bounds.clone().expandByScalar(.25));$('view-label').textContent=entry.label;
    gearPanel.querySelectorAll('[data-gear]').forEach(b=>{const active=Number(b.dataset.gear)===gearIndex;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  if (mode === 'nose') {
    const bounds=new THREE.Box3().setFromObject(model);
    const radius=spec.diameter/2, tip=bounds.max.x;
    const center=meta.modelEnvelope?.centerZ ?? spec.height*.27;
    const noseBounds=new THREE.Box3(new THREE.Vector3(tip-10,center-radius,-radius),new THREE.Vector3(tip,center+radius*(spec.doubleDeck?1.25:1),radius));
    fitModel(new THREE.Vector3(.65,.18,-1),1.12,noseBounds);
  }
  if (mode === 'tail') {
    const tailBounds=new THREE.Box3(),point=new THREE.Vector3();
    model.updateMatrixWorld(true);
    model.traverse(o=>{
      if(!o.isMesh || !o.name.startsWith('shell_fuselage'))return;
      const positions=o.geometry.getAttribute('position');if(!positions)return;
      for(let i=0;i<positions.count;i++){
        point.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);
        if(point.x < -spec.length*.32)tailBounds.expandByPoint(point);
      }
    });
    if(!tailBounds.isEmpty())fitModel(new THREE.Vector3(-.55,.18,-1),1.2,tailBounds.expandByScalar(.35));
  }
  if (mode === 'engine') {
    const entry=engineEntries[engineIndex];
    if(entry){
      const axial=engineAngle==='front'||engineAngle==='rear';
      const bounds=(axial&&!entry.engineBounds.isEmpty()?entry.engineBounds:entry.bounds).clone(),sign=entry.center.z>.1?1:-1;
      if(axial){const x=engineAngle==='front'?bounds.max.x:bounds.min.x;bounds.min.x=x-.15;bounds.max.x=x+.15;bounds.expandByScalar(.35);}
      else bounds.expandByVector(new THREE.Vector3(.7,.7,.6));
      const direction=engineAngle==='side'?new THREE.Vector3(0,.02,sign):engineAngle==='front'?new THREE.Vector3(1,.08,sign*.18):engineAngle==='rear'?new THREE.Vector3(-1,-.12,sign*.85):new THREE.Vector3(.55,-.08,sign);
      fitModel(direction,1.16,bounds);$('view-label').textContent=`${entry.label} 엔진 · ${engineAngle==='side'?'측면':engineAngle==='front'?'흡입구':engineAngle==='rear'?'후방 노즐':'사선'}`;
    }else fitModel(new THREE.Vector3(.45,.15,-1),1.12);
    enginePanel.querySelectorAll('[data-engine]').forEach(b=>{const on=Number(b.dataset.engine)===engineIndex;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    enginePanel.querySelectorAll('[data-engine-angle]').forEach(b=>{const on=b.dataset.engineAngle===engineAngle;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  }
  if(mode==='equipment'){
    const item=exteriorEquipment[exteriorEquipmentIndex],bounds=item.bounds.clone().expandByScalar(.55),side=item.center.z>=0?1:-1;
    const bodyCenter=meta.modelEnvelope?.centerZ ?? spec.height*.27;
    const above=item.center.y>bodyCenter+spec.diameter*.3,below=item.center.y<bodyCenter-spec.diameter*.3;
    const forwardLight=/NLG|기수\s*기어/i.test((item.id||'')+' '+(item.label||'')) || /LANDING|TAXI|TAKEOFF|RUNWAY/i.test(item.type||'');
    fitModel(forwardLight?new THREE.Vector3(1,-.85,side*.65):new THREE.Vector3(.35,above?.9:below?-.5:.16,side*(above?.45:1)),1.3,bounds);
    $('view-label').textContent=item.label || item.id;
    $('equipment-note').textContent='설치 근거·근사 범위는 출처 및 검토 기록 참조';
    $('equipment-note').title=[item.confidence,item.limitations].filter(Boolean).join(' · ');
    const source=(item.sourceUrls || [])[0];$('equipment-source').hidden=!source;if(source)$('equipment-source').href=source;
    $('equipment-select').value=String(exteriorEquipmentIndex);
  }
  if (mode === 'cutaway') fitModel(new THREE.Vector3(.07, .12, 1), 1.08, sectionBounds());
  if (mode === 'top') fitModel(new THREE.Vector3(0, 1, .0001), 1.15);
  if (mode === 'cabin') {
    const c = cabinInfo(); cabinX = c.preset?.position?.[0] ?? c.front - 1;
    camera.position.set(cabinX, c.eye, c.aisle); controls.target.set(cabinX - 0.05, c.eye, c.aisle);
    if (c.preset?.target) {
      const direction = new THREE.Vector3(...c.preset.target).sub(camera.position).normalize().multiplyScalar(.05);
      controls.target.copy(camera.position).add(direction);
    }
    $('walk-position').value = (cabinX - c.rear) / (c.front - c.rear) * 100;
  }
  if (mode === 'cockpit') {
    const c = cabinInfo(); const point = meta.cameras?.cockpit;
    if (point?.position) camera.position.fromArray(point.position);
    else if (Array.isArray(point)) camera.position.fromArray(point);
    else camera.position.set(spec.length * .39, c.floor + 1.2, 0);
    const seatPreset=meta.cameras?.[cockpitSeat==='left'?'pilotLeft':cockpitSeat==='right'?'pilotRight':'cockpit'];
    if(seatPreset?.position)camera.position.fromArray(seatPreset.position);
    else if(cockpitSeat!=='observer') { camera.position.x+=.55; camera.position.z+=cockpitSeat==='left'?-.46:.46; }
    controls.target.copy(camera.position).add(new THREE.Vector3(.05,-Math.tan(THREE.MathUtils.degToRad(1))*.05,0));
    document.querySelectorAll('[data-pilot]').forEach(b=>{b.classList.toggle('active',b.dataset.pilot===cockpitSeat);b.setAttribute('aria-pressed',String(b.dataset.pilot===cockpitSeat));});
  }
  if (mode === 'cargo') {
    focusCargo();
  }
  if(mode==='facility'){
    camera.position.fromArray(activeFacility.camera.position);
    const target=new THREE.Vector3(...activeFacility.camera.target);
    if(interior)controls.target.copy(camera.position).add(target.sub(camera.position).normalize().multiplyScalar(.05));else controls.target.copy(target);
    $('view-label').textContent=(activeFacility.label||activeFacility.id)+' · 예시 설비';
    document.querySelectorAll('[data-facility]').forEach(b=>{b.classList.toggle('active',b.dataset.facility===activeFacility.id);b.setAttribute('aria-pressed',String(b.dataset.facility===activeFacility.id));});
    $('help').textContent=interior?'드래그 둘러보기 · 아래에서 다른 설비 선택':'드래그 회전 · 실제 문 모델 개폐';
  }
  controls.update(); applyVisibility(); updateScale();
}
function moveCabin(delta) {
  if (!model || view !== 'cabin') return;
  const c = walkBounds(); const x = THREE.MathUtils.clamp(camera.position.x + delta, c.rear, c.front);
  const offset = x - camera.position.x; camera.position.x = x; controls.target.x += offset; cabinX = x;
  const zone=meta.cabinClasses?.find(z=>z.deck===(upperDeck?1:0)&&x<=z.frontX+z.pitchM/2&&x>=z.rearX-z.pitchM/2);
  if(zone?.aisleCentersY?.length){const z=-zone.aisleCentersY[0],dz=z-camera.position.z;camera.position.z=z;controls.target.z+=dz;}
  $('walk-position').value = (x - c.rear) / (c.front - c.rear) * 100;
}
function walkBounds() {
  if (view !== 'cargo') return cabinInfo();
  const zone = meta.cargo?.zones?.[cargoZoneIndex];
  const a = zone?.[0] ?? meta.cargo?.startX ?? -spec.length * .23, b = zone?.[1] ?? meta.cargo?.endX ?? spec.length * .23;
  return {rear:Math.min(a,b)+.5,front:Math.max(a,b)-.5};
}
function focusCargo() {
  const c=walkBounds(), floor=meta.cargo?.floorZ ?? cabinInfo().floor-1.4, ceiling=meta.cargo?.ceilingZ ?? cabinInfo().floor-.15;
  const bounds=new THREE.Box3(new THREE.Vector3(c.rear-1,floor-.4,-spec.diameter*.52),new THREE.Vector3(c.front+1,ceiling+.5,spec.diameter*.52));
  fitModel(new THREE.Vector3(.08,.14,1),1.18,bounds);
  $('view-label').textContent=((c.front+c.rear)>0?'전방':'후방')+' 화물칸 개방 · 개념 배치';
}
function makeLine(points, color = 0x8eb7a4) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .75 }));
}
function createDimensions() {
  for (const child of [...dimGroup.children]) { dimGroup.remove(child); disposeModel(child); }
  const l = spec.length / 2, s = spec.span / 2, z = s + 3, y = .15;
  dimGroup.add(makeLine([[-l,y,z],[l,y,z]]), makeLine([[-l,y,z-1],[-l,y,z+1]]), makeLine([[l,y,z-1],[l,y,z+1]]));
  dimGroup.add(makeLine([[-l-4,y,-s],[-l-4,y,s]]), makeLine([[-l-5,y,-s],[-l-3,y,-s]]), makeLine([[-l-5,y,s],[-l-3,y,s]]));
  dimGroup.add(makeLine([[-l-4,0,-s],[-l-4,spec.height,-s]]));
}
function updateScale() {
  if (!spec) return;
  const distance = camera.position.distanceTo(controls.target);
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const pxPerMeter = host.clientHeight / visibleHeight;
  let meters = isInside() || view==='cargo' ? .01 : 10;
  while (meters * pxPerMeter > 140) meters /= 2;
  while (meters * pxPerMeter < 50) meters *= 2;
  $('scale').hidden = isInside() || view==='cargo';
  $('scale').querySelector('div').style.width = `${meters * pxPerMeter}px`;
  $('scale').querySelector('span').textContent = `${Number(meters.toFixed(3))} m · 시점 중심 기준`;
}
new ResizeObserver(() => { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (model && view==='cargo') { focusCargo(); controls.update(); } else if (model && ['exterior','cutaway','top'].includes(view)) { const direction=camera.position.clone().sub(controls.target); if (direction.lengthSq()>0) fitModel(direction,view==='cutaway'?1.08:view==='exterior'?1.18:1.16,view==='cutaway'?sectionBounds():null); controls.update(); } updateScale(); }).observe(host);
controls.addEventListener('change', updateScale);
$('search').addEventListener('input', e => renderFleet(e.target.value));
$('retry').onclick = () => spec ? loadAircraft(spec.id,activeVariant?.id||'') : location.reload();
$('reset').onclick = () => setView(view);
$('menu').onclick = () => { const open = document.querySelector('.sidebar').classList.toggle('open'); $('menu').setAttribute('aria-expanded', String(open)); };
document.querySelectorAll('[data-view]').forEach(b => b.onclick = () => setView(b.dataset.view));
for (const id of ['frames','dimensions','rotate','cabin-layer']) $(id).addEventListener('change', applyVisibility);
$('mechanical').addEventListener('change', () => { if ($('mechanical').checked && view !== 'cutaway' && view !== 'cargo') setView('cutaway'); else applyVisibility(); });
document.querySelectorAll('[data-walk]').forEach(b => b.onclick = () => moveCabin(b.dataset.walk === 'forward' ? 1 : -1));
$('walk-position').oninput = e => { const c = walkBounds(); moveCabin(c.rear + (+e.target.value / 100) * (c.front - c.rear) - camera.position.x); };
$('deck').onclick = () => { upperDeck = !upperDeck; $('deck').textContent = upperDeck ? '하층으로' : '상층으로'; setView('cabin'); };
$('cargo-zone').onclick = () => { const zones=meta.cargo?.zones || []; if (view!=='cargo'||zones.length<2)return; cargoZoneIndex=(cargoZoneIndex+1)%zones.length; focusCargo(); applyVisibility(); controls.update(); };
document.querySelectorAll('[data-pilot]').forEach(b=>b.onclick=()=>{cockpitSeat=b.dataset.pilot;setView('cockpit');});
$('door-select').onchange=syncDoorUI;
$('door-toggle').onclick=()=>{const d=doorEntries.find(x=>x.id===$('door-select').value);if(!d)return;d.open=!d.open;d.targetAngle=d.open?d.angle:0;syncDoorUI();};
window.addEventListener('keydown', e => { if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return; if (['w','s','W','S','ArrowUp','ArrowDown'].includes(e.key) && view==='cabin') { e.preventDefault(); keys.add(e.key.toLowerCase()); } if (e.key === 'Escape') { document.querySelector('.sidebar').classList.remove('open'); $('menu').setAttribute('aria-expanded','false'); } });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
let last = performance.now();
function tick(now) {
  const dt = Math.min((now-last)/1000,.04); last=now;
  if (keys.has('w') || keys.has('arrowup')) moveCabin(dt * 2.4);
  if (keys.has('s') || keys.has('arrowdown')) moveCabin(-dt * 2.4);
  updateDoorAnimations(dt);
  controls.update(); cabinLight.position.copy(camera.position); renderer.render(scene,camera); requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
fetch('fleet.json', {cache:'no-store'}).then(r => { if (!r.ok) throw new Error('fleet.json missing'); return r.json(); }).then(async data => { await variantsReady;fleet = data.aircraft; renderFleet(); const [id,version] = location.hash.slice(1).split('/'); loadAircraft(fleet.some(s => s.id === id) ? id : fleet[0].id,version?decodeURIComponent(version):null); }).catch(error => { message('기종 목록을 불러오지 못했습니다', 'HTTP 서버에서 viewer 폴더를 열어주세요. README.txt에 실행 방법이 있습니다.', true); console.error(error); });
addEventListener('hashchange',()=>{const [id,v]=location.hash.slice(1).split('/');if(fleet.some(s=>s.id===id))loadAircraft(id,v?decodeURIComponent(v):null);});


