// ==================== ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ ====================

/**
 * Обновляет кнопки в навбаре в зависимости от авторизации
 */
function updateNavButtons() {
  const loginLink = document.getElementById('login-link');
  const cabinetLink = document.getElementById('cabinet-link');
  const isAuth = (window.api && window.api.isAuthenticated()) || localStorage.getItem('token');
  
  if (isAuth) {
    // Скрываем "Войти" с анимацией
    if (loginLink) {
      loginLink.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      loginLink.style.opacity = '0';
      loginLink.style.transform = 'translateY(-10px)';
      loginLink.style.pointerEvents = 'none';
      setTimeout(() => { 
        loginLink.style.display = 'none'; 
      }, 300);
    }
    // Показываем "Кабинет" с анимацией
    if (cabinetLink) {
      cabinetLink.style.display = 'inline-block';
      cabinetLink.style.animation = 'bounceIn 0.5s ease forwards';
    }
  } else {
    // Показываем "Войти"
    if (loginLink) {
      loginLink.style.display = 'inline-block';
      loginLink.style.opacity = '1';
      loginLink.style.transform = 'translateY(0)';
      loginLink.style.pointerEvents = 'auto';
    }
    // Скрываем "Кабинет"
    if (cabinetLink) {
      cabinetLink.style.display = 'none';
    }
  }
}

/**
 * Настройка обработчиков при загрузке страницы
 */
function setupMainPage() {
  updateNavButtons();
  
  // Обработчик для кнопки "Кабинет"
  const cabinetLink = document.getElementById('cabinet-link');
  if (cabinetLink) {
    cabinetLink.addEventListener('click', (e) => {
      e.preventDefault();
      const isAuth = (window.api && window.api.isAuthenticated()) || localStorage.getItem('token');
      if (isAuth) {
        // Плавный переход
        document.body.style.transition = 'opacity 0.4s ease';
        document.body.style.opacity = '0';
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 400);
      } else {
        openAuthRequiredModal();
      }
    });
  }
  
  // Анимация при смене языка
  if (typeof window.switchLanguage === 'function') {
    const origSwitch = window.switchLanguage;
    window.switchLanguage = function(lang) {
      document.body.classList.add('lang-switching');
      origSwitch(lang);
      setTimeout(() => document.body.classList.remove('lang-switching'), 350);
    };
  }
  
  // Добавляем эффект параллакса для hero при скролле
  window.addEventListener('scroll', () => {
    const hero = document.querySelector('section.min-h-screen');
    if (hero) {
      const scrollY = window.scrollY;
      const bg = hero.querySelector('.absolute.inset-0:first-child');
      if (bg && scrollY < window.innerHeight) {
        bg.style.transform = `translateY(${scrollY * 0.4}px)`;
      }
    }
  });
}

// ==================== ЗАПУСК ====================
document.addEventListener('DOMContentLoaded', setupMainPage);