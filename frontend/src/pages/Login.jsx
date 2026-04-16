import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f8fafc',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0',
        padding: '2rem', width: '100%', maxWidth: 400,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, textAlign: 'center' }}>
          ResumeForge AI
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: '1.5rem' }}>
          {isRegister ? 'Create your account' : 'Sign in to continue'}
        </p>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b', padding: '0.75rem',
            borderRadius: 8, fontSize: 13, marginBottom: '1rem',
          }}>
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
  padding: '0.625rem 0.875rem', borderRadius: 8,
  border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', width: '100%',
  boxSizing: 'border-box',
};
const btnStyle = {
  padding: '0.625rem', borderRadius: 8, border: 'none',
  background: '#2563eb', color: '#fff', fontSize: 14,
  fontWeight: 500, cursor: 'pointer', marginTop: 4,
};