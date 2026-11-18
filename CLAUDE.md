# Jetliner Hub 작업 안내 (Claude Code용)

이 저장소는 GitHub Pages 사용자 사이트 https://mischef-2.github.io/ 의 소스입니다.
`main` 브랜치의 루트가 그대로 배포되며, 푸시하면 1분 안에 사이트에 반영됩니다.

## 새 컴퓨터에서 처음 할 일

1. Git과 Node.js(LTS)가 없으면 설치한다 (Windows: `winget install --id Git.Git -e`, `winget install --id OpenJS.NodeJS.LTS -e`).
2. 이 저장소에만 커밋 작성자를 설정한다. 전역 설정은 건드리지 않는다.
   - `git config user.name "MisChef-2"`
   - `git config user.email "240839643+MisChef-2@users.noreply.github.com"`
3. `sh build.sh` 를 실행해 `build ok` 가 나오는지 확인한다.
4. 첫 푸시 때 뜨는 GitHub 로그인 창은 사용자가 직접 승인한다. 비밀번호나 토큰을 대신 입력하지 않는다.

## 작업 순서

1. 시작할 때 항상 `git pull` 을 먼저 한다 (여러 컴퓨터에서 번갈아 작업한다).
2. `src/` 만 고친다. `index.html` 은 빌드 결과이므로 직접 고치지 않는다.
3. `sh build.sh` 로 `index.html` (사이트)과 `artifact.html` (claude.ai 아티팩트용, 저장소에는 올리지 않음)을 만든다.
4. `node tools/serve.js 8766` 으로 http://127.0.0.1:8766/ 에서 고친 화면을 확인한다.
5. 커밋하고 `git push origin main` 한다. 사용자와는 한국어로 대화하고, 커밋 메시지도 한국어로 쓴다.

파일별 역할, 차트·지구본 데이터 다시 만드는 법은 README.md 에 있습니다.

## 지켜야 할 것

- Jetliner Virtual(JLV)은 가상의 항공사다. 실제 항공사, vAMSYS, Jeppesen의 이름·로고·자료를 쓰지 않는다.
- 예시 데이터는 예시라고 표시하고, 비행장 차트에는 NOT FOR NAVIGATION 표시를 유지한다.
- `fonts/` 의 글꼴 파일(woff2)은 배포 허락이 없으므로 저장소에 올리지 않는다 (.gitignore 로 제외돼 있음).
- 사용자의 개인 정보는 사용자가 직접 준 내용만 사이트에 싣는다. 커밋 작성자에는 위 noreply 주소만 쓴다.
- API 키를 소스나 저장소에 넣지 않는다.
- 사진·지도 자료를 바꾸면 CREDITS.md 의 출처도 함께 고친다 (`node tools/make-credits.js`).

## claude.ai 아티팩트

같은 사이트의 아티팩트 판이 있습니다. 주소는 사용자가 알고 있으니, 갱신해 달라는 요청을 받으면 주소를 물어본 뒤
`artifact.html` 을 그 주소로 다시 게시합니다. `charts/` 와 `photos/` 파일은 이미 올라가 있어 다시 보낼 필요가 없고,
capabilities(`db`, `user`)는 생략해서 그대로 유지합니다. 사용자가 요청할 때만 게시합니다.
