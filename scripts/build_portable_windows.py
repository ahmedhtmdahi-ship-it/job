"""Assemble an AMD64 Windows portable distribution on Linux or Windows.

This produces PE files, not proof of a Windows launch. Every downloaded archive
is hash-verified against official NuGet catalog / PyPI metadata before use.
"""
import argparse
import base64
import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path,PurePosixPath
import shutil
import subprocess
import sys
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parents[1]
PYTHON_VERSION='3.12.10'
PYTHON_SHA512='u9pNz2iKlCEbYtUJaKkbOPMF0LjR7NkCafdKhvigpPzrt8oWKgdTpHaR6z3wyWQAm9PYGUxv0Zr66NX9AeHMDw=='

def locked_wheels(folder,lockfile):
    normalize=lambda value:re.sub(r'[-_.]+','-',value).lower()
    versions={normalize(line.split('==')[0]):line.split('==')[1] for line in lockfile.read_text().splitlines() if line and not line.startswith('#')}
    excluded={'pyside6','pyside6-addons'};found=set();selected=[]
    for path in sorted(folder.glob('*.whl')):
        name,version=path.name.split('-')[:2];name=normalize(name)
        if name in excluded or versions.get(name)!=version:continue
        if name in found:raise ValueError('Multiple wheel builds for '+name)
        selected.append(path);found.add(name)
    missing=set(versions)-excluded-found
    if missing:raise ValueError('Missing locked wheels: '+', '.join(sorted(missing)))
    return selected

def download(url,path):
    if not path.exists():
        temp=path.with_suffix(path.suffix+'.part')
        with urllib.request.urlopen(url,timeout=90) as response,temp.open('wb') as target:shutil.copyfileobj(response,target)
        temp.replace(path)
    return path

