# Warehouse ERP - UI 기능 명세서

이 문서는 Warehouse ERP 시스템의 모든 사용자 대면 기능을 정리한 명세서입니다.

---

## 1. 인증 관련 기능

### 1.1 로그인

#### 기능 설명
사용자가 이메일과 비밀번호를 입력하여 시스템에 로그인합니다.

#### 주요 UI 컴포넌트
- 이메일 입력 필드
- 비밀번호 입력 필드
- 로그인 버튼
- 회원가입 링크
- 데모 계정 정보 표시 (Super Admin, Company Admin)
- 성공/에러 메시지 표시 영역

#### 사용자 인터랙션 흐름
1. 사용자가 로그인 페이지 접속
2. 이메일과 비밀번호 입력
3. "Sign in" 버튼 클릭
4. 로그인 성공 시:
   - SUPER_ADMIN → `/admin/companies`로 이동
   - 회사 미할당 사용자 → `/setup-company`로 이동
   - 일반 사용자 → `/dashboard`로 이동
5. 로그인 실패 시 에러 메시지 표시

#### 관련 코드 위치
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/lib/hooks/use-auth.ts`

---

### 1.2 회원가입

#### 기능 설명
신규 사용자가 계정을 생성하고, 선택적으로 초대 코드를 통해 기존 회사에 가입할 수 있습니다.

#### 주요 UI 컴포넌트
- 이름 입력 필드 (Full Name)
- 이메일 입력 필드
- 비밀번호 입력 필드
- 비밀번호 확인 입력 필드
- 초대 코드 입력 필드 (선택사항)
- 회원가입 버튼
- 로그인 링크
- 에러 메시지 표시 영역

#### 사용자 인터랙션 흐름
1. 사용자가 회원가입 페이지 접속
2. 필수 정보 입력 (이름, 이메일, 비밀번호, 비밀번호 확인)
3. 선택적으로 초대 코드 입력 (8자리 대문자)
4. "Create account" 또는 "가입 및 회사 참여하기" 버튼 클릭
5. 회원가입 성공 후 자동 로그인
6. 초대 코드 입력 시:
   - 유효한 코드 → 회사 가입 후 `/dashboard`로 이동
   - 유효하지 않은 코드 → 에러 메시지 표시 후 `/setup-company`로 이동
7. 초대 코드 미입력 시 → `/setup-company`로 이동

#### 관련 코드 위치
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/lib/validations/auth.ts`

---

### 1.3 회사 설정

#### 기능 설명
회원가입 후 회사가 할당되지 않은 사용자가 새 회사를 생성하거나 기존 회사에 가입할 수 있습니다.

#### 주요 UI 컴포넌트
- 새 회사 생성 버튼
- 기존 회사 가입 버튼

#### 사용자 인터랙션 흐름
1. 사용자가 회사 설정 페이지 접속
2. 두 가지 옵션 선택:
   - "새 회사 생성" → `/setup-company/create`로 이동
   - "기존 회사 가입" → `/setup-company/join`로 이동

#### 관련 코드 위치
- `frontend/src/app/(auth)/setup-company/page.tsx`
- `frontend/src/app/(auth)/setup-company/create/page.tsx`
- `frontend/src/app/(auth)/setup-company/join/page.tsx`

---

## 2. 대시보드

### 2.1 메인 대시보드

#### 기능 설명
시스템의 전체 현황을 한눈에 확인할 수 있는 중앙 대시보드입니다.

#### 주요 UI 컴포넌트
- 통계 카드 4개:
  - 총 아이템 수 (📦)
  - 창고 수 (🏭)
  - 30일간 거래 수 (📊)
  - 저재고 아이템 수 (⚠️)
- 저재고 알림 배너 (조건부 표시)
- 최근 거래 내역 테이블
- 로딩 스켈레톤

