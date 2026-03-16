# NestJS 기초 설계 — AI Video Generation Backend

요약
- 목적: README.MD에 명시된 'AI Video Generation Backend Platform'을 NestJS로 구현하기 위한 기본 아키텍처와 모듈 설계.
- 비전: 비동기 Job Queue(BullMQ/Redis) 기반으로 요청 수신 → Job 발행 → AI Worker(파이썬) 처리 → 결과 저장(AWS S3) 흐름을 명확히 한다.

아키텍처 개요
- Client -> API Gateway -> Video Generation Service (NestJS)
- Video Generation Service는 요청을 받아 Job Queue에 작업을 추가(BullMQ)
- AI Worker(Python)는 Queue에서 Job을 pull하여 inference 수행
- 결과 영상은 S3에 업로드, 메타데이터는 DB(선택: PostgreSQL 등)에 저장
- 작업 상태 조회 API 제공

핵심 기술 스택 (권장)
- Framework: NestJS (TypeScript)
- Queue: BullMQ + Redis
- Storage: AWS S3
- DB: PostgreSQL (작업/메타데이터), 또는 DynamoDB
- Container: Docker / docker-compose
- AI Worker: Python (독립 컨테이너), inference 라이브러리 포함

모듈 설계 (NestJS)
1) AppModule
   - 전역 설정, ConfigModule, DatabaseModule, BullModule 등록

2) AuthModule (선택)
   - API 보호를 위한 JWT/API Key 인증

3) VideoModule
   - 책임: 영상 생성 요청 수신, Job 생성, 작업 상태 반환
   - 주요 구성요소:
     - VideoController
       - POST /videos: 영상 생성 요청 (returns jobId)
       - GET /videos/:jobId/status: 작업 상태 조회
       - GET /videos/:jobId/result: 결과 메타/다운로드 URL (권한 확인 필요)
     - VideoService
       - validate request, create job record, enqueue job
     - VideoRepository / VideoEntity
       - jobId, status(enum), inputParams(json), resultUrl, startedAt, finishedAt, error
     - DTOs: CreateVideoDto, VideoStatusDto, VideoResultDto

4) JobsModule
   - 책임: Queue 및 Job lifecycle 관리, 재시도 정책, 백오프
   - 주요 구성요소:
     - JobsService: enqueue, getStatus, updateStatus
     - QueueProcessor (optional): lightweight local processors for orchestration
   - BullMQ 설정: Redis 연결, concurrency, repeatable jobs 설정

5) StorageModule
   - 책임: S3 업로드/다운로드 URL 생성, signed URL 발급
   - 구성: S3 client wrapper, 업로드 정책, 버킷 네이밍

6) DatabaseModule
   - 책임: 작업/유저/메타데이터 저장
   - ORM: TypeORM or Prisma 권장

7) MonitoringModule (옵션)
   - 책임: Prometheus metrics, Sentry 에러 추적, BullMQ dashboard

데이터 모델(예시)
- VideoJob entity
  - id (uuid)
  - status (PENDING | RUNNING | SUCCESS | FAILED)
  - input (json)
  - result_url (string)
  - error_message (string|null)
  - created_at, updated_at, started_at, finished_at

API 설계(간단)
- POST /api/v1/videos
  - body: CreateVideoDto {
      title?: string,
      templateId?: string,
      assets: [{type: 'image'|'audio'|'text', uri?: string, data?: string}],
      params: {resolution?, fps?, duration?}
    }
  - response: { jobId: string }

- GET /api/v1/videos/:jobId/status
  - response: { jobId, status, progress?, error? }

- GET /api/v1/videos/:jobId/result
  - response: { jobId, resultUrl, expiresAt }

Queue / Job Flow
1. 클라이언트가 POST /videos 요청
2. `VideoService`가 입력 검증 후 DB에 `VideoJob` 레코드 생성(status=PENDING)
3. `JobsService`가 BullMQ queue에 job 추가(payload: jobId, input)
4. AI Worker(파이썬)가 queue 메시지 소비, 상태를 RUNNING으로 업데이트
5. Worker가 inference 수행 후 결과(영상)를 S3에 업로드
6. Worker가 DB에 result_url과 status=SUCCESS 또는 error를 기록
7. 클라이언트가 상태/결과 조회

Worker (Python) 요건
- 독립 컨테이너로 운영
- BullMQ-compatible client (e.g., using redis + simple queue protocol or dedicated worker lib)
- 처리 중 progress events를 Redis 또는 HTTP callback으로 전송 가능
- S3 업로드 및 메타데이터 전송 기능

환경 변수(예시)
- APP_PORT=3000
- NODE_ENV=production
- DATABASE_URL=postgres://...
- REDIS_URL=redis://...
- S3_BUCKET=...
- S3_REGION=...
- AWS_ACCESS_KEY_ID=...
- AWS_SECRET_ACCESS_KEY=...
- JWT_SECRET=...

Docker & 배포 (간단 제안)
- docker-compose.yml
  - services: api (NestJS), redis, postgres, worker-python
- production: 각 서비스 컨테이너를 ECS / Kubernetes에 배포

테스트 전략
- unit: controllers/services mock DB/queue
- integration: BullMQ + Redis의 간단한 e2e 테스트 (localstack 또는 실제 Redis)
- contract: API 스펙을 기반으로 요청/응답 검증

보안/운영 고려사항
- S3 객체 접근: signed URLs 사용
- Job 인증/인가: API Key 또는 JWT
- Queue 백오프/재시도 정책 설정
- 대용량 업로드: multipart upload, CDN 연동 검토

다음 단계(권장)
1. NestJS 프로젝트 스캐폴딩: `nest new api` 또는 수동 템플릿 생성
2. `VideoModule`, `JobsModule`, `StorageModule` 골격 코드 생성
3. BullMQ와 Redis 로컬 구성 및 간단 enqueue/dequeue 테스트
4. Python Worker 프로토타입으로 S3 업로드와 status 업데이트 구현

---
저장 위치: `DESIGN/NESTJS_DESIGN.md`
