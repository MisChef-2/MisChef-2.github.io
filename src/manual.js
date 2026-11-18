  /* ================= 조종 매뉴얼 =================
     자료 > 조종 매뉴얼. 상황별 대응(비정상, 비상 절차의 일반 원칙), 경험과 요령(흔한 실수와 경험칙), 사건사고(공식 조사 결과 요약).
     모두 학습용 일반 원칙이다. 실제 비행에서는 해당 기종의 교범(FCOM)과 빠른 참조 체크리스트(QRH)가 우선한다. */
  const MN_PHASE = ["전체", "이륙", "상승", "순항", "강하", "접근", "착륙", "모든 단계"];
  // 상황별 대응: [id, 단계, 제목, 언제, 즉시 할 일(순서), 이어서, 흔한 실수, 관련 원리 탭, 시뮬레이터 연습]
  const MN_SIT = [
    ["rto", "이륙", "이륙 중단 (RTO)", "V1에 닿기 전에 엔진 고장, 화재 경고, 이륙 형태 경고처럼 계속 이륙하면 위험한 문제가 생겼을 때.", ["\"STOP\"을 외친다", "추력 레버를 아이들로", "자동 제동(RTO) 작동 확인, 안 되면 최대 수동 제동", "스피드브레이크를 올린다", "역추력을 쓴다"], ["완전히 멈춘 뒤 관제에 알린다", "화재나 연기가 있으면 비상 탈출을 판단한다", "브레이크가 매우 뜨거우니 소방 지원을 요청한다"], ["V1을 넘긴 뒤 멈추려 한다. 남은 활주로로는 멈출 수 없을 수 있다", "작은 경고등 하나로 고속에서 중단해 더 큰 위험을 만든다"], "learn-forces", "짧은 활주로 공항에서 V1 직전 엔진 고장을 설정해 멈추는 거리를 확인한다."],
    ["eng-v1", "이륙", "V1 이후 엔진 고장", "V1을 지난 뒤 엔진 하나가 멈췄을 때. 이때는 이륙을 계속하는 것이 원칙이다.", ["러더로 활주로 중심선을 지킨다", "VR에서 평소처럼 기수를 든다", "V2 ~ V2+15 kt를 유지한다", "상승률이 양(+)인지 확인하고 기어를 올린다"], ["절차 고도(보통 400 ft 이상) 전에는 엔진 조작을 하지 않는다", "두 조종사가 함께 멈춘 엔진을 확인한 뒤 체크리스트를 수행한다", "가속 고도에서 수평으로 가속하며 플랩을 접고, 가까운 공항으로 돌아간다"], ["러더가 모자라 기체가 옆으로 미끄러진다", "급한 마음에 멀쩡한 엔진을 끈다 (1989년 케그워스 사고)"], "learn-control", "V1 바로 뒤 엔진 고장 실패를 걸고 러더로 직진을 유지하는 연습을 반복한다."],
    ["stall", "모든 단계", "실속 경고와 회복", "스틱 셰이커가 울리거나 실속 경고가 나왔을 때, 또는 기체가 흔들리며 기수가 처질 때.", ["기수를 숙여 받음각을 줄인다 (가장 먼저)", "날개를 수평으로", "추력을 필요한 만큼 조절한다", "속도가 회복되면 원래 경로로 돌아온다"], ["회복 뒤 원인(속도 설정, 자동화 모드, 결빙)을 확인한다"], ["추력만 올리고 기수를 계속 당긴다. 받음각이 그대로라 실속에서 벗어나지 못한다", "높은 고도에서 실속을 과속으로 착각한다"], "learn-stall", "오토파일럿을 끄고 고도를 지킨 채 천천히 감속해 경고가 울리는 순간 회복 동작을 연습한다."],
    ["windshear", "접근", "윈드시어", "이륙이나 접근 중 윈드시어 경고가 울리거나, 속도가 갑자기 15 kt 넘게 변하고 강하율이 커질 때.", ["최대 추력(TOGA)", "기수를 약 15도로 들고, 필요하면 스틱 셰이커 직전까지", "기어와 플랩 형태는 바꾸지 않는다", "벗어날 때까지 자세를 유지한다"], ["벗어난 뒤 관제에 보고한다 (다음 비행기를 위해)", "같은 활주로로 다시 접근할지 신중히 판단한다"], ["속도를 되찾으려고 기수를 숙인다. 땅과 가까워진다", "형태를 바꿔 양력을 잃는다"], "learn-forces", "뇌우가 있는 날씨로 설정하고 짧은 최종 접근에서 윈드시어 탈출 동작을 연습한다."],
    ["goaround", "접근", "불안정 접근과 복행", "계기 비행에서 1,000 ft, 시계 비행에서 500 ft에 경로, 속도, 형태, 강하율이 안정되지 않았을 때. 대표 기준은 속도 Vref ~ Vref+20 kt, 강하율 1,000 fpm 이하.", ["\"GO AROUND\"를 외치고 TOGA", "기수를 약 15도로", "플랩을 한 단계 접는다", "상승률이 양(+)이면 기어를 올린다"], ["복행 절차대로 고도와 방향을 맞춘다", "관제에 알리고 다음 접근을 준비한다. 원인(바람, 늦은 강하)을 고친다"], ["낮은 고도에서 억지로 맞춰 내리려 한다", "복행 때 기수를 너무 빨리, 너무 많이 든다"], "learn-highlift", "일부러 높고 빠르게 접근해 기준 고도에서 복행을 결정하는 연습을 한다."],
    ["xwind", "착륙", "옆바람 착륙", "활주로와 비스듬히 바람이 불 때.", ["최종 접근은 바람 쪽으로 기수를 틀어(크랩) 활주로 연장선을 따라간다", "닿기 직전 러더로 기수를 활주로에 맞춘다(디크랩)", "에일러론으로 바람 쪽 날개를 살짝 낮춘다", "닿은 뒤에도 에일러론을 바람 쪽으로 유지한다"], ["기종별로 시연된 최대 옆바람 값을 미리 확인한다", "돌풍 성분의 절반을 접근 속도에 더하는 것이 흔한 방식이다"], ["디크랩을 너무 일찍 해서 바람에 밀린다", "닿은 뒤 에일러론을 풀어 날개가 들린다"], "learn-control", "옆바람 15 kt, 25 kt로 바꿔 가며 같은 공항에 착륙해 본다."],
    ["decomp", "순항", "급감압", "객실 고도 경고가 울리거나 귀가 아프고 안개가 생기며 객실 압력이 급히 떨어질 때.", ["산소 마스크를 쓴다", "조종사끼리 통신을 확보한다", "비상 강하를 시작한다 (추력 아이들, 스피드브레이크)", "7700을 설정하고 MAYDAY를 선언한다"], ["10,000 ft 또는 그 지역 최저 안전 고도까지 내려간다", "구조 손상이 의심되면 속도를 낮게 잡는다"], ["마스크보다 다른 일을 먼저 한다. 높은 고도에서 의식을 유지할 시간은 수십 초 수준이다"], "learn-sweep", "FL370에서 감압 실패를 걸고 10,000 ft까지 비상 강하에 걸리는 시간을 재 본다."],
    ["engfire", "모든 단계", "엔진 화재", "엔진 화재 경고가 울렸을 때.", ["두 조종사가 함께 해당 엔진을 확인한다", "추력 레버를 아이들로", "연료를 차단한다", "소화기를 발사한다 (경고가 남으면 정해진 시간 뒤 두 번째)"], ["가장 가까운 적절한 공항에 내린다", "착륙 뒤 소방대와 확인한다"], ["다른 엔진을 끈다. 그래서 확인을 두 번 한다"], "learn-control", "이륙 상승 중 엔진 화재를 걸고 확인 절차를 소리 내어 해 본다."],
    ["dualeng", "모든 단계", "양쪽 엔진 고장 (조류 충돌, 연료)", "두 엔진이 모두 멈췄을 때.", ["기종 교범의 최적 활공 속도를 잡는다", "APU를 켠다 (전기와 공기)", "고도 여유가 있으면 재시동을 시도한다", "MAYDAY, 7700"], ["닿을 수 있는 공항이나 착륙 지점을 일찍 정한다", "닿을 수 없으면 수면이나 평지 착륙을 준비한다"], ["재시동에 매달려 착륙 지점 결정을 늦춘다"], "learn-lift", "2,000 ft 이상에서 양쪽 엔진을 끄고 최적 활공 속도로 얼마나 멀리 가는지 확인한다."],
    ["fuel", "순항", "연료 부족", "도착 예상 연료가 계획보다 크게 줄었을 때.", ["관제에 'MINIMUM FUEL'을 알린다 (더 이상의 지연을 감당하기 어렵다는 뜻)", "최종 예비 연료(보통 30분) 아래로 내려갈 것 같으면 'MAYDAY FUEL'을 선언한다", "가장 가까운 적절한 공항을 다시 고른다"], ["연료 누출 가능성을 점검한다 (연료 사용량과 남은 양이 맞지 않는지)"], ["목적지에 집착해 교체 공항 결정을 늦춘다 (1983 김리 글라이더, 2001 에어 트랜샛 236)"], "learn-sweep", "출발 연료를 줄여 놓고 교체 공항으로 바꾸는 결정 시점을 연습한다."],
    ["tcas", "모든 단계", "TCAS 회피 지시 (RA)", "충돌 경고 장치가 'CLIMB'이나 'DESCEND' 같은 회피 지시를 냈을 때.", ["오토파일럿을 풀고 지시대로 즉시 움직인다", "관제 지시와 달라도 RA를 따른다", "관제에 'TCAS RA'를 알린다"], ["'CLEAR OF CONFLICT' 뒤 원래 허가 고도로 돌아간다"], ["관제 지시를 따르느라 RA와 반대로 움직인다 (2002 위버링겐 공중 충돌)"], "learn-control", "온라인 관제 비행에서 RA 콜아웃 순서를 미리 외워 둔다."],
    ["gpws", "강하", "지형 경고 'PULL UP'", "지상 접근 경고 장치가 'TERRAIN, PULL UP'을 냈을 때.", ["오토파일럿과 자동 추력을 푼다", "최대 추력", "날개 수평으로 기수를 약 20도로 (스틱 셰이커 범위 안)", "스피드브레이크를 집어넣는다"], ["경고가 그칠 때까지 상승하고 관제에 알린다"], ["경고를 오작동이라 여기고 무시한다"], "learn-forces", "산악 공항 접근에서 일부러 낮게 내려가 경고 회피 동작을 연습한다."],
    ["turb", "순항", "심한 난기류", "흔들림이 커지거나 난기류 예보 지역에 들어갈 때.", ["좌석벨트 신호", "기종의 난기류 통과 속도로 맞춘다", "자세를 지키고 급한 조종을 피한다"], ["고도 변화는 어느 정도 허용한다. 고도를 억지로 지키려 하면 기체에 무리가 간다", "가능하면 고도나 경로를 바꿔 벗어난다"], ["속도와 고도를 억지로 잡으려 크게 조작한다"], "learn-sweep", "날씨 설정에서 난기류를 강하게 하고 오토파일럿 상태와 수동 상태를 비교한다."],
    ["nordo", "모든 단계", "무선 두절", "관제와 교신이 끊겼을 때.", ["7600을 설정한다", "다른 주파수와 장비로 연락을 시도한다", "마지막 허가 받은 경로와 고도를 따른다 (지역 규정에 따라)"], ["도착 공항의 절차대로 접근한다"], ["허가 없이 경로를 바꾼다"], "learn-forces", "비행 계획을 세울 때 무선 두절 시 따를 경로와 고도를 적어 둔다."]
  ];
  // 경험과 요령: [분류, 제목, 내용]
  const MN_TIPS = [
    ["착륙", "부드러운 착륙의 순서", "활주로 끝을 멀리 보며 내려오다가, 약 20~30 ft에서 추력을 줄이고 기수를 2~3도 든다. 너무 일찍 들면 떠올라 활주로를 길게 쓰고(플로트), 너무 늦으면 세게 닿는다. 이 사이트 점수에서 착륙률 100 fpm 이하가 +30점이다."],
    ["착륙", "바운스가 났을 때", "다시 떴다면 기수를 더 들지 말고 자세를 지킨 채 추력을 조금 넣어 내려앉는다. 크게 튀었거나 활주로가 모자라면 망설이지 말고 복행한다."],
    ["강하", "강하 시작점 3배 규칙", "내려갈 고도(천 피트 단위)에 3을 곱한 해리 전에 강하를 시작한다. 35,000 ft에서 해면 고도 공항이면 약 105 nm 전. 감속할 거리와 바람을 생각해 조금 더 일찍."],
    ["강하", "3도 활공로의 강하율", "강하율(fpm)은 지상속도(kt) × 5가 기준이다. 지상속도 140 kt면 약 700 fpm. 뒷바람이면 지상속도가 커지니 강하율도 커져야 한다."],
    ["속도", "10,000 ft 아래 250 kt", "미국을 비롯한 많은 나라에서 10,000 ft 아래는 250 kt 제한이 있다. 강하 중 10,000 ft 직전에 미리 감속해 두면 접근이 여유롭다."],
    ["자동화", "모드 표시를 소리 내어 읽기", "오토파일럿과 자동 추력이 지금 무엇을 하고 있는지 화면 위쪽 모드 표시(FMA)로 확인한다. '내가 생각한 모드'와 실제 모드가 다른 것이 많은 사고의 시작이었다."],
    ["자동화", "자동화가 이상하면 한 단계 내려온다", "모드가 헷갈리면 더 복잡하게 설정하지 말고, 더 단순한 모드나 수동 조종으로 내려와 기체를 먼저 안정시킨다."],
    ["협력", "콜아웃과 체크리스트", "두 사람이 함께 확인하는 장치다. 혼자 나는 시뮬레이터에서도 체크리스트를 소리 내어 읽으면 빠뜨림이 확 줄어든다. 특히 이륙 전 플랩과 트림."],
    ["연료", "연료 계획의 기본", "목적지까지 연료 + 교체 공항까지 연료 + 최종 예비 연료(대략 30분 대기분) + 비상 여유. 계획보다 많이 쓰고 있으면 일찍 알아챌수록 선택지가 많다."],
    ["날씨", "옆바람과 활주로 고르기", "바람과 가장 맞서는 활주로를 고르는 것이 기본이다. 옆바람이 기종 한계에 가까우면 다른 활주로나 교체 공항을 생각한다."],
    ["판단", "'지금 괜찮나'를 계속 묻기", "접근에서 기준 고도마다 속도, 경로, 형태를 확인하고 하나라도 어긋나면 복행한다. 복행은 실패가 아니라 정상 절차다."],
    ["연습", "실패는 하나씩", "시뮬레이터에서 비상 상황을 연습할 때는 한 번에 하나만 걸고, 절차를 익힌 뒤에 조합한다. 처음부터 여러 개를 겹치면 배우는 것이 적다."]
  ];
  // 사건사고: 조사 자료 정리가 끝나면 채운다 (공식 조사 보고서 기준)
  const MN_ACC = typeof ACCIDENTS !== "undefined" ? ACCIDENTS : [];
  const MN_TAG_LINK = { "실속": "learn-stall", "받음각": "learn-stall", "후류": "learn-winglet", "조종면": "learn-control", "플랩": "learn-highlift", "엔진고장": "manual-sit", "윈드시어": "manual-sit", "활공": "learn-lift", "결빙": "learn-stall", "자동화": "manual-tips", "의사소통": "manual-tips", "조종사협력": "manual-tips", "연료": "manual-sit", "조류충돌": "manual-sit", "복행": "manual-sit", "측풍": "manual-sit", "지형충돌": "manual-sit", "계기": "manual-tips", "정비": "manual-sit" };
  let mnPhase = "전체", mnOpen = null, mnTag = "전체";
  const mnHead = (title, text) => `<header class="card ph"><div><div class="crumbs"><a href="#home">대시보드</a> / 조종 매뉴얼</div><h1>${title}</h1><p>${text}</p></div></header>`;
  const mnNote = `<p class="lr-note">학습용 일반 원칙입니다. 실제 비행에서는 해당 기종의 교범(FCOM)과 빠른 참조 체크리스트(QRH), 운항 규정이 우선합니다.</p>`;
  function mnSitList() {
    const L = MN_SIT.filter(x => mnPhase === "전체" || x[1] === mnPhase || x[1] === "모든 단계");
    return L.map(x => { const op = mnOpen === x[0]; return `<article class="mn-sit${op ? " open" : ""}" id="mn-${x[0]}"><button type="button" class="mn-sit-h" data-mn="open:${x[0]}" aria-expanded="${op}"><span class="mn-ph">${x[1]}</span><b>${x[2]}</b><span class="mn-chev">${ICON.chev}</span></button>
<div class="mn-sit-b"><img class="mn-img" src="photos/manual/${x[0]}.webp" alt="" loading="lazy" onerror="this.remove()"><p class="mn-when"><span>언제</span>${x[3]}</p><div class="mn-cols"><div><p class="mn-k">즉시 할 일</p><ol class="mn-steps">${x[4].map(t => `<li>${t}</li>`).join("")}</ol></div><div><p class="mn-k">이어서</p><ul class="lr-list">${x[5].map(t => `<li>${t}</li>`).join("")}</ul><p class="mn-k" style="margin-top:14px">흔한 실수</p><ul class="lr-list mn-bad">${x[6].map(t => `<li>${t}</li>`).join("")}</ul></div></div>
<div class="mn-foot"><span>${ICON.plane}<b>시뮬레이터 연습</b> ${x[8]}</span><a class="lr-go" href="#${x[7]}">${ICON.wing}관련 원리 보기 →</a></div></div></article>`; }).join("") || `<p class="muted">이 단계에 해당하는 항목이 없습니다.</p>`;
  }
  function renderManualSit() {
    return mnHead("상황별 대응", "비정상 상황과 비상 상황에서 무엇을 어떤 순서로 하는지 정리했습니다. 맨 위 '즉시 할 일'은 체크리스트를 꺼내기 전에 외워서 하는 동작(메모리 아이템)에 해당하는 일반 원칙입니다.") + `
<div class="grid lr mn">
<section class="card c12"><div class="card-b"><div class="lr-seg mn-ph-seg" role="group" aria-label="비행 단계">${MN_PHASE.filter(p => p !== "모든 단계").map(p => `<button type="button" data-mn="phase:${p}" class="${p === mnPhase ? "on" : ""}">${p}</button>`).join("")}</div></div><div id="mn-sit-list" class="mn-sit-list">${mnSitList()}</div></section>
<section class="card c12">${cardH(ICON.info, "비상 신호 코드")}<div class="card-b mn-codes"><div><b>7700</b><span>비상 (MAYDAY)</span></div><div><b>7600</b><span>무선 두절</span></div><div><b>7500</b><span>불법 간섭 (납치)</span></div><div><b>MAYDAY</b><span>생명이나 기체가 위험한 긴급 상황</span></div><div><b>PAN-PAN</b><span>긴급하지만 당장 위험은 아닌 상황</span></div></div></section>
</div>${mnNote}`;
  }
  function renderManualTips() {
    const cats = Array.from(new Set(MN_TIPS.map(t => t[0])));
    return mnHead("경험과 요령", "교범에 다 나오지는 않지만 조종사들이 경험으로 쌓아 온 요령과 흔한 실수입니다. 시뮬레이터 비행에 바로 써 볼 수 있는 것 위주로 모았습니다.") + `
<div class="grid lr mn">${cats.map(c => `<section class="card c6 mn-tipc">${cardH(ICON.star, c)}<img class="mn-img mn-tip-img" src="photos/manual/tip-${c}.webp" alt="" loading="lazy" onerror="this.remove()"><div class="card-b mn-tips">${MN_TIPS.filter(t => t[0] === c).map(t => `<div class="mn-tip"><b>${t[1]}</b><p>${t[2]}</p></div>`).join("")}</div></section>`).join("")}
</div>${mnNote}`;
  }
  // 사건사고: 연대(1970년대 ~ 2020년대)로 묶고, 위쪽 연표에서 해마다 점을 찍는다. 사진은 사고기 사진이 아니라 같은 기종의 자료 사진이다
  // 발생 국가 (사고가 난 곳 기준). 두 사고를 묶은 카드는 두 나라 모두에 넣는다
  const MN_CTRY = { us1549: ["미국"], af447: ["공해"], colgan3407: ["미국"], oz214: ["미국"], ba38: ["영국"], ac143: ["캐나다"], ts236: ["포르투갈"], qf32: ["싱가포르"], aa587: ["미국"], ua232: ["미국"], dl191: ["미국"], jk5022: ["스페인"], uberlingen: ["독일"], "737max": ["인도네시아", "에티오피아"], tenerife: ["스페인"], "7c2216": ["대한민국"], ke801: ["미국"], oz733: ["대한민국"], jl123: ["일본"], ci140: ["일본"], ix812: ["인도"], ke8509: ["영국"] };
  // 항공사 국적: 국가 필터는 사고가 난 곳과 항공사 국적 둘 다로 찾는다 (예: 괌에서 난 대한항공 사고는 대한민국에도 나온다)
  const MN_OP = { us1549: ["미국"], af447: ["프랑스"], colgan3407: ["미국"], oz214: ["대한민국"], ba38: ["영국"], ac143: ["캐나다"], ts236: ["캐나다"], qf32: ["호주"], aa587: ["미국"], ua232: ["미국"], dl191: ["미국"], jk5022: ["스페인"], uberlingen: ["러시아"], "737max": ["인도네시아", "에티오피아"], tenerife: ["네덜란드", "미국"], "7c2216": ["대한민국"], ke801: ["대한민국"], oz733: ["대한민국"], jl123: ["일본"], ci140: ["대만"], ix812: ["인도"], ke8509: ["대한민국"] };
  const placeOf = a => a.ctry || MN_CTRY[a.id] || [];
  const opOf = a => [].concat(a.op || MN_OP[a.id] || []);
  const ctryOf = a => Array.from(new Set(placeOf(a).concat(opOf(a))));
  let mnCtry = "전체";
  let mnDec = "전체";
  const decOf = a => Math.floor(+(a.date || "0").slice(0, 4) / 10) * 10;
  function mnAccCard(a) {
    const ac = a.aircraftId && byId[a.aircraftId], y = (a.date || "").slice(0, 4), d = (a.date || "").slice(5).replace("-", ".");
    return `<article class="mn-acc" id="acc-${esc(a.id)}"><div class="mn-acc-top"><div class="mn-acc-ph">${typeof ACC_PHOTOS !== "undefined" && ACC_PHOTOS[a.id] ? `<img src="photos/accidents/${esc(a.id)}.webp" alt="${esc(ACC_PHOTOS[a.id].title)}" loading="lazy" decoding="async"><a class="mn-acc-cr" href="${esc(ACC_PHOTOS[a.id].page)}" target="_blank" rel="noopener">${esc(ACC_PHOTOS[a.id].title)}, ${esc(ACC_PHOTOS[a.id].license)}</a>` : ac ? `<div class="mn-acc-sil">${silhouette(ac, 1.5, 240, 120)}</div><span>${esc(ac.name)} 측면 그림</span>` : `<div class="mn-acc-noph">${ICON.plane}<span>${esc(a.aircraft || "")}</span></div>`}</div>
<div class="mn-acc-hd"><div class="mn-acc-date"><b>${esc(y)}</b><span>${esc(d)}</span></div><h3>${esc(a.name)}</h3><p class="mn-acc-o">${esc(a.outcome || "")}</p><div class="mn-chips">${placeOf(a).map(c => `<span class="ctry">${ICON.globe}${esc(c)}</span>`).join("")}${opOf(a).filter(c => placeOf(a).indexOf(c) < 0).map(c => `<span class="ctry op">${ICON.plane}${esc(c)} 항공사</span>`).join("")}<span>${ICON.flag}${esc(a.place || "")}</span><span>${ICON.plane}${esc(a.aircraft || "")}</span>${a.phase ? `<span>${ICON.route}${esc(a.phase)} 중</span>` : ""}<span class="${a.fatal ? "fat" : "zero"}">${a.fatal ? `사망 ${fmt(a.fatal)}명` : "사망자 없음"}${a.onboard ? ` / 탑승 ${fmt(a.onboard)}명` : ""}</span></div></div></div>
<div class="mn-acc-body"><section><p class="mn-k">${ICON.info}무슨 일이 있었나</p><p>${esc(a.what || "")}</p></section><section><p class="mn-k">${ICON.doc}조사 결과</p><p>${esc(a.cause || "")}</p></section><section class="mn-acc-les"><p class="mn-k">${ICON.target}조종사에게 남긴 것</p><ol>${(a.lessons || []).map(t => `<li>${esc(t)}</li>`).join("")}</ol></section></div>
<div class="mn-foot"><span class="mn-tags">${(a.related || []).map(t => MN_TAG_LINK[t] ? `<a href="#${MN_TAG_LINK[t]}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join("")}${ac ? `<a href="#${ac.id}">${esc(ac.name)} 기종 보기</a>` : ""}</span><span class="mn-src">${(a.sources || []).slice(0, 2).map(s => `<a class="ext" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join("")}</span></div>${a.note ? `<details class="lr-more"><summary>참고 메모</summary><p class="small muted" style="margin:0">${esc(a.note)}</p></details>` : ""}</article>`;
  }
  function mnAccList() {
    if (!MN_ACC.length) return `<p class="muted" style="padding:20px">사건사고 자료가 없습니다.</p>`;
    const L = MN_ACC.filter(a => (mnTag === "전체" || (a.related || []).indexOf(mnTag) >= 0) && (mnDec === "전체" || String(decOf(a)) === mnDec) && (mnCtry === "전체" || ctryOf(a).indexOf(mnCtry) >= 0)).slice().sort((x, y) => (y.date || "").localeCompare(x.date || ""));
    if (!L.length) return `<p class="muted" style="padding:20px">조건에 맞는 사례가 없습니다.</p>`;
    const groups = {}; L.forEach(a => { const k = decOf(a); (groups[k] = groups[k] || []).push(a); });
    return Object.keys(groups).sort((x, y) => y - x).map(k => `<div class="mn-dec"><h2 class="mn-dec-h"><span>${k}년대</span><small>${groups[k].length}건</small></h2>${groups[k].map(mnAccCard).join("")}</div>`).join("");
  }
  // 연표: 1975~2026 축에 사고마다 점. 누르면 그 카드로 이동
  /* 연표 동그라미 안 글자: 항공사 2글자 코드(IATA). 두 대가 얽힌 사고는 '2기', 여러 사고를 묶은 항목은 'MAX' */
  const MN_CODE = { colgan3407: "9L", alw301: "KT", hcy522: "ZU", comair5191: "OH", uberlingen: "2기", tenerife: "2기", "737max": "MAX" };
  const codeOf = a => MN_CODE[a.id] || a.code || ((/^([a-z0-9]{2})\d/.exec(a.id) || [])[1] || "").toUpperCase() || "?";
  function mnTimeline() {
    const y0 = 1970, y1 = 2027, X = y => ((y - y0) / (y1 - y0) * 100).toFixed(2), lanes = [12, 31, 50, 69, 88];
    const L = MN_ACC.slice().sort((p, q) => (p.date || "").localeCompare(q.date || "")), last = [-99, -99, -99, -99, -99];
    const dots = L.map(a => { const y = +(a.date || "0").slice(0, 4) + (+(a.date || "0000-06").slice(5, 7) - 1) / 12, x = +X(y);
      let li = 0; for (let k = 0; k < 5; k++) { if (x - last[k] > 4.2) { li = k; break; } if (last[k] < last[li]) li = k; } last[li] = x;
      const cls = a.fatal ? (a.fatal >= 100 ? " big" : "") : " zero";
      return `<a class="mn-tl-dot${cls}" href="#acc-${esc(a.id)}" data-acc="${esc(a.id)}" style="left:${x}%;top:${lanes[li]}%" data-tip="${esc(`<b>${esc(a.name)}</b><br>${esc(a.date)}, ${a.fatal ? "사망 " + fmt(a.fatal) + "명" : "사망자 없음"}`)}" aria-label="${esc(a.name)}">${esc(codeOf(a))}</a>`; }).join("");
    const ticks = [1970, 1980, 1990, 2000, 2010, 2020].map(y => `<span class="mn-tl-t" style="left:${X(y)}%">${y}</span>`).join("");
    return `<div class="mn-tl-wrap"><div class="mn-tl"><div class="mn-tl-ax"></div>${ticks}${dots}</div></div>
<div class="mn-tl-leg"><span><i class="mn-tl-dot zero">KE</i>사망자 없음</span><span><i class="mn-tl-dot">KE</i>사망자 100명 미만</span><span><i class="mn-tl-dot big">KE</i>사망자 100명 이상</span></div>
<p class="small muted mn-tl-note">동그라미 안 글자는 항공사 코드(예: KE 대한항공, OZ 아시아나항공)입니다. '2기'는 두 비행기가 얽힌 사고입니다. 동그라미를 누르면 해당 사례로 이동합니다.</p>`;
  }
  /* 기종별 통계: 이 페이지에 실린 사례만 기종 계열로 묶어 센다. 사고율이 아니라 '어떤 기종 사례가 실렸나'를 보는 표 */
  const MN_FAM = [[/^A3(18|19|2\d)/i, "A320 계열"], [/^A33|^A34/i, "A330, A340"], [/^A38/i, "A380"], [/^A30|^A31/i, "A300, A310"], [/737/, "737"], [/747/, "747"], [/757/, "757"], [/767/, "767"], [/777/, "777"], [/787/, "787"], [/MD-?1[01]|DC-?10/i, "DC-10, MD-11"], [/MD-?8|DC-?9/i, "DC-9, MD-80"], [/Concorde|콩코드/i, "콩코드"], [/ATR|DHC|Q400|Dash/i, "터보프롭"], [/CRJ|ERJ|Embraer/i, "리저널 제트"], [/L-?1011|트라이스타/i, "L-1011"], [/Tu-|Il-|투폴레프/i, "구소련 기종"]];
  const mnFamOf = s => { for (const f of MN_FAM) if (f[0].test(s || "")) return f[1]; return "기타"; };
  function mnTypeStats() {
    const by = {}; MN_ACC.forEach(a => { const fs = Array.from(new Set(String(a.aircraft || "").split(/,|와 |및 |\/| 그리고 /).map(mnFamOf))); fs.forEach(f => { const b = by[f] || (by[f] = { n: 0, fatal: 0, zero: 0 }); b.n++; b.fatal += a.fatal || 0; if (!a.fatal) b.zero++; }); });
    const ks = Object.keys(by).sort((x, y) => by[y].n - by[x].n || by[y].fatal - by[x].fatal), mx = Math.max(1, ...ks.map(k => by[k].n));
    const rows = ks.map(k => `<div class="mn-ts-r"><b>${esc(k)}</b><div class="mn-ts-bar"><i style="width:${(by[k].n / mx * 100).toFixed(1)}%"></i><i class="z" style="width:${(by[k].zero / mx * 100).toFixed(1)}%"></i></div><span class="num">${by[k].n}건</span><span class="num muted">${by[k].fatal ? "사망 " + fmt(by[k].fatal) : "사망 없음"}</span></div>`).join("");
    return `<section class="card c12">${cardH(ICON.plane, "기종별로 보면", `<span class="hint">이 페이지에 실린 ${MN_ACC.length}건 기준</span>`)}<div class="card-b"><div class="mn-ts">${rows}</div><p class="small muted" style="margin:10px 0 0">막대의 초록 부분은 사망자가 없었던 사례입니다. 운항 대수와 비행 횟수가 기종마다 크게 달라서, 이 숫자로 어느 기종이 더 위험하다고 말할 수는 없습니다.</p></div></section>`;
  }
  function renderManualAcc() {
    const tags = ["전체"].concat(Array.from(new Set(MN_ACC.flatMap(a => a.related || []))));
    const cnt = {}; MN_ACC.forEach(a => ctryOf(a).forEach(c => { cnt[c] = (cnt[c] || 0) + 1; })); const ctrys = [["전체", 0]].concat(Object.keys(cnt).sort((x, y) => cnt[y] - cnt[x] || x.localeCompare(y)).map(c => [c, cnt[c]]));
    const decs = ["전체"].concat(Array.from(new Set(MN_ACC.map(decOf))).sort((x, y) => y - x).map(String));
    return mnHead("사건사고", "널리 알려진 여객기 사고와 사건을 공식 조사 결과를 바탕으로 정리했습니다. 무엇이 있었고, 조사에서 무엇이 밝혀졌고, 조종사가 무엇을 가져가야 하는지에 초점을 맞췄습니다.") + `
<div class="grid lr mn"><section class="card c12">${cardH(ICON.clock, "연표", `<span class="hint">${MN_ACC.length}건</span>`)}<div class="card-b">${mnTimeline()}</div></section>
${mnTypeStats()}<section class="card c12"><div class="card-b mn-filters"><div><p class="mn-k">국가 <small>사고 장소 또는 항공사 국적</small></p><div class="lr-seg" role="group" aria-label="국가">${ctrys.map(c => `<button type="button" data-mn="ctry:${c[0]}" class="${c[0] === mnCtry ? "on" : ""}">${c[0]}${c[1] ? ` <small>${c[1]}</small>` : ""}</button>`).join("")}</div></div><div><p class="mn-k">연대</p><div class="lr-seg" role="group" aria-label="연대">${decs.map(t => `<button type="button" data-mn="dec:${t}" class="${t === mnDec ? "on" : ""}">${t === "전체" ? "전체" : t + "년대"}</button>`).join("")}</div></div><div><p class="mn-k">분류</p><div class="lr-seg" role="group" aria-label="분류">${tags.map(t => `<button type="button" data-mn="tag:${t}" class="${t === mnTag ? "on" : ""}">${t}</button>`).join("")}</div></div></div><div id="mn-acc-list" class="mn-acc-list">${mnAccList()}</div></section>
</div><p class="lr-note">희생자와 가족에게 깊은 애도를 표합니다. 요약은 공식 조사 보고서를 기준으로 했으며, 자세한 내용은 각 출처를 확인하세요. 그림은 기종의 모양을 보여 주는 측면 그림입니다.</p>`;
  }
  const MANUAL_PAGES = { "manual-sit": renderManualSit, "manual-tips": renderManualTips, "manual-acc": renderManualAcc };
  const MANUAL_TITLES = { "manual-sit": "상황별 대응", "manual-tips": "경험과 요령", "manual-acc": "사건사고" };
  document.addEventListener("click", e => {
    const t = e.target.closest && e.target.closest("[data-acc]");
    if (t) { e.preventDefault(); const id = t.getAttribute("data-acc"); if (!$("#acc-" + id)) { mnTag = "전체"; mnDec = "전체"; mnCtry = "전체"; document.querySelectorAll("[data-mn^='tag:'],[data-mn^='dec:'],[data-mn^='ctry:']").forEach(x => x.classList.toggle("on", /:전체$/.test(x.getAttribute("data-mn")))); $("#mn-acc-list").innerHTML = mnAccList(); } const el = $("#acc-" + id); if (el) { el.scrollIntoView({ behavior: fxCalm() ? "auto" : "smooth", block: "start" }); el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); } return; }
    const b = e.target.closest && e.target.closest("[data-mn]"); if (!b) return;
    const v = b.getAttribute("data-mn"), k = v.slice(0, v.indexOf(":")), arg = v.slice(v.indexOf(":") + 1);
    if (k === "open") { mnOpen = mnOpen === arg ? null : arg; const box = $("#mn-sit-list"); if (box) box.innerHTML = mnSitList(); return; }
    if (k === "phase") { mnPhase = arg; document.querySelectorAll("[data-mn^='phase:']").forEach(x => x.classList.toggle("on", x === b)); const box = $("#mn-sit-list"); if (box) box.innerHTML = mnSitList(); return; }
    if (k === "tag") { mnTag = arg; document.querySelectorAll("[data-mn^='tag:']").forEach(x => x.classList.toggle("on", x === b)); const box = $("#mn-acc-list"); if (box) box.innerHTML = mnAccList(); }
    if (k === "ctry") { mnCtry = arg; document.querySelectorAll("[data-mn^='ctry:']").forEach(x => x.classList.toggle("on", x === b)); const box = $("#mn-acc-list"); if (box) box.innerHTML = mnAccList(); return; }
    if (k === "dec") { mnDec = arg; document.querySelectorAll("[data-mn^='dec:']").forEach(x => x.classList.toggle("on", x === b)); const box = $("#mn-acc-list"); if (box) box.innerHTML = mnAccList(); }
  });
