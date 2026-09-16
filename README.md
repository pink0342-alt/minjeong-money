# 민정머니 v0.1 💸

개인용 주간예산 가계부 PWA.

## 들어간 기능
- 주간 기본예산: 기본 100,000원 / 월~일
- 이번 주 남은 돈 자동 계산
- 남은 주간예산 ÷ 오늘 포함 남은 날짜 = 오늘 써도 되는 돈
- 날짜 / 1원 단위 금액 / 카테고리 / 메모 지출 입력
- 카테고리 직접 추가·삭제
- 월간 별도항목: 주간예산과 분리해서 관리
- 달력에서 날짜별 지출 확인
- 월별 총지출 / 카테고리 통계 / 별도항목 사용액
- JSON 백업·복원
- 갤럭시 ↔ 아이패드 Supabase 동기화
- 동기화 payload는 브라우저에서 AES-GCM으로 암호화 후 서버 저장

## GitHub Pages
새 저장소(예: `minjeong-money`)를 만들고 이 폴더의 파일을 전부 업로드한 뒤 Pages를 `main / (root)`로 배포합니다.

## Supabase 동기화
1. Supabase SQL Editor에서 `supabase-setup.sql` 전체를 실행합니다.
2. 앱 설정에서 Project URL + **Publishable key** + 동기화 코드를 입력합니다.
3. `연결 정보 저장` → `지금 동기화`.
4. 다른 기기에도 같은 세 값을 넣습니다.

### 중요
- Secret key / service_role key / DB password는 앱이나 GitHub에 절대 넣지 않습니다.
- 동기화 코드는 앱의 `코드 생성` 버튼으로 만든 긴 랜덤 코드를 권장합니다.
- 가계부 payload는 암호화되어 Supabase에 저장됩니다.
