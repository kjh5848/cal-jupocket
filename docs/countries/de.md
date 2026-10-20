# 독일 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `de` (작업 폴더 `../cal-wt/de`, rates `src/rates/de/`, lib `src/lib/de/`, 테스트 `src/lib/__tests__/de-*.test.ts`) |
| 판 | `de` — 주소 `/de/`, 도구 목록 `src/data/de/tools.ts` |
| 페이지 언어 | Deutsch — `<html lang="de-DE">` |
| 조사표 칸 | 독일 |
| 자동완성 | `--hl de --gl de` |
| 허용 출처 | bundesfinanzministerium.de · gesetze-im-internet.de · deutsche-rentenversicherung.de · bundesregierung.de · arbeitsagentur.de |
| 주의 | 교회세·연대가산세(Solidaritätszuschlag)처럼 붙는 몫은 따로 보이게 한다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 독일판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /de/tools/percent/ | 독일판 첫 도구 — 앞선 보류(공유 파일 충돌) 뒤 다음 회차(2026-10-20)에 `wip/de-percent` 두 커밋을 새 main(b0673c8) 위에 잠금(main) 잡고 cherry-pick, `src/scripts/percent.ts` 충돌은 `pickLang({ ko, ja, en, "zh-Hant": ZH_HANT, de: DE })` 로 사전만 합쳐 풀음. `src/pages/de/index.astro`(LocaleHome)·`src/data/de/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. **숫자 표기**: 공유 `parseNumber` 가 쉼표를 지워 독일식 `12,5` 를 125 로 읽는 문제가 있어, `src/lib/percent.ts` 에 `parseNumberDe`(쉼표 = 소수점, 쉼표 있으면 점은 천 단위만, 쉼표 없이 `1.500` 처럼 세 자리 묶음이면 천 단위·그 밖의 점은 소수점)·`formatNumberDe`(소수 쉼표, 천 단위 줄바꿈 없는 공백) 추가 + 테스트, 공유 스크립트 `src/scripts/percent.ts` 에 DE 사전과 `pickLang` 으로 고르는 NUM(읽기·쓰기) 추가 — KO·JA·EN 출력 그대로(테스트로 고정), 별도 커밋. 표기 근거: § 4 SolzG 1995 "5,5 Prozent"(https://www.gesetze-im-internet.de/solzg_1995/__4.html)·§ 32a EStG "12 348 Euro"·"914,51"(https://www.gesetze-im-internet.de/estg/__32a.html), 확인 2026-10-20 — Intl de-DE 의 점 천 단위(1.234,5)는 허용 출처로 확인 안 해 출력에 안 씀. % 앞 띄어쓰기 관습은 원문 미확인이라 계산기와 같은 붙여 쓰기. 자동완성 `keywords/de-percent-2026-10-20.csv`(hl de, gl de) — prozent berechnen formel·beispiel·dreieck / prozentrechnung dreisatz / prozent berechnen aus zwei werten / prozentuale veränderung zum vorjahr berechnen / rabatt berechnen alter preis neuer preis / excel formel / steigung·gefälle / prozentrechner arbeitszeit(30 ÷ 40 산술 예시만, 법정 근로시간 숫자 없음). MwSt 세율(rates 없음)·€ 기호 위치(원문 미확인)는 안 씀, schweiz·shein·lehrerschmidt 축은 버림. 빌드 HTML(lang de-DE·hreflang ko/ja/en-*/de-DE 양쪽·홈 title "jupocket — Rechner für den Alltag") 확인, 빌드·vitest 0. 미리보기 서버는 무인 회차라 띄우지 않음 |
