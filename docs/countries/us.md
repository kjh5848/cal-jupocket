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
| 2026-10-20 | 날짜 계산(#76·#75) | 단위 | 발행 | /en-us/tools/date-diff/ | 미국판 두 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/date-diff/(type date·icon calendar). 공유 스크립트 `src/scripts/date-diff.ts` 를 `pageLocale()==="ja"` 분기에서 `pickLang({ ko, ja, en })` 로 바꾸고 EN 사전 추가(KO·JA 그대로) — 별도 커밋. EN 날짜 표기는 페이지 lang 의 `toLocaleDateString(…, { timeZone: "UTC" })` 라 영국·호주판이 같은 사전을 써도 일·월 순서가 맞음. 업무일(공휴일 빼기) 토글 없음 — 연방 공휴일 목록을 허용 출처로 확인하지 않음, 토·일만 뺀 Weekdays 까지. 시간 환산(일수×24)도 뺌 — 서머타임 원문 미확인(조사표 56행 메모). 자동완성 `keywords/us-date-diff-2026-10-20.csv` — date calculator between two dates·add/subtract days·in months / days between dates excluding weekends and holidays·excel·google sheets / days from today to end of year. 본문 예시 숫자는 전부 frontmatter 에서 span()·shift() 로 계산. 법 숫자 없음. 라이브 200 확인(2026-10-20 21:48) |
