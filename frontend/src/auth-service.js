class AuthService {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  async login(username, password) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }

    const data = await response.json();
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('token', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    return data;
  }

  async refreshToken() {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.token = data.token;
    localStorage.setItem('token', this.token);
    return data;
  }

  async getCurrentUser() {
    const response = await fetch('/auth/me', {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const data = await response.json();
    this.user = data.user;
    localStorage.setItem('user', JSON.stringify(this.user));
    return data;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  getAuthHeaders() {
    if (!this.token) return { 'Content-Type': 'application/json' };
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  getUserRole() {
    return this.user?.role || null;
  }

  isAdmin() {
    return this.getUserRole() === 'admin';
  }
}

export default new AuthService();
