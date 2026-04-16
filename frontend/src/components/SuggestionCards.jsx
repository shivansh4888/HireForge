const TYPE_STYLES = {
    project:      { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: 'Project'       },
    certification:{ bg: '#fefce8', color: '#854d0e', border: '#fde68a', label: 'Certification' },
    course:       { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: 'Course'         },
    skill:        { bg: '#fdf4ff', color: '#6b21a8', border: '#e9d5ff', label: 'Skill'          },
    contribution: { bg: '#fff7ed', color: '#9a3412', border: '#fed7aa', label: 'Contribution'   },
  };
  
  export default function SuggestionCards({ suggestions = [] }) {
    if (!suggestions.length) return null;
  
    return (
      <div style={{ marginTop: '1.5rem' }}>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: '0.75rem' }}>
          Recommendations to close the gap
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {suggestions.map((s, i) => {
            const style = TYPE_STYLES[s.type] || TYPE_STYLES.skill;
            return (
              <div key={i} style={{
                border: `1px solid ${style.border}`,
                borderRadius: 8, padding: '0.875rem 1rem',
                background: style.bg,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                    background: style.border, color: style.color,
                  }}>
                    {style.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: style.color }}>
                    {s.title}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#4b5563', margin: 0 }}>{s.why}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }