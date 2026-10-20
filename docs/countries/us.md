# 미국 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `us` (작업 폴더 `../cal-wt/us`, rates `src/rates/us/`, lib `src/lib/us/`, 테스트 `src/lib/__tests__/us-*.test.ts`) |
| 판 | `en-us` — 주소 `/en-us/`, 도구 목록 `src/data/en-us/tools.ts` |
| 페이지 언어 | English (US) — `<html lang="en-US">` |
| 조사표 칸 | 미국 |
| 자동완성 | `--hl en --gl us` |
| 허용 출처 | irs.gov · ssa.gov · dol.gov · uscode.house.gov · ecfr.gov · federalregister.gov · consumerfinance.gov · 주(州) 제도는 그 주 정부 .gov 만 |
| 주의 | 연방과 주가 겹치는 제도(소득세·최저임금·실업급여)는 연방 숫자만 쓰거나 주를 고르게 한다 — 주 숫자는 그 주 .gov 원문으로만 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /en-us/tools/percent/ | 미국판 첫 도구 — `src/pages/en-us/index.astro`(LocaleHome)·`src/data/en-us/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 표 위 1순위 53행(#24 실수령액 → 하루·시간)은 한국어판이 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 스크립트 공유·짝이 안 돼 건너뜀(일본 회차와 같은 사유). 공유 스크립트 `src/scripts/percent.ts` 를 `pickLang({ ko, ja, en })` 로 바꾸고 EN 사전 추가(KO·JA 문자열 그대로, 영어 다섯 판 공용이라 통화 기호 없음) — 별도 커밋. 자동완성 `keywords/us-percent-2026-10-20.csv` — percentage calculator formula / percent off price·coupon / percent change between two numbers·formula / percent change vs percent difference / percentage increase formula excel·google sheets / for grades. percent difference(평균으로 나눔)는 식 설명만, 계산은 안 함. 법 숫자 없음 — sales tax·팁은 주·도시마다 달라 쓰지 않음. 입력 `$` 는 parseNumber 가 못 읽어 FAQ 로 안내. 미리보기 서버는 무인 회차라 띄우지 않음 — 빌드 HTML(lang en-US·hreflang ko/ja/en-US 양쪽·25% 초기값)만 확인. 라이브 200 확인(2026-10-20 21:28, /en-us/ 홈도 200) |
