import React, { useState, useEffect } from 'react';
import privateApiService from './private-api-service';

const PrivateApiManager = () => {
  const [apis, setApis] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApi, setNewApi] = useState({
    domain: '',
    apiKey: '',
    tokenType: 'api_key'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadApis();
  }, []);

  const loadApis = () => {
    const configuredApis = privateApiService.getConfiguredApis();
    setApis(configuredApis);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!newApi.domain) {
      newErrors.domain = 'Domain is required';
    } else if (!newApi.domain.startsWith('http')) {
      newErrors.domain = 'Domain must start with http:// or https://';
    }
    
    if (!newApi.apiKey) {
      newErrors.apiKey = 'API Key is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddApi = () => {
    if (!validateForm()) return;
    
    try {
      privateApiService.addPrivateKey(newApi.domain, newApi.apiKey, newApi.tokenType);
      setNewApi({ domain: '', apiKey: '', tokenType: 'api_key' });
      setShowAddForm(false);
      setErrors({});
      loadApis();
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  const handleRemoveApi = (domain) => {
    if (window.confirm(`Remove API key for ${domain}?`)) {
      privateApiService.removePrivateKey(domain);
      loadApis();
    }
  };

  const maskApiKey = (apiKey) => {
    if (!apiKey) return '';
    if (apiKey.length <= 8) return '*'.repeat(apiKey.length);
    return apiKey.substring(0, 4) + '*'.repeat(apiKey.length - 8) + apiKey.substring(apiKey.length - 4);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: '#333' }}>🔐 Private API Configuration</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Cancel' : 'Add API Key'}
        </button>
      </div>

      {showAddForm && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#333' }}>Add New Private API</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              API Domain *
            </label>
            <input
              type="text"
              placeholder="https://api.yourcompany.com"
              value={newApi.domain}
              onChange={(e) => setNewApi(prev => ({ ...prev, domain: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: errors.domain ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.domain && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {errors.domain}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              API Key *
            </label>
            <input
              type="password"
              placeholder="Enter your API key"
              value={newApi.apiKey}
              onChange={(e) => setNewApi(prev => ({ ...prev, apiKey: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: errors.apiKey ? '1px solid #dc3545' : '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
            {errors.apiKey && (
              <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                {errors.apiKey}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Authentication Type
            </label>
            <select
              value={newApi.tokenType}
              onChange={(e) => setNewApi(prev => ({ ...prev, tokenType: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            >
              <option value="api_key">API Key (X-API-Key header)</option>
              <option value="bearer">Bearer Token (Authorization header)</option>
            </select>
          </div>

          {errors.general && (
            <div style={{
              marginBottom: '15px',
              padding: '10px',
              backgroundColor: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              border: '1px solid #f5c6cb'
            }}>
              {errors.general}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAddApi}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add API Key
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setErrors({});
                setNewApi({ domain: '', apiKey: '', tokenType: 'api_key' });
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: '15px', color: '#333' }}>Configured Private APIs</h3>
        
        {apis.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #ddd'
          }}>
            No private APIs configured yet. Add an API key to start testing private endpoints.
          </div>
        ) : (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
            {apis.map((api, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  borderBottom: index < apis.length - 1 ? '1px solid #eee' : 'none',
                  backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {api.domain}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      Type: <span style={{ 
                        backgroundColor: '#e9ecef', 
                        padding: '2px 6px', 
                        borderRadius: '3px',
                        textTransform: 'uppercase'
                      }}>
                        {api.tokenType}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Key: <code style={{ backgroundColor: '#f1f3f4', padding: '2px 4px', borderRadius: '2px' }}>
                        {maskApiKey(api.apiKey)}
                      </code>
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                      Added: {new Date(api.addedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveApi(api.domain)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#d1ecf1',
        borderRadius: '4px',
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px', color: '#0c5460' }}>📋 Usage Instructions</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#0c5460', fontSize: '14px' }}>
          <li>Add your private API domains and corresponding API keys</li>
          <li>API keys are stored locally in your browser (not on the server)</li>
          <li>When testing APIs, authentication headers will be automatically added</li>
          <li>Supports both API Key (X-API-Key) and Bearer Token authentication</li>
          <li>Ensure your API keys are kept secure and never share them</li>
        </ul>
      </div>
    </div>
  );
};

export default PrivateApiManager;
