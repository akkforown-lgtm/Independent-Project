// ==================== ГЛОБАЛЬНАЯ СИСТЕМА ПЕРЕВОДОВ ====================

const translations = {
  ru: {
    // ... все переводы без изменений ...
    "logo": "LUXURY HAVEN",
    "nav.home": "Главная",
    "nav.rooms": "Номера",
    "nav.services": "Услуги",
    "nav.about": "О нас",
    "nav.contacts": "Контакты",
    "nav.login": "Войти",
    "nav.cabinet": "Кабинет",
    "hero.title": "Добро пожаловать в Luxury Haven",
    "hero.subtitle": "Эксклюзивный отдых в сердце природы с высочайшим уровнем сервиса",
    "hero.button": "Забронировать сейчас",
    "services.title": "Наши услуги",
    "services.subtitle": "Мы заботимся обо всём, чтобы ваш отдых был идеальным",
    "services.restaurant": "Ресторан",
    "services.spa": "Spa & Wellness",
    "services.activities": "Активный отдых",
    "services.restaurant.desc": "Высокая кухня, сезонное меню и изысканные вина.",
    "services.spa.desc": "Массажи, сауна, косметология и йога.",
    "services.activities.desc": "Конные прогулки, трекинг, рыбалка и экскурсии.",
    "about.title": "О Luxury Haven",
    "about.description": "Luxury Haven — это премиальный бутик-отель, где роскошь гармонично сочетается с первозданной природой.",
    "about.description2": "С 2009 года мы создаём незабываемые впечатления для наших гостей.",
    "contact.title": "Свяжитесь с нами",
    "contact.subtitle": "Мы всегда рады ответить на ваши вопросы",
    "contact.phone": "+7 (999) 123-45-67",
    "contact.email": "info@luxuryhaven.com",
    "contact.address": "Алтайский край, Горный район",
    "login.title": "Вход в кабинет",
    "login.subtitle": "Добро пожаловать обратно",
    "login.email": "Email",
    "login.password": "Пароль",
    "login.emailPlaceholder": "Введите ваш email",
    "login.passwordPlaceholder": "Введите пароль",
    "login.button": "Войти",
    "login.noaccount": "Нет аккаунта?",
    "login.register": "Зарегистрироваться",
    "login.pageTitle": "Вход • Luxury Haven",
    "register.title": "Создать аккаунт",
    "register.subtitle": "Присоединяйтесь к Luxury Haven",
    "register.firstname": "Имя",
    "register.lastname": "Фамилия",
    "register.email": "Email",
    "register.phone": "Номер телефона",
    "register.password": "Пароль",
    "register.firstnamePlaceholder": "Введите ваше имя",
    "register.lastnamePlaceholder": "Введите вашу фамилию",
    "register.emailPlaceholder": "Введите ваш email",
    "register.phonePlaceholder": "Введите номер телефона",
    "register.passwordPlaceholder": "Минимум 6 символов",
    "register.button": "Зарегистрироваться",
    "register.haveaccount": "Уже есть аккаунт?",
    "register.login": "Войти",
    "register.pageTitle": "Регистрация • Luxury Haven",
    "rooms.title": "Наши номера",
    "rooms.subtitle": "Выберите идеальный вариант для вашего незабываемого отдыха",
    "rooms.vip": "VIP Номера",
    "rooms.classic": "Классические номера",
    "rooms.cheap": "Эконом номера",
    "rooms.book": "Забронировать",
    "rooms.perNight": "/ночь",
    "rooms.noActiveBookings": "Нет активных броней на эту комнату",
    "rooms.activeBookingsLabel": "Активные бронирования:",
    "rooms.moreBookings": "еще дат бронирования",
    "rooms.bookingsAvailable": "Доступны активные бронирования",
    "rooms.bookingsCount": "активных броней",
    "rooms.viewBookings": "Посмотреть бронирования",
    "rooms.bookingModalTitle": "Активные брони для {room}",
    "rooms.bookingModalSubtitle": "Ниже перечислены даты текущих активных бронирований этого номера.",
    "rooms.regionPreview": "Проверка доступности региона для текущих дат.",
    "rooms.regionLimitReached": "В городе {city} на выбранные даты достигнут лимит бронирований ({limit}).",
    "rooms.regionOccupied": "В городе {city} на выбранные даты уже занято {count} из {limit} броней.",
    "rooms.noRegionData": "Выберите город и даты, чтобы узнать статус доступности.",
    "booking.title": "Забронировать номер",
    "booking.city": "Город / Филиал",
    "booking.checkin": "Дата заезда",
    "booking.checkout": "Дата выезда",
    "booking.cancel": "Отмена",
    "booking.confirm": "Подтвердить бронь",
    "booking.services": "Доп. услуги",
    "booking.success": "Бронирование подтверждено!",
    "booking.alertDates": "Пожалуйста, выберите даты заезда и выезда!",
    "booking.invalidDates": "Выберите правильные даты заезда и выезда.",
    "booking.checkoutAfterCheckin": "Дата выезда должна быть позже даты заезда.",
    "booking.cityLabel": "Город",
    "booking.roomLabel": "Номер",
    "booking.checkinLabel": "Заезд",
    "booking.checkoutLabel": "Выезд",
    "booking.priceLabel": "Цена за ночь",
    "booking.totalPrice": "Общая стоимость",
    "booking.priceCalculation": "Стоимость: {total} ({nights} ночей) | Предоплата 20%: {deposit}",
    "booking.selectDatesForPrice": "Выберите даты для расчёта стоимости",
    "booking.selectRegionDates": "Выберите город и даты, чтобы увидеть занятость региона.",
    "booking.nightsLabel": "Ночей",
    "rooms.noRoomsAvailable": "Нет доступных номеров в этой категории",
    "rooms.regionStatusError": "Не удалось получить статус региона. Попробуйте позже.",
    "receipt.title": "Чек об оплате",
    "payment.chooseCardOption": "Выбрать карту...",
    "page.title": "Luxury Haven",
    "dashboard.pageTitle": "Личный кабинет • Luxury Haven",
    "dashboard.title": "Личный кабинет",
    "dashboard.back": "На главную",
    "dashboard.editprofile": "Редактировать профиль",
    "dashboard.mybookings": "Мои бронирования",
    "dashboard.noBookings": "У вас пока нет бронирований",
    "dashboard.logout": "Выйти",
    "dashboard.welcome": "Добро пожаловать",
    "dashboard.loading": "Загрузка...",
    "dashboard.error": "Ошибка загрузки данных",
    "dashboard.retry": "Повторить",
    "dashboard.save": "Сохранить",
    "dashboard.changeBooking": "Изменить бронирование",
    "dashboard.changeRoom": "Изменить класс номера",
    "dashboard.submitChange": "Отправить запрос",
    "dashboard.cancelTitle": "Отменить бронирование?",
    "dashboard.cancelConfirm": "Вы уверены что хотите отменить это бронирование? Запрос будет отправлен администратору.",
    "dashboard.no": "Нет",
    "dashboard.yesCancel": "Да, отменить",
    "dashboard.changeBtn": "Изменить",
    "dashboard.cancelBtn": "Отменить",
    "dashboard.changePricePreview": "Новая стоимость будет рассчитана автоматически",
    "dashboard.service.restaurant": "Ресторан",
    "dashboard.service.bar": "Бар",
    "dashboard.service.transfer": "Трансфер",
    "dashboard.service.laundry": "Прачечная",
    "dashboard.service.excursion": "Экскурсия",
    "dashboard.pendingAdmin": "Ожидается решение администратора",
    "dashboard.locked": "Изменение недоступно (прошло более 12 часов)",
    "dashboard.booked": "Забронировано",
    "dashboard.hoursLeft": "ч на изменение",
    "dashboard.newCost": "Новая стоимость",
    "dashboard.nightsCount": "ночей",
    "dashboard.pricePerNight": "ночь",
    "dashboard.requestSent": "Запрос на изменение отправлен администратору!",
    "dashboard.cancelSent": "Запрос на отмену отправлен администратору!",
    "dashboard.windowExpired": "Время для изменения истекло. Обратитесь в службу поддержки.",
    "dashboard.profileUpdated": "Профиль успешно обновлён!",
    "dashboard.changeRoomBtn": "Выбрать из списка",
    "dashboard.requestType.modification": "Изменение",
    "dashboard.requestType.cancellation": "Отмена",
    "dashboard.newRoom": "Новый номер",
    "status.active": "Активно",
    "status.pending_change": "Ожидает изменения",
    "status.pending_cancellation": "Ожидает отмены",
    "status.changed": "Изменено",
    "status.cancelled": "Отменено",
    "status.rejected": "Отклонено",
    "status.completed": "Завершено",
    "status.notSpecified": "не указана",
    "alert.close": "Закрыть",
    "alert.ok": "Отлично!",
    "alert.warning.title": "Внимание",
    "alert.error.title": "Ошибка",
    "alert.message.placeholder": "Сообщение",
    "auth.required.title": "Требуется авторизация",
    "auth.required.message": "Пожалуйста, войдите или зарегистрируйтесь для доступа в личный кабинет",
    "auth.required.login": "Войти",
    "auth.required.register": "Регистрация",
    "payment.title": "Предоплата 20%",
    "payment.subtitle": "Для подтверждения бронирования необходимо внести предоплату",
    "payment.totalAmount": "Общая стоимость",
    "payment.prepayment": "Предоплата (20%)",
    "payment.selectCard": "Пожалуйста, выберите карту для предоплаты.",
    "payment.invalidCardNumber": "Введите корректный номер карты (16 цифр).",
    "payment.fillCardFields": "Заполните все поля карты.",
    "payment.remaining": "Остаток при заселении",
    "payment.savedCards": "Сохранённые карты",
    "payment.or": "или введите данные новой карты",
    "payment.cardNumber": "Номер карты",
    "payment.expiry": "MM/ГГ",
    "payment.cvc": "CVC",
    "payment.payNow": "Оплатить",
    "payment.processing": "Обработка платежа...",
    "payment.success": "Платёж успешно выполнен!",
    "payment.paid": "Оплачено (20%)",
    "booking.pay": "Оплатить",
    "page.title": "Luxury Haven",
    "dashboard.myCards": "Мои карты",
    "dashboard.addCard": "Добавить карту",
    "dashboard.noCards": "Нет сохранённых карт",
    "dashboard.deleteCard": "Удалить"
    ,"receipt.stay": "Проживание",
    "receipt.discount": "Скидка",
    "receipt.total": "Итого",
    "receipt.closedBy": "Закрыто администратором",
    "error.tooManyRequests": "Слишком много запросов. Пожалуйста, подождите.",
    "error.invalidCredentials": "Неверный email или пароль",
    "error.serverError": "Ошибка сервера. Попробуйте позже."
  },
  en: {
    // ... все переводы без изменений ...
    "logo": "LUXURY HAVEN",
    "nav.home": "Home",
    "nav.rooms": "Rooms",
    "nav.services": "Services",
    "nav.about": "About Us",
    "nav.contacts": "Contacts",
    "nav.login": "Login",
    "nav.cabinet": "Dashboard",
    "hero.title": "Welcome to Luxury Haven",
    "hero.subtitle": "Exclusive relaxation in the heart of nature with the highest level of service",
    "hero.button": "Book Now",
    "services.title": "Our Services",
    "services.subtitle": "We take care of everything so your stay is perfect",
    "services.restaurant": "Restaurant",
    "services.spa": "Spa & Wellness",
    "services.activities": "Activities",
    "services.restaurant.desc": "Fine dining, seasonal menu and exquisite wines.",
    "services.spa.desc": "Massages, sauna, cosmetology and yoga.",
    "services.activities.desc": "Horse riding, trekking, fishing and excursions.",
    "about.title": "About Luxury Haven",
    "about.description": "Luxury Haven is a premium boutique hotel where luxury harmoniously combines with pristine nature.",
    "about.description2": "Since 2009, we have been creating unforgettable experiences for our guests.",
    "contact.title": "Contact Us",
    "contact.subtitle": "We are always happy to answer your questions",
    "contact.phone": "+7 (999) 123-45-67",
    "contact.email": "info@luxuryhaven.com",
    "contact.address": "Altai Territory, Mountain District",
    "login.title": "Sign In",
    "login.subtitle": "Welcome back",
    "login.email": "Email",
    "login.password": "Password",
    "login.emailPlaceholder": "Enter your email",
    "login.passwordPlaceholder": "Enter your password",
    "login.button": "Sign In",
    "login.noaccount": "Don't have an account?",
    "login.register": "Register",
    "login.pageTitle": "Login • Luxury Haven",
    "register.title": "Create Account",
    "register.subtitle": "Join Luxury Haven",
    "register.firstname": "First Name",
    "register.lastname": "Last Name",
    "register.email": "Email",
    "register.phone": "Phone Number",
    "register.password": "Password",
    "register.firstnamePlaceholder": "Enter your first name",
    "register.lastnamePlaceholder": "Enter your last name",
    "register.emailPlaceholder": "Enter your email",
    "register.phonePlaceholder": "Enter your phone number",
    "register.passwordPlaceholder": "At least 6 characters",
    "register.button": "Register",
    "register.haveaccount": "Already have an account?",
    "register.login": "Login",
    "register.pageTitle": "Register • Luxury Haven",
    "rooms.title": "Our Rooms",
    "rooms.subtitle": "Choose the perfect option for your unforgettable stay",
    "rooms.vip": "VIP Rooms",
    "rooms.classic": "Classic Rooms",
    "rooms.cheap": "Economy Rooms",
    "rooms.book": "Book Now",
    "rooms.perNight": "/night",
    "rooms.noActiveBookings": "No active bookings for this room",
    "rooms.activeBookingsLabel": "Active reservations:",
    "rooms.moreBookings": "more booking dates",
    "rooms.bookingsAvailable": "Active reservations available",
    "rooms.bookingsCount": "active bookings",
    "rooms.viewBookings": "View reservations",
    "rooms.bookingModalTitle": "Active bookings for {room}",
    "rooms.bookingModalSubtitle": "Below are the current active reservation dates for this room.",
    "rooms.regionPreview": "Checking region availability for the selected dates.",
    "rooms.regionLimitReached": "In {city}, booking capacity is full for the selected dates ({limit}).",
    "rooms.regionOccupied": "In {city}, {count} of {limit} bookings are already active for the selected dates.",
    "rooms.noRegionData": "Choose a city and dates to check availability.",
    "booking.title": "Book a Room",
    "booking.city": "City / Branch",
    "booking.checkin": "Check-in Date",
    "booking.checkout": "Check-out Date",
    "booking.cancel": "Cancel",
    "booking.confirm": "Confirm Booking",
    "booking.services": "Extra Services",
    "booking.success": "Booking Confirmed!",
    "booking.alertDates": "Please select check-in and check-out dates!",
    "booking.invalidDates": "Please select valid check-in and check-out dates.",
    "booking.checkoutAfterCheckin": "Check-out date must be later than check-in date.",
    "booking.cityLabel": "City",
    "booking.roomLabel": "Room",
    "booking.checkinLabel": "Check-in",
    "booking.checkoutLabel": "Check-out",
    "booking.priceLabel": "Price per night",
    "booking.totalPrice": "Total Price",
    "booking.priceCalculation": "Total: {total} ({nights} nights) | 20% deposit: {deposit}",
    "booking.selectDatesForPrice": "Select dates to calculate price",
    "booking.selectRegionDates": "Choose a city and dates to check region occupancy.",
    "booking.nightsLabel": "Nights",
    "rooms.noRoomsAvailable": "No available rooms in this category",
    "rooms.regionStatusError": "Unable to fetch region status. Please try again later.",
    "receipt.title": "Receipt",
    "payment.chooseCardOption": "Select card...",
    "page.title": "Luxury Haven",
    "dashboard.pageTitle": "Dashboard • Luxury Haven",
    "dashboard.title": "Personal Dashboard",
    "dashboard.back": "Back to Home",
    "dashboard.editprofile": "Edit Profile",
    "dashboard.mybookings": "My Bookings",
    "dashboard.noBookings": "You have no bookings yet",
    "dashboard.logout": "Logout",
    "dashboard.welcome": "Welcome",
    "dashboard.loading": "Loading...",
    "dashboard.error": "Error loading data",
    "dashboard.retry": "Retry",
    "dashboard.save": "Save",
    "dashboard.changeBooking": "Modify Booking",
    "dashboard.changeRoom": "Change Room Class",
    "dashboard.submitChange": "Submit Request",
    "dashboard.cancelTitle": "Cancel Booking?",
    "dashboard.cancelConfirm": "Are you sure you want to cancel this booking? The request will be sent to the administrator.",
    "dashboard.no": "No",
    "dashboard.yesCancel": "Yes, Cancel",
    "dashboard.changeBtn": "Modify",
    "dashboard.cancelBtn": "Cancel",
    "dashboard.changePricePreview": "New cost will be calculated automatically",
    "dashboard.service.restaurant": "Restaurant",
    "dashboard.service.bar": "Bar",
    "dashboard.service.transfer": "Transfer",
    "dashboard.service.laundry": "Laundry",
    "dashboard.service.excursion": "Excursion",
    "dashboard.pendingAdmin": "Awaiting administrator decision",
    "dashboard.locked": "Modification unavailable (12 hours passed)",
    "dashboard.booked": "Booked",
    "dashboard.hoursLeft": "h left to modify",
    "dashboard.newCost": "New price",
    "dashboard.nightsCount": "nights",
    "dashboard.pricePerNight": "night",
    "dashboard.requestSent": "Change request sent to administrator!",
    "dashboard.cancelSent": "Cancellation request sent to administrator!",
    "dashboard.windowExpired": "Modification time expired. Contact support.",
    "dashboard.profileUpdated": "Profile updated successfully!",
    "dashboard.changeRoomBtn": "Select from List",
    "dashboard.requestType.modification": "Modification",
    "dashboard.requestType.cancellation": "Cancellation",
    "dashboard.newRoom": "New room",
    "status.active": "Active",
    "status.pending_change": "Pending Change",
    "status.pending_cancellation": "Pending Cancel",
    "status.changed": "Changed",
    "status.cancelled": "Cancelled",
    "status.rejected": "Rejected",
    "status.completed": "Completed",
    "status.notSpecified": "not specified",
    "alert.close": "Close",
    "alert.ok": "Great!",
    "alert.warning.title": "Attention",
    "alert.error.title": "Error",
    "alert.message.placeholder": "Message",
    "auth.required.title": "Authorization Required",
    "auth.required.message": "Please login or register to access your personal cabinet",
    "auth.required.login": "Login",
    "auth.required.register": "Register",
    "payment.title": "20% Prepayment",
    "payment.subtitle": "A prepayment is required to confirm your booking",
    "payment.totalAmount": "Total amount",
    "payment.prepayment": "Prepayment (20%)",
    "payment.selectCard": "Please select a card for prepayment.",
    "payment.invalidCardNumber": "Enter a valid card number (16 digits).",
    "payment.fillCardFields": "Fill in all card fields.",
    "payment.remaining": "Remaining at check-in",
    "payment.savedCards": "Saved cards",
    "payment.or": "or enter new card details",
    "payment.cardNumber": "Card number",
    "payment.expiry": "MM/YY",
    "payment.cvc": "CVC",
    "payment.payNow": "Pay Now",
    "payment.processing": "Processing payment...",
    "payment.success": "Payment successful!",
    "payment.paid": "Paid (20%)",
    "booking.pay": "Pay",
    "booking.priceCalculation": "Total: {total} ({nights} nights) | 20% deposit: {deposit}",
    "booking.selectDatesForPrice": "Select dates to calculate price",
    "booking.nightsLabel": "Nights",
    "rooms.noRoomsAvailable": "No available rooms in this category",
    "rooms.regionStatusError": "Unable to fetch region status. Please try again later.",
    "receipt.title": "Receipt",
    "payment.chooseCardOption": "Select card...",
    "page.title": "Luxury Haven",
    "dashboard.myCards": "My Cards",
    "dashboard.addCard": "Add Card",
    "dashboard.noCards": "No saved cards",
    "dashboard.deleteCard": "Delete"
    ,"receipt.stay": "Stay",
    "receipt.discount": "Discount",
    "receipt.total": "Total",
    "receipt.closedBy": "Closed by",
    "error.tooManyRequests": "Too many requests. Please wait.",
    "error.invalidCredentials": "Invalid email or password",
    "error.serverError": "Server error. Please try again later."
  }
};

