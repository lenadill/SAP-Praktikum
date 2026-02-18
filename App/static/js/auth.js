const AUTH_KEY = 'sapAuth';
const USER_KEY = 'sapUser';

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function signOut() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
}

function guardProtectedPage() {
  const requireAuth = document.body && document.body.dataset.requireAuth === 'true';
  if (requireAuth && !isAuthenticated()) {
    window.location.href = 'login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  guardProtectedPage();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // If already logged in, go straight to dashboard
    if (isAuthenticated()) {
      window.location.href = 'dashboard.html';
      return;
    }

    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value.trim();
      const errorEl = document.getElementById('loginError');

      if (!email || !password) {
        if (errorEl) {
          errorEl.textContent = 'Bitte E-Mail und Passwort eingeben.';
        }
        return;
      }

     /* if (email !== 'prototype@mail.de' || password !== 'test') {
        if (errorEl) {
          errorEl.textContent = 'Ungültige E-Mail oder Passwort.';
        }
        return;
      }
      */
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(USER_KEY, email);
      if (errorEl) {
        errorEl.textContent = '';
      }
      window.location.href = 'dashboard.html';
    });
  }

  document.querySelectorAll('[data-logout]').forEach((el) => {
    el.addEventListener('click', () => {
      signOut();
    });
  });
});
