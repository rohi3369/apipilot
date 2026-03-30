// Private API service for handling authenticated API calls
import authService from './auth-service-fixed';

class PrivateApiService {
  constructor() {
    this.privateApiKeys = new Map();
    this.loadPrivateApiKeys();
  }

  // Load private API keys from secure storage
  loadPrivateApiKeys() {
    const stored = localStorage.getItem('privateApiKeys');
    if (stored) {
      try {
        const keys = JSON.parse(stored);
        keys.forEach(key => {
          this.privateApiKeys.set(key.domain, key);
        });
      } catch (error) {
        console.error('Failed to load private API keys:', error);
      }
    }
  }

  // Save private API keys to secure storage
  savePrivateApiKeys() {
    const keys = Array.from(this.privateApiKeys.values());
    localStorage.setItem('privateApiKeys', JSON.stringify(keys));
  }

  // Add a new private API key
  addPrivateKey(domain, apiKey, tokenType = 'api_key') {
    this.privateApiKeys.set(domain, {
      domain,
      apiKey,
      tokenType,
      addedAt: new Date().toISOString()
    });
    this.savePrivateApiKeys();
  }

  // Remove a private API key
  removePrivateKey(domain) {
    this.privateApiKeys.delete(domain);
    this.savePrivateApiKeys();
  }

  // Get authentication headers for private API
  getPrivateApiHeaders(url) {
    try {
      const urlObj = new URL(url);
      const domain = `${urlObj.protocol}//${urlObj.host}`;
      const keyConfig = this.privateApiKeys.get(domain);
      
      if (!keyConfig) {
        return null;
      }

      if (keyConfig.tokenType === 'bearer') {
        return { 'Authorization': `Bearer ${keyConfig.apiKey}` };
      } else if (keyConfig.tokenType === 'api_key') {
        return { 'X-API-Key': keyConfig.apiKey };
      }
      
      return null;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
  }

  // Check if URL is a private API
  isPrivateApi(url) {
    try {
      const urlObj = new URL(url);
      const domain = `${urlObj.protocol}//${urlObj.host}`;
      return this.privateApiKeys.has(domain);
    } catch (error) {
      return false;
    }
  }

  // Make authenticated request to private API
  async makePrivateApiRequest(url, options = {}) {
    const privateHeaders = this.getPrivateApiHeaders(url);
    
    if (!privateHeaders) {
      throw new Error('No authentication configured for this private API');
    }

    const requestOptions = {
      ...options,
      headers: {
        ...privateHeaders,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Private API request failed: ${response.status} ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error('Private API request error:', error);
      throw error;
    }
  }

  // Get all configured private APIs
  getConfiguredApis() {
    return Array.from(this.privateApiKeys.values());
  }

  // Validate API key format
  validateApiKeyFormat(apiKey, tokenType) {
    if (!apiKey || apiKey.length < 10) {
      return { valid: false, error: 'API key must be at least 10 characters long' };
    }

    if (tokenType === 'bearer' && !apiKey.startsWith('Bearer ')) {
      return { valid: false, error: 'Bearer token must start with "Bearer "' };
    }

    return { valid: true };
  }
}

export default new PrivateApiService();
