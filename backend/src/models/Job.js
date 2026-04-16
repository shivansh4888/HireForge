import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  type:  String,   // "project" | "certification" | "course" | "skill"
  title: String,
  why:   String,
}, { _id: false });

const jobSchema = new mongoose.Schema({
  _id:             String,           // UUID we generate
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  status:          { type: String, enum: ['queued','processing','done','failed'], default: 'queued' },
  resumeS3Key:     String,
  jdText:          String,
  originalScore:   Number,
  finalScore:      Number,
  rewrittenResume: String,
  gaps:            [String],
  suggestions:     [suggestionSchema],
  keywordMap:      mongoose.Schema.Types.Mixed,
  iterations:      { type: Number, default: 0 },
  errorMessage:    String,
  createdAt:       { type: Date, default: Date.now },
});

export default mongoose.model('Job', jobSchema);