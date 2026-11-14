/* ===== 소개 페이지 내용 =====
   메뉴 맨 위 "소개"에 나오는 글입니다. 이 파일만 고치고 sh build.sh 를 다시 실행하면 바뀝니다.
   공개 사이트에 그대로 실리므로 올려도 되는 내용만 적으세요. */
const ABOUT = {
  name: "MisChef-2",
  tagline: "Jetliner Hub를 만들고 운영합니다.",
  intro: [
    "안녕하세요. 이 사이트를 만든 MisChef-2입니다.",
    "Jetliner Hub는 가상 항공사 Jetliner Virtual의 조종사 포털을 본떠 만든 개인 프로젝트입니다. 비행을 예약하고 기록을 남기는 기능과 함께 보잉·에어버스 기종 백과, 공항 차트, 실시간 운항 지도를 한곳에 모았습니다.",
    "Jetliner Virtual은 실제로 존재하지 않는 항공사이며, 사이트의 차트와 수치는 참고용입니다."
  ],
  // [항목, 내용]
  facts: [
    ["GitHub", "MisChef-2"],
    ["사이트", "mischef-2.github.io"],
    ["만든 것", "Jetliner Hub (가상 항공사 조종사 포털)"],
    ["쓰인 것", "HTML · CSS · JavaScript, 공개 데이터 (OurAirports, OpenStreetMap, Natural Earth, Wikimedia Commons)"]
  ],
  // [이름, 주소]
  links: [
    ["GitHub", "https://github.com/MisChef-2"],
    ["소스 저장소", "https://github.com/MisChef-2/MisChef-2.github.io"]
  ],
  // [제목, 설명, 사이트 안 주소]
  projects: [
    ["비행 예약과 PIREP", "지도에서 목적지를 골라 비행을 예약하고, 마친 비행의 기록을 남깁니다.", "#book"],
    ["비행 지도", "지금까지 비행한 노선을 지구본 위에 그립니다.", "#map"],
    ["공항 차트", "66개 공항의 활주로, 유도로, 주파수를 담은 도면입니다.", "#airports"],
    ["기종 백과", "보잉·에어버스 21개 기종이 왜 만들어졌는지와 제원, 도면을 모았습니다.", "#fleet"],
    ["기종 비교", "두 기종을 같은 축척의 그림과 ICAO 분류로 견줍니다.", "#compare"],
    ["실시간 운항", "공항 주변 교통량과 항공기를 지도에 보여 줍니다.", "#live"]
  ]
};
