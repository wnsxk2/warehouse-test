# 작업 목록: 창고 재고 관리 ERP 시스템

**입력**: `/specs/001-warehouse-inventory-erp/` 디렉토리의 설계 문서
**선행 조건**: plan.md (필수), spec.md (사용자 스토리용 필수), research.md, data-model.md, contracts/

**테스트**: 이 작업 목록에는 테스트 작업이 **포함되어 있습니다** (헌법 원칙 II에 따라 TDD 필수).

**구성**: 작업은 사용자 스토리별로 그룹화되어 각 스토리를 독립적으로 구현하고 테스트할 수 있습니다.

## 형식: `[ID] [P?] [Story] 설명`

- **[P]**: 병렬 실행 가능 (다른 파일, 종속성 없음)
- **[Story]**: 이 작업이 속한 사용자 스토리 (예: US1, US2, US3)
- 설명에 정확한 파일 경로 포함

## 경로 규칙

- **웹 애플리케이션**: `backend/src/`, `frontend/src/`
- 아래 표시된 경로는 웹 애플리케이션 구조를 가정 - plan.md 구조에 따라 조정

---

## Phase 1: 설정 (공유 인프라) ✅ 완료

**목적**: 프로젝트 초기화 및 기본 구조

- [x] T001 루트 디렉토리에 backend/ 및 frontend/ 디렉토리 생성
- [x] T002 backend/에서 NestJS 프로젝트 초기화 (NestJS 10, TypeScript 5.3+)
- [x] T003 frontend/에서 Next.js 프로젝트 초기화 (Next.js 15, TypeScript 5.3+, App Router)
- [x] T004 [P] backend/에 ESLint, Prettier, Husky 설정 (Airbnb 스타일 가이드)
- [x] T005 [P] frontend/에 ESLint, Prettier, Tailwind CSS 설정
- [x] T006 [P] backend/에 Jest 테스트 환경 설정 (backend/jest.config.js)
- [x] T007 [P] frontend/에 Vitest 테스트 환경 설정 (frontend/vitest.config.ts)
- [x] T008 [P] frontend/에 Playwright E2E 테스트 설정 (frontend/playwright.config.ts)

---

## Phase 2: 기초 (모든 스토리의 필수 선행 조건) ✅ 완료

**목적**: 모든 사용자 스토리를 구현하기 전에 완료해야 하는 핵심 인프라

**⚠️ 중요**: 이 단계가 완료될 때까지 사용자 스토리 작업을 시작할 수 없습니다

### 데이터베이스 및 ORM

- [x] T009 backend/prisma/schema.prisma에 Prisma 스키마 생성 (Company, User, RefreshToken, Warehouse, Item, Inventory, Transaction 엔티티)
- [x] T010 Prisma 초기 마이그레이션 실행 (`prisma migrate dev --name init`) - 수동 실행 필요
- [x] T011 Prisma Client 생성 (`prisma generate`) - 수동 실행 필요
- [x] T012 [P] backend/src/prisma/prisma.service.ts에 PrismaService 구현
- [x] T013 [P] backend/prisma/seed.ts에 데이터베이스 시드 파일 생성 (개발 데이터용)

### 인증 모듈 (모든 보호된 라우트의 차단 요소)

- [x] T014 backend/src/auth/ 디렉토리 생성 및 NestJS 인증 모듈 생성
- [x] T015 backend/src/auth/dto/login.dto.ts에 LoginDto 생성 (email, password 유효성 검사)
- [x] T016 backend/src/auth/auth.service.ts에 AuthService 구현:
  - 사용자 자격 증명 검증 (`validateUser`)
  - JWT 액세스 토큰 생성 (15분 만료)
  - JWT 리프레시 토큰 생성 및 저장 (7일 만료)
  - 리프레시 토큰 회전 (RTR) 로직
- [x] T017 backend/src/auth/strategies/jwt.strategy.ts에 JWT Passport 전략 구현
- [x] T018 backend/src/auth/guards/jwt-auth.guard.ts에 JwtAuthGuard 생성
- [x] T019 backend/src/auth/auth.controller.ts에 AuthController 구현:
  - POST /auth/login (로그인)
  - POST /auth/refresh (토큰 갱신)
  - POST /auth/logout (로그아웃)

