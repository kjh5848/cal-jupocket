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
| 2026-10-21 | 날짜 계산(#76·#75) | 단위 | 발행 | /zh-hk/tools/date-diff/ | 조사표 홍콩 칸에서 같음·단위 중 가장 위(55행). `src/data/zh-hk/tools.ts` 에 ko 짝 /tools/date-diff/. 공유 스크립트 `src/scripts/date-diff.ts` 에 번체 사전이 없어 main 잠금을 잡았으나, rebase 해 보니 대만 루틴이 `ZH_HANT` 를 먼저 넣어(8c89eab) 그것을 그대로 쓰고 잠금을 바로 풂(공유 파일 고친 것 없음) — 정적 초기값(兩個日期相差·N天·N週N天·平日（週一到週五）·期間·'2026年10月21日週三')도 그 사전 출력에 맞춤. title "日數計算機（香港）— …"(대만판 '台灣日期計算機'과 갈림). 자동완성 `keywords/hk-date-diff-2026-10-21.csv`(hl zh-HK, gl hk) — 日數計算機·計日子·計日子器 / 日期計算器 天數計算·相隔日數 / 日期計算幾個月·幾年·年月日 / 工作天計算 香港·2026 / 計日子 excel. 대만 쪽 결과(司法院·國定假日·台灣)와 bno 計日子(체류일 규칙 미확인)는 뺌. 계산기는 공휴일을 빼지 않음(토·일만 뺀 平日). 공휴일 예시는 gov.hk「2026年公眾假期」(https://www.gov.hk/tc/about/abouthk/holiday/2026.htm, 2026-10-21 확인 — 목록 끝까지 읽음)에서 聖誕節 12月25日(五)·清明節翌日 4月6日(一)·復活節星期一翌日 4月7日(二)만 씀. 勞工假期·토요일 근무 관습은 labour.gov.hk 를 열지 않아 쓰지 않음 |
| 2026-10-21 | 적립식 복리(#41) | 같음 | 발행 | /zh-hk/tools/compound/ | 조사표 홍콩 칸 같음·단위 중 남은 가장 위(57행). `src/data/zh-hk/tools.ts` 에 ko 짝 /tools/compound/. 공유 스크립트 `src/scripts/compound.ts` 에 번체 사전이 없어 main 잠금을 잡고 rebase(인도네시아 ID 사전·입력칸 numberLocale 426fa6f 위) 뒤 `ZH_HANT` 사전 하나와 pickLang 키만 더함 — 통화는 판의 currency·numberLocale(zh-hk HKD → 'HK$', 대만판이 쓰면 TWD), 중립 서면어(광둥어·대만 표현 없음). 정적 초기값(120個月 · 月利率 0.3333% · 每月月初存入·未設目標·第N年·HK$0)도 그 사전 출력에 맞춤. 세율 기본값 0%(한국 15.4% 안 씀). title "複利計算機（香港）— 港元複息計算…". 자동완성 `keywords/hk-compound-2026-10-21.csv`(hl zh-HK, gl hk) — 複息計算·複息計算機·複息計算方法 / 每月供款 計算·月供 複利 計算·每月存款 複利計算 / 儲蓄計劃 計算(機) / excel 複息計算 / 每年投入·股息再投入. 대만·일본 쪽(0050·國泰·定期定額·聰明主婦·積立·怎麼按) 뺌. 세금 FAQ 는 稅務局「利得税」페이지(https://www.ird.gov.hk/chi/tax/bus_pft.htm, 원문 HTML 에서 직접 확인, 갱신일 표기 없음, 2026-10-21 확인)의 豁免 항목 '在香港存放於認可機構的存款所賺取的利息(在 1998 年 6 月 22 日或之後所累算的)' 한 줄만, 利得税 범위로만 씀. 強積金 숫자 안 씀. i18n·compound vitest 0 |
