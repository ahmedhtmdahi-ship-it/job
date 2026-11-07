"""Reconstruct the exact original Windows ZIP, verifying every SHA256."""
import argparse
import hashlib
import json
from pathlib import Path

def assemble(folder,output=None):
    folder=Path(folder);manifest=json.loads((folder/'manifest.json').read_text())
    name=manifest['archive_name']
    if Path(name).name!=name:raise ValueError('Invalid archive name')
    output=Path(output) if output else folder/name
    if output.exists():raise FileExistsError('Output exists; preserving it: '+str(output))
    digest=hashlib.sha256();total=0
    try:
        with output.open('xb') as target:
            for entry in manifest['parts']:
                name=entry['name']
                if Path(name).name!=name:raise ValueError('Invalid part name')
                data=(folder/'parts'/name).read_bytes()
                if len(data)!=entry['bytes'] or hashlib.sha256(data).hexdigest()!=entry['sha256']:
                    raise ValueError('Part failed integrity check: '+name)
                target.write(data);digest.update(data);total+=len(data)
        if total!=manifest['archive_bytes'] or digest.hexdigest()!=manifest['archive_sha256']:
            raise ValueError('Combined archive failed integrity check')
    except Exception:
        output.unlink(missing_ok=True)
        raise
    return output

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path);args=parser.parse_args()
    print(assemble(Path(__file__).parent,args.output))
