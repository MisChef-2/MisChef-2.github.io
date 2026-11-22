Jetliner Hub 조종석 비행 v4 — 게이트·유도로 이동 (2026-11-22)

실행: 비행모드-미리보기.cmd. 로컬 사이트에 반영했으며 공개 배포는 하지 않았습니다.
기본: ICN 265 주기장 → 15R → NRT 16R → 22 주기장.
지상 이동에서 ‘게이트 ↔ 게이트’를 선택하고 주기장은 자동 선택 또는 직접 지정합니다.
기존 방식은 ‘활주로 출발·도착’으로 선택할 수 있습니다.
경로를 준비한 뒤 재생. ‘착륙 후 이동’은 도착 유도로 구간, ‘정지’는 최종 주기 위치입니다.
지상 천천히는 지상 최대6배속으로 제한합니다. 실제 기상·수동 날씨·UTC 날짜와 시각을 지원합니다.

실제 자료 지원
- 인천 RKSI, 나리타 RJAA, 제주 RKPC: OSM 원자료의 주기 위치, 주기장 진입선, 유도로/계류장 유도로, 탑승구 참고점.
- 제주 일부 주기 위치 번호는 없어 ‘번호 미확인’과 OSM ID로 표시합니다.
- 나머지63개 공항은 기존 지형/활주로 모드를 이용할 수 있으나 주기 위치 자료는 보류 상태입니다.
- 연결이 끊겼거나 다른 활주로를 횡단해야 하거나 착륙 정지 위치 뒤에 출구가 없으면 게이트 경로를 만들지 않습니다.
- 단절된 두 구간을 잔디/건물 위 직선으로 연결하지 않습니다. 자료 정합을 위한5m 노드 합치기, 최대10m 주기점 연결 오차 범위는 별도 근사입니다.
- 탑승구 점은 사람의 탑승 위치일 수 있어 항공기 주기 위치로 대체하지 않습니다.

주행
실제 연결선을 따라 이동하고 코너는 원 경로2m 이내로 완화합니다.
직선 최대8m/s, 코너 최대3m/s, 방향 변화 최대6도/s의 시각화 속도입니다.
후진은 방향이 확인된 주기장 진입선에 한해 표시하며 실제 푸시백 관제/견인차 절차를 재현한 것은 아닙니다.
공항 평균표고와 활주로 표고는100m 구간에서 보간합니다. 카메라 경로이며 기종별 앞바퀴 위치 보정은 아닙니다.

한계
실제 관제 허가·일방통행·기종별 날개 여유·현재 폐쇄·견인 절차를 인증하지 않습니다.
제주13/31, 인천16R/34L 등 일부 조합은 현재 연결/출구 조건으로 제한될 수 있습니다.
터미널 외벽/창문/높이, 유도로 폭, 노면표시는 일부 근사입니다.
지형은 AWS/Mapzen DEM, 표면은 NASA 정적 약500m 영상입니다.
구름/강수형/별 배치는 시각화용이며 날씨는 Open-Meteo 모델값을 참고합니다.

공용 모델
Claude #3d, 기종 상세3D 모달, 비행 모드 모두 3d/models 및 3d/viewer/vendor를 사용합니다.
이번 작업은 비행 모드 파일만 수정했고 Claude의 모델이나 hub-app.js는 덮어쓰지 않았습니다.

자료/권리
OSM ©OpenStreetMap contributors, ODbL: https://www.openstreetmap.org/copyright
원자료 조회시각/쿼리/SHA/좌표 규약: airport-ground-data.json metadata와 airport-ground-data-notes.txt
주기위치 매핑: https://wiki.openstreetmap.org/wiki/Tag:aeroway=parking_position
인천 운항제약 참고: https://aim.koca.go.kr/eaipPub/Package/2026-04-02/html/eAIP/KR-AD-2.RKSI-en-GB.html
공항: https://ourairports.com/data/ (Public Domain)
고도: https://github.com/tilezen/joerd/blob/master/docs/attribution.md
NASA: https://nasa-gibs.github.io/gibs-api-docs/
기상: https://open-meteo.com/en/docs (CC BY4.0)


v5 추가: 항공편 상세→조종석 추적 기능. 사용·검증 범위는 실시간-연결-v5.txt를 참조하세요.
