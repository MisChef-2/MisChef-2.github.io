"""원본 GLB와 같은 노드만 골라 같은 설정으로 다시 내보내되, Draco 압축을 켠다.
사용: blender -b model.blend --python bl_draco.py -- 원본.glb 출력.glb"""
import bpy, sys, json, struct
argv = sys.argv[sys.argv.index("--") + 1:]
src, out = argv[0], argv[1]
f = open(src, "rb"); f.read(12); l, t = struct.unpack("<II", f.read(8)); j = json.loads(f.read(l)); f.close()
names = set(n.get("name") for n in j["nodes"])
bpy.ops.object.select_all(action="DESELECT")
sel = 0
for o in bpy.data.objects:
    if o.name in names:
        o.hide_set(False); o.select_set(True); sel += 1
print("NODES", len(names), "SELECTED", sel)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_yup=True, export_extras=True,
    export_cameras=False, export_lights=False,
    export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
    export_draco_position_quantization=14, export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12, export_draco_color_quantization=10, export_draco_generic_quantization=12)
print("DONE")
