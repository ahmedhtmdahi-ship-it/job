import importlib.util
from pathlib import Path
import pytest

spec=importlib.util.spec_from_file_location('portable_builder',Path(__file__).parents[1]/'scripts/build_portable_windows.py')
builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder)

def test_only_locked_runtime_wheels_are_bundled(tmp_path):
    lock=tmp_path/'lock';lock.write_text('pypdf==5.4.0\n')
    for name in ['pypdf-5.4.0-py3-none-any.whl','pypdf-9.0.0-py3-none-any.whl','unrequested-1.0-py3-none-any.whl']:(tmp_path/name).touch()
    assert [p.name for p in builder.locked_wheels(tmp_path,lock)]==['pypdf-5.4.0-py3-none-any.whl']

def test_missing_locked_wheel_stops_build(tmp_path):
    lock=tmp_path/'lock';lock.write_text('pypdf==5.4.0\n')
    with pytest.raises(ValueError):builder.locked_wheels(tmp_path,lock)

def test_duplicate_build_for_same_version_stops_build(tmp_path):
    lock=tmp_path/'lock';lock.write_text('pypdf==5.4.0\n')
    for name in ['pypdf-5.4.0-py3-none-any.whl','pypdf-5.4.0-1-py3-none-any.whl']:(tmp_path/name).touch()
    with pytest.raises(ValueError):builder.locked_wheels(tmp_path,lock)
