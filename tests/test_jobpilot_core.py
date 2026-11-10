import sqlite3
from pathlib import Path
from jobpilot_core import evaluate, import_jobs, valid_url

def test_match():
 r=evaluate("Operations Coordinator","Excel reporting")
 assert r["best"]["track"]=="operations"
 assert r["needs_review"] is True

def test_reject_bad_url():
 assert not valid_url("file:///etc/passwd")
 assert not valid_url("https://user:pass@example.com")
 assert valid_url("https://example.com/jobs/1")

def test_import(tmp_path):
 db=tmp_path/"jobs.sqlite"
 rows=[{"url":"https://example.com/jobs/1","title":"Data Analyst"},
       {"url":"https://example.com/jobs/1","title":"Data Analyst"},
       {"url":"file:///bad","title":"Bad"}]
 assert import_jobs(db,rows)==1
 with sqlite3.connect(db) as con:
  assert con.execute("select count(*) from jobs").fetchone()[0]==1
