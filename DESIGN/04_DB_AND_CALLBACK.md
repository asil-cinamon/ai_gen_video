# DB Persistence & Worker Callback

요약
- TypeORM (SQLite 기본) 통합을 통해 `VideoJob` 영속화를 구현하고, 워커가 POST하는 콜백을 API에서 받아 DB와 인메모리 상태를 업데이트하도록 구현함.

구현 내용
- `src/database/database.module.ts` (TypeORM 설정, `synchronize: true`)
- `src/video/entities/video-job.entity.ts` (TypeORM Entity)
- `src/video/video.service.ts`:
  - job 생성 시 DB에 저장
  - `handleWorkerCallback(jobId, payload)`로 워커 콜백 처리(상태/resultUrl/error 업데이트)
- `src/video/video.controller.ts`:
  - `POST /api/v1/videos/:jobId/callback` 엔드포인트 추가

데이터 플로우
1. API에서 job 생성 → DB에 `PENDING` 레코드 생성
2. 워커가 작업 완료 후 API로 콜백 전송
3. API가 콜백을 받아 DB 레코드 상태와 `resultUrl`을 갱신

운영/확장
- 개발 환경에서는 SQLite 사용; 운영 환경에서는 PostgreSQL로 교체 권장 (TypeORM 설정만 변경)
- 콜백 인증(서명 또는 API Key)과 idempotency(중복 콜백 처리) 구현 필요
