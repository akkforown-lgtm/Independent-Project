/**
 * Multi-language translations for Hotel Website
 * Supports: Russian (ru), English (en)
 */

const translations = {
  ru: {
    // Navigation
    dashboard: 'Дашборд',
    bookings: 'Бронирования',
    rooms: 'Номера',
    accounting: 'Бухгалтерия',
    settings: 'Настройки',
    history: 'История',
    logout: 'Выйти',

    // Dashboard
    totalBookings: 'Всего бронирований',
    activeBookings: 'Активные броне',
    pendingRequests: 'Ожидают решения',
    cancelledBookings: 'Отменённые брони',
    revenue: 'Доход',
    incomeByService: 'Доход по услугам',

    // Bookings
    bookingId: 'ID брони',
    roomName: 'Название номера',
    roomPrice: 'Цена номера',
    roomCategory: 'Категория',
    city: 'Город',
    checkIn: 'Заезд',
    checkOut: 'Выезд',
    nights: 'Ночей',
    guest: 'Гость',
    totalPrice: 'Всего',
    status: 'Статус',
    approve: 'Одобрить',
    reject: 'Отклонить',
    cancel: 'Отмена',
    checkout: 'Оформить счёт',
    pendingApproval: 'Ожидает решения',
    approvedBy: 'Одобрено:',
    rejectedBy: 'Отклонено:',

    // Services
    restaurant: 'Ресторан',
    bar: 'Бар',
    spa: 'СПА',
    transfer: 'Трансфер',
    laundry: 'Прачечная',
    excursion: 'Экскурсия',
    other: 'Другое',
    addService: '+ Услуга',
    serviceName: 'Название услуги',
    servicePrice: 'Цена',
    quantity: 'Кол-во',
    servicesTotal: 'Итого услуги',
    discount: 'Скидка',
    grandTotal: 'Итого',
    paymentMethod: 'Способ оплаты',
    card: 'Карта',
    cash: 'Наличные',
    transfer: 'Перевод',

    // Rooms
    addRoom: 'Добавить номер',
    editRoom: 'Редактировать номер',
    deleteRoom: 'Удалить номер',
    roomSize: 'Размер (м²)',
    maxGuests: 'Макс. гостей',
    amenities: 'Удобства',
    imageUrl: 'Ссылка на изображение',
    available: 'Доступен',

    // History
    successful: 'Успешные',
    unsuccessful: 'Неудачные',
    closedBy: 'Закрыт:',
    cancelledBy: 'Отменён:',
    reason: 'Причина',

    // Accounting
    totalRevenue: 'Общий доход',
    completedBookings: 'Завершённых бронирований',
    byCategory: 'По категориям',
    byCity: 'По городам',
    byMonth: 'По месяцам',
    export: 'Экспорт',

    // User Dashboard
    myBookings: 'Мои бронирования',
    closed: 'Закрыто',
    showDetails: 'Показать детали',
    requestModification: 'Запросить изменение',
    requestCancellation: 'Запросить отмену',
    awaitingDecision: 'Ожидает решения администратора',

    // Messages & Notifications
    success: 'Успешно',
    error: 'Ошибка',
    warning: 'Внимание',
    info: 'Информация',
    loading: 'Загрузка...',
    noData: 'Нет данных',
    save: 'Сохранить',
    close: 'Закрыть',
    delete: 'Удалить',
    edit: 'Редактировать',
    back: 'Назад',

    // Validation
    required: 'Это поле обязательно',
    invalidEmail: 'Некорректный email',
    invalidPhone: 'Некорректный номер телефона',
    passwordMinLength: 'Пароль минимум 6 символов',
    fieldErrors: 'Ошибки в полях',

    // Admin
    adminPanel: 'Панель администратора',
    adminSecretCode: 'Код администратора',
  },

  en: {
    // Navigation
    dashboard: 'Dashboard',
    bookings: 'Bookings',
    rooms: 'Rooms',
    accounting: 'Accounting',
    settings: 'Settings',
    history: 'History',
    logout: 'Logout',

    // Dashboard
    totalBookings: 'Total Bookings',
    activeBookings: 'Active Bookings',
    pendingRequests: 'Pending Requests',
    cancelledBookings: 'Cancelled Bookings',
    revenue: 'Revenue',
    incomeByService: 'Income by Service',

    // Bookings
    bookingId: 'Booking ID',
    roomName: 'Room Name',
    roomPrice: 'Room Price',
    roomCategory: 'Category',
    city: 'City',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    nights: 'Nights',
    guest: 'Guest',
    totalPrice: 'Total',
    status: 'Status',
    approve: 'Approve',
    reject: 'Reject',
    cancel: 'Cancel',
    checkout: 'Checkout',
    pendingApproval: 'Pending Approval',
    approvedBy: 'Approved by:',
    rejectedBy: 'Rejected by:',

    // Services
    restaurant: 'Restaurant',
    bar: 'Bar',
    spa: 'Spa',
    transfer: 'Transfer',
    laundry: 'Laundry',
    excursion: 'Excursion',
    other: 'Other',
    addService: '+ Service',
    serviceName: 'Service Name',
    servicePrice: 'Price',
    quantity: 'Quantity',
    servicesTotal: 'Services Total',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    paymentMethod: 'Payment Method',
    card: 'Card',
    cash: 'Cash',
    transfer: 'Transfer',

    // Rooms
    addRoom: 'Add Room',
    editRoom: 'Edit Room',
    deleteRoom: 'Delete Room',
    roomSize: 'Size (m²)',
    maxGuests: 'Max Guests',
    amenities: 'Amenities',
    imageUrl: 'Image URL',
    available: 'Available',

    // History
    successful: 'Successful',
    unsuccessful: 'Unsuccessful',
    closedBy: 'Closed by:',
    cancelledBy: 'Cancelled by:',
    reason: 'Reason',

    // Accounting
    totalRevenue: 'Total Revenue',
    completedBookings: 'Completed Bookings',
    byCategory: 'By Category',
    byCity: 'By City',
    byMonth: 'By Month',
    export: 'Export',

    // User Dashboard
    myBookings: 'My Bookings',
    closed: 'Closed',
    showDetails: 'Show Details',
    requestModification: 'Request Modification',
    requestCancellation: 'Request Cancellation',
    awaitingDecision: 'Awaiting Administrator Decision',

    // Messages & Notifications
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data',
    save: 'Save',
    close: 'Close',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',

    // Validation
    required: 'This field is required',
    invalidEmail: 'Invalid email address',
    invalidPhone: 'Invalid phone number',
    passwordMinLength: 'Password must be at least 6 characters',
    fieldErrors: 'Field errors',

    // Admin
    adminPanel: 'Admin Panel',
    adminSecretCode: 'Admin Secret Code',
  }
};

/**
 * Get translation for a key in a specific language
 * @param {string} language - Language code (en, ru)
 * @param {string} key - Translation key
 * @returns {string} Translated text or key if not found
 */
function t(language = 'ru', key) {
  return translations[language]?.[key] || translations['ru']?.[key] || key;
}

/**
 * Get all translations for a language
 * @param {string} language - Language code
 * @returns {object} All translations for the language
 */
function getLang(language = 'ru') {
  return translations[language] || translations['ru'];
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { translations, t, getLang };
}
