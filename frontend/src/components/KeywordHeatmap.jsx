export default function KeywordHeatmap({ keywordMap }) {
  if (!keywordMap || Object.keys(keywordMap).length === 0) return null;

  const present = Object.entries(keywordMap).filter(([, value]) => value === 'present');
  const missing = Object.entries(keywordMap).filter(([, value]) => value === 'missing');

  return (
    <div>
      <div className="section-heading">
        <div>
          <p className="section-label">Keyword coverage</p>
          <h3>Match map</h3>
        </div>
        <div className="keyword-summary">
          <span>{present.length} present</span>
          <span>{missing.length} missing</span>
        </div>
      </div>

      <div className="keyword-groups">
        {present.map(([keyword]) => (
          <span key={keyword} className="keyword-chip keyword-chip-present">
            {keyword}
          </span>
        ))}
        {missing.map(([keyword]) => (
          <span key={keyword} className="keyword-chip keyword-chip-missing">
            {keyword}
          </span>
        ))}
      </div>
    </div>
  );
}
