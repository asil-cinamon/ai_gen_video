import os
import sys
import json
import time
import tempfile
import logging
from urllib.parse import urlparse

import boto3
import redis
import requests
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
S3_BUCKET = os.getenv('S3_BUCKET')
S3_REGION = os.getenv('S3_REGION')

logger = logging.getLogger('worker')
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')


def s3_client():
    session = boto3.session.Session()
    return session.client('s3', region_name=S3_REGION)


def upload_file_to_s3(local_path: str, key: str) -> str:
    client = s3_client()
    client.upload_file(local_path, S3_BUCKET, key)
    return f's3://{S3_BUCKET}/{key}'


def process_job(obj: dict):
    jobId = obj.get('jobId')
    payload = obj.get('payload')
    logger.info('Processing job %s payload=%s', jobId, payload)

    # Simulate video generation work: create a small file as placeholder
    with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
        tmp.write(f"Generated video for job {jobId}\nPayload: {json.dumps(payload)}\n".encode('utf-8'))
        tmp.flush()
        local_path = tmp.name

    key = f'results/{jobId}.mp4'
    url = upload_file_to_s3(local_path, key)

    # store result location in Redis for the API to pick up (optional)
    try:
        r = redis.from_url(REDIS_URL)
        r.set(f'video_result:{jobId}', json.dumps({'resultUrl': url}))
    except Exception:
        logger.exception('Failed to write result to Redis')

    logger.info('Job %s finished, uploaded to %s', jobId, url)

    # Send callback to API if configured
    api_url = os.getenv('API_URL')
    if api_url:
        try:
            cb_url = api_url.rstrip('/') + f'/api/v1/videos/{jobId}/callback'
            resp = requests.post(cb_url, json={'status': 'SUCCESS', 'resultUrl': url}, timeout=5)
            logger.info('Posted callback to %s status=%s', cb_url, resp.status_code)
        except Exception:
            logger.exception('Failed to post callback to API')


def run():
    logger.info('Worker starting, connecting to %s', REDIS_URL)
    r = redis.from_url(REDIS_URL)
    list_key = 'video_jobs'

    while True:
        try:
            # BRPOP returns (list, value) or None
            item = r.brpop(list_key, timeout=5)
            if not item:
                continue
            _, raw = item
            try:
                obj = json.loads(raw)
            except Exception:
                logger.exception('Invalid job payload, skipping')
                continue

            try:
                process_job(obj)
            except Exception:
                logger.exception('Failed processing job')
        except KeyboardInterrupt:
            logger.info('Worker stopping')
            break
        except Exception:
            logger.exception('Worker loop error, sleeping briefly')
            time.sleep(2)


if __name__ == '__main__':
    if not S3_BUCKET:
        logger.error('S3_BUCKET not set. Set environment variable and retry.')
        sys.exit(1)
    run()
