// ==================== ЛОГИКА ДАШБОРДА ====================

function checkDashboardAuth() {
  if (!window.api || !window.api.isAuthenticated()) {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return false; }
  }
  return true;
}
if (!checkDashboardAuth()) {}

let currentUser = null;
let selectedRoomCategory = null;
let selectedRoomPrice = null;
let selectedRoomName = null;
let currentChangeBookingId = null;
let currentCancelBookingId = null;
window.isModificationMode = false;

function safeValue(value, fallback = '—') {
  return value === undefined || value === null || value === '' ? fallback : value;
}

function selectRoomCategory(category, price, name) {
  selectedRoomCategory = category; selectedRoomPrice = price; selectedRoomName = name;
  
  const nameEl = document.getElementById('current-room-name-display');
  const priceEl = document.getElementById('current-room-price-display');
  const t = translations[getCurrentLanguage()];
  
  if (nameEl) nameEl.textContent = name;
  if (priceEl) priceEl.textContent = `$${price}/${t['dashboard.pricePerNight'] || 'night'}`;
  
  updatePricePreview();
}

function updatePricePreview() {
  const checkin = document.getElementById('change-checkin')?.value;
  const checkout = document.getElementById('change-checkout')?.value;
  const preview = document.getElementById('change-price-preview');
  if (!preview) return;
  const lang = getCurrentLanguage(); const t = translations[lang];
  if (checkin && checkout && selectedRoomPrice) {
    const nights = Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
    if (nights > 0) { const total = nights * selectedRoomPrice; preview.textContent = `${t['dashboard.newCost'] || 'Новая стоимость'}: $${total} (${nights} ${t['dashboard.nightsCount'] || 'ночей'} × $${selectedRoomPrice})`; }
  } else { preview.textContent = lang === 'ru' ? 'Новая стоимость будет рассчитана автоматически' : 'New price will be calculated automatically'; }
}

