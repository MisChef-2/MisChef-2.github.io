import json,math
from pathlib import Path
root=Path('outputs/flight-mode');index=json.loads((root/'ground-reference-index.json').read_text());airports={a['icao']:a for a in json.loads((root/'airports-v2.json').read_text())['airports']}
files=list(Path('work/gates-v6/official').glob('*.json'))+[Path('work/gates-v6/europe/LTFM-official-stands.json'),Path('work/gates-v6/europe/VVDN-official-stands.json')]
done=[]
for p in files:
 if not p.exists(): continue
 j=json.loads(p.read_text(encoding='utf-8-sig'))
 if not isinstance(j,dict) or 'features' not in j or j.get('icao') not in airports: continue
 icao=j['icao'];a=airports[icao];seen=set()
 for i,f in enumerate(j['features']):
  if f.get('geometry',{}).get('type')!='Point':raise ValueError('Official facts must be points only')
  lon,lat=f['geometry']['coordinates'];assert all(math.isfinite(v) for v in [lon,lat])
  assert math.hypot((lat-a['lat'])*111200,(lon-a['lon'])*111200*math.cos(math.radians(a['lat'])))<20000,(icao,i)
  f.setdefault('id',f'{icao}-official-{i}');f['properties']['routingEligible']=False;f['properties'].setdefault('coordinateRole','AIP_STAND_REFERENCE_COORDINATE_NOT_VERIFIED_TAXI_NODE')
  f['properties']['kind']='parking_position'
  key=(f['properties'].get('ref'),lon,lat);assert key not in seen,(icao,'duplicate');seen.add(key)
 sources=j.get('source',{});sources=sources if isinstance(sources,list) else [sources]
 mirrored=any('mirror' in str(s).lower() for s in sources)
 old=index['airports'].get(icao,{})
 oldasset=old.get('asset');original=None
 if oldasset and (root/oldasset).exists():
  existing=json.loads((root/oldasset).read_text());original=existing.get('source') if existing.get('groundnet') else existing.get('source',{}).get('previousSimulatorSource')
 source={'kind':'OFFICIAL_AIP_MIRROR' if mirrored else 'OFFICIAL_AIP','url':sources[0].get('url'),'sourceDate':sources[0].get('chartDate') or sources[0].get('coordinatePageEffectiveDate') or sources[0].get('effectiveDate'),'documents':sources,'coordinateRole':'AIP_INS_OR_STAND_REFERENCE_POINT_NOT_ROUTING_NODE','previousSimulatorSource':original}
 record={'icao':icao,'status':'OFFICIAL_REFERENCE_POINTS_ONLY','source':source,'features':j['features'],'counts':{'parking':len(j['features']),'arcs':0},'limitations':['Official-origin stand/INS reference coordinates only. No taxi routing or aircraft centre/nosewheel equivalence inferred.','Current operational status is unverified; third-party mirror currency is separately identified.']}
 asset=f'ground-reference/{icao}.json';(root/asset).write_text(json.dumps(record,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 index['airports'][icao]={'icao':icao,'iata':a['iata'],'name':a['name'],'status':record['status'],'source':source,'asset':asset,'counts':record['counts'],'features':None,'routeValidation':{'status':'HOLD_OFFICIAL_POINTS_WITHOUT_TAXI_GRAPH','departureRunways':[],'arrivalRunways':[],'connectedStands':0}}
 done.append({'icao':icao,'points':len(j['features']),'mirrored':mirrored})
# A numeric format version is not an authoring date.
for icao,r in index['airports'].items():
 if str(r.get('source',{}).get('sourceDate','')).strip().isdigit():
  r['source']['sourceDate']=None
  if r.get('asset'):
   p=root/r['asset'];record=json.loads(p.read_text());record['source']['sourceDate']=None;p.write_text(json.dumps(record,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(root/'ground-reference-index.json').write_text(json.dumps(index,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(root/'official-stand-coverage.json').write_text(json.dumps(done,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(done))
