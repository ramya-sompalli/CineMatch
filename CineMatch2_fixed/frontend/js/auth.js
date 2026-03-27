/**
 * CineMatch — Auth Guard
 * Redirect to login if no session, expose session helpers
 */

const AUTH = {
  token: null,
  username: null,
  email: null,

  init() {
    this.token    = localStorage.getItem('cm_token');
    this.username = localStorage.getItem('cm_user') || 'guest';
    this.email    = localStorage.getItem('cm_email') || '';

    if (!this.token) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },

  headers() {
    return {
      'Content-Type': 'application/json',
      'X-Session-Token': this.token || '',
    };
  },

  logout() {
    localStorage.removeItem('cm_token');
    localStorage.removeItem('cm_user');
    localStorage.removeItem('cm_email');
    window.location.href = 'login.html';
  },

  isDemo() {
    return this.token === 'demo-token';
  },
};

// Run auth check immediately
AUTH.init();
