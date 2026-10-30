# 제휴(CPA) 광고 — 배치 후보와 운영 규칙

등록부: `src/data/affiliates.ts` · 상자: `src/components/AffiliateBox.astro` · 검사: `src/lib/__tests__/affiliates.test.ts`

## 원칙(확정)

- 별도 탭·서브도메인 없이 **주제가 맞는 한국어 글 안에만** 짧은 상자로 넣는다. 상단 "광고·제휴" 표기(공정위 추천·보증 심사지침) — 지우지 않는다.
- 주제 무관 캠페인(모델 모집·타이어 렌탈 등)은 넣지 않는다.
- 추적 링크는 **글에 직접 쓰지 않는다.** 글에는 `<AffiliateBox id="..." />` 만, 링크·기간은 등록부에서.
- 아직 실제 링크가 없어 세 항목(moving-quote · legal-registry · cleaning-movein) 모두 `active: false` — 화면에 아무것도 나오지 않는다.
- 아래 목록은 **후보**다. 링크를 받은 뒤 사람이 글을 열어 문맥(본문 흐름·계산 결과 아래 등)을 보고 넣는다. 한 글에 상자 1개.

## 배치 후보 (14곳)

| 글 주소 | 붙일 category | 이유 |
|---|---|---|
| /guide/brokerage-fee/ | moving | 중개보수 요율을 찾는 사람은 계약 직후 이사를 앞둔 사람 |
| /guide/brokerage-fee-calculator/ | moving | 복비 계산 = 매매·전세 계약 단계, 다음 할 일이 이사 |
| /guide/monthly-rent-brokerage-fee/ | cleaning | 월세 이사는 원룸·오피스텔이 많아 입주청소 수요가 바로 붙음 |
| /guide/apartment-acquisition-tax/ | cleaning | 아파트 매수자 — 잔금 후 입주청소 |
| /guide/acquisition-tax/ | moving | 주택 취득세는 잔금·입주 시점에 찾는 글 |
| /acquisition-tax/ (계산기) | legal | 취득세 납부 후 소유권 이전 등기를 법무사에 맡기는 흐름 |
| /guide/real-estate-acquisition-tax/ | legal | 토지·상가 취득 — 셀프 등기 어려워 법무사 의존도 높음 |
| /guide/officetel-acquisition-tax/ | legal | 본문에 등기 언급, 오피스텔 매수 후 이전 등기 |
| /guide/divorce-acquisition-tax/ | legal | 재산분할 이전 등기는 법무사 상담이 거의 필수 |
| /guide/inheritance-tax-filing/ | legal | 상속세 신고와 같은 시기에 상속 등기를 해야 함(본문 등기 언급) |
| /guide/inheritance-tax-guide/ | legal | 상속 절차 전반을 찾는 사람 — 등기·서류 상담 |
| /inheritance/ (계산기) | legal | 상속세를 계산한 사람의 다음 단계가 상속 등기 |
| /guide/gift-property-value/ | legal | 부동산 증여 — 증여 등기 비용·서류(본문 등기 언급) |
| /guide/gift-tax-filing/ | legal | 증여세 신고 단계, 부동산이면 증여 등기 동반 |

전입신고·이사비용을 직접 다루는 글은 아직 없다. 생기면 moving·cleaning 1순위 후보로 추가한다.

## 운영 규칙

1. **한 광고주는 한 네트워크에서만.** 같은 광고주를 디비디비딥·애드릭스·디비센스에 중복 신청하면 무효 처리된다. 등록부 `advertiser` 로 겹침을 확인한다.
2. **허용 채널 확인.** 캠페인마다 "구글전용"·"당근전용" 같은 채널 제한이 있다. 웹사이트(검색 유입) 게재가 허용된 캠페인만 등록한다. 허용 채널은 캡처해 두고 `issuedOn` 과 함께 기록.
3. **첫 출금은 소액으로.** 한 캠페인을 먼저 켜고, 전환 인정·정산·출금까지 한 바퀴 실제로 받아 본 뒤 다른 캠페인·글로 넓힌다.
4. **만료 관리.** `expiresOn` 을 꼭 적는다. 만료 14일 전부터 `affiliates.test.ts` 가 깨져 ship 이 멈춘다 — 새 링크로 바꾸거나 `active: false`.
5. **측정.** 클릭은 GA4 `affiliate_click`(파라미터 `affiliate_id` 만). 전환·수익은 네트워크 관리 화면에서 본다.

## 링크 넣는 법(한 줄)

```ts
{ id: "moving-quote", ..., url: "https://(발급받은 추적 링크)", issuedOn: "2026-11-02", expiresOn: "2026-12-31", active: true, ... }
```
