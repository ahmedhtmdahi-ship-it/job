"""Start the GUI and retain a safe local diagnostic on startup failure."""
import os
import sys
import traceback
from pathlib import Path

def main():
    try:
        from .ui import run
        return run()
    except Exception as error:
        try:
            root=Path(os.environ.get('LOCALAPPDATA',Path.home()/'.local/share'))/'AhmedHatemJobs';root.mkdir(parents=True,exist_ok=True)
            frames='\n'.join(f'{Path(f.filename).name}:{f.lineno} {f.name}' for f in traceback.extract_tb(error.__traceback__))
            with (root/'app.log').open('a',encoding='utf-8') as f:f.write(type(error).__name__+'\n'+frames+'\n')
        except OSError:pass
        return 1
