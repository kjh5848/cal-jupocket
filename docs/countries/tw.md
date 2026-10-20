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
| 2026-10-21 | 날짜 계산(D-day·며칠 뒤) | 단위 | 발행 | /zh-tw/tools/date-diff/ | 2026-10-20 회차가 페이지·CSV 까지 하고 멈춘 것(`wip/tw-202610201556`)을 새 main 에 cherry-pick 해 마무리. 모자랐던 것: 공유 스크립트 `src/scripts/date-diff.ts` 에 번체 사전 `ZH_HANT`(pickLang `"zh-Hant"`, 홍콩판 공용 — 民國·國定假日 같은 대만 전용 말 없음, 날짜는 `<html lang>` Intl 표기 '2026年10月20日週二') — main 잠금 안에서 별도 커밋, `src/data/zh-tw/tools.ts` 에 `ko: /tools/date-diff/` 짝(type date), FAQ 의 없는 '時間計算工具' 안내 문장 삭제. 국정 공휴일·補班日은 허용 출처로 확인하지 않아 빼지 않음(週一到週五만), 民國年 = 西元 − 1911 표기 산술만 본문에. 자동완성 `keywords/tw-date-diff-2026-10-20.csv`(hl zh-TW, gl tw) — 天數計算·日期相減天數 / 幾天後是幾月幾號 / 日期相減 月數·年月日 / 工作天數計算 / 日期相減 excel. title 에 台灣 넣어 zh-hk 와 갈림. i18n 테스트 0 |
| 2026-10-21 | 적립식 복리(#41) | 같음 | 발행 | /zh-tw/tools/compound/ | 대만판 세 번째 도구. 공유 스크립트 `src/scripts/compound.ts` 의 번체 사전 `ZH_HANT` 는 홍콩판이 먼저 넣어 그대로 씀(공유 파일 안 고침 — 금액은 판 currency·numberLocale 로 `$1,234,567`, 첫 화면 문구 '每月月初存入'·'未設目標' 를 사전과 맞춤). `src/data/zh-tw/tools.ts` 에 `ko: /tools/compound/` 짝(type money). 세율 기본값 0% — 한국 15.4% 안 씀, 대만 利息·股利 과세 숫자는 허용 출처로 확인 안 해 적지 않고 etax.nat.gov.tw 안내만. 상품 이름(0050 등) 안 씀, 每年投入은 ÷ 12 근사라고만. 자동완성 `keywords/tw-compound-2026-10-21.csv`(hl zh-TW, gl tw) — 定期定額 複利計算·公式·試算 / 定期定額+單筆投入 複利計算機 / 單利 複利公式 / 複利公式excel / 複利計算機 每年投入 / 複利計算機怎麼按 / 股息再投入. title 에 台灣 넣어 zh-hk 와 갈림 |
| 2026-10-21 | 디데이(#78) | 단위 | 발행 | /zh-tw/tools/dday/ | 대만판 네 번째 도구. 공유 스크립트 `src/scripts/dday.ts` 에 번체 사전 `ZH_HANT`(pickLang `"zh-Hant"`, 홍콩판 공용 — '還有12天'·'就是今天'·'已過3天', 날짜는 `<html lang>` Intl '2026年12月25日週五', 하루 = 24시간 안내만, 서머타임 문구 없음) — main 잠금 안에서 별도 커밋. `src/data/zh-tw/tools.ts` 에 `ko: /tools/dday/` 짝(type date). 버튼은 100天後·聖誕節·跨年夜(12/31)·元旦 — 過年·中秋(농력)·開學·會考·學測 날짜는 허용 출처로 확인 안 해 적지 않고 직접 넣으라고만. 자동완성 `keywords/tw-dday-2026-10-21.csv`(hl zh-TW, gl tw) — 倒數日計算·倒數日期計算·還有幾天計算 / 倒數計時日期 / 還有幾天聖誕節·跨年·距離1/1還有幾天 / excel 計算 倒數 天數 / 倒數日 英文. 本文 숫자는 frontmatter countdown() 계산. title 에 台灣 넣어 zh-hk 와 갈림. i18n 테스트 0 |
| 2026-10-21 | 유닉스 타임스탬프 변환 | 같음 | 발행 | /zh-tw/tools/unix-time/ | 2026-10-21 회차가 페이지·CSV·tools.ts 짝까지 커밋하고 멈춘 것(`wip/tw-202610202056`)을 새 main 에 cherry-pick 해 마무리. 공유 스크립트 `src/scripts/unix-time.ts` 의 번체 사전 `ZH_HANT` 는 홍콩판이 먼저 넣어 그대로 씀(공유 파일 안 고침 — main 잠금 잡았다가 rebase 뒤 이미 있어 풀고 손대지 않음; UTC·裝置時區만, 상대 시각 '3天4小時5分鐘前/後'·'現在', 날짜는 `<html lang>` Intl). 대만 표준시 오프셋 숫자는 허용 출처로 확인 안 해 안 씀. 자동완성 `keywords/tw-unix-time-2026-10-21.csv`(hl zh-TW, gl tw) — 時間戳轉換·時間戳轉時間·timestamp 轉換器 / unix timestamp 是什麼·時間戳記 意思 / timestamp 轉換 毫秒 / utc timestamp 轉換 / excel·python·java·sql·linux / discord. title 에 台灣 넣어 zh-hk 와 갈림 |
| 2026-10-21 | 초·분·시간 변환(#91, #88 합침) | 같음 | 발행 | /zh-tw/tools/sec-convert/ | 대만판 여섯 번째 도구. 공유 스크립트 `src/scripts/sec-convert.ts` 에 번체 사전 `ZH_HANT`(pickLang `"zh-Hant"`, 홍콩판도 쓸 수 있게 대만 전용 말 없음 — 단위 毫秒·秒·分鐘·小時·天, '1天3小時46分鐘40秒', 時:分:秒) — main 잠금 안에서 별도 커밋. 번체 표기 함수는 인도네시아판처럼 `src/lib/tw/sec-convert.ts`(+ `tw-sec-convert.test.ts` 손계산 고정). `src/data/zh-tw/tools.ts` 에 `ko: /tools/sec-convert/` 짝(type date). 단위 값은 SI 브로슈어 표 8(https://www.bipm.org/en/publications/si-brochure, 조사표 2026-10-20 확인)뿐. 時辰·時差 오프셋·勞基法 工時 숫자는 허용 출처로 확인 안 해 안 씀(時差·UTC 는 時間戳記轉換 링크만, 工時 소수점 시간은 '勞動部公告與勞動契約為準'). 자동완성 `keywords/tw-sec-convert-2026-10-21.csv`(hl zh-TW, gl tw) — 秒換算分鐘·秒 換算 成 分鐘 / 分鐘換算小時公式·小時換算分鐘公式 / 時間換算表 / 時間換算小數點 / 秒轉時分秒 / 毫秒換算秒 / excel 秒轉時分秒·分鐘換算小時excel / 時間換算 utc·時差 / 時間換算器. title 에 台灣 넣어 zh-hk 와 갈림 |
