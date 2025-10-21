# 창고 재고 관리 ERP 시스템 설정 가이드

## 📋 사전 요구사항

- Node.js 18+ 및 npm
- PostgreSQL 15+
- Docker (선택사항, PostgreSQL 실행용)

## 🚀 빠른 시작

### 1. PostgreSQL 데이터베이스 설정

#### Option A: Docker 사용 (권장)

```bash
# PostgreSQL 컨테이너 실행
docker run --name warehouse-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=warehouse_erp \
  -p 5432:5432 \
  -d postgres:15

# 컨테이너 상태 확인
docker ps | grep warehouse-postgres
```

#### Option B: 로컬 PostgreSQL 사용

PostgreSQL이 이미 설치되어 있다면:

```bash
# psql로 데이터베이스 생성
psql -U postgres
CREATE DATABASE warehouse_erp;
\q
```

### 2. 백엔드 설정

```bash
cd backend

# 의존성 설치 (이미 완료된 경우 스킵)
npm install

# Prisma 마이그레이션 실행
npm run prisma:migrate

# Prisma Client 생성
npm run prisma:generate

# 시드 데이터 생성 (선택사항)
npm run prisma:seed
```

### 3. 프론트엔드 설정

```bash
cd frontend

# 의존성 설치 (이미 완료된 경우 스킵)
npm install
```

## 🏃 서버 실행

### 개발 모드

**터미널 1 - 백엔드 서버:**
```bash
cd backend
npm run start:dev
```

서버가 성공적으로 실행되면:
```
Application is running on: http://localhost:3001
```

**터미널 2 - 프론트엔드 서버:**
```bash
cd frontend
npm run dev
```

프론트엔드가 실행되면:
```
http://localhost:3000
```

## 🧪 테스트 계정

시드 데이터를 실행했다면 다음 계정으로 로그인할 수 있습니다:

- **Email**: `admin@demo.com`
- **Password**: `password123`

## 📁 프로젝트 구조

```
sdd/
├── backend/                 # NestJS 백엔드
│   ├── prisma/
│   │   ├── schema.prisma   # 데이터베이스 스키마
│   │   └── seed.ts         # 시드 데이터
│   ├── src/
│   │   ├── auth/           # 인증 모듈
│   │   ├── common/         # 공통 유틸리티
│   │   ├── prisma/         # Prisma 서비스
│   │   └── main.ts
│   └── .env                # 환경 변수
├── frontend/               # Next.js 15 프론트엔드
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/     # 로그인 페이지
│   │   │   └── (dashboard)/ # 보호된 페이지
│   │   ├── components/     # React 컴포넌트
│   │   └── lib/            # 유틸리티, API 클라이언트
│   └── .env.local          # 환경 변수
└── specs/                  # 기능 명세
```

## 🔧 환경 변수

### backend/.env

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/warehouse_erp?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# Server
PORT=3001
NODE_ENV=development

# Frontend
FRONTEND_URL="http://localhost:3000"
```

### frontend/.env.local

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🐛 문제 해결

### 백엔드 빌드 오류

빌드 중 TypeScript 오류가 발생하면:

```bash
cd backend
npm run build
```

모든 TypeScript 오류가 수정되었는지 확인하세요.

### 데이터베이스 연결 실패

1. PostgreSQL이 실행 중인지 확인:
   ```bash
   docker ps | grep warehouse-postgres
   # 또는
   sudo service postgresql status
   ```

2. `.env` 파일의 `DATABASE_URL`이 올바른지 확인

3. 연결 테스트:
   ```bash
   cd backend
   npx prisma db pull
   ```

### 포트 충돌

다른 애플리케이션이 이미 포트를 사용 중이라면:

**백엔드 (3001):**
```bash
# backend/.env 수정
PORT=3002
```

**프론트엔드 (3000):**
```bash
# package.json의 dev 스크립트 수정
"dev": "next dev -p 3001"
```

### Prisma 마이그레이션 오류

마이그레이션 실패 시 초기화:

```bash
cd backend

# 기존 마이그레이션 삭제
rm -rf prisma/migrations

# 데이터베이스 재설정 (⚠️ 모든 데이터 삭제됨)
npx prisma migrate reset

# 새 마이그레이션 생성
npm run prisma:migrate
```

## 📚 유용한 명령어

### Prisma

```bash
# Prisma Studio 실행 (데이터베이스 GUI)
npx prisma studio

# 스키마 포맷팅
npx prisma format

# 마이그레이션 상태 확인
npx prisma migrate status
```

### 백엔드

```bash
# 린트 실행
npm run lint

# 테스트 실행
npm test

# E2E 테스트
npm run test:e2e
```

### 프론트엔드

```bash
# 린트 실행
npm run lint

# 유닛 테스트
npm test

# E2E 테스트
npm run test:e2e
```

## 📖 다음 단계

기본 설정이 완료되었습니다! 이제 다음을 진행할 수 있습니다:

1. ✅ **Phase 1 & 2 완료**: 프로젝트 설정 및 기초 인프라
2. 🚧 **Phase 3-7**: 사용자 스토리 구현
   - Dashboard (대시보드 통계)
   - Warehouse Management (창고 관리)
   - Item Management (아이템 관리)
   - Transaction History (거래 내역)

자세한 작업 목록은 `specs/001-warehouse-inventory-erp/tasks.md`를 참조하세요.
