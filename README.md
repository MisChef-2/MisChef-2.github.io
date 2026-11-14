# Jetliner Hub

가상 항공사 **Jetliner Virtual (JLV)** 의 조종사 포털입니다. 파일 하나(`index.html`)로 동작하는 정적 웹사이트이며, 서버나 빌드 도구 없이 브라우저에서 바로 열립니다.

> Jetliner Virtual은 실제로 존재하지 않는 가상 항공사이며, 실제 항공사·관제 기관·차트 제공사와 관계가 없습니다.
> 사이트의 비행장 차트는 공개 데이터로 그린 참고용 도면으로, **항법에 쓰면 안 됩니다 (NOT FOR NAVIGATION).**

## 기능

| 메뉴 | 내용 |
|---|---|
| 대시보드 | 조종사 요약, 최근 비행, 공지 |
| 비행 예약 (`#book`) | 지도에서 노선을 골라 비행 예약 |
| 내 비행 (`#flights`) | 비행 기록과 PIREP(비행 보고서) 작성·채점 |
| 실시간 운항 (`#live`) | FlyItalyADSB API로 주변 항공기·기종별 추적 (API 키 필요) |
| 내 프로필 · 활동 · 리더보드 | 계급, 배지, 투어·챌린지, 순위 |
| 공항 (`#airports`) | 66개 공항 정보와 비행장 차트 (활주로·유도로·계류장·터미널·주파수, 확대/이동, 주간·야간, 전체 화면) |
| 기종 백과 (`#fleet`) | 보잉·에어버스 21개 기종의 제원, 도면(평면·측면·정면), 사진, 비교, 연표 |

조종사 기록은 브라우저 저장소(localStorage)에 남습니다.

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
  photos.js         사진 목록과 출처
  data.js           기종 데이터
  cover.js          FlyItalyADSB 수신 범위 스냅숏
  charts-meta.js    공항별 활주로·주파수 (tools/chart-build.js 가 만든다)
  core.js, draw-a.js, draw-b.js
                    도면 그리기 (patch-core.js 가 합쳐 core2.js 를 만든다)
  live.js           실시간 운항
  pilot.js          조종사 포털 (공항, 예약, PIREP, 프로필 …)
  chart.js          비행장 차트 그리기
  hub-app.js        라우팅과 나머지 화면
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

## 출처

사진, 지도 데이터, 라이브러리의 출처와 라이선스는 [CREDITS.md](CREDITS.md) 에 있습니다. 사진 목록을 바꾸면 `node tools/make-credits.js` 로 다시 만듭니다.
