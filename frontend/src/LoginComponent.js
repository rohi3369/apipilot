import React, { useState } from 'react';
import authService from './auth-service-fixed';

const LoginComponent = ({ onLogin }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.login(formData.username, formData.password);
      onLogin();
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#f1f5f9', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        width: 380, backgroundColor: '#fff', borderRadius: 10,
        border: '1px solid #e2e8f0', padding: '32px 28px', boxSizing: 'border-box',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>⚡</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>ApiPilot</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {['username', 'password'].map((field) => (
            <div key={field} style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5, textTransform: 'capitalize' }}>
                {field}
              </label>
              <input
                type={field === 'password' ? 'password' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                required
                style={{
                  width: '100%', padding: '8px 10px', border: '1px solid #d1d5db',
                  borderRadius: 6, fontSize: 13, boxSizing: 'border-box', outline: 'none',
                }}
              />
            </div>
          ))}

          {error && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: '8px 12px', color: '#dc2626', fontSize: 12, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '9px', backgroundColor: loading ? '#93c5fd' : '#0ea5e9',
              color: 'white', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 600, marginTop: 4,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: '12px', backgroundColor: '#f8fafc', borderRadius: 6, fontSize: 11, color: '#64748b' }}>
          <strong>Default credentials</strong><br />
          Admin: <code>admin / admin123</code><br />
          User: <code>user / user123</code>
        </div>
      </div>
    </div>
  );
};

export default LoginComponent;
