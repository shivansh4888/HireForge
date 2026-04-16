import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import UploadForm from '../components/UploadForm';
import ResultsPanel from '../components/ResultsPanel';
import { useAuth } from '../context/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [job, setJob] = useState(null);
  const [loadingJob, setLoadingJob] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const jobStatus = job?.status;

  const loadJobs = useCallback(async (preferredJobId) => {
    try {
      const { data } = await api.get('/jobs');
      setJobs(data);
      if (preferredJobId) {
        setSelectedJobId(preferredJobId);
        return;
      }
      setSelectedJobId((current) => current || data[0]?._id || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load previous analyses.');
    }
  }, []);

  const loadJob = useCallback(async (jobId) => {
    if (!jobId) {
      setJob(null);
      return;
    }

    setLoadingJob(true);
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Could not load this analysis.');
    } finally {
      setLoadingJob(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    loadJob(selectedJobId);
  }, [loadJob, selectedJobId]);

  useEffect(() => {
    if (!selectedJobId || !['queued', 'processing'].includes(jobStatus || '')) {
      return undefined;
    }

    const interval = setInterval(async () => {
      try {
        const { data } = await api.get(`/jobs/${selectedJobId}`);
        setJob(data);

        if (!['queued', 'processing'].includes(data.status)) {
          loadJobs(selectedJobId);
        }
      } catch {
        // Keep polling quiet; the panel already handles visible errors.
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobStatus, loadJobs, selectedJobId]);

  useWebSocket(selectedJobId, (message) => {
    if (!message?.progress?.length) {
      return;
    }

    setJob((current) => (
      current
        ? { ...current, progress: message.progress }
        : current
    ));
  });

  async function handleCreateAnalysis({ file, jdText }) {
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jdText', jdText);

      const { data } = await api.post('/upload', formData);
      const optimisticJob = {
        _id: data.jobId,
        status: data.status,
        progress: [],
        createdAt: new Date().toISOString(),
      };

      setSelectedJobId(data.jobId);
      setJob(optimisticJob);
      setJobs((current) => [optimisticJob, ...current.filter((item) => item._id !== data.jobId)]);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewAnalysis() {
    setSelectedJobId(null);
    setJob(null);
    setError('');
  }

  async function handleRefresh() {
    await loadJobs(selectedJobId);
    await loadJob(selectedJobId);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-card">
          <p className="eyebrow">HireForge</p>
          <h1>Resume intelligence for targeted job applications.</h1>
          <p className="muted">
            Upload a resume, map it against a job description, and turn the result into
            a stronger ATS-ready draft.
          </p>
        </div>

        <div className="panel sidebar-panel">
          <div className="sidebar-actions">
            <div>
              <p className="section-label">Workspace</p>
              <strong>{user?.email}</strong>
            </div>
            <button type="button" className="ghost-button" onClick={logout}>
              Sign out
            </button>
          </div>

          <button type="button" className="primary-button full-width" onClick={handleNewAnalysis}>
            New analysis
          </button>

          <div className="history-header">
            <p className="section-label">Recent runs</p>
            <button type="button" className="text-button" onClick={handleRefresh}>
              Refresh
            </button>
          </div>

          <div className="history-list">
            {jobs.length === 0 && (
              <p className="empty-state">Your previous analyses will appear here.</p>
            )}

            {jobs.map((item) => (
              <button
                key={item._id}
                type="button"
                className={`history-item${selectedJobId === item._id ? ' active' : ''}`}
                onClick={() => setSelectedJobId(item._id)}
              >
                <div className="history-topline">
                  <span>{item.status}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <strong>{item.finalScore ?? item.originalScore ?? 'Pending'} ATS</strong>
                <span className="muted mono">{item._id}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="content">
        <section className="hero-card">
          <p className="eyebrow">Analysis Studio</p>
          <h2>Build a tailored resume package in one place.</h2>
          <p className="muted">
            Start a new analysis or reopen an earlier run to review scores, keywords,
            and rewrite output.
          </p>
        </section>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {!selectedJobId ? (
          <UploadForm onSubmit={handleCreateAnalysis} submitting={submitting} />
        ) : (
          <ResultsPanel
            job={job}
            jobId={selectedJobId}
            loading={loadingJob}
            onReset={handleNewAnalysis}
          />
        )}
      </main>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return 'now';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}
