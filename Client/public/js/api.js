// ==================== API КЛИЕНТ ====================

/**
 * Get the API base URL dynamically
 */
function getApiBaseUrl() {
  // In development, use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // In production, use the same host as the client
  return `${window.location.protocol}//${window.location.host}/api`;
}

class ApiClient {
  constructor() {
    this.baseURL = getApiBaseUrl();
    this.token = localStorage.getItem('token');
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    };
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || data.error || 'Ошибка запроса');
      error.field = data.field;
      error.status = response.status;
      error.code = data.error;
      throw error;
    }

    return data;
  }

  async get(endpoint) {
    return this.request(endpoint);
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Аутентификация
  async register(userData) {
    const data = await this.post('/auth/register', userData);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async login(credentials) {
    const data = await this.post('/auth/login', credentials);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getProfile() {
    return this.get('/auth/profile');
  }

  async updateProfile(profileData) {
    return this.put('/auth/profile', profileData);
  }

  async getCards() {
    return this.get('/auth/cards');
  }

  async addCard(cardData) {
    return this.post('/auth/cards', cardData);
  }

  async deleteCard(cardId) {
    return this.delete(`/auth/cards/${cardId}`);
  }

  // Номера
  async getRooms() {
    return this.get('/rooms');
  }

  // Бронирования
  async createBooking(bookingData) {
    return this.post('/bookings', bookingData);
  }

  async getRegionStatus(city, checkIn, checkOut) {
    const params = new URLSearchParams({ city, checkIn, checkOut });
    return this.get(`/bookings/region-status?${params.toString()}`);
  }

  async getRoomBookings(roomName, city = '') {
    const params = new URLSearchParams({ roomName, city });
    return this.get(`/bookings/room-status?${params.toString()}`);
  }

  async getMyBookings() {
    return this.get('/bookings/my');
  }

  async getBooking(id) {
    return this.get(`/bookings/${id}`);
  }

  async requestBookingChange(bookingId, changeData) {
    return this.put(`/bookings/${bookingId}/change-request`, changeData);
  }

  async requestBookingCancellation(bookingId) {
    return this.put(`/bookings/${bookingId}/cancel-request`);
  }

  async getNotifications(bookingId) {
    return this.get(`/bookings/${bookingId}/notifications`);
  }

  isAuthenticated() {
    return !!this.token;
  }

  async checkAuth() {
    if (!this.token) return false;
    try {
      await this.getProfile();
      return true;
    } catch {
      this.removeToken();
      return false;
    }
  }
}

const api = new ApiClient();
window.api = api;
