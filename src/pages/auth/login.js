// src/pages/auth/login.js
import { loginWithUsername } from '../../lib/auth.js';

const REMEMBER_KEY = 'silatrt-remember-username';

export async function init() {
  const form = document.getElementById('form-login');
  const alertBox = document.getElementById('login-alert');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errUsername = document.getElementById('err-username');
  const btnSubmit = document.getElementById('btn-submit-login');
  const btnTogglePw = document.getElementById('btn-toggle-password');
  const iconEye = document.getElementById('icon-eye');
  const rememberBox = document.getElementById('remember-me');
  const linkLupa = document.getElementById('link-lupa-sandi');

  // Pulihkan username yang diingat sebelumnya
  const remembered = localStorage.getItem(REMEMBER_KEY);
  if (remembered) {
    usernameInput.value = remembered;
    rememberBox.checked = true;
    passwordInput.focus();
  } else {
    usernameInput.focus();
  }

  // Toggle tampil/sembunyikan kata sandi
  btnTogglePw.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    btnTogglePw.setAttribute('aria-label', isHidden ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi');
    iconEye.innerHTML = isHidden
      ? '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-3.22 4.36M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="M1 1l22 22"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/>';
  });

  // Info sementara untuk "Lupa sandi"
  linkLupa.addEventListener('click', (e) => {
    e.preventDefault();
    alertBox.className = 'alert alert-info small';
    alertBox.textContent = 'Hubungi Sekretaris RT/RW atau Administrator untuk mengatur ulang kata sandi Anda.';
    alertBox.classList.remove('d-none');
  });

  usernameInput.addEventListener('input', () => {
    errUsername.classList.add('d-none');
    usernameInput.classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertBox.classList.add('d-none');

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (username.length < 3) {
      errUsername.classList.remove('d-none');
      usernameInput.classList.add('is-invalid');
      usernameInput.focus();
      return;
    }
    if (!password) {
      alertBox.className = 'alert alert-danger small';
      alertBox.textContent = 'Kata sandi wajib diisi.';
      alertBox.classList.remove('d-none');
      passwordInput.focus();
      return;
    }

    btnSubmit.classList.add('btn-loading');
    btnSubmit.disabled = true;

    try {
      await loginWithUsername(username, password);

      if (rememberBox.checked) {
        localStorage.setItem(REMEMBER_KEY, username);
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      location.hash = '#/dashboard';
    } catch (err) {
      alertBox.className = 'alert alert-danger small';
      alertBox.textContent = err.message;
      alertBox.classList.remove('d-none');
      btnSubmit.classList.remove('btn-loading');
      btnSubmit.disabled = false;
      passwordInput.focus();
      passwordInput.select();
    }
  });
}
