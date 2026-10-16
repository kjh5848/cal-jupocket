"""roberin 도구 목록(keywords/roberin-tools-list-*.json) → docs/tool-backlog.md 표를 만든다.

사용: python scripts/build_tool_backlog.py keywords/roberin-tools-list-2026-10-16.json
- 목록 JSON 은 roberin 홈의 도구 카드에서 이름·주소·분류만 뽑은 것(문구·화면은 가져오지 않음).
- 이미 있는 도구는 OURS 사전(이름 조각 → 우리 주소)으로 '있음'. 루틴이 손으로 고친 상태·메모는
  기존 표에서 읽어 그대로 보존한다(다시 돌려도 사람이 적은 판정이 지워지지 않는다).
"""
import io, json, re, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "keywords/roberin-tools-list-2026-10-16.json"
OUT = "docs/tool-backlog.md"

# roberin 분류(대/소) → 우리 분류 12개 (설계 3-4)
def our_type(cat, sub, name):
    if cat in ("반려동물", "스포츠·야구", "게임·랜덤·재미"):
        return "생활·재미"
    # 이름이 법·제도 도구면 roberin 분류와 관계없이 우리 분류로(4대보험이 '문서 유틸'에 있는 식)
    if re.search(r"연금|국민연금", name):
        return "연금·보험"
    if re.search(r"4대\s*보험|급여|시급|월급|연봉|주휴|퇴직금|실업|최저임금|수당|근로|알바|일당|통상임금|연차|실수령|산재|육아휴직|출산휴가", name):
        return "급여·근로"
    if re.search(r"세금|소득세|부가세|취득세|재산세|양도|상속|증여|원천징수|3\.3%|종부세|관세", name):
        return "상속·증여" if re.search(r"상속|증여", name) else "세금"
    if cat == "돈·세금·급여":
        if sub == "급여·세금":
            if re.search(r"연금", name):
                return "연금·보험"
            if re.search(r"급여|시급|월급|연봉|주휴|퇴직금|실업|최저임금|수당|4대|근로|알바|일당|통상임금", name):
                return "급여·근로"
            return "세금"
        return "돈·금융"
    if cat == "부동산·주거·자동차":
        return "단위·변환" if sub == "날씨·환경" else "집·차"
    if cat in ("날짜·시간·일정",):
        return "날짜·시간"
    if cat == "여행·이동·생활 생산성":
        return "날짜·시간" if sub in ("회의·시간대", "집중·습관") else "생활·재미"
    if cat == "건강·운동·라이프":
        return "건강·운동"
    if cat == "단위·변환·과학":
        return "단위·변환"
    if cat == "디자인·색상·이미지":
        return "사진·문서" if sub == "이미지·파일" else "텍스트·개발"
    if cat == "문서·텍스트·개발 유틸":
        return "사진·문서" if sub == "PDF·QR·파일" else "텍스트·개발"
    return "생활·재미"  # 게임·랜덤·재미, 스포츠·야구, 반려동물


