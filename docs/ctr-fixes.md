# 클릭률 개선 기록

"노출은 많은데 클릭이 거의 없는" 페이지의 제목·설명·h1·첫 문단을 검색 의도에 맞게 고친 기록.
목록은 `npm run seo:gaps`(social/ctr-gaps.mjs — 순위 ≤ 20, 노출 ≥ 20, 클릭률 < 기대치×0.5, 메인 폴더에서 실행).
고친 뒤 2~3주 지나 같은 페이지의 고치기 전 28일과 고친 뒤 28일 클릭·클릭률을 비교해 "결과" 칸에 적는다.
순위가 그대로인데 클릭률이 올랐으면 성공, 순위가 떨어졌으면 제목이 검색어에서 멀어진 것이라 되돌린다.

## 2026-11-01 회차 — 다음 점검 2026-11-22

기준 기간: GSC 2026-10-02 ~ 2026-10-29(28일). 페이지 수치는 페이지 단위(노출·클릭·평균 순위), 검색어는 페이지 안 노출 많은 것.
예시 숫자는 계산 함수(`otherIncome`·`fromGross`·`shift`)로 뽑거나 나눗셈으로 확인한 값만 썼다. 계산기 동작·URL·hreflang 은 그대로.

| 페이지 | 노출·클릭·순위(전) | 대표 검색어(노출·클릭·순위) | 전 제목 | 후 제목 | 결과(11-22) |
|---|---|---|---|---|---|
| /id/tools/date-diff/ | 5,267 · 3 · 9.2 | 30 hari setelah 30 september 2026 (6·0·10) | Kalkulator Tanggal — Hitung Hari dari Tanggal ke Tanggal & Hari Kerja | 30 Hari Setelah Tanggal Berapa? Kalkulator Tanggal & Hitung Hari antara Dua Tanggal | |
| /tools/time-calc/ | 522 · 0 · 7.6 | 10시간 뒤 (1·0·1), 1시간 뒤 (1·0·6), 540분 (1·0·4) | 시간 계산기 — 몇 시간 뒤 · 두 시각 사이 몇 시간 · 휴게 뺀 근무 시간 | 몇 시간 뒤 계산기 — 오후 3시에서 10시간 뒤는 다음 날 오전 1시 · 두 시각 사이 시간 | |
| /id/tools/sec-convert/ | 446 · 0 · 9.3 | 2800 detik berapa menit (5·0·9) | Konversi Detik ke Menit dan Jam — 1 Jam Berapa Detik, Jam Desimal dan Milidetik | 2800 Detik Berapa Menit? 46 Menit 40 Detik — Konversi Detik ke Menit dan Jam | |
| /en-us/tools/date-diff/ | 1,525 · 3 · 15.6 | 90 days from 7/22/26 (12·0·11.2), days between dates (40·0·26) | Date Calculator — Days Between Two Dates, Add or Subtract Days | Days Between Dates & 90 Days From a Date — US Date Calculator | |
| /zh-tw/tools/sec-convert/ | 300 · 0 · 8 | 735分鐘 (7·0·9.6), 2400秒 (4·0·7.8) | 時間換算器（台灣）— 秒換算分鐘、分鐘換算小時、秒轉時分秒 | 分鐘換算小時・秒換算分鐘（台灣）— 735分鐘＝12小時15分、2400秒＝40分鐘 | |
| /es/tools/sec-convert/ | 602 · 0 · 12 | 135 segundos a minutos (2·0·10), 1440 segundos a horas (2·0·8) | Convertir segundos a minutos y horas — horas decimales y milisegundos | Segundos a minutos y horas: 135 s = 2 min 15 s, 10.000 s = 2 h 46 min 40 s | |
| /ja/tools/time-calc/ | 408 · 2 · 9.5 | 何時間後 (7·1·8.3), 今から80分後 (6·0·10), 9時から6時間後 (2·0·10) | 時間計算 — 何時間後は何時？経過時間・休憩を引いた実働時間・時間の足し算と引き算 | 何時間後・何分後は何時？時間計算 — 9時から6時間後は15時、経過時間・実働時間も | |
| /tools/sec-convert/ | 225 · 0 · 8.6 | 5400초 (2·0·9), 3600분 (1·0·11) | 초·분·시간 변환 — 초를 분으로, 분을 시간으로, 몇 시간 몇 분 몇 초 | 초 분 변환 — 5400초는 몇 분? 90분(1시간 30분) · 초·분·시간 계산 | |
| /withholding/ | 214 · 3 · 6.8 | 8.8 원천징수 계산기 (25·0·6.5), 8.8 계산기 (21·0·5.6) | 원천징수 계산기 (3.3% / 8.8%) | 8.8% 원천징수 계산기 — 강연료 100만원이면 실수령 912,000원 (3.3%도) | |
| /ja/tools/sec-convert/ | 298 · 1 · 10.2 | 400秒は何分 (30·0·10.7), 10000秒 何分 (22·0·11) | 秒・分・時間 変換 — 秒を分に、分を時間に、何時間何分何秒かを計算 | 400秒は何分？6分40秒 — 秒・分・時間 変換（10000秒は2時間46分40秒） | |

목록 순서로 8개(위 8줄)에 더해, 빈틈 점수는 조금 낮아도 정확히 일치하는 검색어 노출이 가장 많은 /withholding/·/ja/tools/sec-convert/ 를 함께 고쳤다(10개).

### 건너뛴 것

| 페이지 | 이유 |
|---|---|
| /en-au/tools/percent/ · /zh-hk/tools/percent/ · /zh-tw/tools/percent/ · /id/tools/percent/ | 검색어가 `80*0.7`·`50*0.85` 같은 산술식 — 구글이 결과 화면에서 바로 답해 제목으로 클릭을 끌 수 없다 |
| /es/tools/date-diff/ | 보이는 검색어가 전부 46~59위 — 20위 안에서 읽을 의도가 없다 |
| /zh-tw/tools/date-diff/ · /zh-hk/tools/date-diff/ | 보이는 검색어가 거의 없다(드문 검색어라 구글이 숨김) |
| /en-gb/tools/unix-time/ | 노출 135 중 117 이 `timestamp:39000` 한 줄 — 봇성 검색어 |
| /ja/tools/service-period/ · /en-au/tools/date-diff/ | 보이는 검색어 대부분이 20위 밖(在籍期間 21위, days between dates 34위) — 다음 회차 후보 |
