# 도구 담을 목록 (roberin 432개 기준)

루틴(`docs/superpowers/plans/2026-10-16-tool-routine.md`)이 위에서부터 한 줄씩 처리한다.
상태: **있음**(우리 도구가 같은 일을 함) · **할 일** · **진행 중** · **가져옴**(새로 만듦) · **보류**(원문 미확인 등 — 메모에 이유) · **제외**(우리 원칙과 안 맞음 — 메모에 이유).
생성: `python scripts/build_tool_backlog.py keywords/roberin-tools-list-2026-10-16.json` — 다시 돌려도 상태·우리 주소·메모 칸은 보존된다.

현재: 보류 2 · 있음 19 · 할 일 411

다음: 리브랜딩 Task 8 계산기 목록 다음 줄 /guide/family-loan-interest/(차용증 이자율) — roberin 같은 도구 찾아 같은 입력 3개 대조(없으면 대조표 '없음' + 손계산). /guide/gift-tax-calculator/ 는 2026-10-18 완료(roberin 같은 입력 15개 중 13개 같음 → 10년 안 같은 사람 합산·납부세액공제 누락 fix(제47조 ②·제58조·시행령 제46조 ①·제69조 ② 2호), 세대생략 할증 단건(제57조·시행령 제46조의3 수식 alt), 자동완성 프리셋 1억~10억, 일본 国税庁 No.4408 매트릭스 '제도'. 보류: 친족 외 이전 합계 1천만 미만일 때 이번 증여 포함 여부, 세대생략+합산(종전 할증), 이전분 세액을 지금 세율로 추정, 제58조 ② 한도 단수. 더할 후보: 분할 증여 비교(매년·10년 주기). family-loan.ts 는 usedWithin10y 그대로라 영향 없음). /inheritance/ 는 2026-10-18 완료(roberin 같은 입력 8개 중 7개 같음 → 배우자공제 법정상속분 한도 누락·배우자 단독상속 일괄공제·장례비 최저 500만 fix, /guide/inheritance-tax/ '배우자만 있으면 10억' 문장 고침, 일본 国税庁 No.4152 매트릭스 '제도'. 보류: 배우자 한도 원 미만·납부세액 10원 미만 단수(7원 차이), 실제 5억 이상인데 한도 5억 미만일 때 5억 바닥 여부, 금융재산 상속공제 칸(rates 숫자 있음 — 다음 후보), 일본 配偶者の税額軽減 No.4158). /guide/industrial-accident-disability/ 는 2026-10-17 완료(roberin 에 같은 도구 없음 → 제36조 ⑦·제57조 ④·제70조 ③·별표 2 손계산 5개 같음, 1~3급 선급 4년분 단서 누락 fix, 연금 한 달 치·선급 최대(이자 공제 전)·4~7급 명목 손익분기 칩, 일본 厚生労働省 障害 매트릭스 '제도'. 보류: 연금 한 달 치 원 미만 처리, 선급 이자 공제율(시행령), 평균임금 증감 반영 누적). /guide/industrial-accident-leave-pay/ 는 2026-10-17 완료(roberin 에 같은 도구 없음 → 제52조·제54조 ①②·별표 1 제1~3호 손계산 7개 같음, 감액 전 금액과 보탠 돈·61세 이후 줄어든 돈 소계 2개, 일본 厚生労働省 休業 4일째부터 60%+20% 매트릭스 '제도'. 보류: 쉰 날수 총액(3일 넘을 때 처음 3일분 해석), 1일 지급액 원 미만 처리, 단서 구간 73,387~94,354원 금액). /guide/old-age-pension-age/ 는 2026-10-17 완료(roberin 에 같은 도구 없음 → 제61조·제62조·제63조 ②·부칙 제8조 손계산 같음, startPlan 칩 4개·명목 손익분기, 일본 日本年金機構 매트릭스 '제도'. 보류: 월 단위 조기·연기, 지급 시작 달 제54조, 미국 ssa.gov 403). /guide/basic-pension-calculator/ 는 2026-10-17 완료(roberin 에 같은 도구 없음 → 법 제8조 ①·②·시행령 제11조·시행규칙 제4조 손계산 6개 같음, 소득인정액·줄어든 돈 소계 2개, 금융재산 프리셋 1억·2억. 보류: 국민연금 연계 감액(A급여), 이자소득 4만원 공제 입력 칸, 나라 매트릭스 — 호주 Services Australia 원문 시간 초과로 전부 미확인). /guide/child-incentive-amount/ 는 2026-10-17 완료(roberin 에 같은 도구 없음 → 제100조의29 ①·제100조의31 ② 손계산 6개 같음, 3만원 하한은 재산·기한 후·자녀세액공제 세 감액 뒤 적용 원문 확인, 줄어든 돈 소계 3칩·자녀 수 −/+, 미국 IRS Child Tax Credit 매트릭스 '제도'. 보류: 곱하는 감액과 공제 차감 순서, ② 단서 1만5천원 해석, 별표 11의2 산정표 — 자동완성 '자녀장려금 금액 산정표' 수요 있음). /guide/earned-incentive-amount/ 는 그 전 회차 완료(roberin 에 같은 도구 없음 → 제100조의5·제100조의7 손계산 8개 같음, 재산·기한 후로 줄어든 돈·최소 금액 조정·최대 금액 구간 칩, 감액 → 최소 금액 순서 제100조의7 ③ 원문 확인, 미국 IRS EITC 매트릭스 '제도'. 별표 11 산정표는 자동완성 '금액표·산정표' 수요 있음 — 읽어 rates 에 올리면 '어림' 뗄 수 있음. 1만5천원 미만 '없음' 괄호 해석 보류). /guide/medical-credit-limit/ 는 그 전 회차 완료(총급여 3% 원 미만 버림 단수 원문 미확인). IRP 소득 입력 자동 판정은 총급여 5,500만원을 rates 에 출처와 함께 올린 뒤. 퇴직금계산기(#23 retire-calculator)는 할 일 그대로 — 우선순위 1순위라 Task 8 끝나면 바로. 지난 회차 보류: 퇴직소득 지방소득세 10원 미만 끝수 처리, 6+6 특례 부모 개월 수가 다를 때 상한(시행령 제95조의3), 1개월 미만 달 일수 비례 분모(제95조 제3항), 회사 지급 금품 감액 기준(제73조), 구직급여 원 미만 단수, 평균임금 산정기간 이직일 포함 여부, 1일 통상임금 단수, 1년 근무 다음 날 재직 요건 판례, 일본 労働基準法 第39条, 주 6일 사업장 ÷6 단수, 국민연금 10원 미만 버림 방식·근거 조문, 건강보험료 원 단위, 민법 제161조·지방소득세 가산세·원천징수 단수·종소세 경비율 구간. 시급계산기(#11)는 할 일 그대로. 카드 세트 late-filing-penalty·multiple-payers 이미지 재생성은 사용자 확인 필요. /guide/vat-final-return-payment/·/guide/withholding-tax/ 납부지연 일수 식 확인 필요. /penalty/ 날짜 칸 스타일(틀) 필요. dev 미리보기 시작이 이번에도 거절돼 폰 폭(390·다크, 가로 넘침 없음)과 산출세액 한도 소계는 라이브에서 확인함.

| # | 우리 분류 | roberin 분류 | roberin 주소 | 도구 | 상태 | 우리 주소 | 메모 |
|---|---|---|---|---|---|---|---|
| 1 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/contract-calculator/ | 3.3% 계산기 | 있음 | /freelancer-33/ | 2026-10-17 대조: 같은 입력 7개 결과 일치 · 새 틀 이전(소득세·지방소득세 나눠 보기) |
| 2 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/freelancer-calculator/ | 8.8% 원천징수 계산기 | 있음 | /withholding/ | 2026-10-17 대조: 기타소득 125,000원 이하 과세최저한(제84조 3호) — 우리·roberin 둘 다 틀려 우리 것 고침 · 기타소득 역산 추가 · 새 틀 이전. 1원 단수 차이는 보류 |
| 3 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/projects/work-income-calculator/ | 근무시간 실수령·구매력 계산기 | 할 일 |  |  |
| 4 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/ordinary-wage-calculator/ | 대한민국 통상임금 계산기 | 할 일 |  |  |
| 5 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/lotto-tax-calculator/ | 로또 당첨금 세금 계산기 | 있음 | /guide/lotto-tax-calculator/ |  |
| 6 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/holding-tax-calculator/ | 보유세 계산기 | 할 일 |  |  |
| 7 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/vat-calculator/ | 부가세계산기 | 있음 | /vat/ | 2026-10-17 대조: 정방향 같음 · 합계 역산 1원 차이는 단수(우리 반올림/roberin 내림, 제29조 제7항에 단수 규정 없음) · 새 틀 이전 · 영국·일본 rates 초안 |
| 8 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/transfer-tax-calculator/ | 부동산 양도세 계산기 | 있음 | /guide/capital-gains-calculator/ |  |
| 9 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/comprehensive-income-tax-calculator/ | 사업소득 종합소득세 계산기 | 있음 | /income-tax-refund/ | 2026-10-17 대조: 우리가 지방소득세만큼 환급을 부풀림(기납부 3.3% − 소득세만) → 소득세·지방소득세 따로 정산으로 고침(제76조 ③4호), 고친 뒤 같은 입력 4개 roberin 과 1원까지 같음 · 새 틀 이전. 940xxx 초과율·직전 연도 수입 판정·기준경비율은 보류(원문 미확인) |
| 10 | 상속·증여 | 돈·세금·급여 / 급여·세금 | https://roberin.com/inheritance-tax-calculator/ | 상속세 계산기 | 있음 | /inheritance/ | 2026-10-18 대조: 같은 입력 8개 중 7개 같음 · 우리가 틀린 3건 고침 — 배우자공제 법정상속분 한도(제19조 ①1호, 30억·배우자 15억에서 세금 약 8천만원 적게 보였음)·배우자 혼자 상속 일괄공제 배제(제21조 ②)·장례비 최저 500만(시행령 제9조 ②) · 새 틀 이전. 7원 단수 차이·실제 5억 이상인데 한도 5억 미만 경계는 보류 |
| 11 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/hourly-wage-calculator/ | 시급계산기 | 할 일 |  |  |
| 12 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/projects/live-salary-tracker/ | 실시간 급여 시각화 트래커 | 할 일 |  |  |
| 13 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/unemployment-calculator/ | 실업급여 계산기 | 있음 | /guide/unemployment-benefit-calculator/ | 2026-10-17 대조: 말일 이직 3개월 산정일수 우리가 틀려 고침(민법 제160조 ③) · 7개 입력 같음 · 2027 이직 하한(68,480 > 상한 68,100)은 우리 맞음, roberin 2026 최저임금 사용 · 340만 1원 단수 보류 · 새 틀 이전 |
| 14 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/overtime-pay-calculator/ | 야근수당 계산기 | 할 일 |  |  |
| 15 | 연금·보험 | 돈·세금·급여 / 급여·세금 | https://roberin.com/pension-tax-credit-calculator/ | 연금저축·IRP 세액공제 계산기 | 있음 | /guide/irp-tax-credit-calculator/ | 2026-10-17 대조: 같은 입력 6개 1원까지 같음(테스트 고정) · 한도 넘긴 돈·남은 금액·더 줄어드는 세금 추가(lib roomToCap) · 산출세액 한도 때 칩 어긋남 고침 · 새 틀 이전. 소득 입력 자동 판정은 보류(총급여 5,500만 rates 숫자 필드 없음) |
| 16 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/my-salary-calculator/ | 연봉계산기 | 할 일 |  |  |
| 17 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/stock-return-calculator/ | 주식 수익률 계산기 | 할 일 |  |  |
| 18 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/property-tax-calculator/ | 주택 재산세 계산기 | 있음 | /property-tax/ |  |
| 19 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/acquisition-tax-calculator/ | 주택 취득세 계산기 | 있음 | /acquisition-tax/ |  |
| 20 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/weekly-rest-allowance-calculator/ | 주휴수당 계산기 | 있음 | /guide/weekly-holiday-pay-calculator/ | 2026-10-17 대조: 같은 입력 6개 주휴수당 1원까지 같음 · 개근 체크·근무 임금·소계 더해 새 틀 이전. 45h 근로급여(우리 40h 자름, 제50조)·주 6일 사업장 ÷6 단수는 보류 |
| 21 | 상속·증여 | 돈·세금·급여 / 급여·세금 | https://roberin.com/gift-tax-simulator/ | 증여세 절세 시뮬레이터 | 있음 | /guide/gift-tax-calculator/ | 2026-10-18 대조: 같은 입력 15개 중 13개 같음 · 우리가 10년 안 같은 사람 합산(제47조 ②)·납부세액공제(제58조)를 안 해 이전 증여가 공제를 넘으면 세금을 적게 보였음(2억+2억에서 970만원) → 고침 · 세대생략 할증(제57조·시행령 제46조의3) 추가 · 새 틀 이전. 친족 외 이전 1천만 미만 합산 여부·세대생략+합산은 보류('—'). 분할 증여 비교는 더할 후보 |
| 22 | 세금 | 돈·세금·급여 / 급여·세금 | https://roberin.com/retirement-income-tax-calculator/ | 퇴직 일시금 세금 계산기 | 있음 | /guide/severance-tax-calculator/ | 2026-10-17 대조: 퇴직소득세 7개 같음 · 지방소득세 10원 단수 차이(우리 원 미만 버림/roberin 10원 버림 — 원문 미확인 보류) · 새 틀 이전(남은 개월 칸·공제 단계 칩·세금 합계 소계) · 일본 rates 초안 |
| 23 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/retire-calculator/ | 퇴직금계산기 | 할 일 |  |  |
| 24 | 급여·근로 | 돈·세금·급여 / 급여·세금 | https://roberin.com/projects/daily-income/ | 하루 실수령액 계산기 | 할 일 |  |  |
| 25 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/loan-calculator/ | 대출계산기 | 할 일 |  |  |
| 26 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/minus-account-interest-calculator/ | 마이너스통장 이자 계산기 | 할 일 |  |  |
| 27 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/projects/debt-repayment-planner/ | 부채 상환 계획 도구 | 할 일 |  |  |
| 28 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/projects/card-point-value-calculator/ | 신용카드 포인트 가치 계산기 | 할 일 |  |  |
| 29 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/projects/cc-installment-calculator/ | 신용카드 할부 수수료 계산기 | 할 일 |  |  |
| 30 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/prepayment-fee-calculator/ | 중도상환수수료 계산기 | 할 일 |  |  |
| 31 | 돈·금융 | 돈·세금·급여 / 대출·카드 | https://roberin.com/foreign-transaction-fee-calculator/ | 해외결제·환전 수수료 계산기 | 할 일 |  |  |
| 32 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/wealth-clock/ | 나만의 부자 시계 | 할 일 |  |  |
| 33 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/compound-calc-wrapper/ | 단순 복리 계산기 | 할 일 |  |  |
| 34 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/dividend-calculator/ | 배당금계산기 | 할 일 |  |  |
| 35 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/seonnapiyeon-calculator/ | 선납이연 계산기 | 할 일 |  |  |
| 36 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/deposit-interest-calculator/ | 예금이자계산기 | 할 일 |  |  |
| 37 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/inflation-adjustment-calculator/ | 인플레이션 조정 계산기 | 할 일 |  |  |
| 38 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/daily-compound-interest-calculator/ | 일일 복리 성장 계산기 | 할 일 |  |  |
| 39 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/recovery-calculator/ | 일자별 손실 원금 복구 계산기 | 할 일 |  |  |
| 40 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/installment-savings-calculator/ | 적금 만기 수령액 계산기 | 할 일 |  |  |
| 41 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/compound-calculator/ | 적립식 복리 계산기 | 할 일 |  |  |
| 42 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/fixed-deposit-interest-calculator/ | 정기예금 이자 계산기 | 할 일 |  |  |
| 43 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/dca-calculator/ | 주식 코인 물타기 계산기 | 할 일 |  |  |
| 44 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/youth-tomorrow-savings-account-calculator/ | 청년내일저축계좌 계산기 | 할 일 |  |  |
| 45 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/exchange-calc-wrapper/ | 코인 거래소 이동 환차이 계산기 | 할 일 |  |  |
| 46 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/parking-account-interest-calculator/ | 파킹통장 이자 계산기 | 할 일 |  |  |
| 47 | 돈·금융 | 돈·세금·급여 / 투자·복리 | https://roberin.com/projects/fx-profit-calculator/ | 환테크 수익 계산기 | 할 일 |  |  |
| 48 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/supply-price-calculator/ | 공급가액 계산기 | 할 일 |  |  |
| 49 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/projects/opportunity-cost-time-value-calculator/ | 기회비용 시간 가치 계산기 | 할 일 |  |  |
| 50 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/living-expense-distribution-calculator/ | 생활비 분배 계산기 | 할 일 |  |  |
| 51 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/projects/fee-per-character-calculator/ | 원고료 단가 계산기 | 할 일 |  |  |
| 52 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/projects/inventory-loss-calculator/ | 재고 손실 계산기 | 할 일 |  |  |
| 53 | 돈·금융 | 돈·세금·급여 / 생활비·가격 | https://roberin.com/projects/coffee-savings-calculator/ | 커피 절약 계산기 | 할 일 |  |  |
| 54 | 돈·금융 | 돈·세금·급여 / 기타 돈 계산 | https://roberin.com/parking-fee-calculator/ | 주차 시간·요금 계산기 | 할 일 |  |  |
| 55 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/real-estate-fee-calculator/ | 부동산 중개 수수료 계산기 | 할 일 |  |  |
| 56 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/projects/junggae-bosu-calculator/ | 부동산 중개보수 계산기(복비 계산기) | 할 일 |  |  |
| 57 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/apartment-area-calculator/ | 아파트 면적 계산기 | 할 일 |  |  |
| 58 | 급여·근로 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/projects/housing-affordability-calculator/ | 월급 대비 적정 주거비 계산기 | 할 일 |  |  |
| 59 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/projects/rent-vs-deposit-calculator/ | 월세 vs 전세 비교 계산기 | 할 일 |  |  |
| 60 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/house-calculator/ | 적정 주택 구매 가격 계산기 | 할 일 |  |  |
| 61 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/projects/jeonse-fund-planner/ | 전세 자금 마련 계획 계산기 | 할 일 |  |  |
| 62 | 집·차 | 부동산·주거·자동차 / 부동산·주거 | https://roberin.com/projects/pyeong-calculator/ | 평형 계산기 | 할 일 |  |  |
| 63 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/car-ownership-cost-calculator/ | 자동차 소유 비용 계산기 | 할 일 |  |  |
| 64 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/car-installment-comparison/ | 자동차 할부 계산기 | 할 일 |  |  |
| 65 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/car-tax-calculator/ | 자동차세 계산기 | 있음 | /vehicle-tax/ |  |
| 66 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/car-cost-comparison/ | 전기차 vs 내연기관 유지비 계산기 | 할 일 |  |  |
| 67 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/projects/electric-vehicle-maintenance-cost-calculator/ | 전기차 유지비 계산기 | 할 일 |  |  |
| 68 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/projects/ev-calculator/ | 전기차 충전 비용 계산기 | 할 일 |  |  |
| 69 | 집·차 | 부동산·주거·자동차 / 자동차·EV | https://roberin.com/car-poor-calculator/ | 카푸어 계산기 | 할 일 |  |  |
| 94 | 급여·근로 | 날짜·시간·일정 / 학교·근속 | https://roberin.com/projects/annual-leave-calculator2/ | 연차 생성 계산기 Pro | 있음 | /guide/annual-leave-calculator/ | 2026-10-17 입력만 관찰: 사업장 규모(5인 미만)를 보고 우리도 상시 근로자 수 버튼 더함(시행령 별표 1). 퇴사 정산(퇴사 예정일·사용 예정 연차)은 /guide/annual-leave-pay/ 글 몫 — 계산기에 안 더함 |
| 95 | 급여·근로 | 날짜·시간·일정 / 학교·근속 | https://roberin.com/annual-leave-calculator/ | 연차일수 계산기 | 있음 | /guide/annual-leave-calculator/ | 2026-10-17 대조: 일수 경계 8개 같음 · 다음 연차 날짜·일수 더함 · 1일 통상임금 단수(하루 최대 7원)는 단수 규정 없어 보류 · roberin 출근율 70% 0일은 제60조 ② 미반영 · 새 틀 이전 |
| 311 | 급여·근로 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/insurance-calculator/ | 4대보험계산기 | 있음 | /guide/four-insurance-calculator/ |  |
| 339 | 급여·근로 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/indemnizacion-calculator/ | 스페인 해고수당(Indemnización) 계산기 | 보류 |  | 나라별 — 한국·일본 다음(설계 2절) |
| 349 | 급여·근로 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/pesangon-calculator/ | 인도네시아 퇴직금(Pesangon) 계산기 | 보류 |  | 나라별 — 한국·일본 다음(설계 2절) |
| 350 | 급여·근로 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/daily-worker-insurance-calculator/ | 일용직 4대보험 계산기 | 할 일 |  |  |
| 359 | 급여·근로 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/maternity-parental-leave-calculator/ | 출산휴가·육아휴직 급여 계산기 | 있음 | /guide/parental-leave-pay-calculator/ | 2026-10-17 대조(육아휴직 탭): 같은 개월 수 입력 6개 같음 · 6+6 부모 개월 수 다를 때(roberin 짧은 쪽만 특례)는 제95조의3 원문에 없어 보류 · 새 틀 이전. 출산전후휴가·배우자 휴가 탭은 우리 출산휴가 글 계산기 회차에 |
| 70 | 단위·변환 | 부동산·주거·자동차 / 날씨·환경 | https://roberin.com/indoor-humidity-calculator/ | 실내 적정습도 계산기 | 할 일 |  |  |
| 71 | 단위·변환 | 부동산·주거·자동차 / 날씨·환경 | https://roberin.com/aircon-temperature-calculator/ | 에어컨 적정온도·제습 계산기 | 할 일 |  |  |
| 72 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/csat-dday-2027/ | 2027학년도 수능 디데이 계산기 | 할 일 |  |  |
| 73 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/couple-days-countdown/ | 고백데이 계산기 | 할 일 |  |  |
| 74 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/date-day-calculator/ | 날짜 요일 계산기 | 할 일 |  |  |
| 75 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/date-difference-calculator/ | 날짜 차이 계산기 | 할 일 |  |  |
| 76 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/date-calculator/ | 날짜계산기 | 할 일 |  |  |
| 77 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/calendar-maker/ | 달력 만들기 | 할 일 |  |  |
| 78 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/dday-calculator/ | 디데이 계산기 | 할 일 |  |  |
| 79 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/goal-achievement-date-calculator/ | 목표 시간 달성일 계산기 | 할 일 |  |  |
| 80 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/projects/days-lived-counter/ | 살아온 날짜 계산기 | 할 일 |  |  |
| 81 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/birthday-countdown/ | 생일까지 카운트다운 | 할 일 |  |  |
| 82 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/projects/date-time-calculator/ | 시작 일시 및 경과시간 계산기 | 할 일 |  |  |
| 83 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/multi-day-elapsed-time-calculator/ | 여러 날짜 경과시간 계산기 | 할 일 |  |  |
| 84 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/year-countdown/ | 올해 남은 날짜 계산기 | 할 일 |  |  |
| 85 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/couple-anniversary-calculator/ | 커플 기념일 계산기 | 할 일 |  |  |
| 86 | 날짜·시간 | 날짜·시간·일정 / 날짜·D-Day | https://roberin.com/projects/work-day-end-countdown-timer/ | 퇴근 카운트다운 | 할 일 |  |  |
| 87 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/presentation-calc-wrapper/ | 발표시간 계산기 | 할 일 |  |  |
| 88 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/projects/time-to-minutes-seconds-converter/ | 시간 → 분/초 변환기 | 할 일 |  |  |
| 89 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/time-duration-calculator/ | 시간 간격 계산기 | 할 일 |  |  |
| 90 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/unix-timestamp-converter/ | 유닉스 타임스탬프 변환기 | 할 일 |  |  |
| 91 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/projects/seconds-minutes-converter/ | 초-분 변환기 | 할 일 |  |  |
| 92 | 날짜·시간 | 날짜·시간·일정 / 시간·타이머 | https://roberin.com/projects/fullscreen-current-time-display/ | 현재 시간 전체화면 | 할 일 |  |  |
| 93 | 날짜·시간 | 날짜·시간·일정 / 학교·근속 | https://roberin.com/employment-calculator/ | 근속 기간 계산기 (년월일) | 할 일 |  |  |
| 96 | 날짜·시간 | 날짜·시간·일정 / 학교·근속 | https://roberin.com/school-calculator/ | 학교 입학, 졸업 연도 계산기 | 할 일 |  |  |
| 97 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/age-calculator/ | 만 나이 계산기 | 할 일 |  |  |
| 98 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/neutering-age-calculator/ | 반려동물 중성화 시기 계산기 | 할 일 |  |  |
| 99 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/projects/parent-child-age-calculator/ | 아이와 나이 차이 계산기 | 할 일 |  |  |
| 100 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/projects/life-season-calculator/ | 인생 시즌 계산기 | 할 일 |  |  |
| 101 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/projects/life-clock/ | 인생시계 계산기 [아프니까 청춘이다] | 할 일 |  |  |
| 102 | 날짜·시간 | 날짜·시간·일정 / 기타 날짜·일정 | https://roberin.com/projects/milestone-calculator/ | 환갑/칠순/팔순 계산기 | 할 일 |  |  |
| 103 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/bmr-calculator/ | BMR 계산기 (기초대사량) | 할 일 |  |  |
| 104 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/heartworm-medication-schedule/ | 강아지 심장사상충 투약 일정 계산기 | 할 일 |  |  |
| 105 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/projects/health-supplement-cost-calculator/ | 건강 보조제 비용 계산기 | 할 일 |  |  |
| 106 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/diabetes-risk-calculator/ | 당뇨 검사 수치 확인기 | 할 일 |  |  |
| 107 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/bmi-calculator/ | 비만도 계산기(BMI) | 할 일 |  |  |
| 108 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/projects/heart-rate-calculator/ | 심박수 존 계산기 | 할 일 |  |  |
| 109 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/age-health-guide/ | 연령대별 건강 맞춤 가이드 | 할 일 |  |  |
| 110 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/body-fat-calculator/ | 체지방율 계산기 | 할 일 |  |  |
| 111 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/blood-sugar-checker/ | 혈당·당화혈색소 수치 판정기 | 할 일 |  |  |
| 112 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/blood-pressure-classifier/ | 혈압 카테고리 분류기 | 할 일 |  |  |
| 113 | 건강·운동 | 건강·운동·라이프 / 몸 지표 | https://roberin.com/blood-alcohol-concentration-calculator/ | 혈중 알코올 농도 계산기 | 할 일 |  |  |
| 114 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/1rm-calculator/ | 1RM 계산기 | 할 일 |  |  |
| 115 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/vo2max-calculator/ | VO2max 계산기 | 할 일 |  |  |
| 116 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/walking-calorie-calculator/ | 걷기·만보 칼로리 계산기 | 할 일 |  |  |
| 117 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/steps-to-kilometers-calculator/ | 걸음 수-킬로미터 변환 계산기 | 할 일 |  |  |
| 118 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/running-age-grade-calculator/ | 러닝 연령등급 계산기 | 할 일 |  |  |
| 119 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/running-calorie-calculator/ | 러닝 칼로리 계산기 | 할 일 |  |  |
| 120 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/running-cadence-calculator/ | 러닝 케이던스 계산기 | 할 일 |  |  |
| 121 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/running-pace-calculator/ | 러닝 페이스 계산기 | 할 일 |  |  |
| 122 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/swimming-calorie-calculator/ | 수영 칼로리 계산기 | 할 일 |  |  |
| 123 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/smart-stride-calculator/ | 스마트 보폭 계산기 | 할 일 |  |  |
| 124 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/interval-running-timer/ | 인터벌 러닝 타이머 | 할 일 |  |  |
| 125 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/bicycle-calorie-calculator/ | 자전거 칼로리 계산기 | 할 일 |  |  |
| 126 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/precision-marathon-pace-calculator/ | 정밀 마라톤 페이스 계산기 | 할 일 |  |  |
| 127 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/jump-rope-calorie-calculator/ | 줄넘기 칼로리 계산기 | 할 일 |  |  |
| 128 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/steps-life-calculator/ | 평생 걸음 거리 계산기 | 할 일 |  |  |
| 129 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/half-marathon-predictor/ | 하프마라톤 기록 예측기 | 할 일 |  |  |
| 130 | 건강·운동 | 건강·운동·라이프 / 운동·러닝 | https://roberin.com/projects/fitness-cost-calculator/ | 헬스장 vs 홈트 비용 비교기 | 할 일 |  |  |
| 131 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/4-7-8-breathing-guide/ | 4-7-8 호흡법 가이드 도구 | 할 일 |  |  |
| 132 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/projects/meditation-timer/ | 명상 타이머 | 할 일 |  |  |
| 133 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/water-calculator/ | 물 섭취량 계산기 | 할 일 |  |  |
| 134 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/projects/vitamin-d-calculator/ | 비타민 D 계산기 | 할 일 |  |  |
| 135 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/sleep-debt-calculator/ | 수면 부채 계산기 | 할 일 |  |  |
| 136 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/sleep-time-calculator/ | 수면 시간 계산기 | 할 일 |  |  |
| 137 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/projects/daily-water-intake-calculator/ | 수분 섭취 계산기 | 할 일 |  |  |
| 138 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/protein-calculator/ | 일일 단백질 섭취량 계산기 | 할 일 |  |  |
| 139 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/projects/vitamin-calculator/ | 일일 비타민 섭취량 계산기 | 할 일 |  |  |
| 140 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/caffeine-intake-calculator/ | 일일 카페인 섭취량 계산기 | 할 일 |  |  |
| 141 | 건강·운동 | 건강·운동·라이프 / 수면·영양·습관 | https://roberin.com/projects/optimal-sleep-schedule-calculator/ | 최적 수면 스케줄 계산기 | 할 일 |  |  |
| 142 | 건강·운동 | 건강·운동·라이프 / 임신·생활 | https://roberin.com/ovulation-calculator/ | 배란일 계산기 | 할 일 |  |  |
| 143 | 건강·운동 | 건강·운동·라이프 / 임신·생활 | https://roberin.com/projects/sunburn-calculator/ | 일광화상 계산기 | 할 일 |  |  |
| 144 | 건강·운동 | 건강·운동·라이프 / 임신·생활 | https://roberin.com/pregnancy-week-calculator/ | 임신 주수 계산기 | 할 일 |  |  |
| 145 | 건강·운동 | 건강·운동·라이프 / 임신·생활 | https://roberin.com/pregnancy-due-date-calculator/ | 출산 예정일 계산기 | 할 일 |  |  |
| 146 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/projects/stroop-test/ | Stroop 테스트 | 할 일 |  |  |
| 147 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/projects/emotion-trash/ | 감정 쓰레기통 도구 | 할 일 |  |  |
| 148 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/refrigerator-temperature-checker/ | 냉장고 적정온도 점검기 | 할 일 |  |  |
| 149 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/biorhythm-calculator/ | 바이오리듬 계산기 | 할 일 |  |  |
| 150 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/biorhythm-compatibility-calculator/ | 바이오리듬 궁합 계산기 | 할 일 |  |  |
| 151 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/child-height-calculator/ | 아이 예상키 계산기 | 할 일 |  |  |
| 152 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/projects/medication-dosage-interval-calculator/ | 약 복용 간격 계산기 | 할 일 |  |  |
| 153 | 건강·운동 | 건강·운동·라이프 / 기타 건강·생활 | https://roberin.com/dental-cost-calculator/ | 치과 치료비 계산기 | 할 일 |  |  |
| 154 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/12-24-hour-converter/ | 12·24시간제 변환기 | 할 일 |  |  |
| 155 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/bp-percent-converter/ | bp 퍼센트 변환기 | 할 일 |  |  |
| 156 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/ccf-to-gallons-conversion/ | CCF → 갤런 변환기 | 할 일 |  |  |
| 157 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/csv-json-converter/ | CSV ↔ JSON 변환기 | 할 일 |  |  |
| 158 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/csv-tsv-converter/ | CSV ↔ TSV 변환기 | 할 일 |  |  |
| 159 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/docx-to-jpg-converter/ | DOCX JPG 변환기 | 할 일 |  |  |
| 160 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/hwp-to-jpg-converter/ | HWP JPG 변환기 | 할 일 |  |  |
| 161 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/iso-kst-converter/ | ISO 날짜 ↔ 한국 시각 변환기 | 할 일 |  |  |
| 162 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/json-yaml-converter/ | JSON ↔ YAML 변환기 | 할 일 |  |  |
| 163 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/json-array-jsonl-converter/ | JSON 배열 ↔ JSONL 변환기 | 할 일 |  |  |
| 164 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/m4a-to-mp3-converter/ | M4A MP3 변환기 | 할 일 |  |  |
| 165 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/mp4-to-mp3-converter/ | MP4 MP3 변환기 | 할 일 |  |  |
| 166 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/srt-vtt-converter/ | SRT ↔ VTT 자막 변환기 | 할 일 |  |  |
| 167 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/wav-mp3-converter/ | WAV MP3 변환기 | 할 일 |  |  |
| 168 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/angle-unit-converter/ | 각도 단위 변환기 | 할 일 |  |  |
| 169 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/gallon-barrel-converter/ | 갤런 배럴 변환기 | 할 일 |  |  |
| 170 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/international-shoe-size-converter/ | 국제 신발 사이즈 변환기 | 할 일 |  |  |
| 171 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/global-size-converter/ | 국제 의류 사이즈 변환기 | 할 일 |  |  |
| 172 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/korean-amount-converter/ | 금액 한글 표기 | 할 일 |  |  |
| 173 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/atmosphere-pascal-converter/ | 기압 파스칼 변환기 | 할 일 |  |  |
| 174 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/knot-mach-converter/ | 노트 마하 변환기 | 할 일 |  |  |
| 175 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/unit-converter/ | 단위 변환기 | 할 일 |  |  |
| 176 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/decibel-meter/ | 데시벨 측정기 | 할 일 |  |  |
| 177 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/mile-kilometer-converter/ | 마일 킬로미터 변환기 | 할 일 |  |  |
| 178 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/water-concentration-calculator/ | 물 농도 계산기 | 할 일 |  |  |
| 179 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/meter-to-feet-converter/ | 미터 피트 변환기 | 할 일 |  |  |
| 180 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/density-calculator/ | 밀도 계산기 | 할 일 |  |  |
| 181 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/becquerel-curie-radiation-unit-converter/ | 베커렐 큐리 변환기 | 할 일 |  |  |
| 182 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/volt-ampere-converter/ | 볼트 암페어 변환기 | 할 일 |  |  |
| 183 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/volume-converter/ | 부피 변환기 | 할 일 |  |  |
| 184 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/celsius-fahrenheit-converter/ | 섭씨 화씨 온도 변환기 | 할 일 |  |  |
| 185 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/speed-calculator/ | 속도 계산기 | 할 일 |  |  |
| 186 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/speed-converter/ | 속도 변환 계산기 | 할 일 |  |  |
| 187 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/energy-converter/ | 에너지 단위 변환기 | 할 일 |  |  |
| 188 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/acre-square-meter-converter/ | 에이커 제곱미터 변환기 | 할 일 |  |  |
| 189 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/excel-column-converter/ | 엑셀 열 문자·번호 변환기 | 할 일 |  |  |
| 190 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/english-name-converter/ | 영문 이름 변환기 | 할 일 |  |  |
| 191 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/watt-horsepower-converter/ | 와트-마력 변환기 | 할 일 |  |  |
| 192 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/coordinate-dms-converter/ | 위도·경도 소수 ↔ 도분초 변환기 | 할 일 |  |  |
| 193 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/inch-centimeter-converter/ | 인치 센티 변환기 | 할 일 |  |  |
| 194 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/bicycle-speed-calculator/ | 자전거 속도 계산기 | 할 일 |  |  |
| 195 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/fullwidth-halfwidth-converter/ | 전각 ↔ 반각 변환기 | 할 일 |  |  |
| 196 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/hz-converter/ | 주파수 변환기 | 할 일 |  |  |
| 197 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/mass-conversion-calculator/ | 질량 변환 계산기 | 할 일 |  |  |
| 198 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/candela-lux-converter/ | 칸델라 룩스 변환기 | 할 일 |  |  |
| 199 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/typing-speed-test/ | 타자속도테스트 | 할 일 |  |  |
| 200 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/torque-unit-converter/ | 토크 단위 변환기 | 할 일 |  |  |
| 201 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/pascal-atm-converter/ | 파스칼 대기압 변환기 | 할 일 |  |  |
| 202 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/projects/pound-force-newton-converter/ | 파운드 뉴턴 변환기 | 할 일 |  |  |
| 203 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/gpa-converter-calculator/ | 학점 변환 계산기 | 할 일 |  |  |
| 204 | 단위·변환 | 단위·변환·과학 / 단위 변환 | https://roberin.com/hangul-english-keyboard-converter/ | 한영 타자 변환기 | 할 일 |  |  |
| 205 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/calculus-derivative-calculator/ | 미분 계산기 | 할 일 |  |  |
| 206 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/bayes-calculator/ | 베이즈 정리 계산기 | 할 일 |  |  |
| 207 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/fraction-calculator/ | 분수 계산기 | 할 일 |  |  |
| 208 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/projects/trigonometry-calculator/ | 삼각함수 계산기 | 할 일 |  |  |
| 209 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/projects/pi-calculator/ | 원주율 계산기 | 할 일 |  |  |
| 210 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/statistics-calculator/ | 통계 계산기 | 할 일 |  |  |
| 211 | 단위·변환 | 단위·변환·과학 / 수학·통계 | https://roberin.com/percent-calculator/ | 퍼센트계산기 | 할 일 |  |  |
| 212 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/condensation-risk-calculator/ | 결로 위험 계산기 | 할 일 |  |  |
| 213 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/projects/heat-index-calculator/ | 열지수 계산기 | 할 일 |  |  |
| 214 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/projects/dew-point-calculator/ | 이슬점 계산기 | 할 일 |  |  |
| 215 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/carbon-footprint-calculator/ | 탄소 발자국 계산기 | 할 일 |  |  |
| 216 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/carbon-footprint-visualizer/ | 탄소발자국 시각화 | 할 일 |  |  |
| 217 | 단위·변환 | 단위·변환·과학 / 날씨·환경 | https://roberin.com/wind-chill-calculator/ | 풍속 냉각 계산기 | 할 일 |  |  |
| 218 | 단위·변환 | 단위·변환·과학 / 기타 단위·계산 | https://roberin.com/projects/ph-calculator/ | pH 계산기 | 할 일 |  |  |
| 219 | 단위·변환 | 단위·변환·과학 / 기타 단위·계산 | https://roberin.com/school-grade-calculator/ | 내신 등급 계산기 | 할 일 |  |  |
| 220 | 단위·변환 | 단위·변환·과학 / 기타 단위·계산 | https://roberin.com/clock-hand-angle-calculator/ | 시계 바늘 각도 계산기 | 할 일 |  |  |
| 221 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/hex-rgb-converter/ | HEX to RGB 변환기 | 할 일 |  |  |
| 222 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/color-converter/ | RGB CMYK 변환기 | 할 일 |  |  |
| 223 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/neon-generator/ | 네온 색상 생성기 | 할 일 |  |  |
| 224 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/random-palette-generator/ | 랜덤 팔레트 생성기 | 할 일 |  |  |
| 225 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/color-blind-test/ | 색맹 테스트 | 할 일 |  |  |
| 226 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-inverter/ | 색상 반전 계산기 | 할 일 |  |  |
| 227 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-temp/ | 색상 온도 변환기 | 할 일 |  |  |
| 228 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/color-name-finder/ | 색상 이름 찾기(HEX 코드) | 할 일 |  |  |
| 229 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-accessibility-checker/ | 색상 접근성 검사기 | 할 일 |  |  |
| 230 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-harmony-generator/ | 색상 조화 생성기 | 할 일 |  |  |
| 231 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/batch-color-converter/ | 색상 코드 일괄 변환기 | 할 일 |  |  |
| 232 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-palette-tool/ | 색상 팔레트 도구 | 할 일 |  |  |
| 233 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/color-picker/ | 이미지 색상 추출기 | 할 일 |  |  |
| 234 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-palette/ | 이미지 컬러 팔레트 생성기 | 할 일 |  |  |
| 235 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/color-mixer/ | 컬러 블렌더 (두 색상 믹서기) | 할 일 |  |  |
| 236 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/text-utf8-hex-converter/ | 텍스트 ↔ UTF-8 16진수 변환기 | 할 일 |  |  |
| 237 | 텍스트·개발 | 디자인·색상·이미지 / 색상·팔레트 | https://roberin.com/projects/pastel-color-generator/ | 파스텔 색상 생성기 | 할 일 |  |  |
| 238 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/gif-compressor/ | GIF 용량 줄이기 | 할 일 |  |  |
| 239 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/heic-to-jpg-converter/ | HEIC JPG 변환기 | 할 일 |  |  |
| 240 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/pdf-compressor/ | PDF 용량 줄이기 | 할 일 |  |  |
| 241 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/pdf-to-image-converter/ | PDF 이미지 변환기 | 할 일 |  |  |
| 242 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/qr-code-image-scanner/ | QR 코드 이미지 스캐너 | 할 일 |  |  |
| 243 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/sns-image-tool/ | SNS 이미지 크기 자르기 툴 | 할 일 |  |  |
| 244 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/mood-photo-generator/ | 무드 사진 생성기 | 할 일 |  |  |
| 245 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/vintage-film-photo-generator/ | 빈티지 필름 사진 생성기 | 할 일 |  |  |
| 246 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/photo-merger/ | 사진 합치기·이어붙이기 | 할 일 |  |  |
| 247 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/add-text-to-photo/ | 사진에 글씨 넣기 | 할 일 |  |  |
| 248 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/cinematic-photo-generator/ | 시네마틱 사진 생성기 | 할 일 |  |  |
| 249 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/webp-converter/ | 이미지 WebP 변환기 | 할 일 |  |  |
| 250 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-base64-converter/ | 이미지 ↔ Base64 변환기 | 할 일 |  |  |
| 251 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/pixel-art-tool/ | 이미지 도트화 도구 | 할 일 |  |  |
| 252 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-resizer/ | 이미지 리사이즈 | 할 일 |  |  |
| 253 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/mosaic-generator/ | 이미지 모자이크 생성기 | 할 일 |  |  |
| 254 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-bc-tool/ | 이미지 밝기 조절 | 할 일 |  |  |
| 255 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-splitter/ | 이미지 분할기 | 할 일 |  |  |
| 256 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-compressor/ | 이미지 압축기 | 할 일 |  |  |
| 257 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/circle-art-tool/ | 이미지 원형 도트화 도구 | 할 일 |  |  |
| 258 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-crop-tool/ | 이미지 자르기 | 할 일 |  |  |
| 259 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-to-text/ | 이미지 텍스트 추출기 | 할 일 |  |  |
| 260 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-format-converter/ | 이미지 포맷 변환 | 할 일 |  |  |
| 261 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/image-rotate-flip/ | 이미지 회전 | 할 일 |  |  |
| 262 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/favicon-generator/ | 파비콘 생성기 | 할 일 |  |  |
| 263 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/projects/polaroid-studio/ | 폴라로이드 사진 생성기 | 할 일 |  |  |
| 264 | 사진·문서 | 디자인·색상·이미지 / 이미지·파일 | https://roberin.com/black-and-white-photo-generator/ | 흑백사진 변환기 | 할 일 |  |  |
| 265 | 텍스트·개발 | 디자인·색상·이미지 / CSS 효과 | https://roberin.com/gradient-generator/ | CSS 그라데이션 생성기 | 할 일 |  |  |
| 266 | 텍스트·개발 | 디자인·색상·이미지 / CSS 효과 | https://roberin.com/projects/shadow-generator/ | CSS 그림자 효과 생성기 | 할 일 |  |  |
| 267 | 텍스트·개발 | 디자인·색상·이미지 / CSS 효과 | https://roberin.com/projects/random-gradient-generator/ | 랜덤 그라데이션 생성기 | 할 일 |  |  |
| 268 | 텍스트·개발 | 디자인·색상·이미지 / CSS 효과 | https://roberin.com/monitor-pixel-test/ | 모니터 불량화소 테스트 | 할 일 |  |  |
| 269 | 텍스트·개발 | 디자인·색상·이미지 / CSS 효과 | https://roberin.com/projects/dpi-calculator/ | 스마트 DPI & 인쇄 해상도 계산기 | 할 일 |  |  |
| 270 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/html-to-markdown-converter/ | HTML Markdown 변환기 | 할 일 |  |  |
| 271 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/pdf-text-extractor/ | PDF 텍스트 추출기 | 할 일 |  |  |
| 272 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/social-space-generator/ | SNS 공백 생성기 | 할 일 |  |  |
| 273 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/sns-character-counter/ | SNS 글자 수 계산기 | 할 일 |  |  |
| 274 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/text-to-txt/ | TXT 파일 만들기 | 할 일 |  |  |
| 275 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/letter-spacing-adjuster/ | 글자 간격 조절기 | 할 일 |  |  |
| 276 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/character-counter/ | 글자수세기 | 할 일 |  |  |
| 277 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/neis-character-counter/ | 나이스(NEIS) 글자수 계산기 | 할 일 |  |  |
| 278 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/case-converter/ | 대소문자 변환기 | 할 일 |  |  |
| 279 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/roman-numeral-converter/ | 로마 숫자 변환기 | 할 일 |  |  |
| 280 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/markdown-converter/ | 마크다운 to HTML 변환기 | 할 일 |  |  |
| 281 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/markdown-table-csv-converter/ | 마크다운 표 CSV 변환기 | 할 일 |  |  |
| 282 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/unicode-codepoint-converter/ | 문자 ↔ 코드포인트 변환기 | 할 일 |  |  |
| 283 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/uppercase-converter/ | 영어 대문자 변환기 | 할 일 |  |  |
| 284 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/email-template-builder/ | 이메일 템플릿 생성기 | 할 일 |  |  |
| 285 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/text-repeater/ | 텍스트 반복기 | 할 일 |  |  |
| 286 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/text-comparator/ | 텍스트 비교기 | 할 일 |  |  |
| 287 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/projects/text-reverse-converter/ | 텍스트 역순 변환기 | 할 일 |  |  |
| 288 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/text-replacer/ | 텍스트 일괄 치환기 | 할 일 |  |  |
| 289 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 텍스트·문자 | https://roberin.com/text-cleaner/ | 텍스트 정리기 | 할 일 |  |  |
| 290 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-clamp-generator/ | CSS clamp() 생성기 | 할 일 |  |  |
| 291 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-flexbox-playground/ | CSS Flexbox 실험판 | 할 일 |  |  |
| 292 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-grid-generator/ | CSS Grid 생성기 | 할 일 |  |  |
| 293 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-unit-converter/ | CSS 단위 변환기 | 할 일 |  |  |
| 294 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-border-radius-preview/ | CSS 둥근 모서리 미리보기 | 할 일 |  |  |
| 295 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/css-formatter/ | CSS 코드 정리기 | 할 일 |  |  |
| 296 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/html-tag-remover/ | HTML 태그 제거기 | 할 일 |  |  |
| 297 | 텍스트·개발 | 문서·텍스트·개발 유틸 / HTML·CSS 개발 | https://roberin.com/json-formatter/ | JSON 정리·압축기 | 할 일 |  |  |
| 298 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-splitter/ | PDF 분할·페이지 추출 | 할 일 |  |  |
| 299 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-password-protect/ | PDF 암호 설정 | 할 일 |  |  |
| 300 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-watermark/ | PDF 워터마크 추가 | 할 일 |  |  |
| 301 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-unlock/ | PDF 잠금 해제 | 할 일 |  |  |
| 302 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-page-numbering/ | PDF 페이지 번호 넣기 | 할 일 |  |  |
| 303 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-page-deletion/ | PDF 페이지 삭제 도구 | 할 일 |  |  |
| 304 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-page-rotator/ | PDF 페이지 회전기 | 할 일 |  |  |
| 305 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/pdf-merge/ | PDF 합치기 | 할 일 |  |  |
| 306 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/qr-generator-wrapper/ | QR 코드 생성기 | 할 일 |  |  |
| 307 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/jpg-to-pdf/ | 사진·JPG → PDF 변환기 | 할 일 |  |  |
| 308 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/projects/number-base-converter/ | 숫자 진법 변환기 | 할 일 |  |  |
| 309 | 사진·문서 | 문서·텍스트·개발 유틸 / PDF·QR·파일 | https://roberin.com/file-batch-renamer/ | 파일 이름 일괄 변경 도구 | 할 일 |  |  |
| 310 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/daily-time-wheel/ | 24시간 원형 시간표 만들기 | 할 일 |  |  |
| 312 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/base64-encoder-decoder/ | Base64 인코더·디코더 | 할 일 |  |  |
| 313 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/dsr-calculator/ | DSR계산기 | 할 일 |  |  |
| 314 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/exif-metadata-remover/ | EXIF 위치정보 제거기 | 할 일 |  |  |
| 315 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/gif-maker/ | GIF 만들기 편집기 | 할 일 |  |  |
| 316 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/json-validator-tree-viewer/ | JSON 검사·트리뷰어 | 할 일 |  |  |
| 317 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/jwt-decoder/ | JWT 디코더 | 할 일 |  |  |
| 318 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/lorem-ipsum-generator/ | Lorem Ipsum 생성기 | 할 일 |  |  |
| 319 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/sha256-hash-comparator/ | SHA-256 해시 대조기 | 할 일 |  |  |
| 320 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/url-encoder-decoder/ | URL 인코더·디코더 | 할 일 |  |  |
| 321 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/url-query-table/ | URL 쿼리 ↔ 항목 표 | 할 일 |  |  |
| 322 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/uuid-generator/ | UUID v4 생성기 | 할 일 |  |  |
| 323 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/time-overlap-exclusion-calculator/ | 겹치는 시간 제외 합산기 | 할 일 |  |  |
| 324 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/shift-overlap-calculator/ | 교대 근무 겹침·공백 계산기 | 할 일 |  |  |
| 325 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/period-end-time-calculator/ | 교시 종료 시각 계산기 | 할 일 |  |  |
| 326 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/my-ip-checker/ | 내 아이피 확인하기 | 할 일 |  |  |
| 327 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/wallpaper-cost-calculator/ | 도배 비용 계산기 | 할 일 |  |  |
| 328 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/video-to-gif/ | 동영상 GIF 변환기 | 할 일 |  |  |
| 329 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/deadline-time-calculator/ | 마감 시각 역산기 | 할 일 |  |  |
| 330 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/mouse-test/ | 마우스 테스트 | 할 일 |  |  |
| 331 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/microphone-test/ | 마이크 테스트 | 할 일 |  |  |
| 332 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/margin-calculator/ | 마진율·목표 판매가 계산기 | 할 일 |  |  |
| 333 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/morse-code-translator/ | 모스부호 번역기 | 할 일 |  |  |
| 334 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/barcode-generator/ | 바코드 생성기 | 할 일 |  |  |
| 335 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/barcode-scanner/ | 바코드 스캐너 | 할 일 |  |  |
| 336 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/repeating-time-list-calculator/ | 반복 시각 목록 계산기 | 할 일 |  |  |
| 337 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/reaction-time-test/ | 반응속도 테스트 | 할 일 |  |  |
| 338 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/password-generator/ | 비밀번호 생성기 | 할 일 |  |  |
| 340 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/win-rate-calculator/ | 승률계산기 | 할 일 |  |  |
| 341 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/time-allocation-calculator/ | 시간 배분 계산기 | 할 일 |  |  |
| 342 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/weekly-timetable/ | 시간표 만들기 | 할 일 |  |  |
| 343 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/time-interval-sum-calculator/ | 여러 구간 시간 합산기 | 할 일 |  |  |
| 344 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/common-availability-calculator/ | 여러 사람 공통 가능 시간 계산기 | 할 일 |  |  |
| 345 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/audio-cutter/ | 오디오·MP3 자르기 | 할 일 |  |  |
| 346 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/online-stamp-maker/ | 온라인 도장 만들기 | 할 일 |  |  |
| 347 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/online-metronome/ | 온라인 메트로놈 | 할 일 |  |  |
| 348 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/webcam-test/ | 웹캠 테스트 | 할 일 |  |  |
| 351 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/seat-arrangement-generator/ | 자리배치 프로그램 | 할 일 |  |  |
| 352 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/work-end-time-calculator/ | 작업 종료 시각 계산기 | 할 일 |  |  |
| 353 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/military-discharge-calculator/ | 전역일 계산기 | 할 일 |  |  |
| 354 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/electronic-signature-maker/ | 전자서명 이미지 만들기 | 할 일 |  |  |
| 355 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/regex-tester/ | 정규식 테스터 | 할 일 |  |  |
| 356 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/draw-lots/ | 제비뽑기 | 할 일 |  |  |
| 357 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/weekly-business-hours-calculator/ | 주간 영업시간 계산기 | 할 일 |  |  |
| 358 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/electricity-bill-calculator/ | 주택용 전기요금 계산기 | 할 일 |  |  |
| 360 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/keyboard-test/ | 키보드 입력 테스트 | 할 일 |  |  |
| 361 | 텍스트·개발 | 문서·텍스트·개발 유틸 / 기타 문서·유틸 | https://roberin.com/tournament-bracket-generator/ | 토너먼트 대진표 만들기 | 할 일 |  |  |
| 362 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/babip-calculator/ | BABIP 계산기 | 할 일 |  |  |
| 363 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/ops-plus-calculator/ | OPS+ 계산기 | 할 일 |  |  |
| 364 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/woba-calculator/ | wOBA 계산기(가중 출루율) | 할 일 |  |  |
| 365 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/baseball-ops-calculator/ | 야구 OPS 계산기 (출루율+장타율) | 할 일 |  |  |
| 366 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/rbi-efficiency-calculator/ | 야구 RBI 효율성 계산기 | 할 일 |  |  |
| 367 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/baseball-risp-batting-average-calculator/ | 야구 득점권 타율 계산기 | 할 일 |  |  |
| 368 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/baseball-slugging-calculator/ | 야구 장타율 계산기 | 할 일 |  |  |
| 369 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/baseball-batting-average-calculator/ | 야구 종합 타율 계산기 | 할 일 |  |  |
| 370 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/baseball-obp-calculator/ | 야구 출루율 계산기 | 할 일 |  |  |
| 371 | 생활·재미 | 스포츠·야구 / 타격 지표 | https://roberin.com/projects/baseball-stats-calculator/ | 야구 타율 계산기 | 할 일 |  |  |
| 372 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/bb9-calculator/ | BB/9 계산기 | 할 일 |  |  |
| 373 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/k9-calculator/ | K/9 계산기 (9이닝당 탈삼진) | 할 일 |  |  |
| 374 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/projects/kbb-ratio-calculator/ | K/BB 비율 계산기 | 할 일 |  |  |
| 375 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/projects/baseball-whip-calculator/ | 야구 WHIP 계산기 | 할 일 |  |  |
| 376 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/projects/baseball-pitcher-split-calculator/ | 야구 스플릿 계산기 | 할 일 |  |  |
| 377 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/projects/baseball-fip-calculator/ | 야구 투수 FIP 계산기 | 할 일 |  |  |
| 378 | 생활·재미 | 스포츠·야구 / 투수 지표 | https://roberin.com/projects/baseball-era-calculator/ | 야구 평균자책점 계산기 (ERA) | 할 일 |  |  |
| 379 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/projects/basketball-foul-counter/ | 농구 파울 카운터 | 할 일 |  |  |
| 380 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/projects/stolen-base-calculator/ | 도루 성공률 계산기 | 할 일 |  |  |
| 381 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/projects/fielding-percentage-calculator/ | 야구 수비율 계산기 | 할 일 |  |  |
| 382 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/pythagorean-win-calculator/ | 야구 피타고리안 승률 계산기 | 할 일 |  |  |
| 383 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/projects/scoreboard/ | 온라인 스코어 보드 | 할 일 |  |  |
| 384 | 생활·재미 | 스포츠·야구 / 팀·수비 | https://roberin.com/projects/soccer-calorie-calculator/ | 축구 칼로리 계산기 | 할 일 |  |  |
| 385 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/fall-baseball-calculator/ | KBO 가을야구 매직넘버 계산기 | 할 일 |  |  |
| 386 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/iso-calculator/ | 야구 ISO 계산기 | 할 일 |  |  |
| 387 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/baseball-runs-created-calculator/ | 야구 RC 계산기 | 할 일 |  |  |
| 388 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/baseball-war-calculator/ | 야구 WAR 계산기 | 할 일 |  |  |
| 389 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/baseball-magic-calculator/ | 야구 매직 넘버 계산기 | 할 일 |  |  |
| 390 | 생활·재미 | 스포츠·야구 / 기타 스포츠 | https://roberin.com/projects/baseball-contact-analyzer/ | 야구 컨택트 분석기 | 할 일 |  |  |
| 391 | 생활·재미 | 반려동물 / 강아지·고양이 | https://roberin.com/dog-age-calculator/ | 강아지 나이 계산기 | 할 일 |  |  |
| 392 | 생활·재미 | 반려동물 / 강아지·고양이 | https://roberin.com/projects/dog-pregnancy-calculator/ | 강아지 임신 기간 계산기 | 할 일 |  |  |
| 393 | 생활·재미 | 반려동물 / 강아지·고양이 | https://roberin.com/projects/cat-age-calculator/ | 고양이 나이 계산기 | 할 일 |  |  |
| 394 | 생활·재미 | 반려동물 / 강아지·고양이 | https://roberin.com/projects/cat-pregnancy-calculator/ | 고양이 임신 기간 계산기 | 할 일 |  |  |
| 395 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/gecko-feeding-calculator/ | 게코 먹이 급여 가이드 | 할 일 |  |  |
| 396 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/hedgehog-age-calculator/ | 고슴도치 나이 계산기 | 할 일 |  |  |
| 397 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/guinea-pig-age-calculator/ | 기니피그 나이 계산기 | 할 일 |  |  |
| 398 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/lizard-age-calculator/ | 도마뱀 나이 계산기 | 할 일 |  |  |
| 399 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/owl-age-calculator/ | 부엉이 나이 계산기 | 할 일 |  |  |
| 400 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/parrot-age-calculator/ | 앵무새 나이 계산기 | 할 일 |  |  |
| 401 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/chinchilla-age-calculator/ | 친칠라 나이 계산기 | 할 일 |  |  |
| 402 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/rabbit-age-calculator/ | 토끼 나이 계산기 | 할 일 |  |  |
| 403 | 생활·재미 | 반려동물 / 소동물·조류·파충류 | https://roberin.com/projects/hamster-age-calculator/ | 햄스터 나이 계산기 | 할 일 |  |  |
| 404 | 생활·재미 | 반려동물 / 기타 반려동물 | https://roberin.com/pet-vaccination-schedule/ | 반려동물 예방접종 일정 계산기 | 할 일 |  |  |
| 405 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/projects/coin-flip/ | 동전 던지기(랜덤) | 할 일 |  |  |
| 406 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/random-roulette-spinner/ | 랜덤 룰렛 돌리기 | 할 일 |  |  |
| 407 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/random-number-generator/ | 랜덤 숫자 뽑기 | 할 일 |  |  |
| 408 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/projects/emoji-picker/ | 랜덤 이모티콘 뽑기 | 할 일 |  |  |
| 409 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/random-team-generator/ | 랜덤 팀 나누기·조짜기 | 할 일 |  |  |
| 410 | 생활·재미 | 게임·랜덤·재미 / 랜덤·선택 | https://roberin.com/projects/online-dice-roller/ | 온라인 주사위 굴리기 & 분석기 | 할 일 |  |  |
| 411 | 생활·재미 | 게임·랜덤·재미 / 게임·퍼즐 | https://roberin.com/gamepad-test/ | 게임패드 테스트 | 할 일 |  |  |
| 412 | 생활·재미 | 게임·랜덤·재미 / 게임·퍼즐 | https://roberin.com/projects/maze-generator/ | 미로 생성기 | 할 일 |  |  |
| 413 | 생활·재미 | 게임·랜덤·재미 / 게임·퍼즐 | https://roberin.com/color-quiz/ | 색상 코드 퀴즈 | 할 일 |  |  |
| 414 | 생활·재미 | 게임·랜덤·재미 / 게임·퍼즐 | https://roberin.com/projects/sudoku-generator/ | 온라인 스도쿠 생성기 | 할 일 |  |  |
| 415 | 생활·재미 | 게임·랜덤·재미 / 이모지·재미 | https://roberin.com/zodiac-calculator/ | 별자리 계산기 | 할 일 |  |  |
| 416 | 생활·재미 | 게임·랜덤·재미 / 이모지·재미 | https://roberin.com/projects/emoji-copier/ | 이모티콘 복사기 | 할 일 |  |  |
| 417 | 생활·재미 | 여행·이동·생활 생산성 / 여행·이동 | https://roberin.com/travel-time-calculator/ | 거리별 소요시간 계산기 | 할 일 |  |  |
| 418 | 생활·재미 | 여행·이동·생활 생산성 / 여행·이동 | https://roberin.com/airport-leave-time-calculator/ | 공항 출발 시각 계산기 | 할 일 |  |  |
| 419 | 생활·재미 | 여행·이동·생활 생산성 / 여행·이동 | https://roberin.com/jetlag-helper/ | 시차 적응 도우미 | 할 일 |  |  |
| 420 | 생활·재미 | 여행·이동·생활 생산성 / 여행·이동 | https://roberin.com/travel-budget-calculator/ | 여행 경비 계산기 | 할 일 |  |  |
| 421 | 날짜·시간 | 여행·이동·생활 생산성 / 회의·시간대 | https://roberin.com/airport-timezone-calculator/ | 공항 시차 & 비행시간 계산기 | 할 일 |  |  |
| 422 | 날짜·시간 | 여행·이동·생활 생산성 / 회의·시간대 | https://roberin.com/projects/world-time-zone-monitor/ | 세계 시차 모니터 | 할 일 |  |  |
| 423 | 날짜·시간 | 여행·이동·생활 생산성 / 회의·시간대 | https://roberin.com/world-meeting-time-calculator/ | 세계 회의 시간 계산기 | 할 일 |  |  |
| 424 | 날짜·시간 | 여행·이동·생활 생산성 / 회의·시간대 | https://roberin.com/projects/meeting-timer/ | 회의 타이머 | 할 일 |  |  |
| 425 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/projects/decision-helper/ | 결정 도우미(선택 장애 해결) | 할 일 |  |  |
| 426 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/book-reading-tracker/ | 독서 계획 계산기 | 할 일 |  |  |
| 427 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/projects/bucket-timeline/ | 버킷리스트 타임라인 만들기 | 할 일 |  |  |
| 428 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/projects/habit-master-calculator/ | 습관 마스터 계산기 | 할 일 |  |  |
| 429 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/projects/time-saver/ | 절약 시간 시각화 도구 | 할 일 |  |  |
| 430 | 날짜·시간 | 여행·이동·생활 생산성 / 집중·습관 | https://roberin.com/pomodoro/ | 포모도로 타이머 | 할 일 |  |  |
| 431 | 생활·재미 | 여행·이동·생활 생산성 / 기타 생활 생산성 | https://roberin.com/fuel-cost-calculator/ | 기름값 계산기 | 할 일 |  |  |
| 432 | 생활·재미 | 여행·이동·생활 생산성 / 기타 생활 생산성 | https://roberin.com/fuel-efficiency-calculator/ | 연비 계산기 | 할 일 |  |  |