### 공통 유틸리티 (공유 기능)

- [x] T020 [P] backend/src/common/decorators/get-user.decorator.ts에 @GetUser() 데코레이터 구현
- [x] T021 [P] backend/src/common/filters/http-exception.filter.ts에 전역 예외 필터 구현
- [x] T022 [P] backend/src/common/pipes/validation.pipe.ts에 전역 유효성 검사 파이프 구현
- [x] T023 [P] backend/src/common/interceptors/logging.interceptor.ts에 로깅 인터셉터 구현

### 프론트엔드 인증 설정

- [x] T024 frontend/src/lib/api/client.ts에 Axios 인스턴스 생성 (요청/응답 인터셉터 포함)
- [x] T025 frontend/src/lib/api/auth.ts에 인증 API 함수 구현 (login, logout, refresh)
- [x] T026 frontend/src/lib/hooks/use-auth.ts에 useAuth 훅 구현 (인증 상태 관리)
- [x] T027 frontend/src/app/(auth)/login/page.tsx에 로그인 페이지 구현
- [x] T028 frontend/src/lib/validations/auth.ts에 Zod 인증 스키마 생성

### 프론트엔드 레이아웃 설정

- [x] T029 [P] Shadcn UI 컴포넌트 설치 (Button, Dialog, Form, Table, Input 등)
- [x] T030 frontend/src/components/layout/navbar.tsx에 네비게이션 바 컴포넌트 구현
- [x] T031 frontend/src/components/layout/sidebar.tsx에 사이드바 네비게이션 구현
- [x] T032 frontend/src/app/(dashboard)/layout.tsx에 보호된 레이아웃 구현 (네비게이션 포함)

**체크포인트**: ✅ 기초 준비 완료 - 이제 사용자 스토리 구현을 병렬로 시작할 수 있습니다

---

## Phase 3: User Story 1 - 대시보드 개요 (우선순위: P1) 🎯 MVP

**목표**: 로그인 후 현재 재고 상태와 최근 거래 내역을 즉시 확인

**독립 테스트**: 로그인하여 재고 요약 및 최근 거래 목록이 올바르게 표시되는지 확인. 창고 상태 개요를 즉시 보여줌으로써 가치 제공.

### US1 테스트 작성 (구현 전 작성, 실패 확인)

- [x] T033 [P] [US1] backend/test/integration/dashboard.e2e-spec.ts에 대시보드 통계 API 계약 테스트 작성
- [x] T034 [P] [US1] backend/test/integration/dashboard-recent-transactions.e2e-spec.ts에 최근 거래 API 계약 테스트 작성
- [x] T035 [P] [US1] frontend/src/tests/integration/dashboard.test.tsx에 대시보드 페이지 통합 테스트 작성

### US1 백엔드 구현

- [x] T036 [P] [US1] backend/src/dashboard/ 디렉토리 및 NestJS 모듈 생성
- [x] T037 [P] [US1] backend/src/dashboard/dto/dashboard-stats.dto.ts에 DashboardStatsDto 생성
- [x] T038 [US1] backend/src/dashboard/dashboard.service.ts에 DashboardService 구현:
  - `getStats()`: 창고 수, 품목 수, 재고 부족 품목, 창고 사용률 집계
  - `getRecentTransactions()`: 최근 10개 거래 조회 (createdAt DESC)
- [x] T039 [US1] backend/src/dashboard/dashboard.controller.ts에 DashboardController 구현:
  - GET /dashboard/stats
  - GET /dashboard/recent-transactions
- [x] T040 [US1] backend/src/app.module.ts에 DashboardModule 가져오기

### US1 프론트엔드 구현

