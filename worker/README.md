Python Worker
=================

Purpose
- Simple worker template that consumes jobs from Redis list `video_jobs`, simulates video generation, uploads a file to S3, and stores the result URL back in Redis under `video_result:<jobId>`.

Env vars
- `REDIS_URL` (default: `redis://localhost:6379`)
- `S3_BUCKET` (required)
- `S3_REGION` (optional)
- AWS credentials via environment: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`

Run locally
```bash
python -m pip install -r requirements.txt
S3_BUCKET=your-bucket REDIS_URL=redis://localhost:6379 python worker.py
```

Run with Docker (example)
```bash
docker build -t ai-video-worker:local .
docker run --env REDIS_URL=redis://redis:6379 --env S3_BUCKET=your-bucket ai-video-worker:local
```

Notes
- This worker uses a plain Redis list for simplicity. Ensure the API enqueues plain list entries in addition to BullMQ if you want to use this worker.
- Replace the simulated generation step with your real inference pipeline.
