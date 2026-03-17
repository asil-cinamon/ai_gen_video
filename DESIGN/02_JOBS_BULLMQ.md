# JobsModule & BullMQ Integration

요약
- `JobsModule`과 `JobsService`를 추가하여 BullMQ 큐와 Redis 연동 스텁을 구현함.

구현 내용
- `src/jobs/jobs.module.ts` (글로벌 모듈)
- `src/jobs/jobs.service.ts`
  - BullMQ `Queue` 인스턴스 생성, `enqueueJob(jobId, payload)` 제공
  - `getJobStatus(jobId)`로 BullMQ 상태 조회
  - Redis plain list(`video_jobs`)에도 LPUSH 하여 외부(파이썬) 워커가 BRPOP으로 소비 가능

설계/운영 포인트
- BullMQ는 Node 내부 작업 소비 또는 모니터링에 사용.
- Python 워커 같은 외부 프로세스와의 호환을 위해 plain Redis 리스트를 동시에 사용.
- 재시도/백오프 설정과 `removeOnComplete` 정책이 기본 적용됨.

확장 아이디어
- BullMQ Processor를 추가해 Node 기반 워커 구현 및 Dashboard 연동.
- 큐 모니터링(Health checks, metrics) 통합.