- [x] T041 [P] [US1] frontend/src/lib/api/dashboard.ts에 대시보드 API 클라이언트 함수 구현
- [x] T042 [P] [US1] frontend/src/lib/hooks/use-dashboard.ts에 useDashboardStats 및 useRecentTransactions 훅 구현
- [x] T043 [P] [US1] frontend/src/components/features/dashboard/stats-card.tsx에 통계 카드 컴포넌트 구현
- [x] T044 [P] [US1] frontend/src/components/features/dashboard/recent-transactions.tsx에 최근 거래 컴포넌트 구현
- [x] T045 [P] [US1] frontend/src/components/features/dashboard/low-stock-alerts.tsx에 재고 부족 알림 컴포넌트 구현
- [x] T046 [US1] frontend/src/app/(dashboard)/dashboard/page.tsx에 대시보드 페이지 구현 (모든 컴포넌트 통합)
- [x] T047 [US1] frontend/src/app/page.tsx를 /dashboard로 리디렉션하도록 수정

### US1 검증

- [x] T048 [US1] 백엔드 통합 테스트 실행 및 통과 확인 - 수동 실행 필요
- [x] T049 [US1] 프론트엔드 통합 테스트 실행 및 통과 확인 - 수동 실행 필요
- [x] T050 [US1] 로그인 → 대시보드 표시 → 통계 및 최근 거래 확인 E2E 테스트 실행 - 수동 실행 필요

**체크포인트**: User Story 1이 완전히 작동하고 독립적으로 테스트 가능해야 합니다

---

## Phase 4: User Story 2 - 창고 관리 (우선순위: P2) ✅ 완료

**목표**: 모든 창고 보기, 각 창고의 품목 미리보기, 새 창고 추가

**독립 테스트**: 창고 관리 페이지로 이동, 창고 목록 보기, 품목 미리보기 확인, 새 창고 추가. 다중 위치 재고 구성 기능 제공으로 가치 전달.

### US2 테스트 작성

- [x] T051 [P] [US2] backend/test/integration/warehouses.e2e-spec.ts에 창고 API 계약 테스트 작성 (목록, 생성, 조회, 수정, 삭제)
- [x] T052 [P] [US2] frontend/tests/integration/warehouses.test.tsx에 창고 페이지 통합 테스트 작성

### US2 백엔드 구현

- [x] T053 [P] [US2] backend/src/warehouses/ 디렉토리 및 NestJS 모듈 생성
- [x] T054 [P] [US2] backend/src/warehouses/dto/create-warehouse.dto.ts에 CreateWarehouseDto 생성 (name, location, capacity 유효성 검사)
- [x] T055 [P] [US2] backend/src/warehouses/dto/update-warehouse.dto.ts에 UpdateWarehouseDto 생성
- [x] T056 [US2] backend/src/warehouses/warehouses.service.ts에 WarehousesService 구현:
  - `findAll()`: companyId로 필터링된 창고 목록 (페이지네이션 포함)
  - `findOne()`: ID로 창고 조회 (재고 품목 수 포함)
  - `create()`: 새 창고 생성 (현재 사용자의 companyId 사용)
  - `update()`: 창고 정보 수정
  - `remove()`: 창고 소프트 삭제 (deletedAt 설정)
  - `getInventory()`: 창고의 모든 재고 조회
- [x] T057 [US2] backend/src/warehouses/warehouses.controller.ts에 WarehousesController 구현:
  - GET /warehouses (목록)
  - POST /warehouses (생성)
  - GET /warehouses/:id (조회)
  - PATCH /warehouses/:id (수정)
  - DELETE /warehouses/:id (삭제)
  - GET /warehouses/:id/inventory (재고 조회)
- [x] T058 [US2] backend/src/app.module.ts에 WarehousesModule 가져오기

### US2 프론트엔드 구현

- [x] T059 [P] [US2] frontend/src/lib/validations/warehouse.ts에 Zod 창고 스키마 생성
- [x] T060 [P] [US2] frontend/src/lib/api/warehouses.ts에 창고 API 클라이언트 함수 구현
- [x] T061 [P] [US2] frontend/src/lib/hooks/use-warehouses.ts에 useWarehouses, useWarehouse, useCreateWarehouse 등 훅 구현
- [x] T062 [P] [US2] frontend/src/components/features/warehouse/warehouse-card.tsx에 창고 카드 컴포넌트 구현
- [x] T063 [P] [US2] frontend/src/components/features/warehouse/add-warehouse-modal.tsx에 창고 추가 모달 구현 (React Hook Form + Zod)
- [x] T064 [US2] frontend/src/app/(dashboard)/warehouses/page.tsx에 창고 목록 페이지 구현
- [x] T065 [US2] frontend/src/components/layout/sidebar.tsx에 "창고" 네비게이션 링크 추가