def members(z):
    for item in z.infolist():
        p=PurePosixPath(item.filename)
        if p.is_absolute() or '..' in p.parts or '\\' in item.filename or ':' in item.filename:raise ValueError('Unsafe build archive')
        yield item,p

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--cache',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--input-bundle',type=Path)
    args=parser.parse_args();cache=args.cache.resolve();cache.mkdir(parents=True,exist_ok=True)
    output=args.output.resolve();output.mkdir(parents=True,exist_ok=True)
    target=output/'AhmedHatemJobs-Windows-x64'
    if target.exists():raise SystemExit('Output exists; use a new output directory to preserve previous builds')
    target.mkdir();runtime=target/'runtime';runtime.mkdir();manifest={'windows_launch_tested':False,'python_version':PYTHON_VERSION,'wheels':[]}
    pkg=download(f'https://api.nuget.org/v3-flatcontainer/python/{PYTHON_VERSION}/python.{PYTHON_VERSION}.nupkg',cache/f'python-{PYTHON_VERSION}.nupkg')
    if hashlib.sha512(pkg.read_bytes()).digest()!=base64.b64decode(PYTHON_SHA512):raise ValueError('CPython SHA512 mismatch')
    manifest['python_sha512']=PYTHON_SHA512
    manifest['python_hash_source']='https://api.nuget.org/v3/catalog0/data/2025.04.08.14.01.15/python.3.12.10.json'
    with zipfile.ZipFile(pkg) as z:
        for item,p in members(z):
            if not p.parts or p.parts[0]!='tools' or item.is_dir():continue
            dst=runtime.joinpath(*p.parts[1:]);dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(z.read(item))
    wheels=cache/'windows-wheels';wheels.mkdir(exist_ok=True)
    subprocess.run([sys.executable,'-m','pip','download','--platform','win_amd64','--python-version','312','--implementation','cp','--abi','cp312','--only-binary=:all:','-r',str(ROOT/'requirements.txt'),'-c',str(ROOT/'requirements-windows.lock'),'--dest',str(wheels)],check=True)
    site=runtime/'Lib'/'site-packages';site.mkdir(parents=True,exist_ok=True)
    for wheel in locked_wheels(wheels,ROOT/'requirements-windows.lock'):
        # Essentials includes every Qt module used here; do not bundle unused WebEngine/Addons.
        if wheel.name.lower().startswith(('pyside6_addons-','pyside6-')):continue
        parts=wheel.name.split('-');name,version=parts[0],parts[1]
        with urllib.request.urlopen(f'https://pypi.org/pypi/{name}/{version}/json',timeout=30) as response:metadata=json.load(response)
        record=next(x for x in metadata['urls'] if x['filename']==wheel.name)
        digest=hashlib.sha256(wheel.read_bytes()).hexdigest()
        if digest!=record['digests']['sha256']:raise ValueError(f'Wheel hash mismatch: {wheel.name}')
        manifest['wheels'].append({'filename':wheel.name,'sha256':digest,'pypi_metadata':f'https://pypi.org/pypi/{name}/{version}/json'})
        with zipfile.ZipFile(wheel) as z:
            for item,p in members(z):
                if item.is_dir():continue
                parts=p.parts
                if parts[0].endswith('.data'):
                    if len(parts)<3 or parts[1] not in ('purelib','platlib'):continue
                    parts=parts[2:]
                dst=site.joinpath(*parts);dst.parent.mkdir(parents=True,exist_ok=True);dst.write_bytes(z.read(item))
    # Qt's PDF image plugin depends on the intentionally omitted Addons module.
    # PDF text/splitting/printing uses pypdf and QtPrintSupport, not this plugin.
    optional=site/'PySide6/plugins/imageformats/qpdf.dll'
    if optional.exists():optional.unlink()
    manifest['excluded_optional_plugins']=['PySide6/plugins/imageformats/qpdf.dll']
    app=target/'app';app.mkdir()
    shutil.copytree(ROOT/'ahmed_jobs',app/'ahmed_jobs',ignore=shutil.ignore_patterns('__pycache__'))
    shutil.copy2(ROOT/'run_app.py',app/'run_app.py')
    shutil.copytree(ROOT/'docs',target/'docs')
    shutil.copy2(ROOT/'README.md',target/'README.md')
    shutil.copy2(ROOT/'requirements-windows.lock',target/'requirements-windows.lock')
    if args.input_bundle:
        folder=target/'input_bundle';folder.mkdir()
        shutil.copy2(args.input_bundle,folder/'Ahmed_Hatem_Codex_Handoff.zip')
        manifest['input_bundle_sha256']=hashlib.sha256(args.input_bundle.read_bytes()).hexdigest()
    (target/'SetupBrowser.cmd').write_text('@echo off\r\ncd /d "%~dp0"\r\nruntime\\python.exe -E -s -m playwright install chromium\r\npause\r\n',encoding='ascii')
    (target/'RunWithConsole.cmd').write_text('@echo off\r\ncd /d "%~dp0"\r\nruntime\\python.exe -E -s app\\run_app.py\r\npause\r\n',encoding='ascii')
    zig=Path(importlib.util.find_spec('ziglang').origin).parent/('zig.exe' if os.name=='nt' else 'zig')
    env=dict(os.environ,ZIG_GLOBAL_CACHE_DIR=str(cache/'zig-global'),ZIG_LOCAL_CACHE_DIR=str(cache/'zig-local'))
    command=[str(zig),'cc','-target','x86_64-windows-gnu','-municode','-Wl,--subsystem,windows','-O2',str(ROOT/'scripts/windows_launcher.c'),'-o',str(target/'AhmedHatemJobs.exe')]
    subprocess.run(command,check=True,env=env)
    assert (target/'AhmedHatemJobs.exe').read_bytes()[:2]==b'MZ'
    manifest['launcher_sha256']=hashlib.sha256((target/'AhmedHatemJobs.exe').read_bytes()).hexdigest()
    manifest['launcher_source']='scripts/windows_launcher.c';manifest['compiler']='zig 0.13.0, x86_64-windows-gnu'
    manifest['application_files']={f.relative_to(target).as_posix():hashlib.sha256(f.read_bytes()).hexdigest() for f in app.rglob('*') if f.is_file()}
    (target/'BUILD_MANIFEST.json').write_text(json.dumps(manifest,indent=2))
    from verify_portable import verify
    manifest['static_verification']=verify(target)
    (target/'BUILD_MANIFEST.json').write_text(json.dumps(manifest,indent=2))
    archive=output/'AhmedHatemJobs-Windows-x64.zip'
    with zipfile.ZipFile(archive,'x',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for f in target.rglob('*'):
            if f.is_file():z.write(f,Path(target.name)/f.relative_to(target))
    with zipfile.ZipFile(archive) as z:
        if z.testzip():raise ValueError('Built archive CRC error')
    print(json.dumps({'archive':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'windows_launch_tested':False}))

if __name__=='__main__':main()
