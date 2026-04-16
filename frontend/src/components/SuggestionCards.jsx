const TYPE_STYLES = {
  project: { bg: '#eef4ff', color: '#1d4f91', border: '#bfd5fb', label: 'Project' },
  certification: { bg: '#fff8df', color: '#8a5b00', border: '#f1d58a', label: 'Certification' },
  course: { bg: '#eef9f1', color: '#1f6b3c', border: '#b9e1c7', label: 'Course' },
  skill: { bg: '#fdf1e7', color: '#a04d12', border: '#f0c9a6', label: 'Skill' },
  contribution: { bg: '#f5efe7', color: '#7f5733', border: '#e4d3be', label: 'Contribution' },
};

export default function SuggestionCards({ suggestions = [] }) {
  if (!suggestions.length) return null;

  return (
    <div>
      <div className="section-heading">
        <div>
          <p className="section-label">Gap closing ideas</p>
          <h3>Recommended additions</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {suggestions.map((suggestion, index) => {
          const style = TYPE_STYLES[suggestion.type] || TYPE_STYLES.skill;
          return (
            <div
              key={`${suggestion.title}-${index}`}
              style={{
                border: `1px solid ${style.border}`,
                borderRadius: 18,
                padding: '1rem 1.1rem',
                background: style.bg,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: style.border,
                    color: style.color,
                  }}
                >
                  {style.label}
                </span>
                <strong style={{ color: style.color }}>{suggestion.title}</strong>
              </div>
              <p style={{ fontSize: 14, color: '#544b40', margin: 0 }}>{suggestion.why}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