#### 사용자 인터랙션 흐름
1. 사용자가 로그인 후 대시보드 접속
2. 실시간 통계 데이터 자동 로드
3. 저재고 아이템이 있을 경우 상단에 경고 배너 표시
4. 최근 거래 내역 확인
5. 각 통계 카드 클릭 시 해당 상세 페이지로 이동 가능

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/components/features/dashboard/stats-card.tsx`
- `frontend/src/components/features/dashboard/recent-transactions.tsx`
- `frontend/src/components/features/dashboard/low-stock-alerts.tsx`
- `frontend/src/lib/hooks/use-dashboard.ts`

---

## 3. 창고 관리

### 3.1 창고 목록

#### 기능 설명
모든 창고를 조회하고 검색하며, 새로운 창고를 추가하거나 기존 창고를 삭제할 수 있습니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- 창고 추가 버튼 (우측 상단)
- 검색 입력 필드 (창고명 또는 위치로 검색)
- 창고 카드 그리드 (2-3열 반응형 레이아웃)
- 창고 카드 컴포넌트 (각 창고별):
  - 창고명
  - 위치
  - 용량 정보
  - 상세보기 버튼
  - 삭제 버튼
- 창고 삭제 확인 다이얼로그
- 로딩 스피너
- 에러 메시지

#### 사용자 인터랙션 흐름
1. 사용자가 창고 관리 페이지 접속
2. 모든 창고 목록 자동 로드
3. 검색어 입력 시 실시간 필터링
4. "창고 추가" 버튼 클릭 → 창고 추가 모달 열림
5. 창고 카드의 "상세보기" 클릭 → 창고 상세 페이지로 이동
6. 창고 카드의 "삭제" 클릭 → 삭제 확인 다이얼로그 표시
7. 삭제 확인 → 창고 삭제 및 목록 갱신

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/warehouses/page.tsx`
- `frontend/src/components/features/warehouse/warehouse-card.tsx`
- `frontend/src/components/features/warehouse/add-warehouse-modal.tsx`
- `frontend/src/lib/hooks/use-warehouses.ts`

---

### 3.2 창고 상세

#### 기능 설명
특정 창고의 상세 정보와 재고 현황을 확인하고 관리합니다.

#### 주요 UI 컴포넌트
- 뒤로가기 버튼
- 창고명 및 위치 정보 헤더
- "New Transaction" 버튼
- 통계 카드 3개:
  - 총 아이템 수
  - 용량 사용률 (프로그레스 바 포함)
  - 저재고 아이템 수
- 재고 현황 테이블
- 거래 생성 모달

#### 사용자 인터랙션 흐름
1. 사용자가 창고 목록에서 특정 창고 선택
2. 창고 상세 페이지로 이동
3. 창고 정보 및 통계 자동 로드
4. 재고 현황 테이블 확인
5. "New Transaction" 버튼 클릭 → 거래 생성 모달 열림 (해당 창고 기본 선택)
6. 뒤로가기 버튼 클릭 → 창고 목록으로 이동

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/warehouses/[id]/page.tsx`
- `frontend/src/components/features/warehouse/inventory-table.tsx`
- `frontend/src/lib/hooks/use-warehouses.ts`
- `frontend/src/lib/hooks/use-inventory.ts`

---

## 4. 아이템 관리

### 4.1 아이템 목록 및 관리

#### 기능 설명
모든 재고 아이템을 조회하고, 검색 및 필터링하며, 새로운 아이템을 등록하거나 기존 아이템을 수정/삭제합니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- "아이템 등록" 버튼 (우측 상단)
- 검색 입력 필드 (SKU, 이름, 카테고리로 검색)
- 카테고리 필터 입력 필드
- 아이템 테이블:
  - SKU
  - 이름
  - 카테고리
  - 단위
  - 재주문 기준
  - 수정/삭제 버튼
- 아이템 등록/수정 모달
- 아이템 삭제 확인 다이얼로그
- 로딩 상태 표시

#### 사용자 인터랙션 흐름
1. 사용자가 아이템 관리 페이지 접속
2. 모든 아이템 목록 자동 로드
3. 검색어 또는 카테고리 입력 시 실시간 필터링
4. "아이템 등록" 버튼 클릭 → 아이템 등록 모달 열림
5. 아이템 정보 입력 후 등록
6. 테이블에서 "수정" 버튼 클릭 → 아이템 수정 모달 열림
7. 테이블에서 "삭제" 버튼 클릭 → 삭제 확인 다이얼로그 표시
8. 삭제 확인 → 아이템 삭제 및 목록 갱신

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/items/page.tsx`
- `frontend/src/components/features/item/item-table.tsx`
- `frontend/src/components/features/item/register-item-modal.tsx`
- `frontend/src/lib/hooks/use-items.ts`

