/**
 * Get the API base URL dynamically
 */
function getAdminApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/admin';
  }
  return `${window.location.origin}/api/admin`;
}

const API_URL = getAdminApiBaseUrl();
const token = localStorage.getItem('adminToken');
const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
let currentTab = 'dashboard';

if (!token) { window.location.href = '/index.html'; }

async function api(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = { 'Authorization': `Bearer ${token}` };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);
  const res = await fetch(`${API_URL}${endpoint}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

async function getRegionLimits() {
  return api('/regions');
}

async function updateRegionLimit(city, data) {
  return api(`/regions/${encodeURIComponent(city)}`, 'PUT', data);
}

const t = {
  ru: {
    dashboard: 'Дашборд', bookings: 'Бронирования', rooms: 'Номера', accounting: 'Бухгалтерия',
    history: 'История', settings: 'Настройки',
    'admin.pageTitle': 'Дашборд • Luxury Haven Admin',
    totalBookings: 'Всего броней', activeBookings: 'Активные', pendingRequests: 'Ожидают ответа', revenue: 'Доход',
    loading: 'Загрузка...', noData: 'Нет данных', approve: 'Одобрить', reject: 'Отклонить',
    logout: 'Выйти', close: 'Закрыть', error: 'Ошибка', success: 'Успешно', warning: 'Внимание',
    save: 'Сохранить', cancel: 'Отмена', delete: 'Удалить', edit: 'Редактировать', add: 'Добавить номер',
    name: 'Название', price: 'Цена', categoryLabel: 'Категория', size: 'Размер', description: 'Описание',
    image: 'Выбрать фото', perNight: '/ночь', quantity: 'Количество / Лимит',
    noActiveBookings: 'Нет активных броней на эту комнату', activeBookingsLabel: 'Активные бронирования:', moreBookings: 'Ещё дат бронирования',
    regionPreview: 'Проверка доступности региона для выбранных дат.', regionLimitReached: 'В городе {city} на выбранные даты достигнут лимит бронирований ({limit}).', regionOccupied: 'В городе {city} на выбранные даты уже занято {count} из {limit} броней.', noRegionData: 'Выберите город и даты для проверки доступности.',
    checkout: 'Закрыть заказ', services: 'Доп. услуги', addService: '+ Услуга',
    restaurant: 'Ресторан', bar: 'Бар', spa: 'Спа', transfer: 'Трансфер',
    laundry: 'Прачечная', excursion: 'Экскурсия', other: 'Другое', discount: 'Скидка',
    total: 'Итого', roomCost: 'Номер', servicesCost: 'Услуги',
    approvedBy: 'Одобрено:', rejectedBy: 'Отклонено:',
    completed: 'Завершено', cancelled: 'Отменено',
    successful: 'Успешно', unsuccessful: 'Неуспешные',
    closedBy: 'Закрыт админом:', cancelledBy: 'Отменён:',
    reason: 'Причина', cancelOrder: 'Отменить заказ',
    cancelReason: 'Укажите причину отмены',
    print: 'Печать', export: 'Экспорт CSV',
    byCategory: 'По категориям номеров', byCity: 'По городам', incomeByServices: 'Доходы по услугам',
    request: 'Запрос', cancelRequest: 'Отмена', changeRequest: 'Изменение',
    requestLabel: 'Запрос', actionCannotBeUndone: 'Это действие нельзя отменить.', defaultReason: 'Не указана',
    nights: 'Ночей', recentBookings: 'Последние бронирования',
    status: {
      active: 'Активный', pending_change: 'Ожидает изменения', pending_cancellation: 'Ожидает отмены',
      cancelled: 'Отменён', rejected: 'Отклонён', completed: 'Завершено', changed: 'Изменено'
    },
    category: { vip: 'VIP', classic: 'Classic', cheap: 'Economy' },
    vipRoomsTitle: '👑 VIP Номера ({count})',
    classicRoomsTitle: '⭐ Classic Номера ({count})',
    economyRoomsTitle: '🏠 Economy Номера ({count})',
    regionLimitTitle: 'Лимиты бронирования по регионам',
    maxConcurrentBookings: 'максимум одновременных бронирований',
    editRegion: 'Изменить', setRegionLimit: 'Установить новый лимит бронирований для {city}',
    limitMustBePositive: 'Лимит должен быть целым числом больше 0',
    regionLimitChanged: 'Лимит региона {city} изменён на {limit}',
    confirmDeleteRoom: 'Удалить этот номер?', roomNamePriceRequired: 'Название и цена обязательны',
    roomUpdated: '✅ Номер обновлён!', roomAdded: '✅ Номер добавлен!', roomDeleted: '🗑️ Номер удалён',
    exportCSV: 'Экспорт CSV', systemInfo: 'О системе', version: 'Версия', apiEndpoint: 'API', mongoDb: 'MongoDB',
    roomCategory: 'Категория номера', noRooms: 'Нет номеров', changesApproved: '✅ Изменения одобрены!', requestRejected: '❌ Запрос отклонён!',
    orderCancelled: '🗑️ Заказ отменён!'
  },
  en: {
    dashboard: 'Dashboard', bookings: 'Bookings', rooms: 'Rooms', accounting: 'Accounting',
    history: 'History', settings: 'Settings',
    'admin.pageTitle': 'Dashboard • Luxury Haven Admin',
    totalBookings: 'Total Bookings', activeBookings: 'Active', pendingRequests: 'Pending', revenue: 'Revenue',
    loading: 'Loading...', noData: 'No data', approve: 'Approve', reject: 'Reject',
    logout: 'Logout', close: 'Close', error: 'Error', success: 'Success', warning: 'Warning',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add Room',
    name: 'Name', price: 'Price', categoryLabel: 'Category', size: 'Size', description: 'Description',
    image: 'Choose Photo', perNight: '/night', quantity: 'Quantity / Limit',
    noActiveBookings: 'No active bookings for this room', activeBookingsLabel: 'Active reservations:', moreBookings: 'more booking dates',
    regionPreview: 'Checking region availability for selected dates.', regionLimitReached: 'In {city}, booking capacity is full for the selected dates ({limit}).', regionOccupied: 'In {city}, {count} of {limit} bookings are already active for the selected dates.', noRegionData: 'Choose a city and dates to check availability.',
    checkout: 'Checkout', services: 'Extra Services', addService: '+ Service',
    restaurant: 'Restaurant', bar: 'Bar', spa: 'Spa', transfer: 'Transfer',
    laundry: 'Laundry', excursion: 'Excursion', other: 'Other', discount: 'Discount',
    total: 'Total', roomCost: 'Room', servicesCost: 'Services',
    approvedBy: 'Approved by:', rejectedBy: 'Rejected by:',
    completed: 'Completed', cancelled: 'Cancelled',
    successful: 'Successful', unsuccessful: 'Unsuccessful',
    closedBy: 'Closed by:', cancelledBy: 'Cancelled:',
    reason: 'Reason', cancelOrder: 'Cancel Order',
    cancelReason: 'Enter cancellation reason',
    print: 'Print', export: 'Export CSV',
    byCategory: 'By Room Category', byCity: 'By City', incomeByServices: 'Income by Services',
    request: 'Request', cancelRequest: 'Cancellation', changeRequest: 'Change',
    requestLabel: 'Request', actionCannotBeUndone: 'This action cannot be undone.', defaultReason: 'Not specified',
    nights: 'Nights', recentBookings: 'Recent Bookings',
    status: {
      active: 'Active', pending_change: 'Pending change', pending_cancellation: 'Pending cancellation',
      cancelled: 'Cancelled', rejected: 'Rejected', completed: 'Completed', changed: 'Changed'
    },
    category: { vip: 'VIP', classic: 'Classic', cheap: 'Economy' },
    vipRoomsTitle: '👑 VIP Rooms ({count})',
    classicRoomsTitle: '⭐ Classic Rooms ({count})',
    economyRoomsTitle: '🏠 Economy Rooms ({count})',
    regionLimitTitle: 'Booking limits by region',
    maxConcurrentBookings: 'maximum simultaneous bookings',
    editRegion: 'Edit', setRegionLimit: 'Set new booking limit for {city}',
    limitMustBePositive: 'Limit must be a whole number greater than 0',
    regionLimitChanged: 'Region limit for {city} changed to {limit}',
    confirmDeleteRoom: 'Delete this room?', roomNamePriceRequired: 'Name and price are required',
    roomUpdated: '✅ Room updated!', roomAdded: '✅ Room added!', roomDeleted: '🗑️ Room deleted',
    exportCSV: 'Export CSV', systemInfo: 'System Info', version: 'Version', apiEndpoint: 'API', mongoDb: 'MongoDB',
    roomCategory: 'Room category', noRooms: 'No rooms', changesApproved: '✅ Changes approved!', requestRejected: '❌ Request rejected!',
    orderCancelled: '🗑️ Order cancelled!'
  }
};
function getLang() { return localStorage.getItem('adminLang') || 'ru'; }
function tr(key, params = {}) {
  const lang = getLang();
  const parts = key.split('.');
  let str = t[lang];
  for (const part of parts) {
    if (str && typeof str === 'object') str = str[part];
    else { str = undefined; break; }
  }
  if (str == null) str = key;
  Object.entries(params).forEach(([name, value]) => {
    str = str.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
  });
  return str;
}

function switchLang(lang) {
  localStorage.setItem('adminLang', lang);
  document.getElementById('btn-ru')?.classList.toggle('bg-amber-500', lang === 'ru');
  document.getElementById('btn-ru')?.classList.toggle('text-black', lang === 'ru');
  document.getElementById('btn-en')?.classList.toggle('bg-amber-500', lang === 'en');
  document.getElementById('btn-en')?.classList.toggle('text-black', lang === 'en');

  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (key) el.textContent = tr(key);
  });

  loadCurrentTab();
}

switchLang(getLang());
document.getElementById('admin-name').textContent = user.firstName || 'Admin';

function showAlert(type, msg) {
  const lang = getLang();
  const translatedMessage = tr(msg);
  document.getElementById('alert-icon').textContent = type === 'error' ? '❌' : type === 'success' ? '✅' : '⚠️';
  document.getElementById('alert-title').textContent = tr(type);
  document.getElementById('alert-message').textContent = translatedMessage !== msg ? translatedMessage : msg;
  document.getElementById('alert-modal').classList.remove('hidden');
}
function closeAlert() { document.getElementById('alert-modal').classList.add('hidden'); }

function logout() {
  document.body.classList.add('page-exit');
  setTimeout(() => {
    localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser');
    window.location.href = '/index.html';
  }, 450);
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    currentTab = this.dataset.tab;
    loadCurrentTab();
  });
});

function loadCurrentTab() {
  // Обновляем текст всех табов + кнопки выйти
  document.querySelectorAll('.tab-btn[data-tab="dashboard"]').forEach(b => b.textContent = '📊 ' + tr('dashboard'));
  document.querySelectorAll('.tab-btn[data-tab="bookings"]').forEach(b => b.textContent = '📋 ' + tr('bookings'));
  document.querySelectorAll('.tab-btn[data-tab="rooms"]').forEach(b => b.textContent = '🏨 ' + tr('rooms'));
  document.querySelectorAll('.tab-btn[data-tab="accounting"]').forEach(b => b.textContent = '💰 ' + tr('accounting'));
  document.querySelectorAll('.tab-btn[data-tab="history"]').forEach(b => b.textContent = '📜 ' + tr('history'));
  document.querySelectorAll('.tab-btn[data-tab="settings"]').forEach(b => b.textContent = '⚙️ ' + tr('settings'));

  const logoutBtns = document.querySelectorAll('button[onclick="logout()"]');
  logoutBtns.forEach(b => b.textContent = tr('logout'));

  switch (currentTab) {
    case 'dashboard': if (typeof loadDashboard === 'function') loadDashboard(); break;
    case 'bookings': if (typeof loadBookings === 'function') loadBookings(); break;
    case 'rooms': if (typeof loadRooms === 'function') loadRooms(); break;
    case 'accounting': if (typeof loadAccounting === 'function') loadAccounting(); break;
    case 'history': if (typeof loadHistory === 'function') loadHistory(); break;
    case 'settings': if (typeof loadSettings === 'function') loadSettings(); break;
  }
}