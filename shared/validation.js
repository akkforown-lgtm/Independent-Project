/**
 * Shared validation utilities
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  if (typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  
  // Only allow digits, spaces, hyphens, parentheses, and optional leading plus
  const phoneFormatRegex = /^\+?[\d\s\-\(\)]+$/;
  if (!phoneFormatRegex.test(trimmed)) {
    return false;
  }
  
  const digits = trimmed.replace(/\D/g, '');
  
  if (trimmed.startsWith('+7') || trimmed.startsWith('7')) {
    return digits.length === 11 && digits.startsWith('7');
  }
  
  if (trimmed.startsWith('+998') || trimmed.startsWith('998')) {
    return digits.length === 12 && digits.startsWith('998');
  }
  
  return false;
};

const allowedCities = ['Tashkent', 'Bukhara', 'Samarkand', 'Khiva', 'Fergana'];

const normalizeCity = (city) => {
  if (typeof city !== 'string') return null;
  const trimmed = city.trim();
  return allowedCities.find(allowed => allowed.toLowerCase() === trimmed.toLowerCase()) || null;
};

const validatePassword = (password) => {
  if (password.length < 6) {
    return { valid: false, error: 'Пароль должен быть минимум 6 символов' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Пароль слишком длинный' };
  }
  return { valid: true };
};

const validateBookingData = (data) => {
  const errors = {};

  if (!data.roomName || typeof data.roomName !== 'string') {
    errors.roomName = 'Наименование номера обязательно';
  }

  if (!data.roomPrice || isNaN(data.roomPrice) || data.roomPrice < 0) {
    errors.roomPrice = 'Цена номера должна быть положительным числом';
  }

  if (!normalizeCity(data.city)) {
    errors.city = 'Выберите корректный город';
  }

  if (!data.checkIn || isNaN(new Date(data.checkIn).getTime())) {
    errors.checkIn = 'Дата заезда некорректна';
  }

  if (!data.checkOut || isNaN(new Date(data.checkOut).getTime())) {
    errors.checkOut = 'Дата выезда некорректна';
  }

  const checkInDate = new Date(data.checkIn);
  const checkOutDate = new Date(data.checkOut);
  if (checkOutDate <= checkInDate) {
    errors.dates = 'Дата выезда должна быть позже даты заезда';
  }

  if (!data.nights || isNaN(data.nights) || data.nights < 1) {
    errors.nights = 'Количество ночей должно быть положительным числом';
  }

  if (!data.totalPrice || isNaN(data.totalPrice) || data.totalPrice < 0) {
    errors.totalPrice = 'Общая цена должна быть положительным числом';
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
};

const validateRegistrationData = (data) => {
  const errors = {};

  if (!data.firstName || typeof data.firstName !== 'string' || data.firstName.trim().length === 0) {
    errors.firstName = 'Имя обязательно';
  }

  if (!data.lastName || typeof data.lastName !== 'string' || data.lastName.trim().length === 0) {
    errors.lastName = 'Фамилия обязательна';
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Некорректный адрес email';
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = 'Некорректный номер телефона (допускается +7 и 11 цифр, либо +998 и 12 цифр)';
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.password = passwordValidation.error;
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
};

const validateLoginData = (data) => {
  const errors = {};

  if (!data.email || !validateEmail(data.email)) {
    errors.email = 'Некорректный адрес email';
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'Пароль обязателен';
  }

  return Object.keys(errors).length === 0 ? { valid: true } : { valid: false, errors };
};

module.exports = {
  validateEmail,
  validatePhone,
  validatePassword,
  normalizeCity,
  allowedCities,
  validateBookingData,
  validateRegistrationData,
  validateLoginData
};
