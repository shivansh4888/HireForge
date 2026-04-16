import { useEffect, useRef } from 'react';

const icons = {
  done:       '✓',
  processing: '◌',
  queued:     '○',
};

export default function ProgressFeed({ steps = [], status }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  if (steps.length === 0 && status === 'queued') {
    return (
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
        Job queued — worker will pick it up shortly...
      </p>
    );
  }

  return (
    <div style={{
      background: '#0f172a', borderRadius: 8, padding: '1rem',
      fontFamily: 'monospace', fontSize: 13, maxHeight: 220, overflowY: 'auto',
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{
          color: i === steps.length - 1 && status === 'processing' ? '#86efac' : '#94a3b8',
          marginBottom: 4,
        }}>
          <span style={{ marginRight: 8, color: '#4ade80' }}>→</span>
          {step}
        </div>
      ))}
      {status === 'processing' && (
        <div style={{ color: '#fbbf24', marginTop: 4 }}>
          <span style={{ marginRight: 8 }}>◌</span>
          Processing...
        </div>
      )}
      {status === 'done' && (
        <div style={{ color: '#4ade80', marginTop: 4, fontWeight: 500 }}>
          <span style={{ marginRight: 8 }}>✓</span>
          Complete
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}