export default function KeywordHeatmap({ keywordMap }) {
    if (!keywordMap || Object.keys(keywordMap).length === 0) return null;
  
    const present = Object.entries(keywordMap).filter(([, v]) => v === 'present');
    const missing = Object.entries(keywordMap).filter(([, v]) => v === 'missing');
  
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
          Keyword match map
        </h3>
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Present: {present.length}
          </span>
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Missing: {missing.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {present.map(([kw]) => (
            <span key={kw} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 12,
              background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0',
            }}>
              {kw}
            </span>
          ))}
          {missing.map(([kw]) => (
            <span key={kw} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 12,
              background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
            }}>
              {kw}
            </span>
          ))}
        </div>
      </div>
    );
  }