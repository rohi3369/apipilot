import React, { useState, useEffect } from 'react';
import authService from './auth-service-fixed';
import privateApiService from './private-api-service';

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
  const [connectionStatus, setConnectionStatus] = useState('checking');

  useEffect(() => {
    checkBackendConnection();
    loadHistory();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const isConnected = await authService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('disconnected');
    }
  };

  const loadHistory = () => {
    const saved = localStorage.getItem('apiHistory');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  };

  const saveToHistory = (req, resp) => {
    const entry = {
      request: req,
      response: resp,
      timestamp: new Date().toISOString()
    };
    const newHistory = [entry, ...history.slice(0, 49)]; // Keep last 50
    setHistory(newHistory);
    localStorage.setItem('apiHistory', JSON.stringify(newHistory));
  };

  const addHeader = () => {
    setRequest(prev => ({
      ...prev,
      headers: [...prev.headers, { k: '', v: '', enabled: true }]
    }));
  };

  const removeHeader = (index) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  };

  const updateHeader = (index, field, value) => {
    setRequest(prev => ({
      ...prev,
      headers: prev.headers.map((h, i) => 
        i === index ? { ...h, [field]: value } : h
      )
    }));
  };

  const addParam = () => {
    setRequest(prev => ({
      ...prev,
      params: [...prev.params, { k: '', v: '', enabled: true }]
    }));
  };

  const removeParam = (index) => {
    setRequest(prev => ({
      ...prev,
      params: prev.params.filter((_, i) => i !== index)
    }));
  };

  const updateParam = (index, field, value) => {
    setRequest(prev => ({
      ...prev,
      params: prev.params.map((p, i) => 
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const buildUrl = () => {
    let url = request.url;
    const enabledParams = request.params.filter(p => p.enabled && p.k && p.v);
    
    if (enabledParams.length > 0) {
      const params = new URLSearchParams();
      enabledParams.forEach(p => params.append(p.k, p.v));
      url += (url.includes('?') ? '&' : '?') + params.toString();
    }
    
    return url;
  };

  const buildHeaders = () => {
    const headers = {};
    const enabledHeaders = request.headers.filter(h => h.enabled && h.k && h.v);
    enabledHeaders.forEach(h => {
      headers[h.k] = h.v;
    });
    
    // Add auth headers if authenticated
    if (authService.isAuthenticated()) {
      const authHeaders = authService.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }
    
    // Add private API headers if URL matches configured private API
    if (privateApiService.isPrivateApi(request.url)) {
      const privateHeaders = privateApiService.getPrivateApiHeaders(request.url);
      if (privateHeaders) {
        Object.assign(headers, privateHeaders);
      }
    }
    
    return headers;
  };

  const buildBody = () => {
    if (!['POST', 'PUT', 'PATCH'].includes(request.method)) return null;
    
    switch (request.bodyType) {
      case 'json':
        try {
          return JSON.parse(request.body || '{}');
        } catch (e) {
          setJsonError('Invalid JSON');
          return null;
        }
      case 'form':
        const formData = new FormData();
        const enabledFormData = request.formData.filter(f => f.enabled && f.k && f.v);
        enabledFormData.forEach(f => formData.append(f.k, f.v));
        return formData;
      case 'raw':
        return request.body;
      default:
        return null;
    }
  };

  const sendRequest = async () => {
    if (!request.url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);
    setJsonError('');

    try {
      const url = buildUrl();
      const headers = buildHeaders();
      const body = buildBody();

      if (request.bodyType === 'json' && jsonError) {
        throw new Error('Invalid JSON in body');
      }

      console.log('🚀 Sending request:', { method: request.method, url, headers });

      const response = await authService.makeApiRequest('/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          method: request.method,
          headers,
          params: request.params.filter(p => p.enabled),
          bodyType: request.bodyType,
          body: request.bodyType === 'json' ? JSON.parse(request.body || '{}') : 
                request.bodyType === 'raw' ? request.body : 
                Object.fromEntries(request.formData.filter(f => f.enabled).map(f => [f.k, f.v]))
        })
      });

      const data = await response.json();
      
      setResponse({
        status: data.status,
        statusText: data.statusText,
        headers: data.headers,
        data: data.data,
        url: data.url,
        duration: Date.now()
      });

      saveToHistory(request, data);
      setJsonError('');

    } catch (error) {
      console.error('Request failed:', error);
      setResponse({
        status: 'ERROR',
        statusText: 'Request Failed',
        headers: {},
        data: { error: error.message },
        url: request.url,
        duration: Date.now()
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (entry) => {
    setRequest(entry.request);
    setResponse(entry.response);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('apiHistory');
  };

  const exampleUrls = [
    { name: 'JSONPlaceholder - Posts', url: 'https://jsonplaceholder.typicode.com/posts' },
    { name: 'JSONPlaceholder - Users', url: 'https://jsonplaceholder.typicode.com/users' },
    { name: 'HTTPBin - IP', url: 'https://httpbin.org/ip' },
    { name: 'HTTPBin - Headers', url: 'https://httpbin.org/headers' },
    { name: 'ReqRes - Users', url: 'https://reqres.in/api/users' }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>🚀 ApiPilot - API Testing Tool</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Backend Status:</span>
          <span style={{ 
            padding: '4px 8px', 
            borderRadius: '4px', 
            fontSize: '12px',
            backgroundColor: connectionStatus === 'connected' ? '#d4edda' : '#f8d7da',
            color: connectionStatus === 'connected' ? '#155724' : '#721c24'
          }}>
            {connectionStatus === 'connected' ? '✅ Connected' : '❌ Disconnected'}
          </span>
          {connectionStatus === 'disconnected' && (
            <button 
              onClick={checkBackendConnection}
              style={{ 
                padding: '4px 8px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Request Section */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Request</h3>
          
          {/* Method and URL */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select 
                value={request.method} 
                onChange={(e) => setRequest(prev => ({ ...prev, method: e.target.value }))}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
                <option>PATCH</option>
                <option>HEAD</option>
                <option>OPTIONS</option>
              </select>
              <input 
                type="text" 
                placeholder="Enter URL (e.g., https://api.example.com/data)"
                value={request.url}
                onChange={(e) => setRequest(prev => ({ ...prev, url: e.target.value }))}
                style={{ 
                  flex: 1, 
                  padding: '8px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px' 
                }}
              />
            </div>
            
            {/* Example URLs */}
            <div style={{ marginBottom: '10px' }}>
              <small style={{ color: '#666' }}>Example URLs:</small>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                {exampleUrls.map(example => (
                  <button
                    key={example.url}
                    onClick={() => setRequest(prev => ({ ...prev, url: example.url }))}
                    style={{ 
                      padding: '2px 6px', 
                      fontSize: '11px', 
                      backgroundColor: '#e9ecef', 
                      border: '1px solid #ddd', 
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    {example.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #ddd', marginBottom: '15px' }}>
            {['params', 'headers', 'body'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: activeTab === tab ? '#007bff' : 'transparent',
                  color: activeTab === tab ? 'white' : '#333',
                  cursor: 'pointer',
                  marginRight: '5px',
                  borderRadius: '4px 4px 0 0'
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginBottom: '15px', minHeight: '200px' }}>
            {activeTab === 'params' && (
              <div>
                {request.params.map((param, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={param.enabled}
                      onChange={(e) => updateParam(index, 'enabled', e.target.checked)}
                      style={{ alignSelf: 'center' }}
                    />
                    <input
                      type="text"
                      placeholder="Key"
                      value={param.k}
                      onChange={(e) => updateParam(index, 'k', e.target.value)}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={param.v}
                      onChange={(e) => updateParam(index, 'v', e.target.value)}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                      onClick={() => removeParam(index)}
                      style={{ padding: '6px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addParam}
                  style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Add Parameter
                </button>
              </div>
            )}

            {activeTab === 'headers' && (
              <div>
                {request.headers.map((header, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={header.enabled}
                      onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                      style={{ alignSelf: 'center' }}
                    />
                    <input
                      type="text"
                      placeholder="Header Name"
                      value={header.k}
                      onChange={(e) => updateHeader(index, 'k', e.target.value)}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      placeholder="Header Value"
                      value={header.v}
                      onChange={(e) => updateHeader(index, 'v', e.target.value)}
                      style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                    <button
                      onClick={() => removeHeader(index)}
                      style={{ padding: '6px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={addHeader}
                  style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Add Header
                </button>
              </div>
            )}

            {activeTab === 'body' && (
              <div>
                {['GET', 'HEAD'].includes(request.method) ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    Body is not available for {request.method} requests
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: '10px' }}>
                      <select
                        value={request.bodyType}
                        onChange={(e) => setRequest(prev => ({ ...prev, bodyType: e.target.value }))}
                        style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                      >
                        <option value="json">JSON</option>
                        <option value="form">Form Data</option>
                        <option value="raw">Raw Text</option>
                      </select>
                    </div>
                    
                    {request.bodyType === 'json' && (
                      <div>
                        <textarea
                          placeholder='{"key": "value"}'
                          value={request.body}
                          onChange={(e) => setRequest(prev => ({ ...prev, body: e.target.value }))}
                          style={{ 
                            width: '100%', 
                            height: '150px', 
                            padding: '8px', 
                            border: '1px solid #ddd', 
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}
                        />
                        {jsonError && (
                          <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                            {jsonError}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {request.bodyType === 'form' && (
                      <div>
                        {request.formData.map((field, index) => (
                          <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                              type="checkbox"
                              checked={field.enabled}
                              onChange={(e) => setRequest(prev => ({
                                ...prev,
                                formData: prev.formData.map((f, i) => 
                                  i === index ? { ...f, enabled: e.target.checked } : f
                                )
                              }))}
                              style={{ alignSelf: 'center' }}
                            />
                            <input
                              type="text"
                              placeholder="Field Name"
                              value={field.k}
                              onChange={(e) => setRequest(prev => ({
                                ...prev,
                                formData: prev.formData.map((f, i) => 
                                  i === index ? { ...f, k: e.target.value } : f
                                )
                              }))}
                              style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <input
                              type="text"
                              placeholder="Field Value"
                              value={field.v}
                              onChange={(e) => setRequest(prev => ({
                                ...prev,
                                formData: prev.formData.map((f, i) => 
                                  i === index ? { ...f, v: e.target.value } : f
                                )
                              }))}
                              style={{ flex: 1, padding: '6px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <button
                              onClick={() => setRequest(prev => ({
                                ...prev,
                                formData: prev.formData.filter((_, i) => i !== index)
                              }))}
                              style={{ padding: '6px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => setRequest(prev => ({
                            ...prev,
                            formData: [...prev.formData, { k: '', v: '', enabled: true }]
                          }))}
                          style={{ padding: '6px 12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Add Field
                        </button>
                      </div>
                    )}
                    
                    {request.bodyType === 'raw' && (
                      <textarea
                        placeholder="Enter raw text..."
                        value={request.body}
                        onChange={(e) => setRequest(prev => ({ ...prev, body: e.target.value }))}
                        style={{ 
                          width: '100%', 
                          height: '150px', 
                          padding: '8px', 
                          border: '1px solid #ddd', 
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '12px'
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={sendRequest}
            disabled={loading || !request.url || connectionStatus !== 'connected'}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: loading || connectionStatus !== 'connected' ? '#6c757d' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading || connectionStatus !== 'connected' ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              width: '100%'
            }}
          >
            {loading ? 'Sending...' : connectionStatus !== 'connected' ? 'Backend Disconnected' : 'Send Request'}
          </button>
        </div>

        {/* Response Section */}
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Response</h3>
          
          {response ? (
            <div>
              {/* Response Status */}
              <div style={{ 
                padding: '10px', 
                marginBottom: '15px', 
                backgroundColor: response.status === 'ERROR' ? '#f8d7da' : 
                               response.status >= 200 && response.status < 300 ? '#d4edda' : '#fff3cd',
                borderRadius: '4px',
                border: `1px solid ${response.status === 'ERROR' ? '#f5c6cb' : 
                                 response.status >= 200 && response.status < 300 ? '#c3e6cb' : '#ffeaa7'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong>{response.status}</strong> {response.statusText}
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(response.duration).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Response Tabs */}
              <div style={{ borderBottom: '1px solid #ddd', marginBottom: '15px' }}>
                {['body', 'headers', 'raw'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setRespTab(tab)}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: respTab === tab ? '#007bff' : 'transparent',
                      color: respTab === tab ? 'white' : '#333',
                      cursor: 'pointer',
                      marginRight: '5px',
                      borderRadius: '4px 4px 0 0'
                    }}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Response Content */}
              <div style={{ minHeight: '300px' }}>
                {respTab === 'body' && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    {typeof response.data === 'object' ? (
                      <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    ) : (
                      <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                        {response.data}
                      </pre>
                    )}
                  </div>
                )}

                {respTab === 'headers' && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    {Object.entries(response.headers || {}).map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '5px', display: 'flex', gap: '10px' }}>
                        <strong style={{ color: '#2d3748', minWidth: '150px' }}>{key}:</strong>
                        <span style={{ color: '#4a5568' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {respTab === 'raw' && (
                  <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}>
                    <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#666', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}>
              {connectionStatus !== 'connected' ? 
                'Backend is not connected. Please check if the backend server is running.' :
                'Send a request to see the response here'}
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Request History</h3>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Clear History
            </button>
          )}
        </div>
        
        {history.length > 0 ? (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            {history.map((entry, index) => (
              <div
                key={index}
                style={{ 
                  padding: '10px', 
                  borderBottom: index < history.length - 1 ? '1px solid #eee' : 'none',
                  cursor: 'pointer',
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                }}
                onClick={() => loadFromHistory(entry)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{entry.request.method}</strong> {entry.request.url}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {new Date(entry.timestamp).toLocaleString()} - {entry.response.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            No request history yet. Send some requests to see them here.
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;
