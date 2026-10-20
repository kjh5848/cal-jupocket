# 호주 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `au` (작업 폴더 `../cal-wt/au`, rates `src/rates/au/`, lib `src/lib/au/`, 테스트 `src/lib/__tests__/au-*.test.ts`) |
| 판 | `en-au` — 주소 `/en-au/`, 도구 목록 `src/data/en-au/tools.ts` |
| 페이지 언어 | English (Australia) — `<html lang="en-AU">` |
| 조사표 칸 | 호주 |
| 자동완성 | `--hl en --gl au` |
| 허용 출처 | ato.gov.au · legislation.gov.au · fairwork.gov.au · servicesaustralia.gov.au · moneysmart.gov.au |
| 주의 | 과세연도는 7/1~6/30 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국 회차와 같은 이유). 독립 호주판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /en-au/tools/percent/ | 호주판 첫 도구 — `src/pages/en-au/index.astro`(LocaleHome)·`src/data/en-au/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 의 영어 사전 `EN` 은 미국 루틴이 이미 넣음 — 고친 것 없음. 홈 title 겹침은 c7276c4 로 기초가 고쳐져 있음(`jupocket Australia — …`). 도구 title 은 미국판과 갈리게 "Percentage Calculator Australia — …". 자동완성 `keywords/au-percent-2026-10-20.csv`(hl en, gl au) — percentage of a number formula·without calculator·trick / percentage increase·decrease between two numbers·formula / percentage decrease from 80 to 60 / percentage off (price) calculator australia / percentage calculator of marks·grade / percentage increase formula excel. 호주 자동완성이 "percent change" 보다 "percentage increase/decrease" 를 써서 그 표현으로 씀. percentage difference(평균으로 나눔)는 질문에서 식만 설명. GST 등 호주 세율 숫자는 rates 미검증이라 쓰지 않음. 미리보기 서버는 무인 회차라 띄우지 않음 — 빌드 HTML(lang en-AU·hreflang ko/ja/en-US/en-AU)만 확인 |
