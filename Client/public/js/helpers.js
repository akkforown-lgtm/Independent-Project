// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Показывает модальное окно с предупреждением или ошибкой
 */
function showAlertModal(type, translateKeyOrMessage) {
  const modal = document.getElementById('alert-modal');
  if (!modal) {
    console.error('alert-modal не найден в DOM!');
    return;
  }
  
  const icon = document.getElementById('alert-icon');
  const title = document.getElementById('alert-title');
  const message = document.getElementById('alert-message');
  
  const lang = getCurrentLanguage();
  const t = translations[lang] || translations.en;
  
  let displayMessage = translateKeyOrMessage;
  if (t[translateKeyOrMessage]) {
    displayMessage = t[translateKeyOrMessage];
  }
  
  if (type === 'warning') {
    if (icon) icon.textContent = '⚠️';
    if (title) title.textContent = t['alert.warning.title'] || 'Warning';
    if (message) message.textContent = displayMessage;
  } else if (type === 'error') {
    if (icon) icon.textContent = '❌';
    if (title) title.textContent = t['alert.error.title'] || 'Error';
    if (message) message.textContent = displayMessage;
  } else if (type === 'success') {
    if (icon) icon.textContent = '✅';
    if (title) title.textContent = t['alert.ok'] || 'Success';
    if (message) message.textContent = displayMessage;
  }
  
  modal.classList.remove('hidden');
}

/**
 * Закрывает модальное окно с предупреждением
 * 🔥 НЕ закрывает payment-modal — он остаётся открытым
 */
function closeAlertModal() {
  const alertModal = document.getElementById('alert-modal');
  if (alertModal) {
    alertModal.classList.add('hidden');
  }
  
  // 🔥 Проверяем: если было открыто окно оплаты (pendingBooking не null), 
  // НЕ закрываем payment-modal
  // payment-modal остаётся открытым для пользователя
}

/**
 * Форматирует дату в читаемый вид
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const lang = getCurrentLanguage();
  try {
    return new Date(dateString).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', options);
  } catch (e) {
    return dateString;
  }
}

/**
 * Вычисляет количество ночей между двумя датами
 */
function calculateNights(checkin, checkout) {
  const start = new Date(checkin);
  const end = new Date(checkout);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Получает сохранённый язык
 */
function getCurrentLanguage() {
  return localStorage.getItem('selectedLanguage') || 'ru';
}

/**
 * Показывает кастомное уведомление (короткая форма)
 */
function showCustomAlert(type, message) {
  const modal = document.getElementById('alert-modal');
  if (!modal) return;
  
  const icon = document.getElementById('alert-icon');
  const title = document.getElementById('alert-title');
  const msg = document.getElementById('alert-message');
  const lang = getCurrentLanguage();
  const t = translations[lang] || translations.en;
  
  if (type === 'success') {
    if (icon) icon.textContent = '✅';
    if (title) title.textContent = t['alert.ok'] || 'Success';
  } else if (type === 'error') {
    if (icon) icon.textContent = '❌';
    if (title) title.textContent = t['alert.error.title'] || 'Error';
  } else if (type === 'warning') {
    if (icon) icon.textContent = '⚠️';
    if (title) title.textContent = t['alert.warning.title'] || 'Warning';
  }
  
  let displayMessage = message;
  if (t[message]) {
    displayMessage = t[message];
  } else if (message === 'Не указана') {
    displayMessage = t['status.notSpecified'] || 'not specified';
  }
  
  if (msg) msg.textContent = displayMessage;
  modal.classList.remove('hidden');
}