# 이름 조각 → 이미 있는 우리 도구(계산기 페이지). 위에서부터 먼저 맞는 것
OURS = [
    (r"3\.3%|프리랜서", "/freelancer-33/"), (r"8\.8|원천징수", "/withholding/"),
    (r"부가세|부가가치세", "/vat/"), (r"종합소득세|종소세", "/income-tax-refund/"), (r"가산세", "/penalty/"),
    (r"^(연봉|월급) ?실수령|^실수령액 ?계산기", "/guide/take-home-calculator/"), (r"주휴", "/guide/weekly-holiday-pay-calculator/"),
    (r"연차", "/guide/annual-leave-calculator/"), (r"실업급여", "/guide/unemployment-benefit-calculator/"),
    (r"육아휴직", "/guide/parental-leave-pay-calculator/"), (r"최저임금", "/guide/minimum-wage-calculator/"),
    (r"^4대\s*보험", "/guide/four-insurance-calculator/"), (r"국민연금", "/national-pension-premium/"),
    (r"기초연금", "/guide/basic-pension-calculator/"), (r"양도", "/guide/capital-gains-calculator/"),
    (r"상속세", "/inheritance/"), (r"증여세", "/guide/gift-tax-calculator/"), (r"취득세", "/acquisition-tax/"),
    (r"재산세", "/property-tax/"), (r"자동차세", "/vehicle-tax/"), (r"종부세|종합부동산", "/guide/jongbu-calculator/"),
    (r"로또|복권", "/guide/lotto-tax-calculator/"), (r"퇴직소득세", "/guide/severance-tax-calculator/"),
    (r"코인.*세|가상자산", "/guide/crypto-tax-calculator/"), (r"연말정산", "/guide/year-end-calculator/"),
    (r"근로장려금", "/guide/earned-incentive-amount/"), (r"자녀장려금", "/guide/child-incentive-amount/"),
    (r"IRP|연금저축", "/guide/irp-tax-credit-calculator/"), (r"의료비", "/guide/medical-credit-limit/"),
    (r"산재|휴업급여", "/guide/industrial-accident-leave-pay/"), (r"노령연금", "/guide/old-age-pension-age/"),
]
LAW_TYPES = {"세금", "급여·근로", "연금·보험", "집·차", "상속·증여", "돈·금융"}


def prev_rows():
    """기존 표에서 roberin 주소 → (상태, 우리 주소, 메모) — 사람이 고친 판정을 보존"""
    try:
        s = io.open(OUT, encoding="utf-8").read()
    except FileNotFoundError:
        return {}
    keep = {}
    for line in s.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 8 and cells[3].startswith("http"):
            keep[cells[3]] = (cells[5], cells[6], cells[7])
    return keep


def main():
    tools = json.load(io.open(SRC, encoding="utf-8"))
    keep = prev_rows()
    rows = []
    for i, t in enumerate(tools, 1):
        typ = our_type(t["cat"], t["sub"], t["name"])
        ours = next((h for pat, h in OURS if re.search(pat, t["name"])), "")
        status, note = ("있음", "") if ours else ("할 일", "")
        if re.search(r"스페인|인도네시아|Indemnizaci|Pesangon|일본|미국", t["name"]):
            status, note = "보류", "나라별 — 한국·일본 다음(설계 2절)"
        if t["url"] in keep:
            status, ours, note = keep[t["url"]]
        rows.append((i, typ, f'{t["cat"]} / {t["sub"]}', t["url"], t["name"], status, ours, note))
    # 법·제도 영역(원문 검증)부터, 같은 영역 안에서는 roberin 순서
    rows.sort(key=lambda r: (r[1] not in LAW_TYPES, r[0]))
    count = {}
    for r in rows:
        count[r[5]] = count.get(r[5], 0) + 1
    head = f"""# 도구 담을 목록 (roberin {len(rows)}개 기준)

루틴(`docs/superpowers/plans/2026-10-16-tool-routine.md`)이 위에서부터 한 줄씩 처리한다.
상태: **있음**(우리 도구가 같은 일을 함) · **할 일** · **진행 중** · **가져옴**(새로 만듦) · **보류**(원문 미확인 등 — 메모에 이유) · **제외**(우리 원칙과 안 맞음 — 메모에 이유).
생성: `python scripts/build_tool_backlog.py {SRC}` — 다시 돌려도 상태·우리 주소·메모 칸은 보존된다.

현재: {" · ".join(f"{k} {v}" for k, v in sorted(count.items()))}

| # | 우리 분류 | roberin 분류 | roberin 주소 | 도구 | 상태 | 우리 주소 | 메모 |
|---|---|---|---|---|---|---|---|
"""
    body = "\n".join(f"| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} | {r[5]} | {r[6]} | {r[7]} |" for r in rows)
    io.open(OUT, "w", encoding="utf-8", newline="\n").write(head + body + "\n")
    print(OUT, len(rows), count)


if __name__ == "__main__":
    main()
