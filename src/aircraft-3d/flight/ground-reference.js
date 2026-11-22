/** Optional, separately attributed community simulation reference layouts. */
export async function loadGroundReferenceIndex(){
 const response=await fetch(new URL('./ground-reference-index.json',import.meta.url));
 if(!response.ok)throw Error('보완 공항 자료 목록을 불러오지 못했습니다.');
 return response.json();
}
const pending=new Map();
export async function ensureGroundReference(data,icao){
 const record=data?.airports?.[icao];if(!record||record.features||!record.asset)return record||null;
 const key=record.asset;
 if(!/^ground-reference\/[A-Z0-9]{4}\.json$/.test(key))throw Error('공항 자료 경로가 올바르지 않습니다.');
 if(!pending.has(key))pending.set(key,(async()=>{
  const response=await fetch(new URL(key,import.meta.url));if(!response.ok)throw Error(icao+' 보완 경로 자료를 불러오지 못했습니다.');
  const loaded=await response.json();if(loaded.icao!==icao||!Array.isArray(loaded.features))throw Error('공항 자료 식별자가 일치하지 않습니다.');
  loaded.routeValidation=record.routeValidation;data.airports[icao]=loaded;return loaded;
 })().finally(()=>pending.delete(key)));
 return pending.get(key);
}
