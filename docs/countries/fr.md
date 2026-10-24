# 프랑스 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `fr` (작업 폴더 `../cal-wt/fr`, rates `src/rates/fr/`, lib `src/lib/fr/`, 테스트 `src/lib/__tests__/fr-*.test.ts`) |
| 판 | `fr` — 주소 `/fr/`, 도구 목록 `src/data/fr/tools.ts` |
| 페이지 언어 | Français — `<html lang="fr-FR">` |
| 조사표 칸 | 프랑스 |
| 자동완성 | `--hl fr --gl fr` |
| 허용 출처 | impots.gouv.fr · service-public.gouv.fr(service-public.fr) · legifrance.gouv.fr · urssaf.fr · economie.gouv.fr |
| 주의 | 소득세는 가구 단위(quotient familial) — 계산이 개인 단위인 한국 도구와 짝이 되기 어렵다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 프랑스판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /fr/tools/percent/ | 프랑스판 첫 도구 — `src/pages/fr/index.astro`(LocaleHome)·`src/data/fr/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 에 FR 사전 추가(` …(보관) |
| 2026-10-21 | 날짜 계산(#76) · 날짜 차이(#75, 같은 주소) | 단위 | 발행 | /fr/tools/date-diff/ | 프랑스판 두 번째 도구, `ko` 짝 /tools/date-diff/(`src/data/fr/tools.ts`). 표기는 `src/lib/fr/date-format.ts`(Intl fr-FR·timeZone UTC 'mar. 20 octobre 2026', 0·1 …(보관) |
| 2026-10-21 | 적립식 복리(#41) | 같음 | 발행 | /fr/tools/compound/ | 프랑스판 세 번째 도구, `ko` 짝 /tools/compound/(`src/data/fr/tools.ts`, type money·icon chart). 공유 `src/scripts/compound.ts` 에 FR 사전(main 잠금 안에서 rebase — 홍콩 Z …(보관) |
| 2026-10-21 | 디데이(#78) | 단위 | 발행 | /fr/tools/dday/ | 프랑스판 네 번째 도구, `ko` 짝 /tools/dday/(`src/data/fr/tools.ts`, type date·icon calendar — en-us 와 같음). 공유 `src/scripts/dday.ts` 에 FR 사전(main 잠금 안에서 origin …(보관) |
| 2026-10-21 | 유닉스 타임스탬프 변환(#90) | 같음 | 발행 | /fr/tools/unix-time/ | 프랑스판 다섯 번째 도구, `ko` 짝 /tools/unix-time/(`src/data/fr/tools.ts`, type date·icon calendar — en-ca 와 같음). 공유 `src/scripts/unix-time.ts` 에 FR 사전(main 잠금 …(보관) |
| 2026-10-21 | 초·분·시간 변환(#91) · 시간 → 분/초(#88, 같은 주소 #parts) | 같음 | 발행 | /fr/tools/sec-convert/ | 프랑스판 여섯 번째 도구, `ko` 짝 /tools/sec-convert/(`src/data/fr/tools.ts`, type date·icon calendar — en-gb 와 같음). 공유 `src/scripts/sec-convert.ts` 에 FR 사전(mai …(보관) |
| 2026-10-21 | 주택분 종합부동산세(IFI, impôt sur la fortune immobilière) | 제도 | 보강 | — | 같음·단위 칸이 모두 발행·보류라 3순위(제도, 초안 없음). 초안 `src/rates/fr/ifi-2026.json`(draft, IFI 2026 = 1.1.2026 기준) — 과세 대상 순 과세 부동산 자산 > 1 300 000 €, 과세되면 800 000 € …(보관) |
| 2026-10-21 | 물건 가격 → 벌려면 일할 시간(구매력, #3) | 단위 | 보류(짝 없음) | — | 조사표 순위 1(단위)의 남은 행. 한국어판이 #24 와 같은 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`, 2026-10-21 커밋 1149c31 로 하루·시간 카드에 합쳐짐)이라 `ko` 짝을 걸 `/tools/` 주 …(보관) |
| 2026-10-21 | 주택분 종합부동산세(IFI) — 2회차 | 제도 | 보강 | — | 같음·단위 칸은 모두 발행·보류(조사표 76~78행도 확인 — 프랑스 칸 같음·단위 없음)라 3순위 IFI 초안 `src/rates/fr/ifi-2026.json` 보강(draft 유지). **닫힘**: 계산 순서 barème(décote 포함) → dons(978 …(보관) |
| 2026-10-21 | 주택분 종합부동산세(IFI) — 3회차 | 제도 | 보류(원문 접근 불가) | — | 지난 회차 지시대로 BOFiP 는 다시 뒤지지 않고 Legifrance 원문(CGI 977·978·979)부터 시도. curl(브라우저 UA·Accept-Language fr) 로 https://www.legifrance.gouv.fr/codes/article_lc …(보관) |
| 2026-10-21 | 사업소득 3.3% 원천징수(조사표 9행, /freelancer-33/) | 미확인 → 제도 | 판정 | — | 4순위 — 같음·단위 행은 전부 발행·보류(#24·#3 은 지난 기록대로 건너뜀), 제도 행 IFI 는 3회차 보류(원문 접근 불가)라 건너뜀, 미확인 중 가장 위(9행). 판정 **제도(지급자 원천징수 없음)**: 프랑스에서 거주자 travailleur indép …(보관) |
| 2026-10-22 | 기타소득 8.8% 원천징수(조사표 10행, /withholding/) | 미확인 → 제도 | 판정 | — | 4순위 — 같음·단위 행은 전부 발행·보류(#24·#3 건너뜀), 제도 행 IFI(38행)는 보류(CGI 977~979 Legifrance 403), 39행 주택 보유세(제도, 초안 없음)도 IFI 부분이 같은 원문 접근 불가로 막히고 taxe foncière 는 …(보관) |
| 2026-10-22 | 근무 중 쌓인 실수령액(실시간 누적, #12) | 단위 | 보류(짝 없음) | — | 1순위 — 조사표 56행(프랑스 칸 '단위', 기록에 없던 마지막 같음·단위 행). 한국어판이 #24·#3 과 같은 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`, `src/lib/pay-per-day.ts` `earned …(보관) |
| 2026-10-23 | 부가세(일반과세 10%·간이과세, 조사표 11행, /vat/) | 미확인 → 제도 | 판정 | — | 4순위 — 같음·단위 행은 전부 발행·보류(#24·#3·#12 건너뜀), 제도 행 IFI(38행)·39행은 지난 기록대로 건너뜀, 미확인 9·10행은 판정됨 → 11행. 판정 **제도(환산식은 같고 세율·소규모 사업자 제도가 다름)**: HT↔TTC 식은 한국 공급 …(보관) |
| 2026-10-23 | 부가세 HT ↔ TTC(TVA, 조사표 11행 /vat/) — 초안 | 제도(이 기록 2026-10-23 판정, 조사표 칸은 미확인 그대로) | 보강 | — | 3순위 — 같음·단위 행 전부 발행·보류, IFI·39행 건너뜀, 지난 판정 행이 적은 대로 'tva-2026.json 초안부터'. 초안 `src/rates/fr/tva-2026.json`(draft) — 식 Prix HT = TTC ÷ (1 + taux)·센트 반 …(보관) |
| 2026-10-23 | 부가세 HT ↔ TTC(TVA, 조사표 11행 /vat/) — 페이지 | 제도(이 기록 2026-10-23 판정) | 발행 | /fr/tva/ | 2순위 — 지난 보강 행이 남긴 대로 범위 안 미확인(TTC 반올림 하나)을 '도구 관례'로 페이지에 밝혀 닫고 `src/rates/fr/tva-2026.json` draft 를 풂(notVerified 빔). CGI(Legifrance 403, 오늘 다시 403) …(보관) |
| 2026-10-24 | 부채 상환 계획(눈사태·눈덩이, 조사표 83행 /tools/debt-payoff/) | 같음 | 발행 | /fr/tools/debt-payoff/ | 1순위 — 조사표 83행 프랑스 칸 '같음'이 기록에 없던 마지막 같음·단위 행(다른 11개 판은 이미 있음). 프랑스판 여덟 번째 도구, `ko` 짝 /tools/debt-payoff/(`src/data/fr/tools.ts`, type money·icon cha …(보관) |
| 2026-10-24 | 기한 후 신고 가산세(무신고·납부지연, 조사표 12행, /penalty/) | 미확인 → 제도 | 판정 | — | 4순위 — 같음·단위 행은 전부 발행·보류(#24·#3·#12 건너뜀, 83행 부채 상환은 발행), 제도 행 IFI(38행)·39행은 지난 기록대로 건너뜀, 미확인 9·10·11행은 판정됨 → 12행. 판정 **제도(구조는 '세액 × 가산 비율 + 기간 이자'로 닮 …(보관) |
| 2026-10-24 | 주택 보유세(조사표 39행, /guide/holding-tax-calculator/) — 초안 | 제도 | 보강 | — | taxe foncière=IFI 과세표준에서 빼는 부채(공제 방식 다름, 세액 공제 아님·BOI-PAT-IFI-20-40-10 §40·§210, 2024-06-05 판) → ifi-2026.json taxeFonciere 추가, 세율 지방결정(F59), draft 유지 |
