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
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /en-us/tools/percent/ | 미국판 첫 도구 — `src/pages/en-us/index.astro`(LocaleHome)·`src/data/en-us/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 표 위 1순위 53행(#24 실수령액 → 하루·시간)은 한국어판이 가이드 …(보관) |
| 2026-10-20 | 날짜 계산(#76·#75) | 단위 | 발행 | /en-us/tools/date-diff/ | 미국판 두 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/date-diff/(type date·icon calendar). 공유 스크립트 `src/scripts/date-dif …(보관) |
| 2026-10-20 | 적립식 복리(#41) | 같음 | 발행 | /en-us/tools/compound/ | 미국판 세 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/compound/(type money·icon chart). 공유 스크립트 `src/scripts/compound.ts …(보관) |
| 2026-10-20 | 디데이(#78) | 단위 | 발행 | /en-us/tools/dday/ | 미국판 네 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/dday/(type date·icon calendar). 공유 스크립트 `src/scripts/dday.ts` 를 `p …(보관) |
| 2026-10-20 | 날짜 요일(#74) | 단위 | 발행 | /en-us/tools/date-day/ | 미국판 다섯 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/date-day/(type date·icon calendar). 공유 스크립트 `src/scripts/date-day …(보관) |
| 2026-10-20 | 유닉스 타임스탬프 변환(#90) | 같음 | 발행 | /en-us/tools/unix-time/ | 미국판 여섯 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/unix-time/(type date·icon calendar, ja 판과 같음). 공유 스크립트 `src/scrip …(보관) |
| 2026-10-21 | 초·분·시간 변환(#91·#88) | 같음 | 발행 | /en-us/tools/sec-convert/ | 미국판 일곱 번째 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. #88 '시간 → 분/초'(조사표 75행, #91 을 따름)는 같은 페이지 `#parts` 절. `src/data/en-us/tools.ts` 에 ko 짝 /tools/sec-convert …(보관) |
| 2026-10-21 | FICA 근로자 원천징수(4대보험 근로자 공제 대응, 조사표 15행) | 제도 | 발행 | /en-us/fica-tax/ | 미국판 첫 제도 도구(basis "law", ko 짝 없음 — 한국 4대보험과 제도가 다름). 1순위는 53행(#24, 지난 회차와 같은 사유)만 남아 2순위로. 초안 `src/rates/us/payroll-fica-2026.json` 을 다시 확인해 검증됨으로 바 …(보관) |
| 2026-10-21 | 12·24시간제 변환(#154) | 단위 | 발행 | /en-us/tools/time-12-24/ | 미국판 여덟 번째 산술 도구. 53행(#24)은 지난 회차와 같은 사유로 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/time-12-24/(type date·icon calendar). 공유 스크립트 `src/scripts/tim …(보관) |
| 2026-10-21 | 최저임금(월급 → 시급 환산 비교, 조사표 17행) | 제도 | 보강 | (페이지 없음) | 1순위(같음·단위)는 53행(#24, 지난 회차와 같은 사유)만 남고 다 발행, 2순위(검증된 초안)는 FICA 뿐이라 3순위 — 표 위쪽 17행. 초안 `src/rates/us/minimum-wage-2026.json`(draft) 새로 만듦, 연방(FLSA) 숫 …(보관) |
| 2026-10-21 | bp ↔ %p(#155 → 퍼센트 계산기 #bp 절, 조사표 77행) | 같음 | 발행 | /en-us/tools/percent/#bp | 1순위 새 행(77행, 한국어판이 /tools/percent/#bp 에 합침) — 새 페이지·tools.ts 항목 없이 미국판 퍼센트 페이지에 `#bp` 절 추가(ko 짝은 기존 /tools/percent/ 그대로). 공유 스크립트 `src/scripts/perce …(보관) |
| 2026-10-21 | 최저임금(월급 → 시급 환산 비교, 조사표 17행) | 제도 | 보강 | (페이지 없음) | 지난 보강 회차의 남은 미확인 3개를 닫음 — `src/rates/us/minimum-wage-2026.json` notVerified 비움(draft 는 남김, 다음 회차가 2순위로 페이지를 만들며 지움). 1순위는 53행(#24, 지난 회차와 같은 사유)만 남아 …(보관) |
| 2026-10-21 | 최저임금(월급 → 시급 환산 비교, 조사표 17행) | 제도 | 발행 | /en-us/minimum-wage/ | 미국판 두 번째 제도 도구(basis "law", ko 짝 없음 — 한국 월 209시간·주휴수당과 제도가 다름). 1순위는 53·54행(#24·#3, 한국어판이 가이드 안 절 `/guide/take-home-calculator/#per-day` — 지난 회차와 같은 …(보관) |
| 2026-10-21 | 의료비 세액공제 → 의료비 항목별 공제(Schedule A, 조사표 24행) | 제도 | 보강 | (페이지 없음) | 1순위는 53·54행(#24·#3, 가이드 안 절 — 지난 회차와 같은 사유)만 남고, 2순위(검증된 초안)는 FICA·최저임금 둘 다 발행돼 3순위. 표 위쪽 19행(실업급여)은 연방 계산식이 없고 금액·자격이 주마다라(주의 원칙 — 주 숫자는 그 주 .gov 로 …(보관) |
| 2026-10-21 | 의료비 세액공제 → 의료비 항목별 공제(Schedule A, 조사표 24행) | 제도 | 발행 | /en-us/medical-expense-deduction/ | 미국판 세 번째 제도 도구(basis "law", ko 짝 없음 — 한국 의료비 세액공제(총급여 3% 초과 × 15%)와 제도가 다름). 1순위는 53·54행(#24·#3, 가이드 안 절 — 지난 회차와 같은 사유)만 남아 2순위로. 지난 보강 회차의 `src/ra …(보관) |
| 2026-10-22 | 근로장려금 → Earned Income Tax Credit(EITC, 조사표 25행) | 제도 | 보강 | (페이지 없음) | 1순위(같음·단위)는 53·54행(#24·#3, 가이드 안 절 — 지난 회차와 같은 사유)만 남고, 2순위(검증된 초안)는 FICA·최저임금·의료비 다 발행돼 3순위. 19행(실업급여)은 지난 회차 메모대로 건너뛰고 표 위쪽 25행. 지난 회차가 끊겨 audit 이 …(보관) |
| 2026-10-22 | 근로장려금 → Earned Income Tax Credit(EITC, 조사표 25행) | 제도 | 보강 | (페이지 없음) | 조사표 미국 칸 1순위(같음·단위)를 다시 뽑아 봄 — 54·55·56행(#24·#3·#12, 한국어판이 가이드 안 절 `/guide/take-home-calculator/#per-day` — 지난 회차와 같은 사유)만 남고 나머지는 다 발행, 2순위(검증된 초안) …(보관) |
| 2026-10-23 | 근로장려금 → Earned Income Tax Credit(EITC, 조사표 25행) | 제도 | 발행 | /en-us/earned-income-credit/ | 미국판 네 번째 제도 도구(basis "law", ko 짝 없음 — 한국 근로장려금(가구·재산 요건)과 제도가 다름). 1순위는 54·55·56행(#24·#3·#12, 가이드 안 절 — 지난 회차와 같은 사유)만 남아 2순위: 지난 두 회차가 검증한 `src/rat …(보관) |
| 2026-10-23 | 부채 상환 계획(눈사태·눈덩이·직접 지정, #27, 조사표 83행) | 같음 | 발행 | /en-us/tools/debt-payoff/ | 조사표 미국 칸 1순위 새 행(83행). 54·55·56행(#24·#3·#12, 가이드 안 절 — 지난 회차와 같은 사유)은 건너뜀. `src/data/en-us/tools.ts` 에 ko 짝 /tools/debt-payoff/(type money·icon char …(보관) |
| 2026-10-23 | 자녀장려금 → Child Tax Credit·Additional Child Tax Credit(CTC·ACTC·ODC, 조사표 26행) | 제도 | 보강 | (페이지 없음) | 1순위(같음·단위)는 54·55·56행(#24·#3·#12, 가이드 안 절 — 지난 회차와 같은 사유)만 남고, 2순위(검증된 초안)는 FICA·최저임금·의료비·EITC 다 발행돼 3순위. 19행(실업급여)은 지난 회차 메모대로 건너뛰고 표 위쪽 26행. 초안 `s …(보관) |
| 2026-10-23 | 자녀장려금 → Child Tax Credit·Additional Child Tax Credit(CTC·ACTC·ODC, 조사표 26행) | 제도 | 발행 | /en-us/child-tax-credit/ | 미국판 다섯 번째 제도 도구(basis "law", ko 짝 없음 — 한국 자녀장려금(가구 소득·재산 요건)과 제도가 다름). 1순위는 54·55·56행(#24·#3·#12, 가이드 안 절 — 지난 회차와 같은 사유)만 남아 2순위: 지난 회차 초안 `src/rat …(보관) |
| 2026-10-24 | 복권 당첨금 세금 → Gambling/lottery winnings 연방 원천징수·추가 연방세(W-2G, 조사표 43행) | 제도 | 보강 | (페이지 없음) | 1순위(같음·단위)는 54·55·56행(#24·#3·#12, 가이드 안 절 — 지난 회차와 같은 사유)만 남고, 2순위(검증된 초안)는 FICA·최저임금·의료비·EITC·CTC 다 발행돼 3순위. 19행(실업급여)은 지난 회차 메모대로 건너뛰고(연방 식 없음·주마다 …(보관) |
| 2026-10-24 | 복권 당첨금 세금 → Lottery/gambling winnings 연방 원천징수·추가 연방세(W-2G, 조사표 43행) | 제도 | 발행 | /en-us/lottery-tax/ | 2순위 — 지난 회차 초안 `src/rates/us/gambling-winnings-2026.json` 이 notVerified 빔이라 draft 지우고 페이지. lib `src/lib/us/gambling-winnings.ts`(regularWithholding: …(보관) |