// ==================== ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ЯЗЫКА ====================

function switchLanguage(lang) {
  // Сохраняем язык в localStorage (ГЛАВНОЕ - синхронизация между страницами)
  localStorage.setItem('selectedLanguage', lang);
  
  // Обновляем lang атрибут
  document.documentElement.lang = lang;

  // Подсветка кнопок
  const btnRu = document.getElementById('btn-ru');
  const btnEn = document.getElementById('btn-en');
  
  if (btnRu) {
    btnRu.classList.toggle('bg-amber-500', lang === 'ru');
    btnRu.classList.toggle('text-black', lang === 'ru');
  }
  if (btnEn) {
    btnEn.classList.toggle('bg-amber-500', lang === 'en');
    btnEn.classList.toggle('text-black', lang === 'en');
  }

  // Перевод всех элементов с data-translate
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translations[lang] && translations[lang][key]) {
      // Плавная смена текста
      el.style.opacity = '0';
      el.style.transform = 'translateY(-5px)';
      el.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      
      setTimeout(() => {
        el.textContent = translations[lang][key];
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 200);
    }
  });

  // Перевод placeholder, value и title
  document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
    const key = el.getAttribute('data-translate-placeholder');
    if (translations[lang] && translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-translate-value]').forEach(el => {
    const key = el.getAttribute('data-translate-value');
    if (translations[lang] && translations[lang][key]) {
      el.value = translations[lang][key];
    }
  });

  document.querySelectorAll('[data-translate-title]').forEach(el => {
    const key = el.getAttribute('data-translate-title');
    if (translations[lang] && translations[lang][key]) {
      el.title = translations[lang][key];
    }
  });

  updateAuthModalText();
  
  // Обновляем дашборд только если он открыт и функция существует
  if (typeof loadDashboard === 'function' && document.getElementById('dashboard-content')) {
    loadDashboard();
  }
}

