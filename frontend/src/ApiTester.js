import React, { useState } from 'react';
import authService from './auth-service';

const ApiTester = () => {
  const [request, setRequest] = useState({
    method: 'GET',
    url: '',
    headers: [{ k: '', v: '', enabled: true }],
    bodyType: 'json',
    body: '',
    params: [{ k: '', v: '', enabled: true }],
    formData: [{ k: '', v: '', enabled: true }],
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('params');
  const [respTab, setRespTab] = useState('body');
  const [jsonError, setJsonError] = useState('');
  const [history, setHistory] = useState([]);

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const bodyTypes = ['json', 'raw', 'form-data'];
  const noBodyMethods = ['GET', 'HEAD', 'OPTIONS'];

  const methodColors = {
    GET: '#0284c7', POST: '#16a34a', PUT: '#ca8a04',
    PATCH: '#7c3aed', DELETE: '#dc2626', HEAD: '#6b7280', OPTIONS: '#0891b2',
  };

  // ── KV row helpers ──────────────────────────────────────────
  const addRow = (field) =>
    setRequest((r) => ({ ...r, [field]: [...r[field], { k: '', v: '', enabled: true }] }));

  const updateRow = (field, index, key, value) =>
    setRequest((r) => {
      const arr = [...r[field]];
      arr[index] = { ...arr[index], [key]: value };
      return { ...r, [field]: arr };
    });

  const removeRow = (field, index) =>
    setRequest((r) => ({
      ...r,
      [field]: r[field].length > 1 ? r[field].filter((_, i) => i !== index) : r[field],
    }));

  // ── Build URL with params appended ─────────────────────────
  const buildURL = () => {
    const enabled = request.params.filter((p) => p.enabled && p.k);
    if (!enabled.length) return request.url;
    const qs = enabled.map((p) => `${encodeURIComponent(p.k)}=${encodeURIComponent(p.v)}`).join('&');
    return request.url + (request.url.includes('?') ? '&' : '?') + qs;
  };

  // ── Auth headers ────────────────────────────────────────────
  const buildAuthHeaders = () => {
    const type = request.authType;
    if (type === 'bearer' && request.bearerToken)
      return { Authorization: `Bearer ${request.bearerToken}` };
    if (type === 'basic' && request.basicUser)
      return { Authorization: `Basic ${btoa(`${request.basicUser}:${request.basicPass || ''}`)}` };
    if (type === 'apikey' && request.apikeyName && request.apikeyVal)
      return { [request.apikeyName]: request.apikeyVal };
    return {};
  };

  // ── Send request ────────────────────────────────────────────
  const sendRequest = async () => {
    if (!request.url) return;
    setLoading(true);
    setResponse(null);

    try {
      const customHeaders = request.headers
        .filter((h) => h.enabled && h.k && h.v)
        .reduce((acc, h) => ({ ...acc, [h.k]: h.v }), {});

      const requestBody = {
        url: buildURL(),
        method: request.method,
        headers: { ...buildAuthHeaders(), ...customHeaders },
        params: [], // already appended to URL above
        bodyType: request.bodyType,
      };

      if (!noBodyMethods.includes(request.method)) {
        if (request.bodyType === 'json' || request.bodyType === 'raw') {
          requestBody.body = request.body;
        } else if (request.bodyType === 'form-data') {
          // FIX: send {k,v} shape that backend now supports
          requestBody.body = request.formData.filter((f) => f.enabled && f.k);
        }
      }

      const apiResponse = await fetch('/proxy', {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      const data = await apiResponse.json();

      // FIX: parse body safely — it may be a string or already an object
      let parsedBody = data.body;
      let isJSON = false;
      if (typeof data.body === 'string') {
        try {
          parsedBody = JSON.parse(data.body);
          isJSON = true;
        } catch (_) {
          parsedBody = data.body;
        }
      } else if (typeof data.body === 'object') {
        isJSON = true;
      }

      const size = new Blob([typeof data.body === 'string' ? data.body : JSON.stringify(data.body)]).size;

      setResponse({ ...data, parsedBody, isJSON, size });

      // Add to history
      setHistory((h) => [
        { method: request.method, url: request.url, status: data.status, time: new Date().toLocaleTimeString() },
        ...h.slice(0, 19),
      ]);
    } catch (error) {
      setResponse({ error: error.message, status: 0, statusText: 'Network Error' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return '#16a34a';
    if (status >= 300 && status < 400) return '#ca8a04';
    if (status >= 400 && status < 500) return '#ea580c';
    if (status >= 500) return '#dc2626';
    return '#6b7280';
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch(() => {});

  const formatJSON = (obj) => JSON.stringify(obj, null, 2);

  // ── Styles ──────────────────────────────────────────────────
  const s = {
    container: { height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Fira Code', Monaco, Consolas, monospace", fontSize: 13, backgroundColor: '#f8f9fa' },
    topbar: { backgroundColor: '#fff', borderBottom: '1px solid #dee2e6', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
    methodSelect: { padding: '6px 8px', border: '1px solid #ced4da', borderRadius: 6, backgroundColor: '#f8f9fa', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: methodColors[request.method] || '#333', minWidth: 95 },
    urlInput: { flex: 1, padding: '6px 10px', border: '1px solid #ced4da', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, outline: 'none' },
    sendBtn: { padding: '6px 20px', borderRadius: 6, border: 'none', backgroundColor: loading ? '#6c757d' : '#0ea5e9', color: '#fff', fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' },
    main: { flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 },
    pane: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    paneLeft: { width: '50%', borderRight: '1px solid #dee2e6', backgroundColor: '#fff' },
    paneRight: { flex: 1, backgroundColor: '#fff' },
    tabs: { display: 'flex', backgroundColor: '#f1f3f4', borderBottom: '1px solid #dee2e6', flexShrink: 0 },
    tab: (active) => ({ padding: '8px 14px', border: 'none', backgroundColor: active ? '#fff' : 'transparent', borderBottom: active ? '2px solid #0ea5e9' : '2px solid transparent', color: active ? '#0ea5e9' : '#6c757d', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }),
    paneBody: { flex: 1, overflowY: 'auto', padding: 14 },
    kvRow: { display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' },
    kvInput: { flex: 1, padding: '4px 7px', border: '1px solid #ced4da', borderRadius: 4, fontFamily: 'inherit', fontSize: 12 },
    rmBtn: { width: 22, height: 22, border: '1px solid #dee2e6', borderRadius: 4, background: 'none', color: '#6c757d', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    addBtn: { padding: '4px 10px', border: '1px dashed #ced4da', borderRadius: 4, background: 'none', color: '#6c757d', fontSize: 11, cursor: 'pointer', marginTop: 4 },
    sectionLabel: { fontSize: 11, color: '#6c757d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' },
    bodyTA: { width: '100%', height: 180, padding: 8, border: '1px solid #ced4da', borderRadius: 6, fontFamily: 'inherit', fontSize: 12, resize: 'vertical', lineHeight: 1.5 },
    btypeBtn: (active) => ({ padding: '3px 10px', border: '1px solid ' + (active ? '#0ea5e9' : '#ced4da'), borderRadius: 4, backgroundColor: active ? '#0ea5e9' : 'none', color: active ? '#fff' : '#6c757d', fontSize: 11, cursor: 'pointer' }),
    authField: { width: '100%', padding: '5px 8px', border: '1px solid #ced4da', borderRadius: 4, fontFamily: 'inherit', fontSize: 12, marginBottom: 6 },
    statusBadge: (status) => ({ padding: '3px 8px', borderRadius: 4, fontWeight: 600, fontSize: 12, color: '#fff', backgroundColor: getStatusColor(status) }),
    respPre: { backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: 6, padding: 12, fontSize: 12, lineHeight: 1.6, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
    copyBtn: { padding: '3px 8px', border: '1px solid #dee2e6', borderRadius: 4, background: 'none', color: '#6c757d', fontSize: 11, cursor: 'pointer' },
    histItem: { padding: '6px 8px', border: '1px solid #dee2e6', borderRadius: 4, marginBottom: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 },
    histMethod: (m) => ({ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 3, color: '#fff', backgroundColor: methodColors[m] || '#6b7280', flexShrink: 0 }),
  };

  const KVEditor = ({ field, placeholder = ['Key', 'Value'] }) => (
    <div>
      {request[field].map((row, i) => (
        <div key={i} style={s.kvRow}>
          <input type="checkbox" checked={row.enabled} onChange={(e) => updateRow(field, i, 'enabled', e.target.checked)} style={{ accentColor: '#0ea5e9', flexShrink: 0 }} />
          <input type="text" placeholder={placeholder[0]} value={row.k} onChange={(e) => updateRow(field, i, 'k', e.target.value)} style={s.kvInput} />
          <input type="text" placeholder={placeholder[1]} value={row.v} onChange={(e) => updateRow(field, i, 'v', e.target.value)} style={s.kvInput} />
          <button style={s.rmBtn} onClick={() => removeRow(field, i)}>×</button>
        </div>
      ))}
      <button style={s.addBtn} onClick={() => addRow(field)}>+ Add row</button>
    </div>
  );

  return (
    <div style={s.container}>
      {/* Top Bar */}
      <div style={s.topbar}>
        <select
          value={request.method}
          onChange={(e) => setRequest({ ...request, method: e.target.value })}
          style={s.methodSelect}
        >
          {methods.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="text"
          placeholder="https://api.example.com/endpoint"
          value={request.url}
          onChange={(e) => setRequest({ ...request, url: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
          style={s.urlInput}
        />
        <button onClick={sendRequest} disabled={loading || !request.url} style={s.sendBtn}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Left Pane — Request */}
        <div style={{ ...s.pane, ...s.paneLeft }}>
          <div style={s.tabs}>
            {['Params', 'Headers', 'Body', 'Auth', 'History'].map((t) => (
              <button key={t} style={s.tab(activeTab === t.toLowerCase())} onClick={() => setActiveTab(t.toLowerCase())}>{t}</button>
            ))}
          </div>
          <div style={s.paneBody}>
            {/* Params */}
            {activeTab === 'params' && (
              <div>
                <div style={s.sectionLabel}>Query Parameters</div>
                <KVEditor field="params" />
              </div>
            )}

            {/* Headers */}
            {activeTab === 'headers' && (
              <div>
                <div style={s.sectionLabel}>Request Headers</div>
                <KVEditor field="headers" />
              </div>
            )}

            {/* Body */}
            {activeTab === 'body' && (
              <div>
                <div style={s.sectionLabel}>Request Body</div>
                {noBodyMethods.includes(request.method) ? (
                  <p style={{ color: '#6c757d', fontSize: 12 }}>{request.method} requests cannot have a body.</p>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {bodyTypes.map((t) => (
                        <button key={t} style={s.btypeBtn(request.bodyType === t)} onClick={() => setRequest({ ...request, bodyType: t })}>
                          {t.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    {request.bodyType === 'form-data' ? (
                      <KVEditor field="formData" />
                    ) : (
                      <>
                        <textarea
                          placeholder={request.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Raw body content'}
                          value={request.body}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRequest({ ...request, body: val });
                            if (request.bodyType === 'json' && val.trim()) {
                              try { JSON.parse(val); setJsonError(''); }
                              catch (err) { setJsonError('Invalid JSON: ' + err.message); }
                            } else { setJsonError(''); }
                          }}
                          style={s.bodyTA}
                        />
                        {jsonError && <div style={{ color: '#dc2626', fontSize: 11, marginTop: 4 }}>{jsonError}</div>}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth */}
            {activeTab === 'auth' && (
              <div>
                <div style={s.sectionLabel}>Authentication</div>
                <select
                  value={request.authType || 'none'}
                  onChange={(e) => setRequest({ ...request, authType: e.target.value })}
                  style={{ ...s.authField, marginBottom: 10 }}
                >
                  <option value="none">No Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                  <option value="apikey">API Key</option>
                </select>
                {request.authType === 'bearer' && (
                  <input type="text" placeholder="Bearer token" value={request.bearerToken || ''} onChange={(e) => setRequest({ ...request, bearerToken: e.target.value })} style={s.authField} />
                )}
                {request.authType === 'basic' && (
                  <>
                    <input type="text" placeholder="Username" value={request.basicUser || ''} onChange={(e) => setRequest({ ...request, basicUser: e.target.value })} style={s.authField} />
                    <input type="password" placeholder="Password" value={request.basicPass || ''} onChange={(e) => setRequest({ ...request, basicPass: e.target.value })} style={s.authField} />
                  </>
                )}
                {request.authType === 'apikey' && (
                  <>
                    <input type="text" placeholder="Header name (e.g. X-API-Key)" value={request.apikeyName || ''} onChange={(e) => setRequest({ ...request, apikeyName: e.target.value })} style={s.authField} />
                    <input type="text" placeholder="API key value" value={request.apikeyVal || ''} onChange={(e) => setRequest({ ...request, apikeyVal: e.target.value })} style={s.authField} />
                  </>
                )}
              </div>
            )}

            {/* History */}
            {activeTab === 'history' && (
              <div>
                <div style={s.sectionLabel}>Request History</div>
                {!history.length ? (
                  <div style={{ color: '#6c757d', fontSize: 12 }}>No requests yet.</div>
                ) : (
                  history.map((h, i) => (
                    <div key={i} style={s.histItem} onClick={() => setRequest((r) => ({ ...r, method: h.method, url: h.url }))}>
                      <span style={s.histMethod(h.method)}>{h.method}</span>
                      <span style={{ fontSize: 11, color: '#6c757d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{h.url}</span>
                      {h.status && <span style={{ fontSize: 11, color: getStatusColor(h.status), flexShrink: 0 }}>{h.status}</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane — Response */}
        <div style={{ ...s.pane, ...s.paneRight }}>
          <div style={{ ...s.tabs, justifyContent: 'flex-start' }}>
            {['Body', 'Headers'].map((t) => (
              <button key={t} style={s.tab(respTab === t.toLowerCase())} onClick={() => setRespTab(t.toLowerCase())}>{t}</button>
            ))}
            {response && !response.error && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12, fontSize: 12 }}>
                <span style={s.statusBadge(response.status)}>{response.status}</span>
                <span style={{ color: '#6c757d' }}>{response.statusText}</span>
                <span style={{ color: '#6c757d' }}>{response.time}ms</span>
                <span style={{ color: '#6c757d' }}>{response.size ? (response.size / 1024).toFixed(1) + 'KB' : ''}</span>
              </div>
            )}
          </div>
          <div style={s.paneBody}>
            {!response ? (
              <div style={{ textAlign: 'center', color: '#6c757d', marginTop: 60, fontSize: 13 }}>
                Enter a URL and click Send
              </div>
            ) : response.error ? (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, padding: 12, color: '#dc2626', fontSize: 12 }}>
                <strong>Error</strong><br /><br />
                {response.error}<br /><br />
                <span style={{ color: '#6c757d' }}>This may be a CORS issue. The target API must allow cross-origin requests, or route through the backend proxy.</span>
              </div>
            ) : respTab === 'body' ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                  <button style={s.copyBtn} onClick={() => copyToClipboard(response.isJSON ? formatJSON(response.parsedBody) : response.body)}>
                    Copy
                  </button>
                </div>
                <pre style={s.respPre}>
                  {response.isJSON ? formatJSON(response.parsedBody) : (response.body || '')}
                </pre>
              </div>
            ) : (
              <div>
                {Object.entries(response.headers || {}).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: '#6c757d', minWidth: 180, flexShrink: 0 }}>{k}</span>
                    <span style={{ wordBreak: 'break-all' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;
