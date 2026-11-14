// node tools/make-credits.js : tools/photos.meta.json 으로 CREDITS.md 를 다시 쓴다.
const fs = require("fs"), path = require("path");
const root = path.resolve(__dirname, "..");
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "photos.meta.json"), "utf8"));
const cell = s => String(s || "").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
const rows = Object.keys(meta).map(k => {
  const m = meta[k];
  return `| \`${m.file}\` | [${cell(m.title)}](${m.page}) | ${cell(m.artist)} | [${cell(m.license)}](${m.licenseUrl}) |`;
});
const md = `# 출처와 라이선스

이 저장소의 사진·지도 자료는 아래 출처의 것이며, 각 라이선스 조건을 따릅니다.
Jetliner Virtual(JLV)은 가상의 항공사로, 실제 항공사·차트 제공사와 아무 관계가 없습니다.

## 사진 (Wikimedia Commons)

\`photos/\` (1920px)와 \`photos/sm/\` (960px)는 아래 사진의 크기를 줄이거나 잘라 낸 것입니다.
CC BY-SA 사진을 고친 파일은 원본과 같은 라이선스로 배포됩니다.

| 파일 | 원본 | 촬영 | 라이선스 |
|---|---|---|---|
${rows.join("\n")}

## 비행장 차트 (\`charts/\`, \`src/charts-meta.js\`)

- 활주로·주파수·표고: [OurAirports](https://ourairports.com/data/) (퍼블릭 도메인)
- 유도로·계류장·터미널·관제탑: © [OpenStreetMap](https://www.openstreetmap.org/copyright) 기여자, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
  \`charts/\` 의 도형 데이터는 OpenStreetMap에서 만든 2차 데이터베이스이므로 ODbL 1.0으로 제공합니다.
- 실제 Jeppesen 차트가 아니며, 항법에 쓰면 안 됩니다 (NOT FOR NAVIGATION).

## 실시간 비행 (\`src/cover.js\`, 실시간 비행 페이지)

- Flight data: [FlyItalyADSB](https://flyitalyadsb.com), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- \`src/cover.js\` 는 수신 범위 스냅숏(2026-11-12 16:02 UTC)입니다. API 키 없이 볼 때 나오는 예시 항공편은 실제 비행이 아닙니다.

## 지구본 (\`src/world.js\`, 비행 지도 페이지)

- 국가 경계: [Natural Earth](https://www.naturalearthdata.com/) 1:110m (퍼블릭 도메인), [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (ISC)에서 변환

## 참고한 것

- 메뉴 구성(Flight Center · My Profile · Activities · Community · Documents · Resources)은 가상 항공사 포털에서 흔히 쓰는 목차를 따랐습니다. 화면과 코드는 이 저장소에서 새로 만든 것이며, 특정 서비스의 상표나 디자인 자산을 쓰지 않았습니다.
- ICAO 분류(비행장 기준 코드, 항적 난기류 등급, 구조·소방 등급)는 ICAO 부속서 14, Doc 4444, Doc 8643의 공개된 기준값으로 계산한 요약이며 공식 문서를 대신하지 않습니다.

## 라이브러리·글꼴 (CDN에서 불러옴)

- [jsvectormap](https://github.com/themustafaomar/jsvectormap) 1.5.3 (MIT)
- [d3-geo](https://github.com/d3/d3-geo) 3.1.1, [d3-array](https://github.com/d3/d3-array) 3.2.4 (ISC), [topojson-client](https://github.com/topojson/topojson-client) 3.1.0 (ISC)
- [Figtree](https://fonts.google.com/specimen/Figtree), [Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR), [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) (Google Fonts, 각 글꼴의 오픈 폰트 라이선스)
`;
fs.writeFileSync(path.join(root, "CREDITS.md"), md);
console.log("CREDITS.md:", rows.length, "photos");