// ==================== ФУНКЦИИ ДЛЯ МОДАЛЬНОГО ОКНА АВТОРИЗАЦИИ ====================

function openAuthRequiredModal() {
  const modal = document.getElementById('auth-required-modal');
  if (modal) {
    modal.classList.remove('hidden');
    updateAuthModalText();
  }
}

function closeAuthRequiredModal() {
  const modal = document.getElementById('auth-required-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function updateAuthModalText() {
  const lang = getCurrentLanguage();
  const t = translations[lang];
  
  const title = document.getElementById('auth-required-title');
  const message = document.getElementById('auth-required-message');
  const loginBtn = document.querySelector('#auth-required-modal button[onclick="goToLogin()"]');
  const registerBtn = document.querySelector('#auth-required-modal button[onclick="goToRegister()"]');
  
  if (title) title.textContent = t['auth.required.title'];
  if (message) message.textContent = t['auth.required.message'];
  if (loginBtn) loginBtn.textContent = t['auth.required.login'];
  if (registerBtn) registerBtn.textContent = t['auth.required.register'];
}

function goToLogin() {
  window.location.href = 'login.html';
}

function goToRegister() {
  window.location.href = 'register.html';
}

// ==================== ЗАГРУЗКА СОХРАНЁННОГО ЯЗЫКА ====================

function loadSavedLanguage() {
  const savedLang = getCurrentLanguage();
  switchLanguage(savedLang);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function getCurrentLanguage() {
  return localStorage.getItem('selectedLanguage') || 'ru';
}

// ==================== ЗАПУСК ПРИ ЗАГРУЗКЕ ====================

document.addEventListener('DOMContentLoaded', () => {
  loadSavedLanguage();
});
