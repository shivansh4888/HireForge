import express from 'express';
import multer  from 'multer';
import { v4 as uuid } from 'uuid';
import Job          from '../models/Job.js';
import { uploadToS3 } from '../services/s3.js';
import { enqueueJob }  from '../services/sqs.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },   // 5 MB
  fileFilter: (_, file, cb) =>
    cb(null, file.mimetype === 'application/pdf'),
});

router.post('/', requireAuth, upload.single('resume'), async (req, res) => {
  let jobId;

  try {
    const { jdText, templateKind = 'sde', targetScore } = req.body;
    if (!jdText?.trim()) return res.status(400).json({ error: 'Job description is required' });
    if (!req.file)       return res.status(400).json({ error: 'PDF resume is required' });
    if (!['sde', 'ai', 'etc'].includes(templateKind)) {
      return res.status(400).json({ error: 'Unsupported resume template' });
    }

    const normalizedTargetScore = Math.min(
      100,
      Math.max(75, Number.parseInt(targetScore, 10) || 90),
    );

    jobId        = uuid();
    const s3Key  = `resumes/${req.user.id}/${jobId}.pdf`;

    await uploadToS3(s3Key, req.file.buffer, 'application/pdf');

    await Job.create({
      _id:         jobId,
      userId:      req.user.id,
      resumeS3Key: s3Key,
      jdText:      jdText.trim(),
      templateKind,
      targetScore: normalizedTargetScore,
    });

    await enqueueJob(jobId);

    res.status(202).json({ jobId, status: 'queued', templateKind, targetScore: normalizedTargetScore });
  } catch (err) {
    console.error('Upload error:', err);

    if (jobId) {
      await Job.findByIdAndUpdate(jobId, {
        status: 'failed',
        errorMessage: err.message || 'Upload failed before queueing job',
      });
    }

    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;
