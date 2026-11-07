"""Static PE/runtime/source checks. Does NOT claim to run Windows binaries."""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import struct

def verify(root):
    root=Path(root);manifest=json.loads((root/'BUILD_MANIFEST.json').read_text())
    binary=(root/'AhmedHatemJobs.exe').read_bytes();pe=struct.unpack_from('<I',binary,0x3c)[0]
    assert binary[:2]==b'MZ' and binary[pe:pe+4]==b'PE\0\0'
    assert struct.unpack_from('<H',binary,pe+4)[0]==0x8664,'Launcher is not AMD64'
    assert struct.unpack_from('<H',binary,pe+24+68)[0]==2,'Launcher must use Windows GUI subsystem'
    assert hashlib.sha256(binary).hexdigest()==manifest['launcher_sha256']
    for relative in ('runtime/python.exe','runtime/pythonw.exe','runtime/python312.dll','runtime/Lib/os.py',
                     'runtime/Lib/site-packages/PySide6/QtWidgets.pyd','runtime/Lib/site-packages/PySide6/Qt6Widgets.dll',
                     'runtime/Lib/site-packages/PySide6/plugins/platforms/qwindows.dll',
                     'runtime/Lib/site-packages/playwright/driver/node.exe','app/run_app.py'):
        assert (root/relative).is_file(),relative
    for relative,digest in manifest.get('application_files',{}).items():
        assert hashlib.sha256((root/relative).read_bytes()).hexdigest()==digest,relative
    files=list((root/'app').rglob('*.py'))
    for p in files:ast.parse(p.read_text(encoding='utf-8'))
    if manifest.get('input_bundle_sha256'):
        assert hashlib.sha256((root/'input_bundle/Ahmed_Hatem_Codex_Handoff.zip').read_bytes()).hexdigest()==manifest['input_bundle_sha256']
    return {'pe_amd64':True,'gui_subsystem':True,'required_runtime_files':True,'source_files':len(files),'windows_execution_tested':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('folder',type=Path);args=parser.parse_args()
    print(json.dumps(verify(args.folder),indent=2))
