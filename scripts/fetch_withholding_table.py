"""근로소득 간이세액표(소득세법 시행령 별표 2)를 국가법령정보센터 문서뷰어 XML에서 읽어 JSON 으로 만든다.

사용: python scripts/fetch_withholding_table.py > src/rates/withholding-table-2026.json

문서뷰어는 쪽마다 글자 하나하나를 좌표(l, t, w)와 함께 XML 로 준다. 같은 줄(t)의 글자를
왼쪽부터 이어 붙이고, 6px 넘게 벌어지면 칸이 바뀐 것으로 본다. 13칸이 모두 숫자나 '-' 인
줄만 표의 행이다(이상·미만 천원, 공제대상가족 1~11명 세액).

2026-10-14: 소득세법 시행령 [시행 2026. 10. 1.] [대통령령 제36737호] 의 별표 2 <개정 2026. 2. 27.>.
770천원 이상 ~ 10,000천원 미만 646행, 이음매 빈틈 없음, 가족 수가 늘면 세액이 줄고 월급이 늘면 세액이 늘거나 같은지, 구간 폭(5·10·20천원)까지 확인했다.
2,810·2,850·2,940·2,990·3,000천원 행은 문서뷰어 쪽 이미지(thumbnail/12.png)와 눈으로 맞췄다.
별표가 바뀌면 BASE 의 경로가 바뀐다 — 시행령 화면의 [별표 2] 링크에서 다시 찾는다.
"""
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

BASE = "https://www.law.go.kr/viewer/BYL/LS/2026/09/0039562026093036737/SKIN/169798151/thumbnailxml/"
PAGES = 27  # 0~26쪽. 문서뷰어의 dimension/0-27.js 는 끝이 열린 구간이다


def page_rows(xml_text):
    root = ET.fromstring(xml_text)
    glyphs = []
    for e in root.iter("text"):
        w = float(e.get("w"))
        c = e.text or ""
        if w > 0 and c.strip():
            glyphs.append((float(e.get("l")), float(e.get("t")), w, c))
    by_t = {}
    for l, t, w, c in glyphs:
        by_t.setdefault(round(t / 3), []).append((l, w, c))
    for k in sorted(by_t):
        toks, cur, end = [], "", -1e9
        for l, w, c in sorted(by_t[k]):
            if l - end > 6 and cur:
                toks.append(cur)
                cur = ""
            cur += c
            end = l + w
        if cur:
            toks.append(cur)
        yield toks


rows = []
for p in range(PAGES):
    # 기본 User-Agent(Python-urllib)는 404 가 난다. curl 은 그대로 받는다.
    req = urllib.request.Request(BASE + f"{p}.xml", headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        text = r.read().decode("utf-8")
    for toks in page_rows(text):
        if len(toks) == 13 and all(re.fullmatch(r"[\d,\-]+", t) for t in toks):
            rows.append([0 if t == "-" else int(t.replace(",", "")) for t in toks])

assert rows[0][0] == 770 and rows[-1][1] == 10_000, (rows[0][:2], rows[-1][:2])
for a, b in zip(rows, rows[1:]):
    assert a[1] == b[0], (a[:2], b[:2])
for r in rows:
    assert all(r[i] >= r[i + 1] for i in range(2, 12)), r[:2]
# 월급이 오를수록(아래 행일수록) 같은 가족 열의 세액은 줄지 않는다 — 값이 옆 행에 잘못 붙으면 여기서 걸린다
for a, b in zip(rows, rows[1:]):
    assert all(b[c] >= a[c] for c in range(2, 13)), (a[:2], b[:2])
# 구간 폭: 770~1,500천원 5천원, 1,500~3,000천원 10천원, 3,000~10,000천원 20천원(원문 이미지로 확인)
for r in rows:
    width = 5 if r[0] < 1500 else 10 if r[0] < 3000 else 20
    assert r[1] - r[0] == width, r[:2]

json.dump({"rows": rows}, sys.stdout, separators=(",", ":"))