async function loadDashboard() {
  try {
    const lang = getCurrentLanguage(); const t = translations[lang];
    
    try { 
      if (window.api && window.api.isAuthenticated()) { 
        const profileData = await window.api.getProfile(); 
        currentUser = profileData.data || profileData; 
      } 
    } catch (e) { 
      currentUser = null;
    }
    
    if (!currentUser || !currentUser.firstName) { 
      logout(); return;
    }

    document.getElementById('welcome-message').textContent = `${t['dashboard.welcome']}, ${safeValue(currentUser.firstName, lang === 'ru' ? 'Гость' : 'Guest')}!`;

    let bookings = [];
    try {
      if (window.api && window.api.isAuthenticated()) {
        const response = await window.api.getMyBookings();
        bookings = Array.isArray(response) ? response : (response.data || []);
      }
    } catch (e) {
      bookings = [];
    }
    bookings = bookings.filter(b => b && (b.roomName || b._id));

    let savedCards = [];
    try {
      const cardsResponse = await window.api.getCards();
      savedCards = cardsResponse.data || [];
    } catch (e) {
      savedCards = currentUser.savedCards || [];
    }

    const html = `
      <div class="col-span-12 lg:col-span-4 space-y-8">
        <div class="bg-zinc-900 rounded-3xl p-8 text-center animate-fade-in-up">
          <div class="w-28 h-28 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl flex items-center justify-center text-5xl mb-4 shadow-lg shadow-amber-500/5 profile-avatar">👤</div>
          <h2 class="text-2xl font-semibold">${safeValue(currentUser.firstName, '')} ${safeValue(currentUser.lastName, '')}</h2>
          <p class="text-gray-400 mt-1">${safeValue(currentUser.email)}</p>
          <p class="text-gray-400 mt-1">${safeValue(currentUser.phone)}</p>
          <button onclick="toggleProfileEdit()" class="mt-6 w-full py-3 border border-white/30 rounded-2xl hover:bg-white/5 transition transform hover:scale-[1.02] active:scale-[0.98]">${t['dashboard.editprofile']}</button>
          <div id="profile-edit-form" class="hidden mt-6 text-left space-y-4 animate-fade-in-up">
            <input id="edit-firstname" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${t['register.firstname']}" value="${currentUser.firstName || ''}">
            <input id="edit-lastname" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${t['register.lastname']}" value="${currentUser.lastName || ''}">
            <input id="edit-phone" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${t['register.phone']}" value="${currentUser.phone || ''}">
            <button onclick="saveProfile()" class="w-full py-3 bg-amber-500 text-black rounded-2xl font-semibold hover:bg-amber-600 transition">${t['dashboard.save']}</button>
          </div>
        </div>

        <div class="bg-zinc-900 rounded-3xl p-8 animate-fade-in-up" style="animation-delay: 0.1s;">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-semibold">💳 ${t['dashboard.myCards'] || 'Мои карты'}</h3>
            <button onclick="toggleAddCardForm()" class="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition text-sm font-medium">+ ${t['dashboard.addCard'] || 'Добавить'}</button>
          </div>
          <div id="cards-list" class="space-y-3">
            ${savedCards.length === 0 ? 
              `<p class="text-gray-500 text-center py-4 text-sm">${t['dashboard.noCards'] || 'Нет сохранённых карт'}</p>` :
              savedCards.map((card, index) => `
                <div class="bg-zinc-800 rounded-xl p-4 flex justify-between items-center card-item animate-fade-in" style="animation-delay: ${index * 0.1}s;">
                  <div class="flex items-center gap-3"><span class="text-2xl">💳</span><div><p class="font-medium text-sm">${card.masked}</p><p class="text-xs text-gray-500">${card.brand}</p></div></div>
                  <button onclick="deleteCard('${card._id}')" class="text-red-400 hover:text-red-300 transition text-sm">🗑️</button>
                </div>`).join('')
            }
          </div>
          <div id="add-card-form" class="hidden mt-4 space-y-3 animate-fade-in-up">
            <input type="text" id="new-card-number" placeholder="1234 5678 9012 3456" maxlength="19" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-xl focus:border-amber-400 transition text-sm">
            <div class="grid grid-cols-2 gap-3">
              <input type="text" id="new-card-expiry" placeholder="MM/YY" maxlength="5" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-xl focus:border-amber-400 transition text-sm">
              <input type="text" id="new-card-cvc" placeholder="CVC" maxlength="4" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-xl focus:border-amber-400 transition text-sm">
            </div>
            <div class="flex gap-3">
              <button onclick="addNewCard()" class="flex-1 py-2.5 bg-amber-500 text-black rounded-xl font-semibold hover:bg-amber-600 transition text-sm">${t['dashboard.save']}</button>
              <button onclick="toggleAddCardForm()" class="flex-1 py-2.5 border border-white/30 rounded-xl hover:bg-white/5 transition text-sm">${t['booking.cancel']}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-8 bg-zinc-900 rounded-3xl p-8 animate-fade-in-up" style="animation-delay: 0.15s;">
        <h3 class="text-2xl font-semibold mb-6">${t['dashboard.mybookings']}</h3>
        <div class="space-y-6" id="bookings-container">
          ${bookings.length === 0 ? 
            `<p class="text-gray-400 text-center py-12">${t['dashboard.noBookings']}</p>` :
            bookings.map(booking => renderBookingCard(booking, t)).join('')
          }
        </div>
      </div>
    `;

    document.getElementById('dashboard-content').innerHTML = html;
    setTimeout(() => bindBookingButtons(), 100);
    
    const cardInput = document.getElementById('new-card-number');
    if (cardInput) {
      cardInput.addEventListener('input', function(e) {
        let val = this.value.replace(/\s/g, '').replace(/[^\d]/g, '');
        val = val.match(/.{1,4}/g)?.join(' ') || val;
        this.value = val;
      });
    }

    const expiryInput = document.getElementById('new-card-expiry');
    if (expiryInput) {
      expiryInput.addEventListener('input', function() {
        const digits = this.value.replace(/\D/g, '').slice(0, 4);
        if (digits.length <= 2) {
          this.value = digits;
        } else {
          this.value = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
      });
    }

    document.querySelectorAll('[data-translate]').forEach(el => {
      const key = el.getAttribute('data-translate');
      if (t[key]) el.textContent = t[key];
    });
    
  } catch (error) {
    console.error('Dashboard error:', error);
    const lang = getCurrentLanguage(); const t = translations[lang];
    document.getElementById('dashboard-content').innerHTML = `<div class="col-span-12 text-center py-20 animate-fade-in-up"><div class="text-6xl mb-4">⚠️</div><p class="text-xl text-gray-400">${t['dashboard.error'] || 'Ошибка загрузки'}</p><button onclick="loadDashboard()" class="mt-4 px-6 py-2 bg-amber-500 text-black rounded-2xl transition">${t['dashboard.retry'] || 'Повторить'}</button></div>`;
  }
}

function toggleAddCardForm() { const form = document.getElementById('add-card-form'); if (form) { form.classList.toggle('hidden'); if (!form.classList.contains('hidden')) form.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
async function addNewCard() {
  const lang = getCurrentLanguage();
  const number = document.getElementById('new-card-number')?.value.replace(/\s/g, '');
  const expiry = document.getElementById('new-card-expiry')?.value;
  const cvc = document.getElementById('new-card-cvc')?.value;
  if (!number || number.length < 16) { showCustomAlert('warning', lang === 'ru' ? 'Введите корректный номер карты (16 цифр)' : 'Enter a valid card number (16 digits)'); return; }
  if (!expiry || !cvc) { showCustomAlert('warning', lang === 'ru' ? 'Заполните все поля' : 'Fill in all fields'); return; }
  const brand = number.startsWith('4') ? 'Visa' : number.startsWith('5') ? 'Mastercard' : 'Card';
  try {
    await window.api.addCard({ cardNumber: number, expiry, brand });
    showCustomAlert('success', lang === 'ru' ? '✅ Карта добавлена!' : '✅ Card added!');
    loadDashboard();
  } catch (error) {
    showCustomAlert('error', error.message);
  }
}
async function deleteCard(cardId) {
  try {
    await window.api.deleteCard(cardId);
    showCustomAlert('success', getCurrentLanguage() === 'ru' ? 'Карта удалена' : 'Card deleted');
    loadDashboard();
  } catch (error) {
    showCustomAlert('error', error.message);
  }
}

// 🔥 КЛИЕНТ: только 1 запрос, после решения — кнопки не показываются
function renderBookingCard(booking, t) {
  const bookingId = booking._id || booking.id;
  const canModify = new Date(booking.canModifyUntil) > new Date();
  const cr = booking.changeRequest;
  
  const statusMap = {
    'active': { color: 'bg-green-500/20 text-green-400', icon: '✅', text: t['status.active'] },
    'pending_change': { color: 'bg-yellow-500/20 text-yellow-400', icon: '⏳', text: t['status.pending_change'] },
    'pending_cancellation': { color: 'bg-orange-500/20 text-orange-400', icon: '🔄', text: t['status.pending_cancellation'] },
    'changed': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️', text: t['status.changed'] },
    'cancelled': { color: 'bg-red-500/20 text-red-400', icon: '❌', text: t['status.cancelled'] },
    'rejected': { color: 'bg-gray-500/20 text-gray-400', icon: '🚫', text: t['status.rejected'] },
    'completed': { color: 'bg-emerald-500/20 text-emerald-400', icon: '✅', text: t['status.completed'] || 'Completed' }
  };
  const st = statusMap[booking.status] || statusMap['active'];
  const timeLeft = canModify ? Math.max(0, Math.ceil((new Date(booking.canModifyUntil) - new Date()) / (1000 * 60 * 60))) : 0;
  const checkInStr = (booking.checkIn || '').toString().split('T')[0];
  const checkOutStr = (booking.checkOut || '').toString().split('T')[0];
  
  let actionHTML = '';
  
  if (booking.status === 'completed') {
    actionHTML = `
      <p class="mt-4 text-xs text-green-400 text-center font-bold">✅ ${t['status.completed'] || 'Completed'}</p>
      <button onclick='openReceiptModal(${JSON.stringify(booking).replace(/'/g, "&#39;")})' class="mt-3 w-full py-2 bg-amber-500/20 text-amber-400 rounded-xl hover:bg-amber-500/30 transition text-sm font-medium">🧾 ${t['dashboard.showDetails'] || 'Показать детали'}</button>
    `;
  } else if (cr && cr.status === 'pending') {
    actionHTML = `<p class="mt-4 text-xs text-yellow-400 text-center">⏳ ${t['dashboard.pendingAdmin']}</p>`;
  } else if (booking.approvalStatus === 'approved' && booking.status === 'active') {
    actionHTML = `<p class="mt-4 text-xs text-green-400 text-center">✅ ${t['approvedBy'] || 'Одобрено:'} ${booking.approvedBy || 'Admin'}</p>
      <div class="flex gap-3 mt-4 pt-4 border-t border-white/10 booking-actions" style="position: relative; z-index: 1;">
        <button class="btn-modify flex-1 py-2.5 border border-amber-400/50 text-amber-400 rounded-xl hover:bg-amber-400/10 transition text-sm font-medium" data-booking-id="${bookingId}" data-city="${booking.city || ''}" data-checkin="${checkInStr}" data-checkout="${checkOutStr}" data-category="${booking.roomCategory || 'classic'}" data-price="${booking.roomPrice || 0}" data-name="${booking.roomName || ''}">✏️ ${t['dashboard.changeBtn']}</button>
        <button class="btn-cancel flex-1 py-2.5 border border-red-400/30 text-red-400 rounded-xl hover:bg-red-400/10 transition text-sm font-medium" data-booking-id="${bookingId}">🗑️ ${t['dashboard.cancelBtn']}</button>
      </div>`;
  } else if (booking.approvalStatus === 'rejected') {
    actionHTML = `<p class="mt-4 text-xs text-red-400 text-center">❌ ${t['rejectedBy'] || 'Отклонено:'} ${booking.approvedBy || 'Admin'}</p>
      <p class="text-xs text-gray-400 text-center mt-1">${booking.approvalNotes || ''}</p>`;
  } else if (canModify && booking.status === 'active') {
    // Только если ещё нет запроса — показываем кнопки Modify/Cancel
    actionHTML = `
      <div class="flex gap-3 mt-4 pt-4 border-t border-white/10 booking-actions" style="position: relative; z-index: 1;">
        <button class="btn-modify flex-1 py-2.5 border border-amber-400/50 text-amber-400 rounded-xl hover:bg-amber-400/10 transition text-sm font-medium" data-booking-id="${bookingId}" data-city="${booking.city || ''}" data-checkin="${checkInStr}" data-checkout="${checkOutStr}" data-category="${booking.roomCategory || 'classic'}" data-price="${booking.roomPrice || 0}" data-name="${booking.roomName || ''}">✏️ ${t['dashboard.changeBtn']}</button>
        <button class="btn-cancel flex-1 py-2.5 border border-red-400/30 text-red-400 rounded-xl hover:bg-red-400/10 transition text-sm font-medium" data-booking-id="${bookingId}">🗑️ ${t['dashboard.cancelBtn']}</button>
      </div>`;
  } else if (booking.status === 'cancelled') {
    const cancelReason = (booking.cancelReason === 'Не указана' || !booking.cancelReason) ? t['status.notSpecified'] : booking.cancelReason;
    actionHTML = `<p class="mt-4 text-xs text-red-400 text-center">❌ ${st.text} - ${cancelReason}</p>`;
  } else if (booking.status === 'changed') {
    actionHTML = `<p class="mt-4 text-xs text-blue-400 text-center">✅ ${t['status.changed']}</p>`;
  } else {
    actionHTML = `<p class="mt-4 text-xs text-gray-600 text-center">🔒 ${t['dashboard.locked']}</p>`;
  }
  
  return `
    <div class="booking-card bg-zinc-800 rounded-2xl p-6" style="animation: fadeInUp 0.5s ease forwards;" data-booking-id="${bookingId}">
      <div class="flex justify-between items-start" style="position: relative; z-index: 1;">
        <div>
          <div class="flex items-center gap-2 mb-1"><p class="font-medium text-lg">${booking.roomName || 'Номер'}</p><span class="text-xs px-2 py-0.5 bg-zinc-700 rounded-full">${booking.roomCategory || 'classic'}</span></div>
          <p class="text-sm text-gray-400 mt-1">📅 ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}</p>
          <p class="text-sm text-gray-400">📍 ${t['booking.cityLabel']}: ${booking.city || ''}</p>
        </div>
        <div class="text-right"><span class="inline-flex items-center gap-1 px-4 py-1 ${st.color} text-sm rounded-full"><span>${st.icon}</span> ${st.text}</span><p class="mt-2 font-semibold text-lg">$${booking.totalPrice || booking.roomPrice || 0}</p></div>
      </div>
      ${actionHTML}
      <div class="flex justify-between items-center mt-3"><p class="text-xs text-gray-500">${t['dashboard.booked']}: ${formatDate(booking.createdAt || booking.created_at)}</p>${canModify && timeLeft > 0 ? `<p class="text-xs text-amber-400/70">⏰ ${timeLeft}${t['dashboard.hoursLeft']}</p>` : ''}</div>
    </div>`;
}

function bindBookingButtons() {
  document.querySelectorAll('.btn-modify').forEach(btn => {
    btn.addEventListener('click', function() {
      openChangeModal(this.getAttribute('data-booking-id'), this.getAttribute('data-city'), this.getAttribute('data-checkin'), this.getAttribute('data-checkout'), this.getAttribute('data-category'), parseFloat(this.getAttribute('data-price')), this.getAttribute('data-name'));
    });
  });
  document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', function() { openCancelModal(this.getAttribute('data-booking-id')); });
  });
}

window.openReceiptModal = function(booking) {
  const modal = document.getElementById('receipt-modal');
  const content = document.getElementById('receipt-content');
  if (!modal || !content || !booking.checkout) return;
  
  const lang = getCurrentLanguage();
  const t = translations[lang] || translations.en;
  const co = booking.checkout;
  let servicesHtml = '';
  if (co.services && co.services.length > 0) {
    servicesHtml = co.services.map(s => `<div class="flex justify-between"><span class="text-gray-400">${safeValue(s.name || s.category)} x${s.quantity || 1}</span><span>$${(s.price || 0) * (s.quantity || 1)}</span></div>`).join('');
  }
  
  content.innerHTML = `
    <div class="border-b border-white/10 pb-3 mb-3">
      <div class="flex justify-between"><span class="text-gray-400">${t['receipt.stay'] || 'Stay'}</span><span>$${co.roomTotal || 0}</span></div>
      ${servicesHtml}
    </div>
    <div class="flex justify-between"><span class="text-gray-400">${t['receipt.discount'] || 'Discount'}</span><span class="text-green-400">-$${co.discount || 0}</span></div>
    <div class="flex justify-between mt-2 pt-2 border-t border-white/10 font-bold text-lg"><span class="text-amber-400">${t['receipt.total'] || 'Total'}</span><span class="text-amber-400">$${co.grandTotal || 0}</span></div>
    <div class="text-xs text-gray-500 mt-4 text-center">${t['receipt.closedBy'] || 'Closed by'}: ${co.closedBy || 'Admin'}</div>
  `;
  
  modal.classList.remove('hidden');
};

function toggleProfileEdit() { const form = document.getElementById('profile-edit-form'); if (form) { form.classList.toggle('hidden'); if (!form.classList.contains('hidden')) form.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
async function saveProfile() {
  const firstName = document.getElementById('edit-firstname')?.value; const lastName = document.getElementById('edit-lastname')?.value; const phone = document.getElementById('edit-phone')?.value;
  const lang = getCurrentLanguage(); const t = translations[lang];
  try {
    if (window.api && window.api.isAuthenticated()) await window.api.updateProfile({ firstName, lastName, phone });
    await loadDashboard(); showCustomAlert('success', '✅ ' + (t['dashboard.profileUpdated'] || 'Профиль обновлён!'));
  } catch (error) { showCustomAlert('error', error.message || 'Ошибка сохранения'); }
}
async function openChangeModal(bookingId, city, checkin, checkout, category, price, roomName) {
  currentChangeBookingId = bookingId;
  if (document.getElementById('change-city')) document.getElementById('change-city').value = city;
  selectedRoomCategory = category; selectedRoomPrice = price; selectedRoomName = roomName;
  
  const nameEl = document.getElementById('current-room-name-display');
  const priceEl = document.getElementById('current-room-price-display');
  const lang = getCurrentLanguage();
  const t = translations[lang];
  
  if (nameEl) nameEl.textContent = roomName;
  if (priceEl) priceEl.textContent = `$${price}/${t['dashboard.pricePerNight'] || 'night'}`;

  updatePricePreview(); 
  const modal = document.getElementById('change-modal'); if (modal) modal.classList.remove('hidden');
}

window.openRoomsModalForChange = function() {
  window.isModificationMode = true;
  document.getElementById('change-modal').classList.add('hidden');
  if (typeof openRoomsModal === 'function') {
    openRoomsModal();
  }
};
function closeChangeModal() { const modal = document.getElementById('change-modal'); if (modal) modal.classList.add('hidden'); currentChangeBookingId = null; }
async function submitChangeRequest() {
  const lang = getCurrentLanguage(); const t = translations[lang];
  try {
    const checkin = document.getElementById('change-checkin')?.value; const checkout = document.getElementById('change-checkout')?.value; const city = document.getElementById('change-city')?.value;
    const nights = checkin && checkout ? Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)) : 0;
    const totalPrice = nights > 0 ? nights * (selectedRoomPrice || 0) : 0;
    
    const selectedServices = Array.from(document.querySelectorAll('#change-services input[type="checkbox"]:checked')).map(cb => ({ category: cb.value, name: cb.parentElement.textContent.trim(), quantity: 1, price: 0 }));
    
    await window.api.requestBookingChange(currentChangeBookingId, { newCity: city, newCheckIn: checkin, newCheckOut: checkout, newRoomName: selectedRoomName, newRoomPrice: selectedRoomPrice, newRoomCategory: selectedRoomCategory, newNights: nights, newTotalPrice: totalPrice, newAdditionalServices: selectedServices });
    closeChangeModal(); showCustomAlert('success', '✅ ' + (t['dashboard.requestSent'] || 'Запрос отправлен!')); setTimeout(loadDashboard, 1000);
  } catch (error) {
    if (error.code === 'WINDOW_EXPIRED') { closeChangeModal(); showCustomAlert('error', '⏰ ' + (t['dashboard.windowExpired'] || 'Время истекло')); }
    else { showCustomAlert('error', error.message); }
  }
}
function openCancelModal(bookingId) { currentCancelBookingId = bookingId; const modal = document.getElementById('cancel-modal'); if (modal) modal.classList.remove('hidden'); }
function closeCancelModal() { const modal = document.getElementById('cancel-modal'); if (modal) modal.classList.add('hidden'); currentCancelBookingId = null; }
async function confirmCancelRequest() {
  const lang = getCurrentLanguage(); const t = translations[lang];
  try { await window.api.requestBookingCancellation(currentCancelBookingId); closeCancelModal(); showCustomAlert('success', '📤 ' + (t['dashboard.cancelSent'] || 'Запрос на отмену отправлен!')); setTimeout(loadDashboard, 1000); }
  catch (error) { if (error.code === 'WINDOW_EXPIRED') { closeCancelModal(); showCustomAlert('error', '⏰ ' + (t['dashboard.windowExpired'] || 'Время истекло')); } else { showCustomAlert('error', error.message); } }
}

function logout() { 
  document.body.style.transition = 'opacity 0.5s ease, transform 0.5s ease'; 
  document.body.style.opacity = '0'; document.body.style.transform = 'scale(0.95)'; 
  setTimeout(() => { 
    if (window.api) window.api.removeToken(); 
    localStorage.removeItem('token'); localStorage.removeItem('user');
    window.location.href = 'index.html'; 
  }, 500); 
}

document.addEventListener('DOMContentLoaded', () => { loadDashboard(); });
document.addEventListener('change', (e) => { if (e.target.id === 'change-checkin' || e.target.id === 'change-checkout') updatePricePreview(); });
