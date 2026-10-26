# 영국 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `gb` (작업 폴더 `../cal-wt/gb`, rates `src/rates/gb/`, lib `src/lib/gb/`, 테스트 `src/lib/__tests__/gb-*.test.ts`) |
| 판 | `en-gb` — 주소 `/en-gb/`, 도구 목록 `src/data/en-gb/tools.ts` |
| 페이지 언어 | English (UK) — `<html lang="en-GB">` |
| 조사표 칸 | 영국 |
| 자동완성 | `--hl en --gl gb` |
| 허용 출처 | gov.uk(HMRC 포함) · legislation.gov.uk |
| 주의 | 잉글랜드·스코틀랜드·웨일스·북아일랜드가 다른 세금(소득세 구간·SDLT/LBTT/LTT)은 어느 지역 숫자인지 페이지에 밝힌다. 과세연도는 4/6~4/5 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(일본 회차와 같은 이유). 독립 영국판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트 | 같음 | 보류(기초 필요) | — | `/en-gb/tools/percent/`·`/en-gb/` 홈·`src/data/en-gb/tools.ts` 를 만들어 빌드는 통과했지만 `seo.test.ts` 'title 이 서로 다르다' 에서 막힘 — `/en-us/` 와 `/en-gb/` 홈이 둘 다 `L …(보관) |
| 2026-10-20 | 퍼센트 | 같음 | 발행 | `/en-gb/tools/percent/` · `/en-gb/` 홈 | 바로 앞 행의 '기초 필요'가 c7276c4(같은 언어 판끼리 홈 title·description 이 갈리게)로 풀려 초안 90b7d0b 의 세 파일을 다시 얹어 냄. 같은 영어 판(en-us·en-au)과 겹치지 않게 title·description 에 UK 를 …(보관) |
| 2026-10-20 | 날짜 계산(#76·#75) | 단위 | 발행 | `/en-gb/tools/date-diff/` | 한국어판 `/tools/date-diff/` 와 `ko` 짝, 공유 스크립트 `src/scripts/date-diff.ts` 의 `EN` 사전 그대로 — 날짜 표기는 `<html lang="en-GB">` 로 'Tue, 20 October 2026'(고친 공유 파일 …(보관) |
| 2026-10-20 | 적립식 복리(#41) | 같음 | 발행 | `/en-gb/tools/compound/` | 한국어판 `/tools/compound/` 와 `ko` 짝, 공유 스크립트 `src/scripts/compound.ts` 의 `EN` 사전 그대로 — 통화는 판의 GBP(고친 공유 파일 없음). 세율 기본 0%(한국 15.4% 안 씀). 영국 숫자는 GOV.UK 에 …(보관) |
| 2026-10-20 | 디데이(#78) | 단위 | 발행 | `/en-gb/tools/dday/` | 한국어판 `/tools/dday/` 와 `ko` 짝, 공유 스크립트 `src/scripts/dday.ts` 의 `EN` 사전 그대로 — 날짜는 `<html lang="en-GB">` 로 'Tue, 20 October 2026'(고친 공유 파일 없음). 프리셋은 공유 …(보관) |
| 2026-10-21 | 평수(#62) | 단위(검증됨) | 보류(공유 스크립트) | — | 조사표 순서상 다음 같음·단위 행. 하지만 공유 스크립트 `src/scripts/pyeong.ts` 가 영국판으로 낼 수 없는 상태: ① 둘째 칸 #57 전용률·평당 분양가(`r-supply`·`r-excl`·`r-price`)를 null 확인 없이 맨 위에서 붙잡 …(보관) |
| 2026-10-21 | 유닉스 타임스탬프 변환(#90) | 같음 | 발행 | `/en-gb/tools/unix-time/` | 한국어판 `/tools/unix-time/` 와 `ko` 짝, 공유 스크립트 `src/scripts/unix-time.ts` 의 `EN` 사전 그대로 — 날짜는 `<html lang="en-GB">` 로 'Wed, 21 Oct 2026'(고친 공유 파일 없음; 공유 …(보관) |

조사표 정정 제안: 시간 계산(#82)·시간 간격(#89) 행의 영국 칸이 '서머타임 원문 미확인' 으로 미확인이지만, GOV.UK https://www.gov.uk/when-do-the-clocks-change (확인 2026-10-20)가 규칙(3월 마지막 일요일 오전 1시 1시간 앞으로·10월 마지막 일요일 오전 2시 1시간 뒤로, BST/GMT)과 2025~2028 날짜를 밝힘 — 영국 칸을 '단위'로 볼 근거.

| 2026-10-21 | 초·분·시간 변환(#91·#88) | 같음 | 발행 | `/en-gb/tools/sec-convert/` | 한국어판 `/tools/sec-convert/` 와 `ko` 짝, 공유 스크립트 `src/scripts/sec-convert.ts` 의 `EN` 사전 그대로(고친 공유 파일 없음). #88 시·분·초 → 총 초는 같은 페이지 `#parts`. 단위 값은 조사표 영국 …(보관) |
| 2026-10-21 | 부가세(VAT, 조사표 /vat/ 행) | 제도 | 발행 | `/en-gb/vat/` | 같음·단위 행이 모두 발행·보류라 2순위(제도·초안 검증)로. 초안 `src/rates/gb/vat-2026.json` 을 원문으로 다시 확인하고 `draft` 지움: https://www.gov.uk/vat-rates (확인 2026-10-21) — standar …(보관) |
| 2026-10-21 | 연차(법정 유급휴가, 조사표 /guide/annual-leave-calculator/ 행) | 제도 | 보강 | — | 같음·단위 행은 모두 발행·보류, 2순위(검증된 초안)는 VAT 뿐이라 3순위로 — 조사표 표 위쪽 첫 '제도·초안 없음' 행. 초안 `src/rates/gb/holiday-entitlement-2026.json`(draft) 새로 만듦: GOV.UK https:/ …(보관) |
| 2026-10-21 | 연차(법정 유급휴가, 조사표 /guide/annual-leave-calculator/ 행) | 제도 | 발행 | `/en-gb/holiday-entitlement/` | 바로 앞 행(보강)의 메모대로 범위를 일수·시간으로 좁혀 2순위로 냄. 초안 `src/rates/gb/holiday-entitlement-2026.json` 의 `draft` 지우고 `notVerified` 를 `notCalculated`(페이지에서 계산 안 함)로 …(보관) |
| 2026-10-21 | 물건 가격 → 일할 시간(구매력, #3) | 단위 | 보류(짝 없음) | — | 같음·단위 행 중 남은 마지막. 한국어판이 #24 와 같은 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨 — #24 행과 같은 이유. 다음 회차는 이 행을 건너뛴다. 확인 2026-10-21 |
| 2026-10-21 | 육아휴직 급여(Statutory Shared Parental Pay, 조사표 /guide/parental-leave-pay-calculator/ 행) | 제도 | 보강 | — | 같음·단위 행은 모두 발행·보류, 검증된 초안(2순위)은 남지 않아 3순위 — 조사표 표 위쪽 첫 '제도·초안 없음' 행. 초안 `src/rates/gb/shared-parental-pay-2026.json`(draft) 새로 만듦, 확인 2026-10-21: GO …(보관) |

조사표 정정 제안: 연차(/guide/annual-leave-calculator/) 행 영국 칸의 '첫해 월 단위 발생 없음'은 원문과 다름 — WTR 1998 reg 15A(2A)(NI reg 19(2))와 GOV.UK 가 첫해에 매달 첫날 1년치의 1/12 씩 발생(반나절 단위 올림)을 밝힘(확인 2026-10-21). '근속 가산 없음'은 맞음.

| 2026-10-21 | 육아휴직 급여(Statutory Shared Parental Pay, 조사표 /guide/parental-leave-pay-calculator/ 행) | 제도 | 발행 | `/en-gb/shared-parental-pay/` | 앞 행(보강)의 메모대로 범위를 '주 지급액·하루치·남은 주 수(+ NWE 도우미)' 로 좁혀 2순위로 냄. `src/rates/gb/shared-parental-pay-2026.json` 의 `draft` 지우고 `notVerified` 를 `notCalculat …(보관) |
| 2026-10-21 | 취득세 → Stamp Duty Land Tax(주거용, 조사표 /acquisition-tax/ 행) | 제도 | 보강 | — | 같음·단위 행은 모두 발행·보류, 검증된 초안(2순위)은 남지 않아 3순위 — 조사표 표 위쪽 첫 '제도·초안 없음' 행. 초안 `src/rates/gb/stamp-duty-land-tax-2026.json`(draft) 새로 만듦, 확인 2026-10-21: GO …(보관) |
| 2026-10-21 | 취득세 → Stamp Duty Land Tax(주거용, 조사표 /acquisition-tax/ 행) | 제도 | 발행 | `/en-gb/stamp-duty/` | 앞 행(보강)의 메모대로 2순위로 냄. `src/rates/gb/stamp-duty-land-tax-2026.json` 의 `draft`·`nextRound` 지움(notVerified 없음, notCalculated 그대로). 이번 회차에 원문 다시 읽음(확인 2 …(보관) |
| 2026-10-22 | 이혼 재산분할 → SDLT 이혼·dissolution 면제(조사표 /guide/divorce-acquisition-tax/ 행) | 제도 | 발행 | `/en-gb/stamp-duty/#divorce` | 새 계산이 없는 면제라 별도 도구 대신 영국판 SDLT 페이지에 절 하나(`#divorce`)로 냄. 앞 회차(10:09 배차)가 끊겨 audit 가 `wip/gb-202610220510` 에 보관한 초안(페이지 절·CSV·진행 중 행)을 새 main(9cb4d4d …(보관) |
| 2026-10-22 | 근무 중 쌓인 실수령액(실시간 누적, #12) | 단위 | 보류(짝 없음) | — | 1순위 — 조사표 56행(영국 칸 '단위', 남은 마지막 같음·단위 행). 한국어판이 #24·#3 과 같은 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`, `src/lib/pay-per-day.ts` `earnedFor() …(보관) |
| 2026-10-23 | 주택 재산세 → Council Tax(조사표 /property-tax/ 행) | 제도 | 보강 | — | 3순위 — 같음·단위 행은 모두 발행·보류, 검증된 초안(2순위)도 없어 조사표 위쪽 첫 '제도·초안 없음' 행(pyeong.ts 는 10-21 이후 커밋 없어 #62 보류 그대로). 초안 `src/rates/gb/council-tax-2026.json`(draft …(보관) |
| 2026-10-23 | 주택 재산세 → Council Tax(조사표 /property-tax/ 행) | 제도 | 발행 | `/en-gb/council-tax/` | 앞 행(보강)의 메모대로 범위를 잉글랜드로 좁혀 2순위로 냄. `src/rates/gb/council-tax-2026.json` 의 `draft` 지우고 `notVerified`(웨일스 할인·분할·재평가, 스코틀랜드, 북아일랜드)를 `outOfScope` 로 옮김 …(보관) |
| 2026-10-23 | 부채 상환 계획(눈사태·눈덩이·직접 지정, #27) | 같음 | 발행 | `/en-gb/tools/debt-payoff/` | 1순위 — 조사표 83행(영국 칸 '같음', 기록에 없던 같음·단위 행). 한국어판 `/tools/debt-payoff/` 와 `ko` 짝, 공유 스크립트 `src/scripts/debt-payoff.ts` 의 `EN` 사전 그대로 — 통화는 판의 GBP·en-GB …(보관) |
| 2026-10-23 | 자동차세 → Vehicle Excise Duty(승용차, 조사표 /vehicle-tax/ 행) | 제도 | 보강 | — | 3순위 — 같음·단위 행은 모두 발행·보류, 검증된 초안(2순위)도 없어 조사표 위쪽 첫 '제도·초안 없음' 행. 초안 `src/rates/gb/vehicle-excise-duty-2026.json`(draft) 새로 만듦, 확인 2026-10-23: GOV.UK …(보관) |
| 2026-10-24 | 자동차세 → Vehicle Excise Duty(승용차, 조사표 /vehicle-tax/ 행) + 전기차 세금(/guide/electric-car-tax-calculator/ 행, 절 `#electric`) | 제도 | 발행 | `/en-gb/vehicle-tax/` | 앞 행(보강)의 메모대로 2순위로 냄. GOV.UK https://www.gov.uk/vehicle-tax-rate-tables 를 content API 로 다시 읽음(updated_at 2026-09-09 그대로, 확인 2026-10-24) — 연액 전부 초안과 …(보관) |
| 2026-10-24 | 코인 세금 → Capital Gains Tax(cryptoassets, 조사표 /guide/crypto-tax-calculator/ 행) | 제도 | 보강 | — | 3순위 — 같음·단위 행은 모두 발행·보류, 검증된 초안(2순위)도 없어 조사표 위쪽 첫 '제도·초안 없음' 행. 초안 `src/rates/gb/crypto-capital-gains-tax-2026.json`(draft) 새로 만듦, 확인 2026-10-24: GO …(보관) |
| 2026-10-26 | 전기차 세금(조사표 /guide/electric-car-tax-calculator/ 행) | 제도 | 판정 | `/en-gb/vehicle-tax/#electric` | 10-24 발행한 절로 이미 처리됨(코드·페이지 확인). 새 숫자 없음, 중복 발행 안 함. 근거 https://www.gov.uk/vehicle-tax-rate-tables (확인 2026-10-24) |
