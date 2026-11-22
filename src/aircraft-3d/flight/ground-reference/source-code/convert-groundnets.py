import json, math, hashlib, shutil, re
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT=Path('outputs/flight-mode')
OUT=ROOT/'ground-reference'
OUT.mkdir(exist_ok=True)
(OUT/'sources').mkdir(exist_ok=True)
airports=json.loads((ROOT/'airports-v2.json').read_text(encoding='utf-8'))['airports']
base=json.loads((ROOT/'airports-features.json').read_text(encoding='utf-8'))
manifests={}
for region in ['asia','americas','europe']:
    p=Path('work/gates-v6')/region/'manifest.json'
    if p.exists():
        data=json.loads(p.read_text(encoding='utf-8-sig'))
        if isinstance(data,dict): data=data.get('airports',data.get('records',[]))
        for item in data: manifests[item['icao']]=item

def coordinate(s,limit):
    s=s.strip()
    if s[:1] in 'NSEW':
        sign=-1 if s[0] in 'SW' else 1
        terms=s[1:].split()
        if len(terms)!=2: raise ValueError('Invalid degrees/minutes '+s)
        deg,minutes=map(float,terms)
        if deg<0 or not 0<=minutes<60: raise ValueError('Invalid angular coordinate '+s)
        v=sign*(deg+minutes/60)
    else: v=float(s)
    if not math.isfinite(v) or abs(v)>limit: raise ValueError('Invalid coordinate '+s)
    return v

def numeric(s):
    try:
        n=float(s)
        return n if math.isfinite(n) else None
    except (ValueError,TypeError): return None

