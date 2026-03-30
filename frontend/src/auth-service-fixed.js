class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log('🔗 AuthService initialized with API URL:', this.apiBaseUrl);
  }

  async login(username, password) {
    try {
      console.log('🔐 Attempting login to:', `${this.apiBaseUrl}/auth/login`);
      console.log('👤 Username:', username);
      
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      console.log('📡 Login response status:', response.status);
      console.log('📡 Login response ok:', response.ok);

      if (!response.ok) {
        const responseText = await response.text();
        console.error('❌ Login failed response:', responseText);
        
        // Check if we got HTML instead of JSON
        if (responseText.trim().startsWith('<!doctype') || responseText.trim().startsWith('<html')) {
          throw new Error('Got HTML response instead of JSON. The frontend cannot reach the backend API.');
        }
        
        try {
          const data = JSON.parse(responseText);
          throw new Error(data.error || 'Login failed');
        } catch (jsonError) {
          throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}...`);
        }
      }

      const data = await response.json();
      console.log('✅ Login successful:', data);
      
      this.token = data.token;
      this.user = data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
      return data;
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/refresh`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        this.logout();
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('token', this.token);
      return data;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      this.logout();
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
        headers: this.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      this.user = data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      return data;
    } catch (error) {
      console.error('❌ Get current user error:', error);
      throw error;
    }
  }

  logout() {
    console.log('🚪 Logging out user');
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Origin': window.location.origin
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async makeApiRequest(url, options = {}) {
    try {
      const fullUrl = url.startsWith('http') ? url : `${this.apiBaseUrl}${url}`;
      console.log('🌐 Making API request to:', fullUrl);
      
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers
        },
        credentials: 'include'
      });

      console.log('📡 API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API request failed:', errorText);
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return response;
    } catch (error) {
      console.error('❌ API request error:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      console.log('🔍 Testing backend connection...');
      const response = await fetch(`${this.apiBaseUrl}/health`, {
        method: 'GET',
        headers: {
          'Origin': window.location.origin
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connection successful:', data);
        return true;
      } else {
        console.error('❌ Backend connection failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend connection error:', error);
      return false;
    }
  }

  getUserRole() {
    return this.user?.role || null;
  }

  isAdmin() {
    return this.getUserRole() === 'admin';
  }
}

export default new AuthService();
