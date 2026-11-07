import json
import os
import subprocess
import sys
from pathlib import Path

def test_packaging_smoke_mode_runs_and_exits_without_external_operations(tmp_path):
    root=Path(__file__).parents[1]
    destination=tmp_path/'أحمد'
    env=dict(os.environ,LOCALAPPDATA=str(tmp_path),AHMED_JOBS_SMOKE_DIR=str(destination),QT_QPA_PLATFORM='offscreen')
    p=subprocess.run([sys.executable,str(root/'run_app.py'),'--smoke-test'],env=env,cwd=root,capture_output=True,text=True,timeout=20)
    assert p.returncode==0,p.stderr
    report=json.loads((destination/'smoke-result.json').read_text())
    assert report['tabs']==10 and report['platforms']==24 and report['network_started'] is False
    assert (destination/'smoke-desktop.png').stat().st_size>100
