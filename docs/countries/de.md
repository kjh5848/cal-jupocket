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
| 2026-10-20 | 퍼센트(#211) | 같음 | 보류(공유 파일 충돌 — 다음 회차 재시도) | — | 빌드·vitest 0 까지 마쳤지만 push 직전 rebase 에서 `src/scripts/percent.ts` 가 21acd6d(번체 ZH_HANT 사전 추가)와 충돌 → `git rebase --abort`. 작업은 로컬 브랜치 **`wip/de-percent`**(커밋 ab87e52 공유 lib·스크립트·테스트 + 3cc3f18 페이지·홈·tools.ts·CSV·기록)에 남김 — 다음 회차는 새 main 에서 두 커밋을 cherry-pick 하고 `pickLang({ ko, ja, en, "zh-Hant": …, de: DE })` 로 사전 줄만 합치면 됨(3cc3f18 의 de.md 행은 이 보류 행과 겹치니 발행 행으로 정리). 내용: `src/lib/percent.ts` 에 `parseNumberDe`(쉼표 = 소수점, 쉼표 있으면 점은 천 단위만, 쉼표 없이 `1.500` 처럼 세 자리 묶음이면 천 단위·그 밖의 점은 소수점)·`formatNumberDe`(소수 쉼표, 천 단위 줄바꿈 없는 공백) + `percent.test.ts` 고정(KO 표기 그대로), 스크립트에 DE 사전 + `NUM = pickLang({ ko: {parse, fmt}, de: {…De} })`. 한국 `parseNumber` 는 "12,5" 를 125 로 읽어 그대로 내면 안 됨. 표기 근거: § 4 SolzG 1995 "5,5 Prozent"(https://www.gesetze-im-internet.de/solzg_1995/__4.html)·§ 32a EStG "12 348 Euro"·"914,51"(https://www.gesetze-im-internet.de/estg/__32a.html), 확인 2026-10-20 — 점 천 단위(Intl de-DE)는 허용 출처로 확인 안 해 출력에 안 씀. 자동완성 `keywords/de-percent-2026-10-20.csv`(hl de, gl de, wip 커밋 안) — prozent berechnen formel·dreieck / dreisatz / aus zwei werten / prozentuale veränderung zum vorjahr / rabatt alter preis neuer preis / excel formel / steigung·gefälle / arbeitszeit. MwSt 세율·€ 위치는 안 씀. 참고(프랑스 기록과 같음): calc-ui 틀의 `num()` 은 천 단위 쉼표 전제 — 프리셋·소계를 쓰는 독일판 도구가 오면 기초 필요 |