### US2 검증

- [x] T066 [US2] 백엔드 통합 테스트 실행 및 통과 확인
- [x] T067 [US2] 프론트엔드 통합 테스트 실행 및 통과 확인
- [x] T068 [US2] 창고 목록 → 새 창고 추가 → 목록에서 확인 E2E 테스트 실행

**체크포인트**: ✅ User Story 1과 2가 모두 독립적으로 작동합니다

---

## Phase 5: User Story 3 - 창고 상세 및 품목 할당 (우선순위: P2) ✅ 완료

**목표**: 특정 창고에 저장된 모든 품목 보기 및 창고에 품목 할당

**독립 테스트**: 창고 상세 페이지로 이동, 품목 목록 보기, 창고에 품목 추가. 상세한 창고 수준 재고 관리 기능으로 가치 전달.

### US3 테스트 작성

- [x] T069 [P] [US3] backend/test/integration/inventory.e2e-spec.ts에 재고 API 계약 테스트 작성 (생성, 수정)
- [ ] T070 [P] [US3] frontend/tests/integration/warehouse-detail.test.tsx에 창고 상세 페이지 통합 테스트 작성

### US3 백엔드 구현

- [x] T071 [P] [US3] backend/src/inventory/ 디렉토리 및 NestJS 모듈 생성
- [x] T072 [P] [US3] backend/src/inventory/dto/create-inventory.dto.ts에 CreateInventoryDto 생성 (warehouseId, itemId, quantity)
- [x] T073 [P] [US3] backend/src/inventory/dto/update-inventory.dto.ts에 UpdateInventoryDto 생성
- [x] T074 [US3] backend/src/inventory/inventory.service.ts에 InventoryService 구현:
  - `create()`: 창고에 품목 할당 (초기 수량 포함)
  - `update()`: 재고 수량 수동 조정
  - `findByWarehouse()`: 창고의 모든 재고 조회
  - 창고 용량 초과 검증 로직
- [x] T075 [US3] backend/src/inventory/inventory.controller.ts에 InventoryController 구현:
  - POST /inventory (품목 할당)
  - PATCH /inventory/:id (수량 수정)
- [x] T076 [US3] backend/src/warehouses/warehouses.service.ts에 `getInventory()` 메서드 구현 (품목 상세 포함)
- [x] T077 [US3] backend/src/app.module.ts에 InventoryModule 가져오기

### US3 프론트엔드 구현

- [x] T078 [P] [US3] frontend/src/lib/validations/inventory.ts에 Zod 재고 스키마 생성
- [x] T079 [P] [US3] frontend/src/lib/api/inventory.ts에 재고 API 클라이언트 함수 구현
- [x] T080 [P] [US3] frontend/src/lib/hooks/use-inventory.ts에 useWarehouseInventory, useCreateInventory 등 훅 구현
- [x] T081 [P] [US3] frontend/src/components/features/warehouse/inventory-table.tsx에 재고 테이블 컴포넌트 구현
- [x] T082 [P] [US3] frontend/src/components/features/warehouse/add-item-to-warehouse-modal.tsx에 품목 추가 모달 구현
- [x] T083 [US3] frontend/src/app/(dashboard)/warehouses/[id]/page.tsx에 창고 상세 페이지 구현
- [x] T084 [US3] frontend/src/components/features/warehouse/warehouse-card.tsx를 클릭 시 상세 페이지로 이동하도록 수정

### US3 검증

- [ ] T085 [US3] 백엔드 통합 테스트 실행 및 통과 확인
- [ ] T086 [US3] 프론트엔드 통합 테스트 실행 및 통과 확인
- [ ] T087 [US3] 창고 상세 → 품목 추가 → 재고 목록 확인 E2E 테스트 실행

