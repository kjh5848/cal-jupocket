# 싱가포르 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `sg` (작업 폴더 `../cal-wt/sg`, rates `src/rates/sg/`, lib `src/lib/sg/`, 테스트 `src/lib/__tests__/sg-*.test.ts`) |
| 판 | `en-sg` — 주소 `/en-sg/`, 도구 목록 `src/data/en-sg/tools.ts` |
| 페이지 언어 | English (Singapore) — `<html lang="en-SG">` |
| 조사표 칸 | 싱가포르 |
| 자동완성 | `--hl en --gl sg` |
| 허용 출처 | iras.gov.sg · mom.gov.sg · cpf.gov.sg · sso.agc.gov.sg |
| 주의 | 거주자·비거주자 세율이 다르다 — 어느 쪽인지 밝힌다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주 회차와 같은 이유). 독립 싱가포르판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /en-sg/tools/percent/ | 싱가포르판 첫 도구 — `src/pages/en-sg/index.astro`(LocaleHome)·`src/data/en-sg/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 의 영어 사전 `EN` 그대로 — 공유 파일 고친 것 없음. 계산기 마크업은 호주판과 같은 data-* 계약, 본문은 새로 씀. title "Percentage Calculator Singapore — …"(다른 영어 판과 갈림). 자동완성 `keywords/sg-percent-2026-10-20.csv`(hl en, gl sg) — percentage of a number formula·trick·without calculator / percentage increase and decrease formula·with example / percentage increase from one number to another / percentage discount formula·meaning·example / percentage calculator of marks·grade / percentage increase formula excel / percentage calculator difference. 자동완성에 gst·cpf·tax percentage singapore 가 있으나 rates 미검증이라 숫자 안 씀(다음 제도 회차 후보). 통화 기호(S$/$) 관습은 원문 미확인이라 예시는 숫자만. 빌드 HTML(lang en-SG·hreflang ko/ja/en-US/en-AU/en-SG) 확인, 빌드·vitest 0 |
