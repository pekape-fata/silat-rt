// src/pages/auth/login.js
import { loginWithUsername } from '../../lib/auth.js';

export async function init() {
  const form = document.getElementById('form-login');
  const alertBox = document.getElementById('login-alert');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.add('d-none');

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      await loginWithUsername(username, password);
      location.hash = '#/dashboard';
    } catch (err) {
      alertBox.textContent = err.message;
      alertBox.classList.remove('d-none');
    }
  });
}
