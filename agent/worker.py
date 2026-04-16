import os
import sys
import json
import time
from pathlib import Path
import boto3
import fitz          # PyMuPDF
import pymongo
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_PATH, override=True)

from graph.graph import graph

REQUIRED_ENV = [
    "MONGODB_URI",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "SQS_QUEUE_URL",
    "GROQ_API_KEY",
    "GROQ_MODEL",
]

missing_env = [name for name in REQUIRED_ENV if not os.environ.get(name, "").strip()]
if missing_env:
    print(f"[worker] Missing env vars: {', '.join(missing_env)}")
    sys.exit(1)

# ── Clients ───────────────────────────────────────────────────────────────────
sqs = boto3.client(
    "sqs",
    region_name            = os.environ["AWS_REGION"],
    aws_access_key_id      = os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key  = os.environ["AWS_SECRET_ACCESS_KEY"],
)
s3 = boto3.client(
    "s3",
    region_name            = os.environ["AWS_REGION"],
    aws_access_key_id      = os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key  = os.environ["AWS_SECRET_ACCESS_KEY"],
)

DB_NAME = os.environ.get("MONGODB_DB", "resumeforge")

mongo  = pymongo.MongoClient(os.environ["MONGODB_URI"])
db     = mongo[DB_NAME]
jobs   = db["jobs"]

QUEUE_URL = os.environ["SQS_QUEUE_URL"]
BUCKET    = os.environ["S3_BUCKET"]

# ── Helpers ───────────────────────────────────────────────────────────────────

def extract_text_from_s3(s3_key: str) -> str:
    obj    = s3.get_object(Bucket=BUCKET, Key=s3_key)
    pdf    = fitz.open(stream=obj["Body"].read(), filetype="pdf")
    return "\n".join(page.get_text() for page in pdf)

def set_status(job_id: str, status: str, extra: dict = {}):
    jobs.update_one({"_id": job_id}, {"$set": {"status": status, **extra}})

# ── Core job processor ────────────────────────────────────────────────────────

def process_job(job_id: str):
    print(f"[worker] Processing job {job_id}")
    job = jobs.find_one({"_id": job_id})
    if not job:
        print(f"[worker] Job {job_id} not found in DB — skipping")
        return

    set_status(job_id, "processing")

    try:
        resume_text = extract_text_from_s3(job["resumeS3Key"])
    except Exception as e:
        set_status(job_id, "failed", {"errorMessage": f"PDF extraction failed: {e}"})
        return

    initial_state = {
        "job_id":           job_id,
        "resume_text":      resume_text,
        "jd_text":          job["jdText"],
        "parsed_resume":    {},
        "parsed_jd":        {},
        "ats_score":        0,
        "keyword_map":      {},
        "gaps":             [],
        "rewritten_resume": None,
        "suggestions":      [],
        "iteration":        0,
        "final_score":      None,
        "progress":         [],
    }

    try:
        result = graph.invoke(initial_state)
    except Exception as e:
        set_status(job_id, "failed", {"errorMessage": f"Agent error: {e}"})
        print(f"[worker] Agent failed for {job_id}: {e}")
        return

    set_status(job_id, "done", {
        "originalScore":   result["ats_score"],
        "finalScore":      result["final_score"],
        "rewrittenResume": result.get("rewritten_resume"),
        "gaps":            result["gaps"],
        "suggestions":     result["suggestions"],
        "keywordMap":      result["keyword_map"],
        "iterations":      result["iteration"],
        "progress":        result.get("progress", []),
    })

    print(f"[worker] Job {job_id} done. Score: {result['ats_score']} → {result['final_score']}")

# ── SQS polling loop ──────────────────────────────────────────────────────────

def poll():
    print(f"[worker] Loaded env from {ENV_PATH}")
    print(f"[worker] Mongo database: {DB_NAME}")
    print(f"[worker] Started. Polling SQS for jobs on {QUEUE_URL}")
    while True:
        try:
            resp = sqs.receive_message(
                QueueUrl            = QUEUE_URL,
                MaxNumberOfMessages = 1,
                WaitTimeSeconds     = 20,     # long-polling — uses almost no quota
            )
            messages = resp.get("Messages", [])

            if not messages:
                continue   # nothing in queue, loop again

            print(f"[worker] Received {len(messages)} message(s)")
            for msg in messages:
                body   = json.loads(msg["Body"])
                job_id = body["jobId"]

                try:
                    process_job(job_id)
                except Exception as e:
                    print(f"[worker] Unhandled error for {job_id}: {e}")
                    set_status(job_id, "failed", {"errorMessage": str(e)})
                finally:
                    # Always delete the message so it doesn't reprocess
                    sqs.delete_message(
                        QueueUrl      = QUEUE_URL,
                        ReceiptHandle = msg["ReceiptHandle"],
                    )

        except KeyboardInterrupt:
            print("\n[worker] Shutting down.")
            sys.exit(0)
        except Exception as e:
            print(f"[worker] SQS error: {e} — retrying in 5s")
            time.sleep(5)

if __name__ == "__main__":
    poll()