---

## 5. 거래 관리

### 5.1 거래 내역

#### 기능 설명
모든 입출고 거래 내역을 조회하고, 다양한 조건으로 필터링하며, 새로운 거래를 등록합니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- "거래 등록" 버튼 (우측 상단)
- 거래 필터 컴포넌트:
  - 거래 유형 선택 (입고/출고)
  - 창고 선택
  - 아이템 선택
  - 시작 날짜
  - 종료 날짜
- 거래 내역 테이블:
  - 거래 유형 (INBOUND/OUTBOUND)
  - 아이템명
  - 창고명
  - 수량
  - 거래 날짜
  - 상세보기 버튼
- 거래 상세 모달
- 거래 생성 모달
- 로딩/에러 상태 표시
- 거래 건수 표시

#### 사용자 인터랙션 흐름
1. 사용자가 거래 내역 페이지 접속
2. 모든 거래 내역 자동 로드
3. 필터 조건 선택 시 실시간 필터링
4. "거래 등록" 버튼 클릭 → 거래 생성 모달 열림
5. 거래 정보 입력 (유형, 창고, 아이템, 수량 등) 후 등록
6. 테이블에서 거래 행 클릭 → 거래 상세 모달 열림
7. 거래 상세 정보 확인

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/transactions/page.tsx`
- `frontend/src/components/features/transaction/transaction-table.tsx`
- `frontend/src/components/features/transaction/transaction-filters.tsx`
- `frontend/src/components/features/transaction/create-transaction-modal.tsx`
- `frontend/src/components/features/transaction/transaction-detail-modal.tsx`
- `frontend/src/lib/hooks/use-transactions.ts`

---

## 6. 재고 현황

### 6.1 재고 요약

#### 기능 설명
아이템별 총 재고량과 창고별 재고 분포를 한눈에 확인합니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- 요약 카드 3개:
  - 총 아이템 수
  - 총 재고량
  - 재주문 필요 아이템 수
- 재고 현황 테이블:
  - 확장/축소 버튼
  - SKU
  - 아이템명
  - 카테고리
  - 단위
  - 총 재고량
  - 재주문 기준
  - 상태 배지 (정상/재주문 필요)
- 확장 영역 (창고별 재고 분포):
  - 창고명
  - 창고 위치
  - 재고량
- 로딩 상태 표시

#### 사용자 인터랙션 흐름
1. 사용자가 재고 현황 페이지 접속
2. 모든 아이템의 재고 요약 자동 로드
3. 요약 카드에서 전체 통계 확인
4. 테이블에서 아이템별 재고 현황 확인
5. 아이템 행의 확장 버튼 클릭 → 창고별 재고 분포 표시
6. 재주문 필요 아이템 시각적 구분 (빨간색 배지)

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/stock-summary/page.tsx`
- `frontend/src/lib/hooks/use-items.ts`

---

## 7. 알림

### 7.1 알림 페이지

#### 기능 설명
사용자에게 전송된 모든 알림을 확인하고 관리합니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- "모두 읽음 표시" 버튼 (읽지 않은 알림이 있을 경우)
- 필터 버튼:
  - 전체 (전체 알림 수)
  - 읽지 않음 (읽지 않은 알림 수)
  - 읽음 (읽은 알림 수)
- 알림 목록:
  - 읽음/읽지 않음 인디케이터 (파란점/회색점)
  - 알림 제목
  - 알림 메시지
  - 생성 시간 (상대 시간)
  - 읽은 시간 (읽은 알림인 경우)
  - "읽음" 버튼 (읽지 않은 알림인 경우)
- 총 알림 수 표시
- 로딩 상태 표시
- 빈 상태 메시지

#### 사용자 인터랙션 흐름
1. 사용자가 알림 페이지 접속
2. 모든 알림 목록 자동 로드
3. 필터 선택 (전체/읽지 않음/읽음)
4. 알림 클릭:
   - 읽지 않은 알림 → 읽음으로 표시
   - 관련 페이지로 자동 이동 (창고/아이템/거래)
