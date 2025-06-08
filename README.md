# Release Tracker

## 프로젝트 개요

이 보일러 플레이트는 풀스택 웹 애플리케이션 개발을 위한 기본 구조를 제공합니다. monorepo 구조로 클라이언트와 서버를 효율적으로 관리하며, 현대적인 웹 개발 기술 스택을 활용합니다.

## 기술 스택

### 공통

- 패키지 매니저: pnpm (workspace 기능 활용)
- 언어: TypeScript
- Node.js 버전: 22.x
- 테스트: Vitest
- 코드 품질: Prettier

### 클라이언트

- 프레임워크: React
- 빌드 도구: Vite
- 라우팅: React Router
- 스타일링: TailwindCSS

### 서버

- 프레임워크: Fastify
- 데이터베이스: SQLite with DirzzleORM

## 설치 및 실행

### 초기 설치

```bash
# 프로젝트 루트 디렉토리에서 실행
pnpm install
```

### 개발 서버 실행

```bash
# 클라이언트 및 서버 동시 실행
pnpm dev

# 클라이언트만 실행
pnpm dev:client

# 서버만 실행
pnpm dev:server
```

### 테스트 실행

```bash
# 클라이언트 테스트
pnpm test:client

# 서버 테스트
pnpm test:server

# 모든 테스트 실행
pnpm test
```

### 빌드

```bash
# 클라이언트 및 서버 빌드
pnpm build
```

## 환경 변수 설정

- 클라이언트: `client/.env` 파일에 설정 (예시는 `client/.env.example` 참조)
- 서버: `server/.env` 파일에 설정 (예시는 `server/.env.example` 참조)

## API 엔드포인트

서버는 다음과 같은 기본 API 엔드포인트를 제공합니다:

- `GET /api/health`: 서버 상태 확인
- `GET /api/users`: 유저 목록 조회
- `GET /api/users/:id`: 특정 유저 조회
- `POST /api/users`: 새 유저 추가
- `PUT /api/users/:id`: 유저 정보 수정
- `DELETE /api/users/:id`: 유저 삭제

## CHANGELOG

### Level 1
- GitHub 릴리즈 통계 분석 기능 개선
  - 저장소별 통계와 패키지별 통계를 분리하여 분석
    - release-stats.csv: 저장소 전체 릴리즈 통계
    - package-stats.csv: 각 패키지별 상세 릴리즈 통계

### Level 2
- GitHub 릴리즈 통계에 주말/평일 구분 기능 추가
  - 주말 릴리즈와 평일 릴리즈를 별도로 집계
  - 평균 릴리즈 주기와 월간 평균 릴리즈 수를 근무일 기준으로 계산
  - 주말 릴리즈 비율 지표 추가

### Level 3
- 로우 데이터 csv 추가

### Level 4
- 대시보드 차트 시각화 기능 추가
  - 패키지별 릴리즈 수 차트
  - 릴리즈 주기 분포 차트
  - 릴리즈 유형 분포(프리릴리즈/주말/일반) 파이 차트
  - 월별 릴리즈 추세 선 차트
  - 릴리즈 작성자 TOP 10 차트
  - 각 차트별 설명과 인사이트 제공
  - 차트별 고유 색상 적용으로 시각적 구분 개선