catalog={'metadata':{'schemaVersion':1,'sourceKind':'COMMUNITY_SIMULATION_REFERENCE','label':'FlightGear TerraSync 참고 자료','license':'GPL-2.0','licenseUrl':'https://www.gnu.org/licenses/old-licenses/gpl-2.0.html','licenseEvidence':'https://wiki.flightgear.org/Howto:Make_an_airport','coordinateSystem':'WGS84 [longitude,latitude]','limitations':['Community flight-simulator layouts, NOT current surveyed airport or operational/ATC data.','Original node IDs and directional arcs are preserved; disconnected paths are never invented.','Parking position is a simulator aircraft reference point, not a certified nosewheel stop.','Source date is authoring metadata if present, NOT a verified currency date.']},'airports':{}}
report=[]
for a in airports:
    icao=a['icao'];m=manifests.get(icao,{})
    if icao in ['RKSI','RJAA','RKPC']: continue
    raw=Path(m.get('rawFile') or f'work/gates-v6/missing/{icao}')
    info={'icao':icao,'iata':a['iata'],'name':a['name'],'status':'HOLD_SOURCE_NOT_FOUND','source':m,'features':None}
    if not raw.is_file():
        catalog['airports'][icao]=info;report.append({'icao':icao,'status':info['status']});continue
    try:
        content=raw.read_bytes();sha=hashlib.sha256(content).hexdigest()
        if m.get('sha256') and m['sha256'].lower()!=sha: raise ValueError('Source hash mismatch')
        xml=ET.fromstring(content);nodes=[];features=[];ids=set();arcs=[];rejected=[]
        for element in list(xml.findall('.//Parking'))+list(xml.findall('.//node')):
            p=element.attrib;id=str(p['index']);lat=coordinate(p['lat'],90);lon=coordinate(p['lon'],180)
            if id in ids: raise ValueError('Duplicate source node '+id)
            distance=math.hypot((lat-a['lat'])*111200,(lon-a['lon'])*111200*math.cos(math.radians(a['lat'])))
            if distance>30000: raise ValueError('Node >30km from airport '+id)
            ids.add(id);parking=element.tag=='Parking';name=(p.get('name','')+p.get('number','')).strip()
            n={'id':id,'lat':lat,'lon':lon,'parking':parking,'name':name or ('번호 미확인 '+id),'type':p.get('type'),'heading':numeric(p.get('heading')),'radius':numeric(p.get('radius')),'pushBackRoute':p.get('pushBackRoute'),'isOnRunway':p.get('isOnRunway')=='1','sourceAttributes':p}
            nodes.append(n)
            if parking:
                features.append({'type':'Feature','id':f'flightgear:{icao}:parking:{id}','geometry':{'type':'Point','coordinates':[lon,lat]},'properties':{'aeroway':'parking_position','kind':'parking_position','ref':name or None,'name':n['name'],'sourceKind':'FLIGHTGEAR_REFERENCE','sourceNodeId':id,'heading':n['heading'],'radiusM':n['radius'],'parkingType':n['type'],'coordinateRole':'SIMULATOR_AIRCRAFT_REFERENCE_POSITION_NOT_CERTIFIED_NOSEWHEEL','sourceUrl':m.get('url')}})
        byid={n['id']:n for n in nodes}
        for i,e in enumerate(xml.findall('.//arc')):
            p=e.attrib;start,end=str(p['begin']),str(p['end'])
            if start not in byid or end not in byid:
                rejected.append({'arc':i,'reason':'MISSING_SOURCE_NODE','begin':start,'end':end});continue
            if start==end: continue
            arcs.append({'begin':start,'end':end,'isPushBackRoute':p.get('isPushBackRoute')=='1','sourceAttributes':p})
            features.append({'type':'Feature','id':f'flightgear:{icao}:arc:{i}','geometry':{'type':'LineString','coordinates':[[byid[start]['lon'],byid[start]['lat']],[byid[end]['lon'],byid[end]['lat']]]},'properties':{'aeroway':'taxiway','kind':'taxiway','sourceKind':'FLIGHTGEAR_REFERENCE','sourceNodeIds':[start,end],'directed':True,'isPushBackRoute':p.get('isPushBackRoute')=='1'}})
        # Independent mapped building outlines only block paths; they never add routes.
        context=[dict(f,properties=dict(f['properties'],contextOnly=True)) for f in base['airports'].get(icao,{}).get('features',[]) if f.get('properties',{}).get('kind')=='terminal']
        features.extend(context)
        eligible=sum(n['parking'] and n['type'] in ['gate','cargo'] for n in nodes)
        status='REFERENCE_NETWORK_AVAILABLE' if eligible and arcs else 'HOLD_NO_CONNECTED_SOURCE_NETWORK'
        source=dict(m,sha256=sha,license='GPL-2.0',sourceKind='COMMUNITY_SIMULATION_REFERENCE',sourceDate=xml.findtext('fgaversion') or xml.findtext('version'),sourceAuthor=xml.findtext('name'),originalAsset=f'sources/{icao}.groundnet.xml')
        record={'icao':icao,'status':status,'source':source,'features':features,'groundnet':{'nodes':nodes,'arcs':arcs,'rejectedArcs':rejected},'counts':{'parking':sum(n['parking'] for n in nodes),'eligibleParking':eligible,'nodes':len(nodes),'arcs':len(arcs),'rejectedArcs':len(rejected)}}
        (OUT/f'{icao}.json').write_text(json.dumps(record,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
        shutil.copyfile(raw,OUT/'sources'/f'{icao}.groundnet.xml')
        info.update(status=status,source=source,asset=f'ground-reference/{icao}.json',counts=record['counts'])
        report.append({'icao':icao,'status':status,**record['counts']})
    except Exception as e:
        info.update(status='HOLD_SOURCE_VALIDATION_FAILED',error=str(e));report.append({'icao':icao,'status':info['status'],'error':str(e)})
    catalog['airports'][icao]=info
(ROOT/'ground-reference-index.json').write_text(json.dumps(catalog,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
Path('work/gates-v6/conversion-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'airports':len(report),'networks':sum(r['status']=='REFERENCE_NETWORK_AVAILABLE' for r in report),'pointsOnly':sum(r['status']=='HOLD_NO_CONNECTED_SOURCE_NETWORK' for r in report),'missingOrRejected':[r['icao'] for r in report if r['status'] not in ['REFERENCE_NETWORK_AVAILABLE','HOLD_NO_CONNECTED_SOURCE_NETWORK']]}))
