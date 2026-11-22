
## 조종석 비행 체험 기상 데이터

Weather data by [Open-Meteo](https://open-meteo.com/) 및 원 기상기관, CC BY 4.0. [예보 API](https://open-meteo.com/en/docs), [과거 예보 API](https://open-meteo.com/en/docs/historical-forecast-api). 경로상의 시간별 모델 값을 보간·시각화하며 실제 관측 영상 또는 항공고도 기상 자료가 아닙니다. 구름 형태·고도와 활주로는 시각화용 근사입니다. 해안선은 기존 Natural Earth/world-atlas 자료(public domain)를 재사용합니다.

## 조종석 비행 체험 지도·지형 자료 (`src/aircraft-3d/flight/`)

- 공항·활주로: [OurAirports](https://ourairports.com/data/) (퍼블릭 도메인)
- 유도로·계류장·터미널·탑승교 등: © [OpenStreetMap](https://www.openstreetmap.org/copyright) 기여자, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/)
- 보완 지상 경로(`ground-reference/`): [FlightGear TerraSync](https://github.com/terrasync/main) groundnet, GPL v2. 라이선스 전문(`COPYING`), 원본 XML(`sources/`), 변환 코드(`source-code/`)를 함께 둡니다. 실제 공항 실측·관제 자료가 아닙니다.
- 지형 높이: Mapzen/AWS Terrain Tiles ([출처 안내](https://github.com/tilezen/joerd/blob/master/docs/attribution.md))
- 지표 영상: [NASA GIBS / ESDIS](https://nasa-gibs.github.io/gibs-api-docs/) Blue Marble
- 노선 미니맵 해안선: Natural Earth (퍼블릭 도메인)
