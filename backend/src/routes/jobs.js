import express from 'express';
import Job     from '../models/Job.js';
import { requireAuth } from '../middleware/auth.js';
import { getPresignedUrl } from '../services/s3.js';

const router = express.Router();

// Get one job (poll or final result)
router.get('/:jobId', requireAuth, async (req, res) => {
  const job = await Job.findOne({ _id: req.params.jobId, userId: req.user.id }).lean();
  if (!job) return res.status(404).json({ error: 'Not found' });

  // If done, attach a short-lived pre-signed URL for the original PDF
  if (job.status === 'done' && job.resumeS3Key)
    job.resumeUrl = await getPresignedUrl(job.resumeS3Key);

  res.json(job);
});

// List all jobs for the logged-in user
router.get('/', requireAuth, async (req, res) => {
  const jobs = await Job.find({ userId: req.user.id })
    .select('_id status originalScore finalScore createdAt')
    .sort('-createdAt')
    .limit(20)
    .lean();
  res.json(jobs);
});

export default router;