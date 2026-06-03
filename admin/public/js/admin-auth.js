// ==================== ПЕРЕВОДЫ ДЛЯ СТРАНИЦЫ ВХОДА ====================
const translations = {
  ru: {
    "admin.subtitle": "Админ-панель",
    "admin.login": "Вход",
    "admin.register": "Регистрация",
    "admin.code": "Код администратора",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.emailPlaceholder": "Введите ваш email",
    "auth.passwordPlaceholder": "Введите пароль",
    "auth.firstname": "Имя",
    "auth.lastname": "Фамилия",
    "auth.firstnamePlaceholder": "Введите ваше имя",
    "auth.lastnamePlaceholder": "Введите вашу фамилию",
    "auth.phone": "Телефон",
    "auth.phonePlaceholder": "Введите номер телефона",
    "admin.pageTitle": "Админ-панель • Luxury Haven",
    "admin.codePlaceholder": "Введите код администратора",
    "auth.signIn": "Войти",
    "auth.signUp": "Зарегистрироваться",
    "auth.close": "Закрыть",
    "auth.error": "Ошибка",
    "auth.success": "Успешно",
    "auth.warning": "Внимание"
  },
  en: {
    "admin.subtitle": "Admin Panel",
    "admin.login": "Login",
    "admin.register": "Register",
    "admin.code": "Admin Code",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.emailPlaceholder": "Enter your email",
    "auth.passwordPlaceholder": "Enter your password",
    "auth.firstname": "First Name",
    "auth.lastname": "Last Name",
    "auth.firstnamePlaceholder": "Enter your first name",
    "auth.lastnamePlaceholder": "Enter your last name",
    "auth.phone": "Phone",
    "auth.phonePlaceholder": "Enter your phone number",
    "admin.pageTitle": "Admin Panel • Luxury Haven",
    "admin.codePlaceholder": "Enter admin code",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.close": "Close",
    "auth.error": "Error",
    "auth.success": "Success",
    "auth.warning": "Warning"
  }
};

// ==================== ЯЗЫК ====================
function getLang() { return localStorage.getItem('adminLang') || 'ru'; }

function switchLang(lang) {
  localStorage.setItem('adminLang', lang);
  document.documentElement.lang = lang;

  document.getElementById('btn-ru').classList.toggle('bg-amber-500', lang === 'ru');
  document.getElementById('btn-ru').classList.toggle('text-black', lang === 'ru');
  document.getElementById('btn-en').classList.toggle('bg-amber-500', lang === 'en');
  document.getElementById('btn-en').classList.toggle('text-black', lang === 'en');

  document.body.classList.add('lang-switching');
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });
  setTimeout(() => document.body.classList.remove('lang-switching'), 350);
}

// Загрузка сохранённого языка
switchLang(getLang());

// ==================== ТАБЫ ====================
function switchTab(tab) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const lang = getLang();

  if (tab === 'login') {
    loginForm.classList.remove('hidden'); registerForm.classList.add('hidden');
    tabLogin.classList.add('bg-amber-500', 'text-black'); tabRegister.classList.remove('bg-amber-500', 'text-black');
    tabLogin.textContent = translations[lang]['admin.login'];
    tabRegister.textContent = translations[lang]['admin.register'];
  } else {
    loginForm.classList.add('hidden'); registerForm.classList.remove('hidden');
    tabRegister.classList.add('bg-amber-500', 'text-black'); tabLogin.classList.remove('bg-amber-500', 'text-black');
    tabRegister.textContent = translations[lang]['admin.register'];
    tabLogin.textContent = translations[lang]['admin.login'];
  }
}

// ==================== API ====================
function getAdminApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/admin';
  }
  return `${window.location.origin}/api/admin`;
}

const API_URL = getAdminApiBaseUrl();

function parseApiError(error) {
  if (!error) return 'Ошибка запроса';
  if (typeof error === 'string') return error;
  if (typeof error === 'object') {
    const messages = Object.values(error).flatMap(value => Array.isArray(value) ? value : [value]);
    return messages.filter(Boolean)[0] || 'Ошибка запроса';
  }
  return String(error);
}

function normalizePhoneNumber(phoneCode, phone) {
  const raw = `${phoneCode || ''}${phone || ''}`;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return `+${digits}`;
  }
  return raw.trim();
}

function showAlert(type, message) {
  const lang = getLang();
  document.getElementById('alert-icon').textContent = type === 'error' ? '❌' : type === 'success' ? '✅' : '⚠️';
  document.getElementById('alert-title').textContent = translations[lang][`auth.${type}`] || message;
  document.getElementById('alert-message').textContent = message;
  document.getElementById('alert-modal').classList.remove('hidden');
}
function closeAlert() { document.getElementById('alert-modal').classList.add('hidden'); }

// ==================== ВХОД ====================
async function handleLogin(e) {
  e.preventDefault();
  const lang = getLang();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  if (!email || !password) {
    document.querySelector('#login-form').classList.add('shake');
    setTimeout(() => document.querySelector('#login-form').classList.remove('shake'), 600);
    return;
  }

  btn.innerHTML = '🔄...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiError(data.error || data.message));

    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    window.location.href = '/dashboard.html';
  } catch (error) {
    showAlert('error', error.message);
    btn.textContent = translations[lang]['auth.signIn'];
    btn.disabled = false;
  }
}

// ==================== РЕГИСТРАЦИЯ ====================
async function handleRegister(e) {
  e.preventDefault();
  const lang = getLang();
  const firstName = document.getElementById('reg-firstname').value;
  const lastName = document.getElementById('reg-lastname').value;
  const email = document.getElementById('reg-email').value;
  const phoneCode = document.getElementById('reg-phone-code').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  const adminCode = document.getElementById('reg-admin-code').value;
  const btn = document.getElementById('register-btn');

  if (!firstName || !lastName || !email || !phone || !password || !adminCode) {
    document.querySelector('#register-form').classList.add('shake');
    setTimeout(() => document.querySelector('#register-form').classList.remove('shake'), 600);
    return;
  }

  const normalizedPhone = normalizePhoneNumber(phoneCode, phone);

  btn.innerHTML = '🔄...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, phone: normalizedPhone, password, adminCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(parseApiError(data.error || data.message));

    localStorage.setItem('adminToken', data.token);
    localStorage.setItem('adminUser', JSON.stringify(data.user));
    window.location.href = '/dashboard.html';
  } catch (error) {
    showAlert('error', error.message);
  } finally {
    btn.textContent = translations[lang]['auth.signUp'];
    btn.disabled = false;
  }
}