// ==================== ЛОГИКА ВХОДА ====================

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email');
  const password = document.getElementById('login-password');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const form = document.querySelector('form');
  const lang = getCurrentLanguage();
  
  // Сброс ошибок
  email.classList.remove('input-error');
  password.classList.remove('input-error');
  emailError.classList.add('hidden');
  passwordError.classList.add('hidden');
  
  if (!email.value || !password.value) {
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 600);
    showCustomAlert('warning', lang === 'ru' ? 'Пожалуйста, заполните все поля' : 'Please fill in all fields');
    return;
  }
  
  const btn = document.getElementById('login-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="inline-block animate-spin">🔄</span> ' + (lang === 'ru' ? 'Вход...' : 'Signing in...');
  btn.disabled = true;
  
  try {
    if (window.api) {
      const result = await window.api.login({ email: email.value, password: password.value });
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.5s ease';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
      throw new Error('API client is not available');
    }
  } catch (error) {
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    if (error.field === 'email') {
      email.classList.add('input-error', 'shake');
      emailError.textContent = error.message;
      emailError.classList.remove('hidden');
      setTimeout(() => email.classList.remove('shake'), 600);
    } else if (error.field === 'password') {
      password.classList.add('input-error', 'shake');
      passwordError.textContent = error.message;
      passwordError.classList.remove('hidden');
      setTimeout(() => password.classList.remove('shake'), 600);
    } else {
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 600);
      showCustomAlert('error', error.message);
    }
  }
}

// ==================== ЛОГИКА РЕГИСТРАЦИИ ====================

async function handleRegister(event) {
  event.preventDefault();
  
  const fields = {
    firstName: document.getElementById('reg-firstname'),
    lastName: document.getElementById('reg-lastname'),
    email: document.getElementById('reg-email'),
    phoneCode: document.getElementById('reg-phone-code'),
    phone: document.getElementById('reg-phone'),
    password: document.getElementById('reg-password')
  };
  
  const errors = {
    email: document.getElementById('email-error'),
    phone: document.getElementById('phone-error'),
    password: document.getElementById('password-error')
  };
  
  const form = document.querySelector('form');
  const lang = getCurrentLanguage();
  
  Object.values(fields).forEach(f => f?.classList.remove('input-error'));
  Object.values(errors).forEach(e => e?.classList.add('hidden'));
  
  if (!fields.firstName.value || !fields.lastName.value || !fields.email.value || 
      !fields.phone.value || !fields.password.value) {
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 600);
    showCustomAlert('warning', lang === 'ru' ? 'Пожалуйста, заполните все поля' : 'Please fill in all fields');
    return;
  }
  
  if (fields.password.value.length < 6) {
    fields.password.classList.add('input-error', 'shake');
    errors.password.textContent = lang === 'ru' ? 'Пароль должен быть минимум 6 символов' : 'Password must be at least 6 characters';
    errors.password.classList.remove('hidden');
    setTimeout(() => fields.password.classList.remove('shake'), 600);
    return;
  }
  
  const fullPhone = fields.phoneCode.value + fields.phone.value;
  
  const btn = document.getElementById('register-btn');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="inline-block animate-spin">🔄</span> ' + (lang === 'ru' ? 'Регистрация...' : 'Registering...');
  btn.disabled = true;
  
  try {
    if (window.api) {
      await window.api.register({ 
        firstName: fields.firstName.value, 
        lastName: fields.lastName.value, 
        email: fields.email.value, 
        phone: fullPhone, 
        password: fields.password.value 
      });
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.5s ease';
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
    } else {
      throw new Error('API client is not available');
    }
  } catch (error) {
    btn.innerHTML = originalText;
    btn.disabled = false;
    
    if (error.field === 'email') {
      fields.email.classList.add('input-error', 'shake');
      errors.email.textContent = error.message;
      errors.email.classList.remove('hidden');
      setTimeout(() => fields.email.classList.remove('shake'), 600);
    } else if (error.field === 'phone') {
      fields.phone.classList.add('input-error', 'shake');
      errors.phone.textContent = error.message;
      errors.phone.classList.remove('hidden');
      setTimeout(() => fields.phone.classList.remove('shake'), 600);
    } else {
      form.classList.add('shake');
      setTimeout(() => form.classList.remove('shake'), 600);
      showCustomAlert('error', error.message);
    }
  }
}

function showCustomAlert(type, message) {
  document.getElementById('alert-message').textContent = message;
  showAlertModal(type, 'alert.warning.title');
}
