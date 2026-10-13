"""시리즈 글을 클러스터·최근 글·링크허브·리다이렉트에 한 번에 등록한다.

사용: python scripts/register_series.py < series.json

series.json:
  {"cluster": "vat", "icon": "calendar", "year": 2026,
   "pages": [{"slug": "...", "label": "...", "title": "..."}]}

이미 등록된 것은 건너뛴다(여러 번 돌려도 같다). IRP 시리즈(2026-10-12)를 손으로
등록하다가 같은 일을 네 시리즈에 반복하게 돼서 뺐다.
"""
import io
import json
import os
import re
import sys

# 윈도우 표준입력은 cp949 로 읽혀 한글이 깨진다. 바이트로 받아 UTF-8 로 푼다.
spec = json.loads(sys.stdin.buffer.read().decode("utf-8"))
cluster = spec["cluster"]
pages = spec["pages"]
icon = spec.get("icon", "receipt")
year = spec.get("year")


def read(p):
    return io.open(p, encoding="utf-8").read()


def write(p, s):
    # 임시 파일에 먼저 쓰고 바꿔치기한다. 쓰다가 실패해도 원본이 남는다
    # (2026-10-13 에 인코딩 오류로 clusters.ts 가 0바이트가 된 적이 있다).
    tmp = p + ".tmp"
    io.open(tmp, "w", encoding="utf-8", newline="").write(s)
    os.replace(tmp, p)


# 1) clusters.ts — 해당 클러스터 links 끝에 추가, recent 맨 앞에 추가
p = "src/data/clusters.ts"
s = read(p)
start = s.index(f'id: "{cluster}"')
links_open = s.index("links: [", start)
# links 배열의 닫는 괄호: 줄 시작이 '    ],' 인 첫 위치
links_close = s.index("\n    ],", links_open)
add = ""
for pg in pages:
    href = f"/guide/{pg['slug']}/"
    if f'href: "{href}"' in s:
        continue
    y = f", year: {year}" if year else ""
    add += f'      {{ href: "{href}", title: "{pg["title"]}", kind: "guide", icon: "{icon}"{y} }},\n'
if add:
    s = s[: links_close + 1] + add + s[links_close + 1 :]
anchor = "export const recent: string[] = [\n"
i = s.index(anchor) + len(anchor)
j = s.index("];", i)
block = s[i:j]
new = "".join(f'  "/guide/{pg["slug"]}/",\n' for pg in reversed(pages) if f'"/guide/{pg["slug"]}/"' not in block)
s = s[:i] + new + s[i:]
write(p, s)

# 2) linkhub.ts — 번호 이어 붙이기 + hubGroups 의 해당 클러스터 묶음
p = "src/data/linkhub.ts"
s = read(p)
nos = [int(x) for x in re.findall(r"\{ no: (\d+),", s)]
last = max(nos)
k = s.index(f"  {{ no: {last},")
e = s.index("\n", k) + 1
entries = ""
n = last
for pg in pages:
    href = f"/guide/{pg['slug']}/"
    if f'href: "{href}"' in s:
        continue
    n += 1
    if len(pg["label"]) > 30:
        sys.exit(f"라벨이 30자를 넘는다: {pg['label']}")
    entries += f'  {{ no: {n}, href: "{href}", label: "{pg["label"]}", kind: "guide" }},\n'
s = s[:e] + entries + s[e:]
g = s.index(f'cluster: "{cluster}"', s.index("export const hubGroups"))
open_ = s.index("inCluster([", g) + len("inCluster([")
close = s.index("])", open_)
inner = s[open_:close]
multiline = "\n" in inner
missing = [pg["slug"] for pg in pages if f'"/guide/{pg["slug"]}"' not in inner]
if missing:
    if multiline:
        ins = "".join(f'      "/guide/{m}",\n' for m in missing)
        # 닫는 괄호 앞 줄의 들여쓰기를 지키며 넣는다
        line_start = s.rfind("\n", 0, close) + 1
        s = s[:line_start] + ins + s[line_start:]
    else:
        ins = "".join(f', "/guide/{m}"' for m in missing)
        s = s[:close] + ins + s[close:]
write(p, s)

# 3) _redirects
p = "public/_redirects"
s = read(p).rstrip("\n") + "\n"
for pg in pages:
    slug = pg["slug"]
    if f"/{slug}/  /guide/{slug}/" in s:
        continue
    s += f"\n/{slug}/  /guide/{slug}/  301\n/{slug}  /guide/{slug}/  301\n"
write(p, s)

print(f"linkhub {last + 1}~{n} · {len(pages)}편 확인")
