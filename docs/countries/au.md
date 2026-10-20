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
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /en-au/tools/percent/ | 호주판 첫 도구 — `src/pages/en-au/index.astro`(LocaleHome)·`src/data/en-au/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 의 영어 사전 `EN` 은 미국 루틴이 이미 넣음 — 고친 것 없음. 홈 title 겹침은 c7276c4 로 기초가 고쳐져 있음(`jupocket Australia — …`). 도구 title 은 미국판과 갈리게 "Percentage Calculator Australia — …". 자동완성 `keywords/au-percent-2026-10-20.csv`(hl en, gl au) — percentage of a number formula·without calculator·trick / percentage increase·decrease between two numbers·formula / percentage decrease from 80 to 60 / percentage off (price) calculator australia / percentage calculator of marks·grade / percentage increase formula excel. 호주 자동완성이 "percent change" 보다 "percentage increase/decrease" 를 써서 그 표현으로 씀. percentage difference(평균으로 나눔)는 질문에서 식만 설명. GST 등 호주 세율 숫자는 rates 미검증이라 쓰지 않음. 미리보기 서버는 무인 회차라 띄우지 않음 — 빌드 HTML(lang en-AU·hreflang ko/ja/en-US/en-AU)만 확인. 라이브 200 확인(2026-10-20 21:42, /en-au/ 홈도 200) |
| 2026-10-20 | 날짜 계산(#76, #75 행 같은 도구) | 단위 | 발행 | /en-au/tools/date-diff/ | `src/data/en-au/tools.ts` 에 ko 짝 /tools/date-diff/. 공유 스크립트 `src/scripts/date-diff.ts` 의 영어 사전 `EN` 은 이미 있고 날짜 표기는 `<html lang="en-AU">` 로 '20 October 2026'(일·월 순) — 고친 것 없음. title 은 미국·영국판과 갈리게 "Days Between Dates Calculator Australia — …". 자동완성 `keywords/au-date-diff-2026-10-20.csv`(hl en, gl au) — days between dates calculator australia·between 2 dates / add days to date calculator / date calculator in months·weeks between dates / working days calculator australia·nsw·victoria·qld·wa·sa·act / days between dates calculator excel. 공휴일은 빼지 않음(월~금만) — fairwork.gov.au/employment-conditions/public-holidays 가 WebFetch·curl 모두 응답 시간 초과(2026-10-20)라 공휴일 날짜·개수는 본문에 쓰지 않고 "주·준주마다 다름"만 적음. 자동완성의 "date calculator ato" 는 ATO 원문 확인 전이라 다루지 않음. 시간 환산은 넣지 않음(일광 절약 시간). 미리보기 서버는 무인 회차라 띄우지 않음 — 빌드 HTML(lang en-AU·hreflang ko/ja/en-US/en-GB/en-AU, 본문 숫자 72일·52 weekdays 손계산 일치)만 확인. 라이브 200 확인(2026-10-20 22:36)·IndexNow 전송 |
| 2026-10-20 | 적립식 복리(#41) | 같음 | 발행 | /en-au/tools/compound/ | `src/data/en-au/tools.ts` 에 ko 짝 /tools/compound/. 공유 스크립트 `src/scripts/compound.ts` 의 영어 사전 `EN` 은 이미 있고 통화는 판의 AUD — 고친 것 없음. title 은 미국·영국판과 갈리게 "Compound Interest Calculator Australia — Monthly Savings, Daily Rates, Inflation". 세율 기본값 0%(한국 15.4% 안 씀), 호주 세율 숫자는 적지 않음(ato.gov.au 는 WebFetch·curl 모두 403). 호주 사실은 Moneysmart 원문만 — 복리 공식·$10,000 3% 월복리 5·10·20년 예시(https://moneysmart.gov.au/saving/compound-interest, Last updated 2026-09-10 — 페이지에서 compound() 로 $11,616·$13,494·$18,208 재현해 대조), 저축 이자는 세금 신고에 넣는 투자소득·세금은 marginal tax rate 에 따름·슈퍼는 별도 세제(https://moneysmart.gov.au/how-to-invest/investing-and-tax, Last updated 2026-10-02), 확인 2026-10-20. 자동완성 `keywords/au-compound-2026-10-20.csv`(hl en, gl au) — compound interest calculator australia monthly / savings calculator australia / daily compound interest calculator australia(일복리 → 월복리 환산식으로 설명) / with inflation / superannuation compound interest calculator australia(슈퍼 세제·수수료는 모델링 안 한다고 FAQ) / excel. 은행 이름 자동완성(commbank·anz·nab 등)은 다루지 않음. 미리보기 서버는 무인 회차라 띄우지 않음 |
