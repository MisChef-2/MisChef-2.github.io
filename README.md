# Jetliner Hub

가상 항공사 **Jetliner Virtual (JLV)** 의 조종사 포털입니다. 파일 하나(`index.html`)로 동작하는 정적 웹사이트이며, 서버나 빌드 도구 없이 브라우저에서 바로 열립니다.

> Jetliner Virtual은 실제로 존재하지 않는 가상 항공사이며, 실제 항공사·관제 기관·차트 제공사와 관계가 없습니다.
> 사이트의 비행장 차트는 공개 데이터로 그린 참고용 도면으로, **항법에 쓰면 안 됩니다 (NOT FOR NAVIGATION).**

## 기능

메뉴는 가상 항공사 조종사 포털의 일반적인 목차를 따릅니다.

| 묶음 | 메뉴 | 내용 |
|---|---|---|
| | 소개 (`#about`) | 사이트를 만든 사람 소개. 내용은 `src/about.js` 에서 고칩니다 |
| | 대시보드 (`#home`) | 조종사 요약, 최근 비행, 공지 |
| Flight Center | 비행 예약 (`#book`) | 지도에서 목적지와 기종을 골라 예약 |
| | 취항지 (`#dest`) | 출발 공항별로 갈 수 있는 공항, 거리, 예상 시간 |
| | 비행 생성기 (`#generator`) · 내 로스터 (`#rosters`) | 여러 구간 일정을 무작위로 만들고 저장해 진행 상황을 추적 |
| | 내 예약 (`#flights`) · PIREP (`#pireps`) · 클레임 (`#claims`) | 예약 확인, 비행 보고서 제출·채점, 예약 없는 비행의 수동 보고 |
| | 실시간 운항 (`#live`) | FlyItalyADSB API로 주변 항공기·기종별 추적 (API 키 필요) |
| My Profile | 프로필 · 통계 (`#stats`) | 기간별 통계, 계급, 월별 차트, 기종별 로그북 |
| | 비행 지도 (`#map`) | 비행한 노선을 3차원 지구본에 그림 (끌어서 회전, 휠로 확대) |
| | 패스포트 (`#passport`) · 배지 · 설정 | 방문한 공항과 나라, 배지, 이름·단위 설정 |
| Activities · Community | 투어 · 도전 과제, 리더보드 | 정해진 구간 완주, 점수 순위 |
| Documents | NOTAM · 계급 안내 · 점수 기준 · ICAO 기준 (`#icao`) | 운영 공지와 규칙, ICAO 분류 설명 |
| Resources | 공항 (`#airports`) | 66개 공항 정보와 비행장 차트 (활주로·유도로·주파수, 휠 확대, 주간·야간, 전체 화면) |
| | 기종 백과 (`#fleet`) · 기종 비교 · 연표 | 보잉·에어버스 21개 기종의 개발 배경(왜 만들어졌나), 제원, ICAO 분류, 도면, 같은 축척 비교 그림 |

조종사 기록은 브라우저 저장소(localStorage)에 남습니다.

### 소개 글 고치기

메뉴 맨 위 "소개"의 이름, 소개 글, 링크는 `src/about.js` 한 파일에 있습니다. 고친 뒤 `sh build.sh` 를 다시 실행하세요. 공개 사이트에 그대로 실리므로 올려도 되는 내용만 적으세요.

## 실행

`index.html` 을 브라우저에서 열면 됩니다. 비행장 차트의 유도로 도형은 `charts/` 에서 따로 불러오므로, 파일을 옮길 때는 `photos/`, `charts/` 폴더도 함께 두세요.

로컬 서버로 보고 싶다면 (Node.js 18 이상):

```bash
node tools/serve.js 8766
```

그다음 브라우저에서 http://127.0.0.1:8766/ 을 엽니다.

### 실시간 운항 (선택)

[flyitalyadsb.com/data/api](https://flyitalyadsb.com/data/api/) 에서 무료 API 키를 받아 실시간 운항 화면에 붙여 넣으면 항공기 목록이 30초마다 바뀝니다.
키는 그 브라우저의 저장소에만 남습니다. **키를 소스 코드나 저장소에 넣지 마세요.** 키가 없으면 예시 항공편을 보여 줍니다.

## 폴더 구조

```
index.html          빌드된 사이트 (이 파일만 열면 동작)
build.sh            src/ 를 합쳐 index.html 을 만든다
src/
  hub.html          레이아웃과 CSS
  about.js          소개 페이지 내용 (이름, 소개 글, 링크)
  photos.js         사진 목록과 출처
  data.js           기종 데이터
  why.js            기종별 개발 배경(왜 만들어졌나)과 시대별 요약
  cover.js          FlyItalyADSB 수신 범위 스냅숏
  charts-meta.js    공항별 활주로·주파수 (tools/chart-build.js 가 만든다)
  world.js          지구본용 국가 경계 (tools/world-build.js 가 만든다)
  core.js, draw-a.js, draw-b.js
                    도면 그리기 (patch-core.js 가 합쳐 core2.js 를 만든다)
  icao.js           ICAO 분류 계산과 기준 안내 문서
  cmpart.js         기종 비교 그림 (같은 축척의 측면·평면·정면)
  live.js           실시간 운항
  pilot.js          조종사 포털 (공항, 예약, PIREP, 프로필, 대시보드)
  portal.js         메뉴와 추가 페이지 (취항지, 비행 생성기, 로스터, 통계, 패스포트 …)
  globe.js          비행 지도 지구본
  chart.js          비행장 차트 그리기
  hub-app.js        라우팅과 기종 백과 화면
photos/             기종·배너 사진 (photos/sm/ 은 작은 크기)
charts/             공항별 유도로·계류장·터미널 도형 (OpenStreetMap에서 만듦)
fonts/              선택 글꼴 자리 (fonts/README.md 참고)
tools/              차트 데이터 스크립트, 미리보기 서버, 출처 문서 생성기
```

## 빌드

`src/` 를 고친 뒤 다시 합칩니다 (Git Bash 또는 macOS/Linux 셸, Node.js 필요):

```bash
sh build.sh
```

`index.html` 과 `artifact.html` (claude.ai 아티팩트 게시용, 저장소에는 올리지 않음)이 만들어집니다.

## 비행장 차트 데이터 다시 만들기

1. [OurAirports 데이터](https://davidmegginson.github.io/ourairports-data/)에서 `airports.csv`, `runways.csv`, `airport-frequencies.csv` 를 받아 `chartsrc/` 폴더에 넣습니다.
2. 아래 순서로 실행합니다. 두 번째 단계는 OpenStreetMap Overpass API에 공항마다 한 번씩 요청하므로 오래 걸립니다 (이미 받은 공항은 건너뜀).

```bash
node tools/chart-extract.js chartsrc src/pilot.js
```

```bash
node tools/chart-osm.js chartsrc
```

```bash
node tools/chart-build.js chartsrc .
```

```bash
sh build.sh
```

## 지구본 지도 데이터 다시 만들기

`src/world.js` 는 [world-atlas](https://github.com/topojson/world-atlas) 의 `countries-110m.json` (Natural Earth 1:110m)에서 국가 경계만 남긴 것입니다. 원본을 `chartsrc/world/` 에 받아 두고 실행합니다.

```bash
node tools/world-build.js chartsrc/world/countries-110m.json
```

## 출처

사진, 지도 데이터, 라이브러리의 출처와 라이선스는 [CREDITS.md](CREDITS.md) 에 있습니다. 사진 목록을 바꾸면 `node tools/make-credits.js` 로 다시 만듭니다.
