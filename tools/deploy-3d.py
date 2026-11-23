"""3D 모형 뷰어(Codex 제작본)를 사이트에 올릴 수 있는 모양으로 3d/ 폴더에 복사한다.

- 원본: src/aircraft-3d/production (저장소에는 올리지 않는 제작 폴더)
- GLB는 Draco 압축본을 쓴다 (블렌더에서 같은 설정에 압축만 켜서 다시 내보낸 것, 기종당 약 3~8MB)
- 뷰어 코드는 고치지 않고 복사한 뒤 Draco 로더 한 줄과 사이트 안 표시 설정만 덧붙인다
- .blend 원본, 검토 페이지, 제작 스크립트는 올리지 않는다

사용: python tools/deploy-3d.py <압축 GLB 폴더> <three 예제 폴더(DRACOLoader, draco 디코더)>
"""
import json, os, re, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src", "aircraft-3d", "production")
DST = os.path.join(ROOT, "3d")
glb_dir, three_ex = sys.argv[1], sys.argv[2]

def cp(a, b):
    os.makedirs(os.path.dirname(b), exist_ok=True); shutil.copyfile(a, b)

if os.path.isdir(DST): shutil.rmtree(DST)
# 뷰어
V = os.path.join(SRC, "viewer")
for f in ("index.html", "styles.css", "fleet.json"):
    cp(os.path.join(V, f), os.path.join(DST, "viewer", f))
for dp, _, fs in os.walk(os.path.join(V, "vendor")):
    for f in fs:
        a = os.path.join(dp, f); cp(a, os.path.join(DST, "viewer", os.path.relpath(a, V)))
cp(os.path.join(three_ex, "loaders", "DRACOLoader.js"), os.path.join(DST, "viewer", "vendor", "three", "addons", "loaders", "DRACOLoader.js"))
for f in ("draco_decoder.js", "draco_decoder.wasm", "draco_wasm_wrapper.js"):
    cp(os.path.join(three_ex, "libs", "draco", "gltf", f), os.path.join(DST, "viewer", "vendor", "three", "addons", "libs", "draco", "gltf", f))

js = open(os.path.join(V, "viewer.js"), encoding="utf-8").read()
miss = []
def rep(s, a, b):
    if a not in s: miss.append(a[:50]); return s
    return s.replace(a, b, 1)
js = rep(js, "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
         "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nimport { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';")
js = rep(js, "const loader = new GLTFLoader();",
         "const loader = new GLTFLoader();\n{ const draco = new DRACOLoader(); draco.setDecoderPath('vendor/three/addons/libs/draco/gltf/'); loader.setDRACOLoader(draco); }")
# 허브 배경 고르기(embed.js)가 바닥 격자와 원판의 진하기를 바꿀 수 있게 내보낸다
js = re.sub(r"scene\.add\(ground\);(\r?\n)", lambda m: "scene.add(ground);" + m.group(1) + "window.__hubScene = { grid, ground };" + m.group(1), js, count=1)
open(os.path.join(DST, "viewer", "viewer.js"), "w", encoding="utf-8").write(js)

# 제작 검토 링크와 .blend 내려받기는 숨긴다 (배포하지 않는 파일)
html = open(os.path.join(DST, "viewer", "index.html"), encoding="utf-8").read()
html = rep(html, "</head>", "<style>#research,#download-blend{display:none!important}</style>\n<script>if(new URLSearchParams(location.search).has('embed'))document.documentElement.classList.add('embed')</script>\n<link rel=\"stylesheet\" href=\"embed.css\">\n<script src=\"embed.js\" defer></script>\n</head>")
open(os.path.join(DST, "viewer", "index.html"), "w", encoding="utf-8").write(html)
# ?embed 일 때 허브 모양 (사이드바, 상단바, 제목을 숨기고 허브 색과 글꼴을 쓴다, 전체화면 단추)
cp(os.path.join(ROOT, "tools", "viewer-embed.css"), os.path.join(DST, "viewer", "embed.css"))
cp(os.path.join(ROOT, "tools", "viewer-embed.js"), os.path.join(DST, "viewer", "embed.js"))

# 모델: 압축 GLB + 명세 JSON
total = 0
for sub in ("", "variants"):
    sd = os.path.join(SRC, "models", sub)
    for f in sorted(os.listdir(sd)):
        if not f.endswith(".glb"): continue
        g = os.path.join(glb_dir, sub, f)
        if not os.path.exists(g): print("NO_COMPRESSED", sub, f); continue
        cp(g, os.path.join(DST, "models", sub, f)); total += os.path.getsize(g)
        cp(os.path.join(sd, f[:-4] + ".json"), os.path.join(DST, "models", sub, f[:-4] + ".json"))

# 기체 버전 목록과 도색 참고 사진
for f in ("variants-v8.json", "livery-references.json"):
    cp(os.path.join(SRC, f), os.path.join(DST, f))
refs = json.load(open(os.path.join(SRC, "livery-references.json"), encoding="utf-8")).get("references", [])
for r in refs:
    p = (r.get("photoPath") or "").lstrip("./")
    if p and os.path.exists(os.path.join(SRC, p)): cp(os.path.join(SRC, p), os.path.join(DST, p))
print("models bytes", total, "missing patches", miss)
