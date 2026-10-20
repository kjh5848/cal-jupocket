# 인도네시아 판 진행 기록

나라판 루틴(`docs/superpowers/plans/2026-10-20-country-routine.md`)이 회차마다 한 줄. 상태: 진행 중 · 발행 · 보강 · 판정 · 보류(이유).

## 설정

| 항목 | 값 |
|---|---|
| 나라 코드 | `id` (작업 폴더 `../cal-wt/id`, rates `src/rates/id/`, lib `src/lib/id/`, 테스트 `src/lib/__tests__/id-*.test.ts`) |
| 판 | `id` — 주소 `/id/`, 도구 목록 `src/data/id/tools.ts` |
| 페이지 언어 | Bahasa Indonesia — `<html lang="id-ID">` |
| 조사표 칸 | 인도네시아 |
| 자동완성 | `--hl id --gl id` |
| 허용 출처 | pajak.go.id · peraturan.bpk.go.id · jdih.kemenkeu.go.id · kemnaker.go.id · bpjsketenagakerjaan.go.id · bpjs-kesehatan.go.id |
| 주의 | — |

## 기록

| 날짜 | 도구 | 조사표 판정 | 상태 | 주소 | 메모 |
|---|---|---|---|---|---|
| 2026-10-20 | 월 실수령액 ÷ 하루·근무시간(#24) | 단위 | 보류(짝 없음) | — | 한국어판이 세금 가이드 안 절(`/guide/take-home-calculator/#per-day`)이라 `ko` 짝·스크립트 공유가 안 됨(미국·영국·호주·싱가포르 회차와 같은 이유). 독립 인도네시아판 도구로 만들지는 사람이 정할 것 — 다음 회차는 이 행을 건너뛴다 |
| 2026-10-20 | 퍼센트(#211) | 같음 | 보류(기초 필요) | — | `/id/tools/percent/`·`/id/` 홈·`src/data/id/tools.ts` 와 공유 스크립트 `src/scripts/percent.ts` 의 `ID` 사전(`pickLang({ ko, ja, en, id })`)을 만들어 빌드는 통과했지만 `seo.test.ts` '모든 페이지에 title 이 있고 slug 가 새어나오지 않는다' 에서 막힘 — `/id/` 홈 `<title>` 이 `src/i18n/ui.ts` id 사전의 `homeTitle`("jupocket — kalkulator sehari-hari")이고, 인도네시아어 중복어 `sehari-hari`(하이픈)가 slug 정규식에 걸림. 판의 첫 도구는 홈이 꼭 있어야 해서 페이지만 낼 수도 없음. **기초 필요: `src/i18n/ui.ts` id 사전 `homeTitle` 을 하이픈 중복어 없는 말로(예 "jupocket Indonesia — kalkulator untuk keperluan harian") 바꾸거나 `seo.test.ts` slug 검사가 언어 낱말을 예외로 두게.** 기초가 고쳐지면 다음 회차가 로컬 브랜치 `wip/id-percent`(1ae7aba, 올리지 않음)를 다시 얹어 낸다. 자동완성 `keywords/id-percent-2026-10-20.csv`(hl id, gl id, 48개 — 그 커밋 안) — cara menghitung persen dari harga·diskon / persentase kenaikan dan penurunan / persentase keuntungan dari modal·untung·rugi / persentase kehadiran siswa·sakit izin alpa / rumus persentase excel·spreadsheet. 그 밖 vitest 는 전부 통과(1 실패만). **기초 필요(비차단): `src/lib/percent.ts` 의 `parseNumber`(쉼표를 지우고 점을 소수점으로 읽음)·`formatNumber`(ko-KR 고정) — 인도네시아 표기 관습은 원문 미확인이지만 `12,5` 를 125 로 읽는다. 초안은 h1 아래에 "ketik 150000, desimal pakai titik" 로 계산기 동작을 적고 본문 예시는 정수만 씀. id·de·fr·es 판 공통 문제** |
| 2026-10-20 | 퍼센트(#211) | 같음 | 발행 | https://jupocket.com/id/tools/percent/ | 기초(7ae22e0 — id `homeTitle` "jupocket Indonesia — kalkulator harian", slug 검사 완화)가 고쳐져 보관 브랜치 `wip/id-percent`(1ae7aba)를 새 main 위에 다시 얹음. 공유 `src/scripts/percent.ts` 는 main 잠금 안에서 de·fr 사전·`NUM` 과 충돌을 풀어 `ID` 사전과 `pickLang({…, id: ID })` 만 더함(숫자 읽기는 ko 기본 그대로 — 인도네시아 소수 쉼표 관습은 허용 출처에서 미확인이라 `NUM` 에 넣지 않고 h1 아래 입력 방법 안내 유지). `/id/` 홈·`src/data/id/tools.ts`(ko 짝 `/tools/percent/`). 자동완성 `keywords/id-percent-2026-10-20.csv`. 확인일 2026-10-20 |
| 2026-10-21 | 날짜 계산(#76)·날짜 차이(#75) | 단위 | 발행 | https://jupocket.com/id/tools/date-diff/ | 한국어판 `/tools/date-diff/` 와 `lib/date-calc.ts`·`scripts/date-diff.ts` 공유 — 공유 스크립트는 main 잠금 안에서 `ID` 사전과 `pickLang({…, id: ID })` 만 더함(EN·JA 처럼 Senin–Jumat 칩·기간 칩 둘, 한국 공휴일 업무일 칩·시간 환산 없음, 날짜는 `id-ID` Intl 'Rabu, 21 Oktober 2026'). 조사표 칸이 공휴일·주말 관습·날짜 표기 원문 미확인이라 공휴일 날짜·근무 주(5일/6일)는 쓰지 않고 "hari libur nasional dan cuti bersama tidak dikurangi" 로만 안내. `src/data/id/tools.ts` ko 짝 `/tools/date-diff/`. 자동완성 `keywords/id-date-diff-2026-10-21.csv`(hl id, gl id, 95개) — hitung hari dari tanggal ke tanggal / hitung tanggal mundur / selisih tanggal dalam bulan / menghitung jumlah hari kerja·hari kerja dalam sebulan / excel·spreadsheet. 확인일 2026-10-21 |
| 2026-10-21 | 적립식 복리(#41) | 같음 | 발행 | https://jupocket.com/id/tools/compound/ | 한국어판 `/tools/compound/` 와 `lib/compound.ts`·`scripts/compound.ts` 공유 — 공유 스크립트는 main 잠금 안에서 `ID` 사전과 `pickLang({…, id: ID })`, 입력칸 천 단위 표기를 판의 numberLocale 로(ko·ja·en 은 쉼표 그대로, id 는 점 — 결과 'Rp 10.000.000' 과 맞춤, `money.ts` 는 안 고침). 통화는 EN 과 같은 판 formatter(IDR·id-ID). 세율 기본값 0% — 한국 15.4% 안 쓰고, 인도네시아 이자·투자 세율은 허용 출처에서 열지 않아 숫자 없이 pajak.go.id 링크만. 입력은 rupiah 정수(desimal 안 읽음) FAQ. `src/data/id/tools.ts` ko 짝 `/tools/compound/`. 자동완성 `keywords/id-compound-2026-10-21.csv`(hl id, gl id, 50개) — rumus bunga majemuk(modal akhir·bulanan) / bunga majemuk dan bunga tunggal / kalkulator bunga majemuk bulanan·harian·tahunan / simulasi investasi bulanan·compound interest rupiah / mencari modal awal·mencari suku bunga. Excel FV 절은 자동완성에 없음(관습상 덧붙임). 확인일 2026-10-21 |
