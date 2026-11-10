"""JobPilot safe offline matching core. Standard library only."""
import json
import re
import sqlite3
from pathlib import Path
from urllib.parse import urlparse

SCHEMA = """CREATE TABLE IF NOT EXISTS jobs (
 id INTEGER PRIMARY KEY, url TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
 score INTEGER NOT NULL DEFAULT 0, track TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)"""
TRACKS = {
 "operations": ["operations", "coordinator", "project management", "pmo", "عمليات", "مشاريع"],
 "data": ["data analyst", "excel", "power bi", "reporting", "تحليل بيانات"],
 "training": ["trainer", "training", "learning development", "مدرب", "تدريب"],
 "assistant": ["virtual assistant", "administrative", "inbox", "مساعد اداري"],
 "quality": ["quality assurance", "software tester", "qa analyst", "اختبار البرمجيات"],
}
def normalize(text):
 return " " + re.sub(r"[^\w]+", " ", str(text or "").casefold()).strip() + " "

def evaluate(title, description="", tracks=None):
 tracks = tracks or TRACKS
 t, d = normalize(title), normalize(description)
 candidates = []
 for name, keywords in tracks.items():
  title_hits = [w for w in keywords if normalize(w) in t]
  desc_hits = [w for w in keywords if normalize(w) in d]
  score = min(100, 45 * bool(title_hits) + 10 * len(title_hits) + 5 * len(desc_hits))
  candidates.append({"track":name,"score":score,"title_hits":title_hits,"description_hits":desc_hits})
 candidates.sort(key=lambda item:(-item["score"],item["track"]))
 return {"best":candidates[0] if candidates else None,
         "alternatives":candidates[1:3],
         "needs_review":True,
         "warning":"Keyword match only; not a hiring probability or proof of eligibility."}

def valid_url(value):
 try:
  u=urlparse(value)
  return u.scheme in ("https","http") and bool(u.hostname) and not u.username and not u.password
 except ValueError:
  return False

def import_jobs(database, rows):
 db=sqlite3.connect(str(database))
 db.execute(SCHEMA)
 count=0
 try:
  for row in rows:
   url=str(row.get("url","")).strip()
   title=str(row.get("title","")).strip()
   if not valid_url(url) or not title: continue
   desc=str(row.get("description",row.get("desc","")))
   result=evaluate(title,desc)["best"]
   cur=db.execute("INSERT OR IGNORE INTO jobs(url,title,description,score,track) VALUES (?,?,?,?,?)",
                  (url,title,desc,result["score"],result["track"]))
   count+=cur.rowcount
  db.commit()
 finally: db.close()
 return count

if __name__=="__main__":
 import argparse, csv
 p=argparse.ArgumentParser()
 p.add_argument("--csv",required=True)
 p.add_argument("--db",default="jobpilot.sqlite")
 args=p.parse_args()
 with open(args.csv,encoding="utf-8-sig",newline="") as f:
  print(json.dumps({"imported":import_jobs(Path(args.db),csv.DictReader(f))},ensure_ascii=False))
