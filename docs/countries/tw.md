# 대만 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `tw` (작업 폴더 `../cal-wt/tw`, rates `src/rates/tw/`, lib `src/lib/tw/`, 테스트 `src/lib/__tests__/tw-*.test.ts`) |
| 판 | `zh-tw` — 주소 `/zh-tw/`, 도구 목록 `src/data/zh-tw/tools.ts` |
| 페이지 언어 | 繁體中文（台灣） — `<html lang="zh-Hant-TW">` |
| 조사표 칸 | 대만 |
| 자동완성 | `--hl zh-TW --gl tw` |
| 허용 출처 | mof.gov.tw(財政部) · etax.nat.gov.tw · law.moj.gov.tw · bli.gov.tw(勞保局) · mol.gov.tw(勞動部) · nhi.gov.tw |
| 주의 | 연도는 民國 표기가 원문에 많다 — 서기와 함께 쓴다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 대만판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /zh-tw/tools/percent/ | 대만판 첫 도구 — 작업 폴더 `cal-wt/tw` 새로 만듦. `src/pages/zh-tw/index.astro`(LocaleHome)·`src/data/zh-tw/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 에 번체 사전 `ZH_HANT` 추가(`pickLang` 의 `"zh-Hant"` — 홍콩판도 같이 씀, KO·JA·EN 그대로) — 별도 커밋. 사전에는 打折 같은 대만 표현·통화 기호를 넣지 않고 페이지 본문에서만 설명. 자동완성 `keywords/tw-percent-2026-10-20.csv`(hl zh-TW, gl tw) — 百分比計算公式·方法 / 成長率計算公式·方式·負數 / 打折計算公式·方式·打折數計算 / 打折計算機怎麼按 / 百分比公式 excel·試算表 / 升幅. 성장률 음수는 lib 가 ÷ |A| 라 그 식으로 설명. 계산기 % 키 동작은 기종마다 달라 "소수 곱하기" 를 기본으로 안내. 營業稅 등 대만 세율 숫자는 rates 미검증이라 쓰지 않음, 통화 기호 없이 숫자만. title 에 台灣 넣어 zh-hk 와 갈림. 미리보기 서버는 무인 회차라 띄우지 않음 — 빌드 HTML(lang zh-Hant-TW·hreflang ko/ja/en-*/zh-TW)만 확인, 빌드·vitest 0. 라이브 200 확인(2026-10-20 21:56, /zh-tw/ 홈도 200) |
