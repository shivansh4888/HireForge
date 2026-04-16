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
  try {
    const { jdText } = req.body;
    if (!jdText?.trim()) return res.status(400).json({ error: 'Job description is required' });
    if (!req.file)       return res.status(400).json({ error: 'PDF resume is required' });

    const jobId  = uuid();
    const s3Key  = `resumes/${req.user.id}/${jobId}.pdf`;

    await uploadToS3(s3Key, req.file.buffer, 'application/pdf');

    await Job.create({
      _id:         jobId,
      userId:      req.user.id,
      resumeS3Key: s3Key,
      jdText:      jdText.trim(),
    });

    await enqueueJob(jobId);

    res.status(202).json({ jobId, status: 'queued' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;