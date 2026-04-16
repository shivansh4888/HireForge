export default function ScoreRing({ score, label, size = 100 }) {
    const radius      = 38;
    const stroke      = 7;
    const circumference = 2 * Math.PI * radius;
    const progress    = ((score || 0) / 100) * circumference;
  
    const color =
      score >= 90 ? '#16a34a' :
      score >= 70 ? '#d97706' : '#dc2626';
  
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <svg width={size} height={size} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius}
            fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          <circle cx="50" cy="50" r={radius}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
          <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
            style={{ fontSize: 18, fontWeight: 700, fill: color, fontFamily: 'sans-serif' }}>
            {score ?? '—'}
          </text>
        </svg>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{label}</span>
      </div>
    );
  }