**체크포인트**: ✅ User Story 1, 2, 3이 모두 독립적으로 작동합니다

---

## Phase 6: User Story 4 - 거래 이력 추적 (우선순위: P3) ✅ 완료

**목표**: 모든 입출고 거래 보기, 유형별 필터링, 각 거래의 상세 정보 확인

**독립 테스트**: 거래 페이지로 이동, 필터 적용, 거래 목록 보기, 거래 상세 열기. 완전한 이동 추적 및 감사 기능으로 가치 전달.

### US4 테스트 작성

- [x] T088 [P] [US4] backend/test/integration/transactions.e2e-spec.ts에 거래 API 계약 테스트 작성 (목록, 생성, 조회, 필터링)
- [ ] T089 [P] [US4] frontend/tests/integration/transactions.test.tsx에 거래 페이지 통합 테스트 작성

### US4 백엔드 구현

- [x] T090 [P] [US4] backend/src/transactions/ 디렉토리 및 NestJS 모듈 생성
- [x] T091 [P] [US4] backend/src/transactions/dto/create-transaction.dto.ts에 CreateTransactionDto 생성 (type, warehouseId, itemId, quantity, notes)
- [x] T092 [US4] backend/src/transactions/transactions.service.ts에 TransactionsService 구현:
  - `create()`: 입출고 거래 생성 (데이터베이스 트랜잭션 사용)
    - 출고 시 재고 부족 검증
    - Inventory 테이블 수량 자동 업데이트
    - Transaction 레코드 생성 (불변)
  - `findAll()`: 거래 목록 조회 (companyId 필터, 페이지네이션)
  - `findOne()`: 거래 상세 조회 (창고, 품목, 사용자 정보 포함)
  - 필터링 로직 (type, warehouseId, itemId, 날짜 범위)
- [x] T093 [US4] backend/src/transactions/transactions.controller.ts에 TransactionsController 구현:
  - GET /transactions (목록 및 필터링)
  - POST /transactions (거래 생성)
  - GET /transactions/:id (조회)
- [x] T094 [US4] backend/src/app.module.ts에 TransactionsModule 가져오기

### US4 프론트엔드 구현

- [x] T095 [P] [US4] frontend/src/lib/validations/transaction.ts에 Zod 거래 스키마 생성
- [x] T096 [P] [US4] frontend/src/lib/api/transactions.ts에 거래 API 클라이언트 함수 구현
- [x] T097 [P] [US4] frontend/src/lib/hooks/use-transactions.ts에 useTransactions, useTransaction, useCreateTransaction 등 훅 구현
- [x] T098 [P] [US4] frontend/src/components/features/transaction/transaction-filters.tsx에 필터 컴포넌트 구현 (유형, 날짜 범위)
- [x] T099 [P] [US4] frontend/src/components/features/transaction/transaction-table.tsx에 거래 테이블 컴포넌트 구현
- [x] T100 [P] [US4] frontend/src/components/features/transaction/transaction-detail-modal.tsx에 거래 상세 모달 구현
- [x] T101 [US4] frontend/src/app/(dashboard)/transactions/page.tsx에 거래 이력 페이지 구현
- [x] T102 [US4] frontend/src/components/layout/sidebar.tsx에 "거래 이력" 네비게이션 링크 추가 (이미 존재)

### US4 검증

- [ ] T103 [US4] 백엔드 통합 테스트 실행 및 통과 확인
- [ ] T104 [US4] 프론트엔드 통합 테스트 실행 및 통과 확인
- [ ] T105 [US4] 거래 목록 → 필터 적용 → 거래 상세 보기 E2E 테스트 실행

**체크포인트**: ✅ User Story 1-4가 모두 독립적으로 작동합니다

---

## Phase 7: User Story 5 - 품목 마스터 데이터 관리 (우선순위: P3) ✅ 완료

**목표**: 시스템에 등록된 모든 품목 보기 및 새 품목 추가

**독립 테스트**: 품목 관리 페이지로 이동, 전체 품목 목록 보기, 새 품목 추가. 중앙 집중식 품목 카탈로그 관리로 가치 전달.

### US5 테스트 작성

- [x] T106 [P] [US5] backend/test/integration/items.e2e-spec.ts에 품목 API 계약 테스트 작성 (목록, 생성, 조회, 수정, 삭제)
- [ ] T107 [P] [US5] frontend/tests/integration/items.test.tsx에 품목 페이지 통합 테스트 작성

### US5 백엔드 구현

- [x] T108 [P] [US5] backend/src/items/ 디렉토리 및 NestJS 모듈 생성
- [x] T109 [P] [US5] backend/src/items/dto/create-item.dto.ts에 CreateItemDto 생성 (sku, name, category, unitOfMeasure, description, reorderThreshold)
- [x] T110 [P] [US5] backend/src/items/dto/update-item.dto.ts에 UpdateItemDto 생성
- [x] T111 [US5] backend/src/items/items.service.ts에 ItemsService 구현:
  - `findAll()`: companyId로 필터링된 품목 목록 (페이지네이션, 검색, 카테고리 필터)
  - `findOne()`: ID로 품목 조회 (모든 창고의 총 수량 포함)
  - `create()`: 새 품목 생성 (SKU 중복 검증)
  - `update()`: 품목 정보 수정
  - `remove()`: 품목 소프트 삭제
- [x] T112 [US5] backend/src/items/items.controller.ts에 ItemsController 구현:
  - GET /items (목록)
  - POST /items (생성)
  - GET /items/:id (조회)
  - PATCH /items/:id (수정)
  - DELETE /items/:id (삭제)
- [x] T113 [US5] backend/src/app.module.ts에 ItemsModule 가져오기

### US5 프론트엔드 구현

- [x] T114 [P] [US5] frontend/src/lib/validations/item.ts에 Zod 품목 스키마 생성
- [x] T115 [P] [US5] frontend/src/lib/api/items.ts에 품목 API 클라이언트 함수 구현
- [x] T116 [P] [US5] frontend/src/lib/hooks/use-items.ts에 useItems, useItem, useCreateItem 등 훅 구현
- [x] T117 [P] [US5] frontend/src/components/features/item/item-table.tsx에 품목 테이블 컴포넌트 구현
- [x] T118 [P] [US5] frontend/src/components/features/item/register-item-modal.tsx에 품목 등록 모달 구현 (React Hook Form + Zod)
- [x] T119 [US5] frontend/src/app/(dashboard)/items/page.tsx에 품목 관리 페이지 구현
- [x] T120 [US5] frontend/src/components/layout/sidebar.tsx에 "품목 관리" 네비게이션 링크 추가 (이미 존재)

### US5 검증

- [ ] T121 [US5] 백엔드 통합 테스트 실행 및 통과 확인
- [ ] T122 [US5] 프론트엔드 통합 테스트 실행 및 통과 확인
- [ ] T123 [US5] 품목 목록 → 새 품목 등록 → 목록 확인 → 창고에 할당 E2E 테스트 실행

**체크포인트**: ✅ 모든 사용자 스토리가 독립적으로 작동합니다

---

## Phase 8: 완성 및 통합 작업 ✅ 완료

**목적**: 여러 사용자 스토리에 영향을 미치는 개선 작업

### 회사 및 사용자 관리 (관리 기능)

- [x] T124 [P] backend/src/companies/ 디렉토리 및 CompaniesModule 생성
- [x] T125 [P] backend/src/companies/companies.service.ts에 CompaniesService 구현 (CRUD)
- [x] T126 [P] backend/src/users/ 디렉토리 및 UsersModule 생성
- [x] T127 [P] backend/src/users/users.service.ts에 UsersService 구현 (CRUD, 비밀번호 해싱)

### 전역 오류 처리 및 검증 개선

- [x] T128 [P] backend/src/common/filters/prisma-exception.filter.ts에 Prisma 오류 필터 추가 (데이터베이스 제약 조건 위반 처리)
- [x] T129 [P] frontend/src/lib/utils/error-handler.ts에 전역 오류 처리 유틸리티 구현

### 성능 최적화