5. 개별 "읽음" 버튼 클릭 → 해당 알림만 읽음 처리
6. "모두 읽음 표시" 버튼 클릭 → 모든 알림 읽음 처리

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/notifications/page.tsx`
- `frontend/src/components/notifications/notifications-dropdown.tsx` (Navbar 드롭다운)
- `frontend/src/hooks/use-notifications-sse.ts` (실시간 알림)

---

## 8. 설정

### 8.1 사용자 설정

#### 기능 설명
사용자의 프로필 정보와 애플리케이션 환경설정을 관리합니다.

#### 주요 UI 컴포넌트
- 페이지 헤더 (제목, 설명)
- 탭 네비게이션:
  - 프로필 탭
  - 환경설정 탭
- 프로필 설정 카드:
  - 프로필 설정 컴포넌트 (이름 변경, 비밀번호 변경)
- 환경설정 카드:
  - 환경설정 컴포넌트

#### 사용자 인터랙션 흐름
1. 사용자가 설정 페이지 접속
2. 기본적으로 "프로필" 탭 선택
3. 프로필 탭에서:
   - 이름 변경 폼
   - 비밀번호 변경 폼
   - 각 폼 제출 시 저장
4. "환경설정" 탭 클릭
5. 환경설정 탭에서:
   - 애플리케이션 관련 설정 변경

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/settings/page.tsx`
- `frontend/src/components/features/settings/profile-settings.tsx`
- `frontend/src/components/features/settings/preferences-settings.tsx`

---

## 9. 관리 기능

### 9.1 관리 페이지 (ADMIN 전용)

#### 기능 설명
회사 관리자가 사용자 및 회사 설정을 관리할 수 있는 페이지입니다.

#### 주요 UI 컴포넌트
- (구체적인 컴포넌트는 코드 확인 필요)

#### 사용자 인터랙션 흐름
1. ADMIN 권한을 가진 사용자만 접근 가능
2. 사용자 관리 및 회사 설정 기능 제공

#### 관련 코드 위치
- `frontend/src/app/(dashboard)/management/page.tsx`

---

## 10. 레이아웃 및 네비게이션

### 10.1 사이드바

#### 기능 설명
애플리케이션의 주요 페이지로 이동할 수 있는 좌측 네비게이션 메뉴입니다.

#### 주요 UI 컴포넌트
- 로고 영역
- 메뉴 항목:
  - Dashboard (홈 아이콘)
  - Warehouses (창고 아이콘)
  - Items (패키지 아이콘)
  - Stock Summary (클립보드 아이콘)
  - Transactions (히스토리 아이콘)
  - Notifications (벨 아이콘)
  - Settings (설정 아이콘)
  - Management (사용자 아이콘, ADMIN 전용)

#### 사용자 인터랙션 흐름
1. 로그인 후 모든 페이지에서 사이드바 표시
2. 메뉴 항목 클릭 → 해당 페이지로 이동
3. 현재 페이지 메뉴 항목 하이라이트

#### 관련 코드 위치
- `frontend/src/components/layout/sidebar.tsx`

---

### 10.2 네비게이션 바

#### 기능 설명
상단에 위치한 네비게이션 바로, 사용자 정보와 알림을 표시합니다.

#### 주요 UI 컴포넌트
- 애플리케이션 제목
- 알림 드롭다운:
  - 벨 아이콘 (읽지 않은 알림 수 배지)
  - 최근 알림 목록 (최대 5개)
  - "모두 보기" 링크
- 사용자 정보:
  - 사용자 이름
  - 로그아웃 버튼

#### 사용자 인터랙션 흐름
1. 로그인 후 모든 페이지 상단에 표시
2. 벨 아이콘 클릭 → 알림 드롭다운 열림
3. 알림 클릭 → 관련 페이지로 이동
4. "모두 보기" 클릭 → 알림 페이지로 이동
5. 로그아웃 버튼 클릭 → 로그아웃 및 로그인 페이지로 이동

#### 관련 코드 위치
- `frontend/src/components/layout/navbar.tsx`
- `frontend/src/components/notifications/notifications-dropdown.tsx`

---

