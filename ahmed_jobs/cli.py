"""Local maintenance only; no approve/send/auto command."""
import argparse
import json
from pathlib import Path
from .config import data_dir
from .storage import Store

def main():
    parser=argparse.ArgumentParser(description='Ahmed Hatem local data maintenance')
    parser.add_argument('--data-dir',type=Path,default=None)
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('status')
    for name in ('import-bundle','import-csv','backup','restore'):
        p=sub.add_parser(name);p.add_argument('path',type=Path)
    args=parser.parse_args();s=Store(args.data_dir or data_dir())
    try:
        if args.command=='status':result={'jobs':len(s.jobs()),'drafts':len(s.drafts()),'assets':len(s.assets()),'platforms':len(s.get('platforms'))}
        elif args.command=='import-bundle':result=s.import_handoff(args.path)
        elif args.command=='import-csv':result={'rows':s.import_csv(args.path)}
        elif args.command=='backup':s.backup(args.path);result={'backup':str(args.path)}
        else:
            if (s.root/'desktop.lock').exists():raise ValueError('Close the desktop before restoring data')
            result={'previous_backup':str(s.restore(args.path))}
        print(json.dumps(result,ensure_ascii=False,indent=2))
    finally:s.close()

if __name__=='__main__':main()
