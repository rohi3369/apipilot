import React, { useState, useEffect } from 'react';
import authService from './auth-service-fixed';

const ProtectedApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proxyResult, setProxyResult] = useState(null);
  const [proxyLoading, setProxyLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
          setUser(authService.user);
        } catch (error) {
          console.error('Auth check failed:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const makeProxyRequest = async () => {
    setProxyLoading(true);
    setProxyResult(null);
    try {
      const response = await authService.makeApiRequest('/proxy', {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({
          url: 'https://jsonplaceholder.typicode.com/posts/1',
          method: 'GET',
          headers: {},
          params: [],
          bodyType: 'json',
        }),
      });
      const data = await response.json();
      // FIX: parse body safely
      let parsed = data.body;
      try { parsed = JSON.parse(data.body); } catch (_) {}
      setProxyResult({ success: true, status: data.status, data: parsed });
    } catch (error) {
      setProxyResult({ success: false, error: error.message });
    } finally {
      setProxyLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50, color: '#64748b' }}>Loading…</div>;
  if (!user) return <div style={{ textAlign: 'center', marginTop: 50 }}>Please login to continue.</div>;

  const card = { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 20, marginBottom: 16 };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Dashboard</h2>

      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 12 }}>User Info</h3>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          {[['Username', user.username], ['Role', user.role], ['Admin access', authService.isAdmin() ? 'Yes' : 'No']].map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: '5px 0', color: '#6b7280', width: 140 }}>{k}</td>
              <td style={{ padding: '5px 0', fontWeight: 500 }}>{v}</td>
            </tr>
          ))}
        </table>
      </div>

      <div style={card}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Test Proxy</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
          Fires a test GET request through the backend proxy to verify authentication and connectivity.
        </p>
        <button
          onClick={makeProxyRequest}
          disabled={proxyLoading}
          style={{ padding: '7px 16px', backgroundColor: proxyLoading ? '#93c5fd' : '#0ea5e9', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          {proxyLoading ? 'Sending…' : 'Send Test Request'}
        </button>
        {proxyResult && (
          <div style={{ marginTop: 12, padding: 12, backgroundColor: proxyResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${proxyResult.success ? '#86efac' : '#fca5a5'}`, borderRadius: 6, fontSize: 12 }}>
            {proxyResult.success
              ? <><strong style={{ color: '#16a34a' }}>✓ Success — {proxyResult.status}</strong><pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap', color: '#374151' }}>{JSON.stringify(proxyResult.data, null, 2)}</pre></>
              : <span style={{ color: '#dc2626' }}>✗ {proxyResult.error}</span>
            }
          </div>
        )}
      </div>

      <div style={{ ...card, backgroundColor: '#f8fafc' }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Quick Reference</h3>
        <ul style={{ fontSize: 12, color: '#6b7280', paddingLeft: 18, margin: 0, lineHeight: 1.8 }}>
          <li>JWT token stored in localStorage, included in all proxy requests</li>
          <li>Token auto-refresh available via <code>/auth/refresh</code></li>
          <li>Switch to <strong>API Tester</strong> tab to make full requests</li>
        </ul>
      </div>
    </div>
  );
};

export default ProtectedApp;
