"""Build problems.db from CSV. Run once after install."""
import argparse 
import csv
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  
DATA_DIR = ROOT / "data"  
DB_PATH  = DATA_DIR / "problems.db"

parser = argparse.ArgumentParser()
parser.add_argument("--mode", choices=["local", "production"], default="production")
args = parser.parse_args()

if args.mode == "production":
    CSV_PATH = DATA_DIR / "atcoder_tags.csv"
else:
    CSV_PATH = DATA_DIR / "sample.csv"


if not CSV_PATH.exists():
    raise SystemExit(f"CSV missing at {CSV_PATH}")

if DB_PATH.exists():
    DB_PATH.unlink()

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

cur.execute("""
CREATE TABLE problems (
    problem_index INT PRIMARY KEY,
    Problem_Link TEXT NOT NULL,
    Editorial_Link TEXT NOT NULL,
    Tags TEXT NOT NULL
)
""")

cur.execute("CREATE INDEX idx_problems_tags ON problems(Tags)")

with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = [
        (int(r["Index"]), r["Problem_Link"], r["Editorial_Link"], r["Tags"])
        for r in reader
    ]
cur.executemany(
    "INSERT INTO problems (problem_index, Problem_Link, Editorial_Link, Tags) VALUES (?, ?, ?, ?)",
    rows,
)
conn.commit()
conn.close()
print(f"Built {DB_PATH} with {len(rows)} rows")