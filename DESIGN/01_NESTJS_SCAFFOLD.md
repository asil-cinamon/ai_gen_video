# NestJS Project Scaffold

요약
- 기본 NestJS 골격과 엔드포인트/모듈 구조를 생성함.

생성 항목
- `package.json`, `tsconfig.json`, `tsconfig.build.json`
- `src/main.ts`, `src/app.module.ts`
- `src/video` 모듈: `video.module.ts`, `video.controller.ts`, `video.service.ts`
- DTO/Entity: `src/video/dto/create-video.dto.ts`, `src/video/entities/video-job.entity.ts`
- `.env.example`

핵심 설계 포인트
- `VideoModule`은 영상 생성 요청 수신, 작업 생성, 상태/결과 조회를 담당.
- 현재 `VideoService`는 작업을 생성하고 큐에 등록(enqueue)하도록 구현되어 있음.
- 추후 인증(AuthModule), 모니터링 등을 추가하도록 설계됨.

다음 단계
- 추가 모듈(JobsModule, StorageModule, DatabaseModule) 연동 및 실제 구현.