## 11. 공통 UI 패턴

### 11.1 모달/다이얼로그

#### 사용되는 모달
- 창고 추가 모달
- 창고에 아이템 추가 모달
- 아이템 등록/수정 모달
- 거래 생성 모달
- 거래 상세 모달
- 삭제 확인 다이얼로그 (창고, 아이템)

#### 공통 특징
- 배경 어둡게 처리 (오버레이)
- ESC 키 또는 외부 클릭으로 닫기
- 확인/취소 버튼
- 폼 유효성 검사

---

### 11.2 토스트 알림

#### 기능 설명
사용자 액션에 대한 즉각적인 피드백을 제공하는 일시적 알림입니다.

#### 사용 사례
- 성공 메시지 (예: "창고가 성공적으로 추가되었습니다")
- 에러 메시지 (예: "창고 삭제에 실패했습니다")
- 정보 메시지

#### 관련 코드 위치
- `frontend/src/components/ui/sonner.tsx`
- `frontend/src/hooks/use-toast.ts`

---

### 11.3 로딩 상태

#### 구현 방식
- 스켈레톤 UI (데이터 로딩 중)
- 스피너 (전체 페이지 또는 컴포넌트 로딩)
- 버튼 비활성화 (요청 처리 중)

#### 관련 코드 위치
- `frontend/src/components/shared/loading-skeleton.tsx`
- `frontend/src/components/ui/skeleton.tsx`

---

### 11.4 에러 상태

#### 구현 방식
- 에러 메시지 배너 (페이지 상단)
- 인라인 에러 메시지 (폼 필드 하단)
- 에러 페이지 (404, 권한 없음 등)

#### 사용 사례
- API 호출 실패
- 폼 유효성 검사 실패
- 권한 없음
- 데이터 없음

---

## 12. 반응형 디자인

### 브레이크포인트
- 모바일: < 640px (sm)
- 태블릿: 640px - 1024px (md)
- 데스크톱: > 1024px (lg)

### 반응형 특징
- 그리드 레이아웃 자동 조정 (1열 → 2열 → 3-4열)
- 사이드바 축소/확장
- 테이블 가로 스크롤
- 모바일 네비게이션

---

## 13. 접근성

### 구현된 기능
- 키보드 네비게이션 지원
- ARIA 레이블
- 포커스 인디케이터
- 시맨틱 HTML

---

## 14. 실시간 기능

### 14.1 실시간 알림 (Server-Sent Events)

#### 기능 설명
서버에서 발생한 이벤트를 실시간으로 클라이언트에 전송합니다.

#### 알림 유형
- 창고 생성/삭제
- 아이템 생성/삭제
- 거래 생성
- 저재고 경고

#### 사용자 경험
- 새 알림 도착 시 Navbar 벨 아이콘에 배지 표시
- 드롭다운에서 최신 알림 확인
- 토스트 알림으로 즉시 피드백

#### 관련 코드 위치
- `frontend/src/hooks/use-notifications-sse.ts`

---

## 부록: 기술 스택

### Frontend
- **프레임워크**: Next.js 14 (App Router)
- **UI 라이브러리**: shadcn/ui (Radix UI + Tailwind CSS)
- **상태 관리**: React Query (TanStack Query)
- **폼 관리**: React Hook Form + Zod
- **HTTP 클라이언트**: Axios
- **아이콘**: Lucide React
- **토스트**: Sonner
- **타입스크립트**: TypeScript 5.3+

### 라우팅 구조
- **(auth)**: 인증 관련 페이지 (로그인, 회원가입, 회사 설정)
- **(dashboard)**: 메인 대시보드 및 기능 페이지 (인증 필수)
- **(admin)**: 관리자 전용 페이지 (SUPER_ADMIN 전용)

### 권한 체계
- **비인증 사용자**: /login, /register 접근 가능
- **일반 사용자**: /dashboard 및 하위 페이지 접근
- **회사 관리자 (ADMIN)**: Management 페이지 추가 접근
- **슈퍼 관리자 (SUPER_ADMIN)**: /admin 영역 접근

---

**문서 생성 일시**: 2025년 1월

**최종 업데이트**: 코드베이스 전체 분석 완료
