# DB Persistence & Worker Callback

요약
- 현재 구현은 별도의 RDBMS/TypeORM 영속화 계층 없이 **인메모리 상태 + BullMQ/Redis** 조합으로 `VideoJob` 상태를 관리한다.
- 워커는 HTTP 콜백을 호출하지 않고, **Redis에 결과를 기록**하고 큐 상태를 갱신하며, API 서버는 이를 조회하여 클라이언트에 노출한다.

구현 내용 (현재 기준)
- **인메모리 상태 관리**
  - API 프로세스 내에서 job 메타데이터(예: 생성 시각, 요청 파라미터, 간단한 상태 등)를 저장하는 경량 인메모리 맵/객체를 사용한다.
  - 프로세스 재시작 시 인메모리 상태는 사라지며, 신뢰 가능한 소스는 Redis의 큐/결과 정보이다.
- **BullMQ + Redis**
  - job 생성 시 BullMQ 큐에 작업을 넣고, Redis를 통해 작업 대기/진행/완료 상태가 관리된다.
  - 워커는 BullMQ를 통해 job을 가져와 처리하고, 처리 결과(성공/실패, result URL, 에러 메시지 등)를 Redis에 저장한다.
- **API 서비스 (예: `src/video/video.service.ts`)**
  - job 생성 시: BullMQ 큐에 enqueue 하고, 인메모리 상태에도 초기 상태(`PENDING` 등)를 기록한다.
  - job 조회 시: Redis/BullMQ에서 최신 상태를 조회하고, 필요 시 인메모리 상태와 병합하여 클라이언트에 반환한다.
- **컨트롤러 (예: `src/video/video.controller.ts`)**
  - job 생성/조회/목록 조회 등의 REST 엔드포인트만 제공하며, 워커용 콜백 전용 엔드포인트는 없다.

데이터 플로우 (현재 동작)
1. 클라이언트가 API에 비디오 처리 요청을 전송한다.
2. API는 새로운 BullMQ job을 생성하여 Redis 큐에 enqueue 한다.
3. API는 인메모리 상태에 해당 job의 초기 메타데이터와 상태(`PENDING` 등)를 기록하고, 클라이언트에 `jobId`를 반환한다.
4. 워커 프로세스는 BullMQ 큐에서 job을 가져와 비디오 처리를 수행한다.
5. 워커는 처리 완료 후, 해당 job의 결과(성공/실패 상태, result URL, 에러 정보 등)를 Redis에 저장하거나 BullMQ job의 result 필드를 업데이트한다.
6. 클라이언트가 job 상태/결과를 조회하면, API는 BullMQ/Redis에서 최신 job 상태 및 결과를 조회하고, 인메모리 상태와 함께 응답을 구성한다.

참고: 워커 HTTP 콜백 엔드포인트
- 초기 설계에서는 워커가 `POST /api/v1/videos/:jobId/callback` 엔드포인트로 결과를 전송하고, API가 이를 받아 DB/인메모리 상태를 업데이트하는 모델을 고려했다.
- 그러나 **현재 코드베이스에는 다음이 존재하지 않는다.**
  - TypeORM/SQLite 기반 영속화(`src/database/database.module.ts`, TypeORM Entity 등)
  - 워커 콜백 엔드포인트 `POST /api/v1/videos/:jobId/callback`
  - 서비스 레벨의 `handleWorkerCallback(jobId, payload)` 메서드
- 따라서 본 문서는 현재 구현에 맞추어 **Redis 기반 결과 저장 + API 조회 방식**을 기준으로 한다.

운영/확장
- **Redis/BullMQ 운영**
  - Redis는 단일 장애 지점이므로, 운영 환경에서는 Sentinel/Cluster 등을 통한 고가용성 구성이 필요하다.
  - BullMQ 큐 모니터링 및 재시도 정책(backoff, attempts 등)을 적절히 설정하여 워커 장애에 대응해야 한다.
- **영속 스토리지 도입 시 고려사항 (미구현, 향후 계획 가능)**
  - 장기적인 job 이력/통계를 위해 RDBMS(MySQL/PostgreSQL 등) + ORM(TypeORM/Prisma 등) 도입을 검토할 수 있다.
  - 이 경우:
    - job 생성 시 DB에 `PENDING` 레코드를 생성하고,
    - 워커 완료 시 DB 상태를 `SUCCEEDED`/`FAILED`로 업데이트하는 패턴으로 확장한다.
  - 구현 시점에 맞춰 본 문서를 다시 업데이트해야 한다.
- **API/워커 간 통신 패턴**
  - 현재는 BullMQ/Redis를 통해 간접적으로 통신하며, 별도 HTTP 콜백 엔드포인트는 사용하지 않는다.
  - 보안/감사 요구사항이 강화될 경우, 서명된 HTTP 콜백 + DB 영속화 모델로 전환을 검토할 수 있다.
