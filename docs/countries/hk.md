# 홍콩 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `hk` (작업 폴더 `../cal-wt/hk`, rates `src/rates/hk/`, lib `src/lib/hk/`, 테스트 `src/lib/__tests__/hk-*.test.ts`) |
| 판 | `zh-hk` — 주소 `/zh-hk/`, 도구 목록 `src/data/zh-hk/tools.ts` |
| 페이지 언어 | 繁體中文（香港） — `<html lang="zh-Hant-HK">` |
| 조사표 칸 | 홍콩 |
| 자동완성 | `--hl zh-HK --gl hk` |
| 허용 출처 | ird.gov.hk(稅務局) · elegislation.gov.hk · mpfa.org.hk · labour.gov.hk · gov.hk |
| 주의 | 과세연도는 4/1~3/31. 페이지 말은 繁體中文(홍콩 표기), 영어판은 아직 없다 |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 홍콩판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | /zh-hk/tools/percent/ | 홍콩판 첫 도구 — `src/pages/zh-hk/index.astro`(LocaleHome)·`src/data/zh-hk/tools.ts`(ko 짝 /tools/percent/) 같이 만듦. 공유 스크립트 `src/scripts/percent.ts` 의 번체 사전 `ZH_HANT` 는 대만 루틴이 먼저 넣음(21acd6d) — 이번 회차에 만든 같은 사전은 버리고 그것을 씀(공유 파일 고친 것 없음), 정적 초기값도 그 문구에 맞춤. title "百分比計算機（香港）— …"(대만판과 갈림). 자동완성 `keywords/hk-percent-2026-10-20.csv`(hl zh-HK, gl hk) — 百分比計算公式·計算方法 / 升幅 百分比計算·增長率 計算公式 / 折扣 計算 公式·原價 / 利潤·盈利 百分比 公式 / 誤差·差異 百分比 公式 / 百分比 公式 excel·google 試算表 / 百分比 點 計. 결과에 대만식 축(捷運·bookwalker·怎麼按)도 섞여 있어 뺌. 八折 = 原價 × 0.8 은 말뜻 산술로 본문에만. 통화 기호(HK$) 관습은 원문 미확인이라 예시는 숫자만, 세율·強積金 숫자 안 씀. 빌드 HTML(lang zh-Hant-HK·hreflang ko/ja/en-*/zh-HK) 확인, 빌드·vitest 0. 첫 회차는 올리지 못해 `wip/hk-percent` 로 보관됐고, 다음 회차가 새 main(b0673c8) 위로 cherry-pick 해 ship 으로 올림(충돌 없음, i18n 테스트 29/29) |
