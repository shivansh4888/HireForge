import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/client';
import ScoreRing       from '../components/ScoreRing';
import KeywordHeatmap  from '../components/KeywordHeatmap';
import SuggestionCards from '../components/SuggestionCards';
import ProgressFeed    from '../components/ProgressFeed';

export default function Home() {
  const { user, logout }       = useAuth();
  const [file,     setFile]    = useState(null);
  const [jdText,   setJdText]  = useState('');
  const [jobId,    setJobId]   = useState(null);
  const [job,      setJob]     = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [polling,  setPolling] = useState(false);

  // Drag and drop
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1,
  });

  // WebSocket — receive live progress from backend (future enhancement)
  useWebSocket(jobId, (msg) => {
    if (msg.progress) setJob(prev => prev ? { ...prev, progress: msg.progress } : prev);
  });

  // Poll job status every 3 seconds while processing
  useEffect(() => {
    if (!jobId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/jobs/${jobId}`);
        setJob(data);
        if (data.status === 'done' || data.status === 'failed') {
          setPolling(false);
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId, polling]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file)         return setError('Please upload a PDF resume.');
    if (!jdText.trim()) return setError('Please paste the job description.');
    setError(''); setLoading(true); setJob(null); setJobId(null);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jdText', jdText);
      const { data } = await api.post('/upload', formData);
      setJobId(data.jobId);
      setJob({ status: 'queued', progress: [] });
      setPolling(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null); setJdText(''); setJobId(null);
    setJob(null);  setError('');  setPolling(false);
  };

  const copyResume = () => {
    if (job?.rewrittenResume) navigator.clipboard.writeText(job.rewrittenResume);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 1.5rem', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 600, fontSize: 16 }}>ResumeForge AI</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</span>
          <button onClick={logout} style={{
            fontSize: 13, color: '#64748b', background: 'none',
            border: '1px solid #e2e8f0', borderRadius: 6,
            padding: '4px 12px', cursor: 'pointer',
          }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Upload form — hide once job is running */}
        {!job && (
          <div style={{
            background: '#fff', borderRadius: 12,
            border: '1px solid #e2e8f0', padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: '0.25rem' }}>
              Optimize your resume
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: '1.25rem' }}>
              Upload your resume and paste the job description — we'll rewrite it to score 90+ on ATS.
            </p>

            {error && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', padding: '0.75rem',
                borderRadius: 8, fontSize: 13, marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Dropzone */}
              <div {...getRootProps()} style={{
                border: `2px dashed ${isDragActive ? '#2563eb' : '#cbd5e1'}`,
                borderRadius: 10, padding: '2rem', textAlign: 'center',
                cursor: 'pointer', marginBottom: '1rem',
                background: isDragActive ? '#eff6ff' : '#f8fafc',
                transition: 'all 0.2s',
              }}>
                <input {...getInputProps()} />
                {file ? (
                  <div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                    <p style={{ fontWeight: 500, color: '#1e293b' }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>
                      {(file.size / 1024).toFixed(1)} KB — click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>⬆</div>
                    <p style={{ color: '#475569', fontWeight: 500 }}>
                      {isDragActive ? 'Drop it here' : 'Drag your resume PDF here'}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      or click to browse — PDF only, max 5 MB
                    </p>
                  </div>
                )}
              </div>

              {/* JD textarea */}
              <textarea
                placeholder="Paste the full job description here..."
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                rows={8}
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid #cbd5e1',
                  padding: '0.75rem', fontSize: 13, resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '1rem',
                }}
              />

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.75rem', borderRadius: 8,
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff', fontSize: 15, fontWeight: 500,
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Uploading...' : 'Analyze & optimize resume'}
              </button>
            </form>
          </div>
        )}

        {/* Results panel */}
        {job && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status header */}
            <div style={{
              background: '#fff', borderRadius: 12,
              border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 2 }}>
                  {job.status === 'done'       && 'Analysis complete'}
                  {job.status === 'processing' && 'Optimizing your resume...'}
                  {job.status === 'queued'     && 'In queue...'}
                  {job.status === 'failed'     && 'Something went wrong'}
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Job ID: {jobId}
                </p>
              </div>
              <button onClick={reset} style={{
                fontSize: 13, padding: '6px 14px', borderRadius: 8,
                border: '1px solid #e2e8f0', background: '#fff',
                cursor: 'pointer', color: '#475569',
              }}>
                New analysis
              </button>
            </div>

            {/* Scores */}
            {(job.originalScore != null || job.finalScore != null) && (
              <div style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
                display: 'flex', justifyContent: 'center', gap: '3rem',
              }}>
                <ScoreRing score={job.originalScore} label="Original score" />
                <div style={{ display: 'flex', alignItems: 'center', color: '#94a3b8', fontSize: 20 }}>
                  →
                </div>
                <ScoreRing score={job.finalScore}    label="Optimized score" />
              </div>
            )}

            {/* Progress feed */}
            {(job.status === 'processing' || job.status === 'queued' || job.progress?.length > 0) && (
              <div style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
              }}>
                <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: '0.75rem' }}>
                  Agent progress
                </h3>
                <ProgressFeed steps={job.progress || []} status={job.status} />
              </div>
            )}

            {/* Rewritten resume */}
            {job.rewrittenResume && (
              <div style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
              }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '0.75rem',
                }}>
                  <h3 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>
                    Optimized resume
                    {job.iterations > 0 && (
                      <span style={{
                        marginLeft: 8, fontSize: 11, background: '#eff6ff',
                        color: '#1d4ed8', padding: '2px 8px', borderRadius: 12,
                      }}>
                        {job.iterations} rewrite pass{job.iterations > 1 ? 'es' : ''}
                      </span>
                    )}
                  </h3>
                  <button onClick={copyResume} style={{
                    fontSize: 13, padding: '5px 12px', borderRadius: 7,
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    cursor: 'pointer', color: '#374151',
                  }}>
                    Copy
                  </button>
                </div>
                <textarea
                  readOnly
                  value={job.rewrittenResume}
                  rows={16}
                  style={{
                    width: '100%', borderRadius: 8, border: '1px solid #e2e8f0',
                    padding: '0.75rem', fontSize: 13, resize: 'vertical',
                    fontFamily: 'monospace', boxSizing: 'border-box',
                    background: '#f8fafc', color: '#1e293b',
                  }}
                />
              </div>
            )}

            {/* Keyword heatmap */}
            {job.keywordMap && Object.keys(job.keywordMap).length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
              }}>
                <KeywordHeatmap keywordMap={job.keywordMap} />
              </div>
            )}

            {/* Suggestions */}
            {job.suggestions?.length > 0 && (
              <div style={{
                background: '#fff', borderRadius: 12,
                border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
              }}>
                <SuggestionCards suggestions={job.suggestions} />
              </div>
            )}

            {/* Error state */}
            {job.status === 'failed' && (
              <div style={{
                background: '#fee2e2', borderRadius: 12,
                border: '1px solid #fecaca', padding: '1.25rem 1.5rem',
                color: '#991b1b', fontSize: 14,
              }}>
                {job.errorMessage || 'The agent encountered an error. Please try again.'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}