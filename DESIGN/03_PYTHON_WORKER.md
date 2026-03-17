# Python Worker Template

요약
- Redis 리스트 `video_jobs`에서 BRPOP으로 작업을 수신하고 결과를 S3에 업로드한 뒤 API에 콜백을 POST 하는 간단 템플릿을 추가함.

파일
- `worker/worker.py`: BRPOP 소비, 파일 생성(플레이스홀더), S3 업로드, Redis에 result 저장(`video_result:<jobId>`), API 콜백
- `worker/requirements.txt`, `worker/Dockerfile`, `worker/README.md`

환경 변수
- `REDIS_URL`, `S3_BUCKET`, `S3_REGION`, `API_URL` (API 콜백 기본 URL), AWS 자격증명

동작 플로우
1. Redis `video_jobs`에서 job 레코드 수신
2. 작업 처리(여기서는 파일 생성 시뮬레이션)
3. 결과 업로드 → S3 URL 확보
4. Redis에 결과 저장 및 API로 POST 콜백

보안/운영
- API 콜백은 인증(예: HMAC 또는 API Key) 적용 권장
- S3 업로드는 권한 최소화된 크레덴셜 또는 IAM 역할 사용
