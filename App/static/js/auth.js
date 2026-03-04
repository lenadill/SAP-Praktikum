const AUTH_KEY = 'clarityAuth';
const USER_KEY = 'clarityUser';

// IMMEDIATE AUTH GUARD
(function() {
    const isAuth = localStorage.getItem(AUTH_KEY) === 'true';
    const path = window.location.pathname;
    
    // SECURITY: Clear sensitive parameters from URL if present
    if (window.location.search.includes('password') || window.location.search.includes('email')) {
        const url = new URL(window.location);
        url.searchParams.delete('email');
        url.searchParams.delete('password');
        window.history.replaceState({}, document.title, url.pathname + url.search);
    }

    const publicRoutes = ['/login', '/signup', '/register-company', '/logout', '/404'];
    const isPublic = publicRoutes.some(r => path === r || path.startsWith(r + '.html'));
    const isIndex = path === '/' || path.endsWith('index.html');

    // Redirect unauthenticated users to login
    if (!isAuth && !isPublic) {
        window.location.href = '/login';
        return;
    }

    // Redirect authenticated users away from login/index to dashboard
    // But allow them to stay on /signup or /register-company (or they might be creating a second org)
    if (isAuth && (isLoginPage || isIndex)) {
        window.location.href = '/dashboard';
        return;
    }
})();

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();
      const errorEl = document.getElementById('loginError');

      if (!email || !password) {
        if (errorEl) errorEl.textContent = 'Bitte E-Mail und Passwort eingeben.';
        return;
      }

      try {
        const res = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (data.error) {
          if (errorEl) errorEl.textContent = data.error;
          return;
        }

        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        
        if (errorEl) errorEl.textContent = '';
        window.location.href = '/dashboard';
      } catch (err) {
        if (errorEl) errorEl.textContent = 'Server-Fehler beim Login.';
      }
    });
  }

  document.querySelectorAll('[data-logout]').forEach((el) => {
    el.addEventListener('click', () => {
      signOut();
    });
  });
});
