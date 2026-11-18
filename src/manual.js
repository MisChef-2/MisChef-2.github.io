  /* ================= 조종 매뉴얼 =================
     자료 > 조종 매뉴얼. 상황별 대응(비정상, 비상 절차의 일반 원칙), 경험과 요령(흔한 실수와 경험칙), 사건사고(공식 조사 결과 요약).
     모두 학습용 일반 원칙이다. 실제 비행에서는 해당 기종의 교범(FCOM)과 빠른 참조 체크리스트(QRH)가 우선한다. */
  const MN_PHASE = ["전체", "이륙", "상승", "순항", "강하", "접근", "착륙", "모든 단계"];
  // 상황별 대응: [id, 단계, 제목, 언제, 즉시 할 일(순서), 이어서, 흔한 실수, 관련 원리 탭, 시뮬레이터 연습]
  const MN_SIT = [
    ["rto", "이륙", "이륙 중단 (RTO)", "V1에 닿기 전에 엔진 고장, 화재 경고, 이륙 형태 경고처럼 계속 이륙하면 위험한 문제가 생겼을 때.", ["\"STOP\"을 외친다", "추력 레버를 아이들로", "자동 제동(RTO) 작동 확인, 안 되면 최대 수동 제동", "스피드브레이크를 올린다", "역추력을 쓴다"], ["완전히 멈춘 뒤 관제에 알린다", "화재나 연기가 있으면 비상 탈출을 판단한다", "브레이크가 매우 뜨거우니 소방 지원을 요청한다"], ["V1을 넘긴 뒤 멈추려 한다. 남은 활주로로는 멈출 수 없을 수 있다", "작은 경고등 하나로 고속에서 중단해 더 큰 위험을 만든다"], "learn-forces", "짧은 활주로 공항에서 V1 직전 엔진 고장을 설정해 멈추는 거리를 확인한다."],
    ["eng-v1", "이륙", "V1 이후 엔진 고장", "V1을 지난 뒤 엔진 하나가 멈췄을 때. 이때는 이륙을 계속하는 것이 원칙이다.", ["러더로 활주로 중심선을 지킨다", "VR에서 평소처럼 기수를 든다", "V2 ~ V2+15 kt를 유지한다", "상승률이 양(+)인지 확인하고 기어를 올린다"], ["절차 고도(보통 400 ft 이상) 전에는 엔진 조작을 하지 않는다", "두 조종사가 함께 멈춘 엔진을 확인한 뒤 체크리스트를 수행한다", "가속 고도에서 수평으로 가속하며 플랩을 접고, 가까운 공항으로 돌아간다"], ["러더가 모자라 기체가 옆으로 미끄러진다", "급한 마음에 멀쩡한 엔진을 끈다 (1989년 케그워스 사고)"], "learn-control", "V1 바로 뒤 엔진 고장을 설정하고 러더로 직진을 유지하는 연습을 반복한다."],
    ["stall", "모든 단계", "실속 경고와 회복", "스틱 셰이커가 울리거나 실속 경고가 나왔을 때, 또는 기체가 흔들리며 기수가 처질 때.", ["기수를 숙여 받음각을 줄인다 (가장 먼저)", "날개를 수평으로", "추력을 필요한 만큼 조절한다", "속도가 회복되면 원래 경로로 돌아온다"], ["회복 뒤 원인(속도 설정, 자동화 모드, 결빙)을 확인한다"], ["추력만 올리고 기수를 계속 당긴다. 받음각이 그대로라 실속에서 벗어나지 못한다", "높은 고도에서 실속을 과속으로 착각한다"], "learn-stall", "오토파일럿을 끄고 고도를 지킨 채 천천히 감속해 경고가 울리는 순간 회복 동작을 연습한다."],
    ["windshear", "접근", "윈드시어", "이륙이나 접근 중 윈드시어 경고가 울리거나, 속도가 갑자기 15 kt 넘게 변하고 강하율이 커질 때.", ["최대 추력(TOGA)", "기수를 약 15도로 들고, 필요하면 스틱 셰이커 직전까지", "기어와 플랩 형태는 바꾸지 않는다", "벗어날 때까지 자세를 유지한다"], ["벗어난 뒤 관제에 보고한다 (다음 비행기를 위해)", "같은 활주로로 다시 접근할지 신중히 판단한다"], ["속도를 되찾으려고 기수를 숙인다. 땅과 가까워진다", "형태를 바꿔 양력을 잃는다"], "learn-forces", "뇌우가 있는 날씨로 설정하고 짧은 최종 접근에서 윈드시어 탈출 동작을 연습한다."],
    ["goaround", "접근", "불안정 접근과 복행", "계기 비행에서 1,000 ft, 시계 비행에서 500 ft에 경로, 속도, 형태, 강하율이 안정되지 않았을 때. 대표 기준은 속도 Vref ~ Vref+20 kt, 강하율 1,000 fpm 이하.", ["\"GO AROUND\"를 외치고 TOGA", "기수를 약 15도로", "플랩을 한 단계 접는다", "상승률이 양(+)이면 기어를 올린다"], ["복행 절차대로 고도와 방향을 맞춘다", "관제에 알리고 다음 접근을 준비한다. 원인(바람, 늦은 강하)을 고친다"], ["낮은 고도에서 억지로 맞춰 내리려 한다", "복행 때 기수를 너무 빨리, 너무 많이 든다"], "learn-highlift", "일부러 높고 빠르게 접근해 기준 고도에서 복행을 결정하는 연습을 한다."],
    ["xwind", "착륙", "옆바람 착륙", "활주로와 비스듬히 바람이 불 때.", ["최종 접근은 바람 쪽으로 기수를 틀어(크랩) 활주로 연장선을 따라간다", "닿기 직전 러더로 기수를 활주로에 맞춘다(디크랩)", "에일러론으로 바람 쪽 날개를 살짝 낮춘다", "닿은 뒤에도 에일러론을 바람 쪽으로 유지한다"], ["기종별로 시연된 최대 옆바람 값을 미리 확인한다", "보잉 기준으로는 정풍 성분의 절반에 돌풍 증가분 전체를 접근 속도에 더하는 것이 흔한 방식이다"], ["디크랩을 너무 일찍 해서 바람에 밀린다", "닿은 뒤 에일러론을 풀어 날개가 들린다"], "learn-control", "옆바람 15 kt, 25 kt로 바꿔 가며 같은 공항에 착륙해 본다."],
    ["decomp", "순항", "급감압", "객실 고도 경고가 울리거나 귀가 아프고 안개가 생기며 객실 압력이 급히 떨어질 때.", ["산소 마스크를 쓴다", "조종사끼리 통신을 확보한다", "비상 강하를 시작한다 (추력 아이들, 스피드브레이크)", "7700을 설정하고 MAYDAY를 선언한다"], ["10,000 ft 또는 그 지역 최저 안전 고도까지 내려간다", "구조 손상이 의심되면 속도를 낮게 잡는다"], ["마스크보다 다른 일을 먼저 한다. 높은 고도에서 의식을 유지할 시간은 수십 초 수준이다"], "learn-sweep", "FL370에서 감압 고장을 설정하고 10,000 ft까지 비상 강하에 걸리는 시간을 재 본다."],
    ["engfire", "모든 단계", "엔진 화재", "엔진 화재 경고가 울렸을 때.", ["두 조종사가 함께 해당 엔진을 확인한다", "추력 레버를 아이들로", "연료를 차단한다", "소화기를 발사한다 (경고가 남으면 정해진 시간 뒤 두 번째)"], ["가장 가까운 적절한 공항에 내린다", "착륙 뒤 소방대와 확인한다"], ["다른 엔진을 끈다. 그래서 확인을 두 번 한다"], "learn-control", "이륙 상승 중 엔진 화재를 걸고 확인 절차를 소리 내어 해 본다."],
    ["dualeng", "모든 단계", "양쪽 엔진 고장 (조류 충돌, 연료)", "두 엔진이 모두 멈췄을 때.", ["기종 교범의 최적 활공 속도를 잡는다", "APU를 켠다 (전기와 공기)", "고도 여유가 있으면 재시동을 시도한다", "MAYDAY, 7700"], ["닿을 수 있는 공항이나 착륙 지점을 일찍 정한다", "닿을 수 없으면 수면이나 평지 착륙을 준비한다"], ["재시동에 매달려 착륙 지점 결정을 늦춘다"], "learn-lift", "2,000 ft 이상에서 양쪽 엔진을 끄고 최적 활공 속도로 얼마나 멀리 가는지 확인한다."],
    ["fuel", "순항", "연료 부족", "도착 예상 연료가 계획보다 크게 줄었을 때.", ["관제에 'MINIMUM FUEL'을 알린다 (더 이상의 지연을 감당하기 어렵다는 뜻)", "최종 예비 연료(보통 30분) 아래로 내려갈 것 같으면 'MAYDAY FUEL'을 선언한다", "가장 가까운 적절한 공항을 다시 고른다"], ["연료 누출 가능성을 점검한다 (연료 사용량과 남은 양이 맞지 않는지)"], ["목적지에 집착해 교체 공항 결정을 늦춘다 (연료 부족을 늦게 알아챈 사례: 2001년 에어 트랜샛 236편)"], "learn-sweep", "출발 연료를 줄여 놓고 교체 공항으로 바꾸는 결정 시점을 연습한다."],
    ["tcas", "모든 단계", "TCAS 회피 지시 (RA)", "충돌 경고 장치가 'CLIMB'이나 'DESCEND' 같은 회피 지시를 냈을 때.", ["오토파일럿을 풀고 지시대로 즉시 움직인다", "관제 지시와 달라도 RA를 따른다", "관제에 'TCAS RA'를 알린다"], ["'CLEAR OF CONFLICT' 뒤 원래 허가 고도로 돌아간다"], ["관제 지시를 따르느라 RA와 반대로 움직인다 (2002년 위버링겐 공중 충돌)"], "learn-control", "온라인 관제 비행에서 RA 콜아웃 순서를 미리 외워 둔다."],
    ["gpws", "강하", "지형 경고 'PULL UP'", "지상 접근 경고 장치가 'TERRAIN, PULL UP'을 냈을 때.", ["오토파일럿과 자동 추력을 푼다", "최대 추력", "날개 수평으로 기수를 약 20도로 (스틱 셰이커 범위 안)", "스피드브레이크를 집어넣는다"], ["경고가 그칠 때까지 상승하고 관제에 알린다"], ["경고를 오작동이라 여기고 무시한다"], "learn-forces", "산악 공항 접근에서 일부러 낮게 내려가 경고 회피 동작을 연습한다."],
    ["turb", "순항", "심한 난기류", "흔들림이 커지거나 난기류 예보 지역에 들어갈 때.", ["좌석벨트 신호", "기종의 난기류 통과 속도로 맞춘다", "자세를 지키고 급한 조종을 피한다"], ["고도 변화는 어느 정도 허용한다. 고도를 억지로 지키려 하면 기체에 무리가 간다", "가능하면 고도나 경로를 바꿔 벗어난다"], ["속도와 고도를 억지로 잡으려 크게 조작한다"], "learn-sweep", "날씨 설정에서 난기류를 강하게 하고 오토파일럿 상태와 수동 상태를 비교한다."],
    ["nordo", "모든 단계", "무선 두절", "관제와 교신이 끊겼을 때.", ["7600을 설정한다", "다른 주파수와 장비로 연락을 시도한다", "마지막으로 허가받은 경로와 고도를 따른다 (지역 규정에 따라)"], ["도착 공항의 절차대로 접근한다"], ["허가 없이 경로를 바꾼다"], "learn-forces", "비행 계획을 세울 때 무선 두절 시 따를 경로와 고도를 적어 둔다."],
    ["smoke", "모든 단계", "객실 연기와 화재", "객실이나 조종석에 연기, 타는 냄새가 나거나 화물칸 화재 경고가 울렸을 때.", ["산소 마스크와 연기 보호 안경을 쓴다", "조종사끼리 통신을 확보한다", "MAYDAY를 선언하고 가장 가까운 적절한 공항으로 회항을 시작한다", "연기 체크리스트로 의심되는 계통을 하나씩 끈다"], ["연기가 계속 짙어지면 체크리스트를 다 끝내기보다 착륙을 우선한다", "객실 승무원에게 연기 위치와 진행 상황을 계속 보고받는다", "착륙 뒤 비상 탈출을 판단하고 소방대를 대기시킨다"], ["원인 찾기에 시간을 쓰며 착륙을 미룬다. 기내 화재는 몇 분 안에 번질 수 있다", "마스크를 늦게 써서 판단력이 떨어진다"], "learn-forces", "순항 중 연기 고장을 설정하고 가장 가까운 공항까지 몇 분 안에 내릴 수 있는지 재 본다."],
    ["elec", "모든 단계", "전기 계통 고장", "발전기 고장 경고가 뜨거나 여러 화면과 계기가 한꺼번에 꺼질 때.", ["대기 계기로 자세를 확인하며 기체 조종을 먼저 한다", "남은 발전기가 버스를 잇고 있는지 확인한다", "APU를 켜 발전기를 연결한다", "전기 체크리스트로 꺼진 버스와 원인을 확인한다"], ["배터리만 남았다면 쓸 수 있는 시간이 한정되므로 가까운 공항에 내린다", "꺼진 장비(연료 펌프, 결빙 방지, 항법 장비)를 정리해 접근 계획에 반영한다", "관제에 상황을 알리고 단순한 접근을 요청한다"], ["화면이 꺼진 데 놀라 기체 자세를 놓친다", "튀어나온 회로 차단기를 여러 번 다시 넣는다. 과열이나 화재로 이어질 수 있다"], "learn-control", "발전기 고장 고장을 설정하고 대기 계기만으로 접근하는 연습을 한다."],
    ["hyd", "모든 단계", "유압 계통 고장", "유압 압력 저하 경고가 뜨거나 조종면, 플랩, 기어, 브레이크 작동이 둔해질 때.", ["기체 조종과 경로를 먼저 안정시킨다", "어느 유압 계통을 잃었는지 확인한다", "유압 체크리스트를 수행한다", "관제에 알리고 대기해 시간을 확보한다"], ["대체 방식으로 기어를 내리는 절차를 미리 확인한다", "플랩이 덜 펴지고 제동과 조향이 약해지므로 긴 활주로를 고르고 착륙 거리를 다시 계산한다", "활주로에서 멈춘 뒤 무리하게 이동하지 말고 견인을 요청한다"], ["서둘러 접근하며 줄어든 성능을 계산하지 않는다", "모든 유압을 잃었을 때는 조종면 대신 좌우 엔진 추력 차이로 방향과 기수를 조절해야 했다 (1989년 유나이티드 232편)"], "learn-control", "유압 계통 하나를 고장 내고 플랩과 제동이 줄어든 상태로 착륙 거리를 비교한다."],
    ["gear", "접근", "착륙 장치가 내려오지 않을 때", "기어를 내렸는데 초록 표시등 3개가 다 들어오지 않거나 기어 경고가 울릴 때.", ["복행하거나 접근을 멈추고 안전한 고도에서 대기한다", "한 조종사는 비행에만 집중하고 다른 조종사가 문제를 맡는다", "체크리스트가 허락하면 기어를 올렸다가 다시 내린다", "대체(중력) 내림 절차를 수행한다"], ["관제탑 앞을 낮게 지나가며 기어 상태를 눈으로 확인해 달라고 할 수 있다", "끝내 내려오지 않으면 연료를 줄이고 소방대를 대기시킨 뒤 비상 착륙을 준비한다", "객실 승무원에게 충격 대비 자세 안내를 맡긴다"], ["두 조종사가 모두 표시등에 매달려 고도가 떨어지는 것을 놓친다 (1972년 이스턴 항공 401편)"], "learn-forces", "기어 고장 고장을 설정하고 대기 패턴에서 대체 내림 절차를 해 본다."],
    ["flaps", "접근", "플랩이나 슬랫 고장", "접근 중 플랩이나 슬랫이 펴지지 않거나 한쪽만 펴져 비대칭 경고가 뜰 때.", ["레버 조작을 멈추고 지금 형태의 최소 속도보다 빠르게 유지한다", "복행하거나 대기해 시간을 확보한다", "체크리스트에서 형태별 접근 속도 보정값을 찾는다", "착륙 거리를 다시 계산하고 긴 활주로를 고른다"], ["접근 속도가 높아 기수 자세와 플레어 느낌이 평소와 다르다는 것을 미리 알고 내려간다", "관제에 알리고 길고 곧은 최종 접근을 요청한다"], ["비대칭 상태에서 레버를 계속 움직여 기울어짐을 키운다", "평소 접근 속도로 내려가 실속 여유가 줄어든다"], "learn-highlift", "플랩 고장 고장을 설정하고 플랩이 작을 때 접근 속도와 착륙 거리가 얼마나 늘어나는지 확인한다."],
    ["icing", "모든 단계", "결빙", "기온이 영하 근처인 구름이나 비, 눈 속을 지날 때, 또는 결빙 경고가 뜨거나 와이퍼와 날개에 얼음이 보일 때.", ["엔진 결빙 방지를 켠다", "기종 기준에 맞춰 날개 결빙 방지를 켠다", "속도를 평소보다 여유 있게 유지한다", "얼음이 계속 쌓이면 고도를 바꿔 결빙층을 벗어난다"], ["관제에 결빙 정도를 보고한다", "날개에 얼음이 남아 있으면 실속 경고보다 먼저 실속할 수 있으니 접근 속도를 보정한다", "지상에서는 제빙, 방빙 처리를 하고 허용 시간 안에 이륙한다"], ["지상과 이륙에서 엔진 결빙 방지를 켜지 않아 잘못된 추력 표시를 믿는다 (1982년 에어 플로리다 90편)", "오토파일럿이 얼음 때문에 생긴 쏠림을 감추고 있다가 풀리는 순간 크게 기운다"], "learn-stall", "기온을 영하 근처로 두고 구름 속 접근에서 결빙 방지 스위치를 켜는 시점을 연습한다."],
    ["birdeng", "이륙", "조류 충돌 (엔진 하나)", "이륙이나 초기 상승 중 새와 부딪힌 뒤 한쪽 엔진에서 진동, 소음, 추력 감소가 생길 때.", ["속도와 상승 경로를 지키며 기체를 먼저 조종한다", "러더로 방향을 잡는다", "두 조종사가 함께 어느 엔진인지 계기로 확인한다", "절차 고도 전에는 엔진 조작을 하지 않는다"], ["진동과 배기 온도를 보고 체크리스트대로 추력을 줄이거나 엔진을 끈다", "관제에 조류 충돌을 알리고 돌아가 내린다", "다른 엔진도 손상됐을 수 있으니 계기를 계속 지켜본다"], ["소리나 느낌만으로 엔진을 골라 멀쩡한 쪽을 줄인다", "낮은 고도에서 서둘러 엔진을 만져 추력을 더 잃는다"], "learn-control", "이륙 직후 엔진 하나 손상 고장을 설정하고 한 엔진으로 장주를 돌아 내리는 연습을 한다."],
    ["tailstrike", "이륙", "꼬리 닿음 (테일스트라이크) 위험", "무게가 무겁거나 속도 계산이 틀렸을 때, 또는 기수를 너무 빨리 들 때. 동체가 긴 기종일수록 위험이 크다.", ["이륙 전 무게와 V 속도를 두 사람이 교차 확인한다", "VR 전에는 기수를 들지 않는다", "초당 약 3도로 부드럽게 기수를 든다", "떠오를 때까지 자세를 더 키우지 않는다"], ["꼬리가 닿았다고 의심되면 객실 여압을 올리지 않고 돌아가 내린다", "착륙에서도 플레어를 길게 끌거나 바운스 뒤 기수를 크게 들면 꼬리가 닿을 수 있다"], ["무게를 잘못 넣어 너무 낮은 속도로 기수를 든다 (2009년 에미레이트 407편)", "기수를 한 번에 세게 당긴다"], "learn-lift", "무게를 무겁게 두고 기수를 드는 빠르기를 바꿔 가며 기수 자세가 어떻게 달라지는지 본다."],
    ["rwyobs", "착륙", "활주로 위 장애물과 침범", "최종 접근이나 이륙 활주 중 활주로에 다른 비행기, 차량, 사람이 보이거나 관제가 활주로가 비지 않았다고 알릴 때.", ["보이는 것을 크게 말해 두 조종사가 함께 확인한다", "접근 중이면 망설이지 말고 복행한다", "이륙 활주 중이면 V1 전인지 확인하고 멈출지 판단한다", "관제에 보고한다"], ["관제 지시를 받은 뒤 다시 접근한다", "지상 이동 중에는 활주로에 들어가기 전 허가를 소리 내어 확인한다"], ["상대가 곧 비킬 것이라 믿고 접근을 계속한다", "이륙 허가를 확실히 받지 않고 이륙을 시작한다 (1977년 테네리페 참사)"], "learn-forces", "온라인 관제 비행에서 활주로 진입과 이륙 허가 문구를 정확히 따라 읽는다."],
    ["slippery", "착륙", "미끄러운 활주로 착륙", "비, 눈, 얼음으로 활주로 제동 상태가 나쁘다고 보고되거나 물이 고였을 때.", ["보고된 제동 상태로 착륙 거리를 다시 계산한다", "자동 제동을 더 강한 단계로 둔다", "플로트 없이 정해진 지점에 단단히 내린다", "닿자마자 스피드브레이크와 역추력을 쓴다"], ["옆바람 한계가 줄어드니 바람을 다시 확인한다", "속도가 충분히 줄 때까지 앞바퀴 조향보다 러더로 방향을 잡는다", "여유가 부족하면 다른 활주로나 교체 공항으로 간다"], ["부드럽게 내리려고 오래 떠 있다가 활주로를 다 쓴다", "역추력을 늦게 써서 멈추지 못한다 (2005년 사우스웨스트 항공 1248편)"], "learn-forces", "활주로를 젖거나 얼음으로 설정하고 자동 제동 단계별로 멈추는 거리를 비교한다."],
    ["uas", "모든 단계", "속도계 이상", "두 속도계 값이 서로 다르거나, 속도가 고도, 추력, 자세와 맞지 않게 변할 때. 피토관 결빙이나 막힘이 흔한 원인이다.", ["오토파일럿과 자동 추력을 푼다", "기종 교범의 기억 항목 자세와 추력으로 맞춘다", "날개를 수평으로 유지한다", "피토 열선이 켜져 있는지 확인한다"], ["안정되면 체크리스트의 자세와 추력 표로 비행한다", "GPS 지상속도와 받음각 정보를 참고한다", "관제에 알리고 높은 고도에서는 서두르지 않는다"], ["틀린 속도계를 믿고 기수를 크게 당긴다 (2009년 에어 프랑스 447편)", "막힌 피토관 때문에 속도가 오르는 것처럼 보여 추력을 줄이고 기수를 든다 (1996년 비르겐에어 301편)"], "learn-stall", "피토관 막힘 고장을 설정하고 자세와 추력만으로 수평 비행을 유지해 본다."],
    ["upset-nh", "모든 단계", "비정상 자세 회복 (기수 높음)", "기수가 크게 들리고 속도가 빠르게 줄어들 때. 대략 기수 25도 이상을 기준으로 흔히 쓴다.", ["오토파일럿과 자동 추력을 푼다", "조종간을 밀어 받음각을 줄인다", "필요하면 기수를 숙이는 쪽으로 트림한다", "추력을 줄여 기수를 드는 힘을 줄인다", "그래도 부족하면 기울여서 기수를 수평선 쪽으로 내린다 (60도를 넘기지 않는다)"], ["기수가 수평선에 가까워지면 날개를 수평으로 맞춘다", "속도가 회복되면 천천히 수평 비행으로 돌아온다", "원인(자동화 모드, 트림, 난기류)을 확인한다"], ["추력을 더 넣어 기수가 더 들린다. 날개 밑에 엔진이 달린 기종은 추력이 기수를 든다", "조종간을 너무 세게 밀어 몸이 뜨는 음(-)의 G를 만든다"], "learn-stall", "오토파일럿을 끄고 기수를 30도까지 든 뒤 회복 순서를 소리 내어 해 본다."],
    ["upset-nl", "모든 단계", "비정상 자세 회복 (기수 낮음)", "기수가 크게 숙여지고 속도가 빠르게 늘어날 때. 기울기가 큰 경우가 많다.", ["오토파일럿과 자동 추력을 푼다", "실속 경고가 있으면 먼저 받음각을 줄인다", "날개를 수평으로 맞춘다", "추력을 줄이고 필요하면 스피드브레이크를 쓴다", "날개가 수평이 된 뒤 기수를 들어 회복한다"], ["과속 한계와 하중 한계를 넘지 않게 부드럽게 당긴다", "회복 뒤 기체 점검이 필요한지 판단하고 관제에 알린다"], ["기울어진 채로 조종간을 당긴다. 나선을 그리며 더 빠르게 내려간다", "급하게 당겨 기체 한계 하중을 넘긴다"], "learn-control", "오토파일럿을 끄고 60도 기울기에 기수 20도 아래 자세를 만든 뒤 날개 수평이 먼저인 회복을 반복한다."],
    ["incap", "모든 단계", "조종사 무력화", "다른 조종사가 부르는 말에 답하지 않거나 평소와 다른 행동을 할 때. 두 번 불러도 알맞은 답이 없으면 무력화를 의심한다.", ["\"I HAVE CONTROL\"을 말하고 조종을 맡는다", "오토파일럿을 켜 일의 양을 줄인다", "객실 승무원을 불러 무력해진 조종사가 조종 장치에 닿지 않게 한다", "무력해진 조종사에게 산소를 준다"], ["관제에 MAYDAY나 PAN PAN을 선언하고 가까운 적절한 공항으로 간다", "승객 중 의사가 있는지 찾는다", "혼자서 체크리스트와 접근 준비를 한 단계씩 천천히 한다"], ["상대가 피곤한 것으로 여기고 조치를 늦춘다", "혼자 일을 다 하려다 비행 경로를 놓친다"], "learn-control", "오토파일럿을 활용해 혼자 체크리스트, 무선, 접근 준비를 처리하는 순서를 정해 두고 연습한다."],
    ["ash", "순항", "화산재 구역 진입", "밤에 앞 유리에 정전기 불꽃이 보이거나, 유황 냄새, 객실의 먼지, 엔진 배기 온도 상승, 출력 이상이 생길 때.", ["가능하면 추력을 아이들 쪽으로 줄인다", "화산재를 벗어나도록 180도 돌린다 (보통 강하하며)", "산소 마스크를 쓴다", "결빙 방지와 공기 공급 장치를 켜고 APU를 켠다"], ["엔진이 꺼지면 재시동을 시도한다. 맑은 공기로 내려온 뒤 다시 살아난 사례가 있다 (1982년 브리티시 항공 9편)", "속도계가 이상해질 수 있으니 자세와 추력도 함께 본다", "관제에 화산재를 보고하고 가까운 공항으로 간다"], ["추력을 올려 상승으로 벗어나려 한다. 엔진이 뜨거울수록 화산재가 녹아 엔진 안에 달라붙는다"], "learn-forces", "화산재 실패가 없다면 양쪽 엔진 고장 실패로 재시동 절차를 연습한다."],
    ["medical", "순항", "의료 비상과 회항 결정", "객실 승무원이 승객의 심한 통증, 의식 저하, 호흡 곤란 같은 상황을 알릴 때.", ["비행은 한 조종사가 계속 맡는다", "객실에 의사가 있는지 방송으로 찾는다", "환자 상태와 예상 도착 시간을 객실 승무원과 나눈다", "항공사 운항 관리나 지상 의료 상담과 연결한다"], ["회항 공항은 거리만이 아니라 활주로, 날씨, 의료 시설, 착륙 무게를 함께 본다", "최대 착륙 무게를 넘으면 연료 방출이나 과중량 착륙을 판단한다", "관제에 PAN PAN이나 MAYDAY로 우선 처리를 요청한다"], ["가장 가까운 공항만 보고 날씨나 활주로가 맞지 않는 곳으로 간다", "두 조종사가 모두 객실 상황에 매달려 비행을 놓친다"], "learn-forces", "장거리 비행 중간에 회항 공항 두세 곳을 정해 두고 각 공항의 활주로와 날씨를 미리 본다."],
    ["trim", "모든 단계", "트림 폭주와 자동 조종 이상", "트림이 멈추지 않고 계속 돌거나, 오토파일럿이 지시와 다르게 움직여 기체가 한쪽으로 계속 쏠릴 때.", ["조종간을 단단히 잡고 자세를 지킨다", "오토파일럿과 자동 추력을 푼다", "전기 트림으로 반대 방향을 맞춰 본다", "그래도 계속되면 트림 차단 스위치를 끈다"], ["수동 트림 휠이 있는 기종은 손으로 트림을 맞춘다", "속도가 높을수록 수동 트림이 무거워지므로 속도를 적당히 유지한다", "가까운 적절한 공항에 내린다"], ["트림이 반복해서 움직이는데 차단 스위치를 쓰지 않고 계속 반대로 맞춘다 (2018년 라이온에어 610편)"], "learn-control", "트림 폭주 고장을 설정하고 차단 스위치까지의 순서를 소리 내어 해 본다."],
    ["blackhole", "접근", "야간 착시 (블랙홀 접근)", "밤에 활주로 주변이 깜깜하고 활주로 불빛만 보일 때. 바다나 사막 쪽 접근에서 실제보다 높다고 느껴 너무 낮게 내려가기 쉽다.", ["ILS나 RNAV 활공로를 함께 띄워 둔다", "PAPI를 계속 확인한다", "강하율을 기준값(지상속도 × 5)과 비교한다", "기준 고도에서 안정되지 않으면 복행한다"], ["시계 접근 허가를 받아도 계기 접근 경로를 따라간다", "낯선 공항이라면 주변 지형과 장애물을 미리 확인한다"], ["눈에 보이는 활주로 모양만 믿고 계속 낮게 내려간다", "PAPI가 빨간 불 4개인데도 접근을 계속한다"], "learn-forces", "밤 시간으로 해안 공항을 골라 계기를 보지 않고 접근한 뒤 활공로와 얼마나 어긋났는지 확인한다."]
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
    ["연습", "고장은 하나씩", "시뮬레이터에서 비상 상황을 연습할 때는 한 번에 하나만 걸고, 절차를 익힌 뒤에 조합한다. 처음부터 여러 개를 겹치면 배우는 것이 적다."],
    ["착륙", "접지 지점을 정해 두기", "활주로 끝이 아니라 접지 구역 표지(보통 문턱에서 약 1,000 ft 지점의 굵은 표지)를 목표로 삼는다. 접근 내내 이 지점이 창 안에서 같은 자리에 머물면 활공로를 잘 타고 있는 것이다. 위로 올라가면 낮고, 아래로 내려가면 높다."],
    ["착륙", "닿은 뒤가 착륙의 절반", "접지하면 스포일러가 올라갔는지 확인하고 기수를 부드럽게 내린 뒤 역추력과 브레이크로 감속한다. 활주로 길이가 넉넉해도 젖었거나 짧으면 자동 제동 단계를 한 칸 높여 둔다."],
    ["강하", "감속에 필요한 거리", "수평 비행에서 속도 10 kt를 줄이는 데 대략 1 nm가 든다고 생각한다. 강하하면서 동시에 감속하기는 어려우니, 감속 구간을 3배 규칙 거리에 따로 더해 둔다."],
    ["강하", "전이고도와 고도계", "상승하며 전이고도를 지나면 고도계를 표준(1013 hPa, 29.92 inHg)으로, 강하하며 전이층을 지나면 그 지역 QNH로 바꾼다. 전이고도는 나라와 공항마다 다르니 차트에서 미리 확인한다."],
    ["속도", "플랩 제한 속도 지키기", "플랩과 기어마다 내려도 되는 최대 속도가 정해져 있다. 속도가 제한보다 충분히 낮아진 것을 보고 한 단계씩 내리고, 내린 뒤에는 표시가 맞는지 확인한다."],
    ["속도", "속도 추세 화살표 보기", "속도계 옆 추세 화살표는 몇 초 뒤의 속도를 보여 준다. 지금 숫자보다 화살표 끝을 보고 추력을 조절하면 속도가 오르내리며 출렁이는 것을 줄일 수 있다."],
    ["자동화", "허가 고도부터 맞춘다", "관제 허가를 받으면 모드를 바꾸기 전에 고도 선택 창에 허가 고도를 먼저 넣는다. 고도 창이 틀린 채로 상승이나 강하를 시작하면 허가 고도를 지나쳐 버리기 쉽다."],
    ["자동화", "FMS 경로는 차트와 대조한다", "출발 전에 FMS에 들어간 경로를 차트와 한 지점씩 맞춰 보고, 경로가 끊긴 곳(디스컨티뉴이티)이 없는지 확인한다. 잘못 넣은 지점 하나를 자동화는 그대로 따라간다."],
    ["협력", "조종하는 사람과 살피는 사람", "한 사람은 조종(PF)에, 다른 사람은 감시와 교신(PM)에 집중하도록 역할을 나눈다. 조종을 넘길 때는 '조종 넘깁니다', '조종 받았습니다'처럼 분명히 말로 주고받는다."],
    ["협력", "조용한 조종석 (스테릴 콕핏)", "택시, 이륙, 착륙과 낮은 고도(흔히 10,000 ft 아래)에서는 비행과 관계없는 대화를 하지 않는다. 일이 몰리는 구간에서 주의가 흩어지지 않게 하려는 규칙이다."],
    ["연료", "구간마다 연료 확인", "주요 지점을 지날 때마다 실제 남은 연료와 계획 연료를 비교한다. 차이가 조금씩 커지면 바람, 고도, 누출 가능성을 점검하고 교체 공항 계획을 미리 다시 본다."],
    ["연료", "연료를 더 싣는 것도 비용이다", "연료가 싼 공항에서 다음 구간 연료까지 실어 가는 것(탱커링)은 무게가 늘어 그만큼 연료를 더 태운다. 가격 차이, 구간 거리, 착륙 중량 한계를 함께 따져 이득일 때만 한다."],
    ["날씨", "METAR 읽는 순서", "METAR는 공항, 시각, 바람, 시정, 날씨 현상, 구름, 기온과 이슬점, 기압 순으로 적혀 있다. 기온과 이슬점 차이가 2~3도 안으로 좁으면 안개나 낮은 구름이 생기기 쉽다."],
    ["날씨", "옆바람 성분 어림셈", "옆바람 성분은 풍속 × sin(바람과 활주로 사이 각도)이다. 30도면 풍속의 절반, 45도면 약 0.7배, 60도 이상이면 거의 전부가 옆바람이라고 기억하면 빠르다."],
    ["판단", "출발 전 IMSAFE 점검", "병(Illness), 약(Medication), 스트레스(Stress), 술(Alcohol), 피로(Fatigue), 감정과 식사(Emotion, Eating)를 스스로 점검한다. 하나라도 걸리면 비행을 미루는 것이 옳은 판단이다."],
    ["판단", "'끝까지 가고 싶은 마음' 경계", "목적지가 가까울수록 날씨나 연료가 나빠져도 계획대로 밀고 가려는 마음이 커진다. 회항이나 복행 기준을 출발 전에 정해 두고, 그 기준에 닿으면 고민 없이 따른다."],
    ["연습", "한 공항에서 장주 비행 반복", "익숙한 공항 하나를 정해 이륙, 장주, 착륙을 여러 번 되풀이한다. 같은 조건에서 반복해야 무엇이 좋아졌는지 비교할 수 있다."],
    ["연습", "비행 뒤 짧게 되돌아보기", "착륙 뒤 잘된 것 하나와 고칠 것 하나를 적어 둔다. 다음 비행 브리핑에서 그 한 가지를 목표로 삼으면 실력이 꾸준히 는다."],
    ["이륙", "이륙 전 브리핑", "활주로, 이륙 속도(V1, VR, V2), 첫 상승 고도와 방향, 그리고 이륙 중 문제가 생기면 멈출지 계속할지와 어디로 돌아올지를 미리 말해 둔다. 일이 터진 뒤 생각하면 늦다."],
    ["이륙", "회전은 부드럽고 일정하게", "VR에서 초당 약 2~3도의 일정한 속도로 기수를 들어 목표 자세(흔히 15도 안팎)까지 올린다. 너무 빨리 들면 꼬리가 활주로에 닿을 수 있고, 너무 느리면 활주로를 길게 쓴다."],
    ["지상", "택시는 걷듯이 천천히", "직선 유도로에서는 대략 20 kt 아래, 꺾을 때는 10 kt 정도로 줄인다. 브레이크를 계속 살짝 밟고 가지 말고, 속도가 붙으면 한 번에 눌러 줄인 뒤 떼는 것이 브레이크를 덜 달군다."],
    ["지상", "활주로 앞 정지선", "유도로의 활주로 정지선(노란 실선 두 줄과 점선 두 줄)은 허가 없이 넘지 않는다. 건너거나 들어가기 전에 허가받은 활주로가 맞는지, 접근하는 비행기가 없는지 눈으로 한 번 더 본다."],
    ["교신", "중요한 지시는 복창한다", "활주로, 고도, 방향, 속도, 주파수, 트랜스폰더 코드, 정지 지시는 받은 그대로 되풀이해 말하고 끝에 자기 호출부호를 붙인다. 관제사는 복창을 듣고 잘못 알아들은 것을 바로잡는다."],
    ["교신", "누구에게, 누가, 어디서, 무엇을", "처음 부를 때는 부르는 관제 기관, 내 호출부호, 현재 위치, 요청 순으로 짧게 말한다. 말하기 전에 할 말을 정리하고, 다른 교신이 끝났는지 잠깐 들은 뒤 누른다."]
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
<section class="card c12">${cardH(ICON.info, "비상 신호 코드")}<div class="card-b mn-codes"><div><b>7700</b><span>비상 (MAYDAY)</span></div><div><b>7600</b><span>무선 두절</span></div><div><b>7500</b><span>불법 간섭 (납치)</span></div><div><b>MAYDAY</b><span>생명이나 기체가 위험한 긴급 상황</span></div><div><b>PAN PAN</b><span>긴급하지만 당장 위험은 아닌 상황</span></div></div></section>
</div>${mnNote}`;
  }
  function renderManualTips() {
    const cats = Array.from(new Set(MN_TIPS.map(t => t[0])));
    return mnHead("경험과 요령", "교범에 다 나오지는 않지만 조종사들이 경험으로 쌓아 온 요령과 흔한 실수입니다. 시뮬레이터 비행에 바로 써 볼 수 있는 것 위주로 모았습니다.") + `
<div class="grid lr mn">${cats.map(c => `<section class="card c6 mn-tipc">${cardH(ICON.star, c)}<div class="card-b mn-tipwrap"><img class="mn-tip-img" src="photos/manual/tip-${c}.webp" alt="" loading="lazy" onerror="this.remove()"><div class="mn-tips">${MN_TIPS.filter(t => t[0] === c).map(t => `<div class="mn-tip"><b>${t[1]}</b><p>${t[2]}</p></div>`).join("")}</div></div></section>`).join("")}
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
<div class="mn-foot"><span class="mn-tags">${(a.related || []).map(t => MN_TAG_LINK[t] ? `<a href="#${MN_TAG_LINK[t]}">${esc(t)}</a>` : `<span>${esc(t)}</span>`).join("")}${ac ? `<a href="#${ac.id}">${esc(ac.name)} 기종 보기</a>` : ""}</span><span class="mn-src">${(a.sources || []).slice(0, 2).map(s => `<a class="ext" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`).join("")}</span></div>${typeof ACC_NEWS !== "undefined" && ACC_NEWS[a.id] && ACC_NEWS[a.id].length ? `<div class="mn-news"><span class="mn-news-k">${ICON.book}관련 보도</span><div class="mn-news-l">${ACC_NEWS[a.id].map(n => `<a href="${esc(n.url)}" target="_blank" rel="noopener"><b>${esc(n.outlet)}</b><span>${esc(n.title)}</span>${n.date ? `<small>${esc(n.date.replace(/-/g, "."))}</small>` : ""}</a>`).join("")}</div></div>` : ""}${a.note ? `<details class="lr-more"><summary>참고 메모</summary><p class="small muted" style="margin:0">${esc(a.note)}</p></details>` : ""}</article>`;
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
    return mnHead("사건사고", "널리 알려진 여객기 사고와 사건을 공식 조사 결과를 바탕으로 정리했습니다. 무엇이 있었고, 조사에서 무엇이 밝혀졌고, 조종사가 무엇을 배워야 하는지에 초점을 맞췄습니다.") + `
<div class="grid lr mn">${mnTypeStats()}<section class="card c12">${cardH(ICON.clock, "연표", `<span class="hint">${MN_ACC.length}건</span>`)}<div class="card-b">${mnTimeline()}</div></section>
<section class="card c12"><div class="card-b mn-filters"><div><p class="mn-k">국가 <small>사고 장소 또는 항공사 국적</small></p><div class="lr-seg" role="group" aria-label="국가">${ctrys.map(c => `<button type="button" data-mn="ctry:${c[0]}" class="${c[0] === mnCtry ? "on" : ""}">${c[0]}${c[1] ? ` <small>${c[1]}</small>` : ""}</button>`).join("")}</div></div><div><p class="mn-k">연대</p><div class="lr-seg" role="group" aria-label="연대">${decs.map(t => `<button type="button" data-mn="dec:${t}" class="${t === mnDec ? "on" : ""}">${t === "전체" ? "전체" : t + "년대"}</button>`).join("")}</div></div><div><p class="mn-k">분류</p><div class="lr-seg" role="group" aria-label="분류">${tags.map(t => `<button type="button" data-mn="tag:${t}" class="${t === mnTag ? "on" : ""}">${t}</button>`).join("")}</div></div></div><div id="mn-acc-list" class="mn-acc-list">${mnAccList()}</div></section>
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
