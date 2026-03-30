import React, { useState, useEffect } from 'react';
import authService from './auth-service-fixed';
import LoginComponent from './LoginComponent';
import ProtectedApp from './ProtectedApp';
import ApiTester from './ApiTester-fixed';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          await authService.getCurrentUser();
          setUser(authService.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Auth check failed:', error);
          authService.logout();
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setUser(authService.user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginComponent onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <header className="navbar">
        <div className="navbar-brand">🚀 ApiPilot</div>
        <nav className="navbar-nav">
          <button 
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-link ${currentView === 'tester' ? 'active' : ''}`}
            onClick={() => setCurrentView('tester')}
          >
            API Tester
          </button>
        </nav>
        <div className="navbar-user">
          <div className="user-info">
            <span>👤 {user?.username}</span>
            <span style={{ 
              padding: '2px 8px', 
              backgroundColor: user?.role === 'admin' ? '#28a745' : '#6c757d', 
              color: 'white', 
              borderRadius: '12px', 
              fontSize: '12px' 
            }}>
              {user?.role}
            </span>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content-area">
        {currentView === 'dashboard' ? <ProtectedApp /> : <ApiTester />}
      </main>
    </div>
  );
};

export default App;
