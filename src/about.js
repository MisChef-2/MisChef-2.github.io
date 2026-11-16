/* ===== 소개 페이지 내용 =====
   메뉴 맨 위 "소개"에 나오는 글입니다. 이 파일만 고치고 sh build.sh 를 다시 실행하면 바뀝니다.
   공개 사이트에 그대로 실리므로 올려도 되는 내용만 적으세요.
   "예시"라고 적힌 항목은 형식을 보여 주는 자리 채움입니다. 자기 내용으로 바꾸거나 지우세요.
   목록을 비우면([]) 그 구역은 화면에 나오지 않습니다. */
const ABOUT = {
  // 맨 위 머리 부분
  eyebrow: "Urban Space Design & Analytics Lab · Chung-Ang University",
  name: "김성훈",
  nameEn: "Kim Seong-Hoon",
  tagline: ["So desperate, I couldn't give up.", "So certain, I couldn't stop."],
  // [이름, 주소]
  links: [
    ["onfoa@cau.ac.kr", "mailto:onfoa@cau.ac.kr"],
    ["연구실 홈페이지", "https://www.urbandna.net/"],
    ["GitHub", "https://github.com/MisChef-2"],
    ["소스 저장소", "https://github.com/MisChef-2/MisChef-2.github.io"]
  ],

  // 01 / About me : 한 줄이 한 문단
  intro: [
    "안녕하세요. 김성훈입니다. 중앙대학교 스마트시티학과(Dep. of Smartcity) Urban Space Design & Analytics Lab 소속입니다.",
    "스마트시티, 로봇, 보행자, 도시 환경, 안전에 관심을 두고 연구하고 있습니다.",
    "이 사이트 Jetliner Hub는 가상 항공사를 만든 개인 프로젝트입니다. Jetliner Virtual은 실제로 존재하지 않는 항공사이며, 사이트의 차트와 수치는 참고용입니다."
  ],
  // 관심 분야 꼬리표
  tags: ["Smartcity", "Aerodynamics" ,"Robot", "Pedestrian", "Environments", "Safety"],

  // 02 / Projects : [제목, 분류, 설명, 주소(없으면 "")]
  //   분류와 설명은 비워 두면("") 화면에 나오지 않습니다.
  work: [
    ["개인연구 (석사)", "2026-09-01 ~ 2027-08-31", "중앙대학교", "진행중"],
    ["AURI 관리건축물 식별", "2026-05-16 ~ 2026-11-17", "AURI", "완료"],
    ["VR3", "2026-09-01 ~ 2027-08-31", "한국연구재단", "진행중"],
    ["Jetliner Hub", "Web development", "가상 항공사 조종사 포털. 비행 예약과 기록, 3차원 비행 지도, 66개 공항 차트, 기종 백과를 파일 하나로 동작하는 정적 사이트로 만들었습니다.", "#home"]
  ],

  // 03 / Publications : [연도, 제목, 저자, 실린 곳]. 논문이 없으면 수업 보고서나 발표 자료를 적어도 됩니다.
  //   예: ["2026", "논문 제목", "김성훈, 공저자", "학술지 / 학회"]
  pubs: [
     ["SCI"],
     ["SSCI"],
     ["KCI"],
     ["학술지"],
     ["학회"]
],

  // 이 사이트 둘러보기 : [제목, 설명, 사이트 안 주소]
  projects: [
    ["비행 예약과 PIREP", "지도에서 목적지를 골라 비행을 예약하고, 마친 비행의 기록을 남깁니다.", "#book"],
    ["비행 지도", "지금까지 비행한 노선을 지구본 위에 그립니다.", "#map"],
    ["공항 차트", "66개 공항의 활주로, 유도로, 주파수를 담은 도면입니다.", "#airports"],
    ["기종 백과", "보잉·에어버스 21개 기종이 왜 만들어졌는지와 제원, 도면을 모았습니다.", "#fleet"],
    ["기종 비교", "두 기종을 같은 축척의 그림과 ICAO 분류로 견줍니다.", "#compare"],
    ["실시간 운항", "공항 주변 교통량과 항공기를 지도에 보여 줍니다.", "#live"]
  ]
};
