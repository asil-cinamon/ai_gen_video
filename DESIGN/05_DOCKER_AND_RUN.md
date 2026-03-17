# Docker & Run Notes

요약
- `docker-compose.yml`과 각 서비스의 Dockerfile을 구성하여 로컬에서 API, Redis, Postgres(예비), Python worker를 함께 실행할 수 있도록 설정함.

구성 요약
- `api` (NestJS): 루트 `Dockerfile` 사용, 포트 3000 노출
- `redis`: `redis:7-alpine`
- `postgres`: `postgres:15-alpine` (선택적)
- `worker-python`: `worker/Dockerfile`에서 빌드되며 `API_URL`로 콜백을 전송

간단 실행
```bash
# .env 파일을 작성한 뒤
docker compose up --build
```

로컬 개발 팁
- Node: `npm run start:dev`로 빠르게 개발
- Worker: `python -m pip install -r worker/requirements.txt` 후 환경 변수 지정하여 실행

환경변수
- `.env.example`에 기본값 포함: `REDIS_URL`, `S3_BUCKET`, `API_URL`, `DATABASE_URL`

운영 권장
- 프로덕션에서는 SQLite 대신 PostgreSQL 사용, Docker secrets/EnvVault로 민감 정보 관리
- S3 업로드를 비동기/멀티파트로 최적화, CDN 연동 권장
