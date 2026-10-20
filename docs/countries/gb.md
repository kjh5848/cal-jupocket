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
| 2026-10-20 | 퍼센트 | 같음 | 보류(기초 필요) | — | `/en-gb/tools/percent/`·`/en-gb/` 홈·`src/data/en-gb/tools.ts` 를 만들어 빌드는 통과했지만 `seo.test.ts` 'title 이 서로 다르다' 에서 막힘 — `/en-us/` 와 `/en-gb/` 홈이 둘 다 `LocaleHome` 의 공유 영어 사전 `homeTitle`("jupocket — a pocket of everyday calculators")을 써서 `<title>` 이 같아짐. 판의 첫 도구는 홈이 꼭 있어야 해서(i18n 테스트) 페이지만 낼 수도 없음. **기초 필요: `src/i18n/ui.ts`·`LocaleHome` 에서 같은 언어를 쓰는 판끼리 홈 `<title>`(·description)이 갈리게 — 예: 판별 덧말(UK·US·Canada…) 또는 판별 homeTitle. zh-tw·zh-hk 도 같은 문제.** 기초가 고쳐지면 다음 회차가 퍼센트를 다시 낸다. 공유 스크립트 `src/scripts/percent.ts` 의 영어 사전 `EN` 은 미국 루틴이 이미 넣음(b1a555e) — 영국판은 고칠 것 없음. 자동완성 `keywords/gb-percent-2026-10-20.csv`(hl en, gl gb) — how to calculate percentage of a number / percentage increase·decrease formula·between two numbers / percentage off calculator / percentage difference / of marks. 이번 초안 커밋 90b7d0b(올리지 않음): percentage difference(차이 ÷ 평균) 모드는 없어 질문에서 change 와의 차이만 설명, VAT 20% 는 rates 초안이라 예시에 안 씀, description 160자 이하로 줄임 |
| 2026-10-20 | 퍼센트 | 같음 | 발행 | `/en-gb/tools/percent/` · `/en-gb/` 홈 | 바로 앞 행의 '기초 필요'가 c7276c4(같은 언어 판끼리 홈 title·description 이 갈리게)로 풀려 초안 90b7d0b 의 세 파일을 다시 얹어 냄. 같은 영어 판(en-us·en-au)과 겹치지 않게 title·description 에 UK 를 넣음. 한국어판 `/tools/percent/` 와 `ko` 짝, 공유 스크립트 `src/scripts/percent.ts` 의 `EN` 사전 그대로(고친 공유 파일 없음). 자동완성 `keywords/gb-percent-2026-10-20.csv`(hl en, gl gb). 빌드·vitest 통과 |
