import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { login, register } = useAuth();
  const navigate             = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isRegister) await register(email, password);
      else            await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">HireForge</p>
        <h1 className="auth-title">Resume tuning with a deployment-ready workflow.</h1>
        <p style={{ textAlign: 'left', color: '#6c6152', fontSize: 14, marginBottom: '1.5rem' }}>
          {isRegister ? 'Create your account' : 'Sign in to continue'}
        </p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={inputStyle}
          />
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, marginTop: '1rem', color: '#64748b' }}>
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <span
            onClick={() => setIsRegister(!isRegister)}
            style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isRegister ? 'Sign in' : 'Register'}
          </span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '0.875rem 0.95rem', borderRadius: 14,
  border: '1px solid #d8c9b4', fontSize: 14, outline: 'none', width: '100%',
  boxSizing: 'border-box',
  background: '#fffaf4',
};
const btnStyle = {
  padding: '0.875rem', borderRadius: 14, border: 'none',
  background: 'linear-gradient(135deg, #d9692b, #b84f1c)', color: '#fff', fontSize: 14,
  fontWeight: 700, cursor: 'pointer', marginTop: 4,
};
