import KeywordHeatmap from './KeywordHeatmap';
import ProgressFeed from './ProgressFeed';
import ScoreRing from './ScoreRing';
import SuggestionCards from './SuggestionCards';

export default function ResultsPanel({ job, jobId, loading, onReset }) {
  async function copyResume() {
    if (!job?.rewrittenResume) {
      return;
    }

    await navigator.clipboard.writeText(job.rewrittenResume);
  }

  if (loading && !job) {
    return (
      <section className="panel">
        <p className="muted">Loading the analysis...</p>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="panel">
        <p className="muted">Pick an analysis from the left or create a new one.</p>
      </section>
    );
  }

  return (
    <div className="results-layout">
      <section className="panel status-panel">
        <div>
          <p className="section-label">Run status</p>
          <h3>{getHeading(job.status)}</h3>
          <p className="muted mono">{jobId}</p>
        </div>
        <button type="button" className="ghost-button" onClick={onReset}>
          New analysis
        </button>
      </section>

      {(job.originalScore != null || job.finalScore != null) && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Score movement</p>
              <h3>ATS performance snapshot</h3>
            </div>
          </div>

          <div className="score-grid">
            <ScoreRing score={job.originalScore} label="Original" />
            <div className="score-arrow">to</div>
            <ScoreRing score={job.finalScore} label="Optimized" />
          </div>
        </section>
      )}

      {(job.status === 'queued' || job.status === 'processing' || job.progress?.length > 0) && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Agent progress</p>
              <h3>Current processing timeline</h3>
            </div>
          </div>
          <ProgressFeed steps={job.progress || []} status={job.status} />
        </section>
      )}

      {job.rewrittenResume && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Optimized draft</p>
              <h3>Ready-to-edit resume rewrite</h3>
            </div>
            <button type="button" className="ghost-button" onClick={copyResume}>
              Copy text
            </button>
          </div>

          <textarea className="result-textarea" readOnly value={job.rewrittenResume} rows="18" />
        </section>
      )}

      {job.keywordMap && Object.keys(job.keywordMap).length > 0 && (
        <section className="panel">
          <KeywordHeatmap keywordMap={job.keywordMap} />
        </section>
      )}

      {job.suggestions?.length > 0 && (
        <section className="panel">
          <SuggestionCards suggestions={job.suggestions} />
        </section>
      )}

      {job.status === 'failed' && (
        <div className="alert alert-error">
          {job.errorMessage || 'The worker encountered an error while processing this resume.'}
        </div>
      )}
    </div>
  );
}

function getHeading(status) {
  if (status === 'done') {
    return 'Analysis complete';
  }

  if (status === 'processing') {
    return 'Optimizing resume content';
  }

  if (status === 'failed') {
    return 'Analysis failed';
  }

  return 'Queued for processing';
}