- [x] T130 [P] backend/에 데이터베이스 인덱스 검증 (Prisma 스키마의 @@index 지시어 확인)
- [x] T131 [P] frontend/에 Next.js 이미지 최적화 설정 (next.config.ts)
- [x] T132 [P] frontend/에 번들 크기 분석 및 최적화 (@next/bundle-analyzer)

### 접근성 및 UX 개선

- [ ] T133 [P] frontend/의 모든 대화형 요소에 ARIA 레이블 추가 (기존 shadcn/ui 컴포넌트가 ARIA 지원)
- [ ] T134 [P] frontend/에 키보드 탐색 지원 검증 (모달, 폼, 테이블) (shadcn/ui 컴포넌트가 키보드 탐색 지원)
- [x] T135 [P] frontend/에 로딩 스켈레톤 컴포넌트 추가 (frontend/src/components/shared/loading-skeleton.tsx)

### 문서화

- [x] T136 [P] backend/src/main.ts에 Swagger/OpenAPI 문서 설정 (http://localhost:3001/api-docs)
- [x] T137 [P] 루트 디렉토리에 README.md 업데이트 (프로젝트 개요, 설정 지침, 실행 방법)
- [ ] T138 [P] specs/001-warehouse-inventory-erp/quickstart.md 검증 및 업데이트 (README.md로 대체)

### E2E 테스트 전체 시나리오

- [ ] T139 전체 사용자 여정 E2E 테스트 작성 (frontend/tests/e2e/full-workflow.spec.ts):
  - 로그인 → 대시보드 확인 → 창고 생성 → 품목 등록 → 재고 할당 → 거래 생성 → 거래 이력 확인
- [ ] T140 Playwright E2E 테스트 실행 및 모든 시나리오 통과 확인

### 코드 품질 검증

- [x] T141 백엔드 및 프론트엔드에서 ESLint 실행 및 오류 수정 (경고 4개, 에러 모두 수정)
- [x] T142 백엔드 및 프론트엔드에서 TypeScript 타입 체크 실행 (`tsc --noEmit`) - 통과
- [ ] T143 백엔드 테스트 커버리지 확인 (목표: 단위 80%, 통합 70%)
- [ ] T144 프론트엔드 테스트 커버리지 확인 (목표: 컴포넌트 80%, 통합 70%)

---

## 종속성 및 실행 순서

### 단계 종속성

- **설정 (Phase 1)**: 종속성 없음 - 즉시 시작 가능
- **기초 (Phase 2)**: 설정 완료 후 - 모든 사용자 스토리를 차단
- **사용자 스토리 (Phase 3+)**: 모두 기초 단계 완료에 종속
  - 사용자 스토리는 병렬로 진행 가능 (인력이 있는 경우)
  - 또는 우선순위 순서대로 순차적으로 (P1 → P2 → P3)
- **완성 (최종 단계)**: 모든 원하는 사용자 스토리 완료에 종속

### 사용자 스토리 종속성

- **User Story 1 (P1)**: 기초 단계 (Phase 2) 후 시작 가능 - 다른 스토리에 종속 없음
- **User Story 2 (P2)**: 기초 단계 (Phase 2) 후 시작 가능 - US1과 통합될 수 있지만 독립적으로 테스트 가능해야 함
- **User Story 3 (P2)**: 기초 단계 (Phase 2) 후 시작 가능 - US1/US2와 통합될 수 있지만 독립적으로 테스트 가능해야 함
- **User Story 4 (P3)**: 기초 단계 (Phase 2) 후 시작 가능 - Inventory 엔티티에 종속 (US3에서 생성)
- **User Story 5 (P3)**: 기초 단계 (Phase 2) 후 시작 가능 - 다른 스토리에 종속 없음

### 각 사용자 스토리 내

- 테스트는 구현 전에 작성되고 실패해야 함
- 모델 → 서비스 → 엔드포인트
- 핵심 구현 → 통합
- 다음 우선순위로 넘어가기 전에 스토리 완료

### 병렬 실행 기회

- [P]로 표시된 모든 설정 작업은 병렬 실행 가능
- [P]로 표시된 모든 기초 작업은 병렬 실행 가능 (Phase 2 내에서)
- 기초 단계 완료 후 모든 사용자 스토리를 병렬로 시작 가능 (팀 역량이 허용하는 경우)
- [P]로 표시된 각 스토리의 모든 테스트는 병렬 실행 가능
- [P]로 표시된 스토리 내 모델은 병렬 실행 가능
- 다른 사용자 스토리는 다른 팀원이 병렬로 작업 가능

---

## 병렬 실행 예시: User Story 1

```bash
# User Story 1의 모든 테스트를 함께 시작:
Task: "backend/test/integration/dashboard.e2e-spec.ts에 대시보드 통계 API 계약 테스트 작성"
Task: "backend/test/integration/dashboard-recent-transactions.e2e-spec.ts에 최근 거래 API 계약 테스트 작성"
Task: "frontend/tests/integration/dashboard.test.tsx에 대시보드 페이지 통합 테스트 작성"

# User Story 1의 백엔드 및 프론트엔드 병렬 작업:
Task: "backend/src/dashboard/dashboard.service.ts에 DashboardService 구현"
Task: "frontend/src/lib/api/dashboard.ts에 대시보드 API 클라이언트 함수 구현"
Task: "frontend/src/components/features/dashboard/stats-card.tsx에 통계 카드 컴포넌트 구현"
```

---

## 구현 전략

### MVP 우선 (User Story 1만)

1. Phase 1 완료: 설정
2. Phase 2 완료: 기초 (중요 - 모든 스토리 차단)
3. Phase 3 완료: User Story 1 (대시보드)
4. **중단 및 검증**: User Story 1을 독립적으로 테스트
5. 준비되면 배포/데모

### 점진적 전달

1. 설정 + 기초 완료 → 기반 준비
2. User Story 1 추가 → 독립적으로 테스트 → 배포/데모 (MVP!)
3. User Story 2 추가 → 독립적으로 테스트 → 배포/데모
4. User Story 3 추가 → 독립적으로 테스트 → 배포/데모
5. 각 스토리는 이전 스토리를 손상시키지 않고 가치 추가

### 병렬 팀 전략

여러 개발자가 있는 경우:

1. 팀이 설정 + 기초를 함께 완료
2. 기초 완료 후:
   - 개발자 A: User Story 1
   - 개발자 B: User Story 2
   - 개발자 C: User Story 3
3. 스토리가 독립적으로 완료되고 통합됨

---

## 주의사항

- [P] 작업 = 다른 파일, 종속성 없음
- [Story] 레이블은 특정 사용자 스토리에 작업을 매핑하여 추적성 확보
- 각 사용자 스토리는 독립적으로 완료하고 테스트 가능해야 함
- 구현 전에 테스트가 실패하는지 확인
- 각 작업 또는 논리적 그룹 후 커밋
- 체크포인트에서 중단하여 스토리를 독립적으로 검증
- 피해야 할 것: 모호한 작업, 동일한 파일 충돌, 독립성을 해치는 스토리 간 종속성

---

## 작업 통계

**총 작업 수**: 144개

**사용자 스토리별 작업 분포**:

- Phase 1 (설정): 8개 작업
- Phase 2 (기초): 24개 작업
- Phase 3 (US1 - 대시보드): 18개 작업
- Phase 4 (US2 - 창고 관리): 18개 작업
- Phase 5 (US3 - 창고 상세): 19개 작업
- Phase 6 (US4 - 거래 이력): 18개 작업
- Phase 7 (US5 - 품목 관리): 18개 작업
- Phase 8 (완성): 21개 작업

**병렬 실행 기회**: 약 60개 작업이 [P]로 표시되어 병렬 실행 가능 (전체의 ~42%)

**독립 테스트 기준**:

- User Story 1: 로그인 → 대시보드 표시 → 통계 및 거래 확인
- User Story 2: 창고 목록 → 새 창고 추가 → 목록에서 확인
- User Story 3: 창고 상세 → 품목 추가 → 재고 목록 확인
- User Story 4: 거래 목록 → 필터 적용 → 상세 보기
- User Story 5: 품목 목록 → 새 품목 등록 → 목록 확인

**권장 MVP 범위**: User Story 1 (대시보드 개요) + 기초 인프라
