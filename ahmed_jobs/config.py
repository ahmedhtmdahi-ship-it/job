import json
import os
import sys
from pathlib import Path

SEEDS = Path(__file__).parent / 'data'

def seed(name):
    return json.loads((SEEDS / (name + '.json')).read_text(encoding='utf-8'))

def data_dir():
    base = Path(os.environ.get('LOCALAPPDATA', Path.home() / '.local' / 'share'))
    root = base / 'AhmedHatemJobs'
    root.mkdir(parents=True, exist_ok=True)
    return root

def bundled_input():
    candidates=[Path(__file__).resolve().parents[1],Path(sys.executable).resolve().parent.parent]
    for root in candidates:
        path=root/'input_bundle'/'Ahmed_Hatem_Codex_Handoff.zip'
        manifest=root/'BUILD_MANIFEST.json'
        if path.is_file() and manifest.is_file():
            from .safety import sha256
            expected=json.loads(manifest.read_text()).get('input_bundle_sha256')
            if expected and sha256(path)==expected:return path
    return None
