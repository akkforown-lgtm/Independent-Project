// ==================== МОДАЛЬНЫЕ ОКНА И БРОНИРОВАНИЕ ====================

let currentRoom = {};
let pendingBooking = null;

function openRoomsModal() {
  const modal = document.getElementById('rooms-modal');
  if (modal) { modal.classList.remove('hidden'); renderRooms(); }
}

function closeRoomsModal() {
  const modal = document.getElementById('rooms-modal');
  if (modal) modal.classList.add('hidden');
}

function openBookingModal(name, price, category = 'classic') {
  if (!window.api || !window.api.isAuthenticated()) {
    closeRoomsModal();
    openAuthRequiredModal();
    return;
  }
  
  // 🔥 Если мы в режиме изменения брони (из дашборда)
  if (window.isModificationMode) {
    if (typeof selectRoomCategory === 'function') {
      selectRoomCategory(category, price, name);
      closeRoomsModal();
      const changeModal = document.getElementById('change-modal');
      if (changeModal) changeModal.classList.remove('hidden');
      window.isModificationMode = false; // Сбрасываем флаг
      return;
    }
  }
  currentRoom = { name, price, category };
  const modalRoomInfo = document.getElementById('modal-room-info');
  if (modalRoomInfo) {
    const lang = getCurrentLanguage();
    const t = translations[lang];
    modalRoomInfo.innerHTML = `<p class="text-2xl font-semibold">${name}</p><p class="text-amber-400 text-xl">$${price} <span class="text-sm text-gray-400">${t['rooms.perNight'] || 'per night'}</span></p>`;
  }
  updateBookingPricePreview();
  updateRegionStatusText();
  closeRoomsModal();
  refreshBookingDateInputs();
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');
  if (checkinInput && !checkinInput.dataset.bookingListenerAttached) {
    checkinInput.addEventListener('change', () => { refreshBookingDateInputs(); updateBookingPricePreview(); updateRegionStatusText(); });
    checkinInput.dataset.bookingListenerAttached = '1';
  }
  if (checkoutInput && !checkoutInput.dataset.bookingListenerAttached) {
    checkoutInput.addEventListener('change', () => { updateBookingPricePreview(); updateRegionStatusText(); });
    checkoutInput.dataset.bookingListenerAttached = '1';
  }
  const bookingModal = document.getElementById('booking-modal');
  if (bookingModal) bookingModal.classList.remove('hidden');
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.classList.add('hidden');
}

function updateBookingPricePreview() {
  const checkin = document.getElementById('checkin')?.value;
  const checkout = document.getElementById('checkout')?.value;
  const previewText = document.getElementById('price-preview-text');
  if (!previewText) return;
  const lang = getCurrentLanguage();
  if (checkin && checkout && currentRoom.price) {
    const nights = calculateNights(checkin, checkout);
    if (nights > 0) {
      const total = currentRoom.price * nights;
      const deposit = Math.round(total * 0.2);
      previewText.textContent = lang === 'ru' ? 
        `Стоимость: $${total} (${nights} ночей) | Предоплата 20%: $${deposit}` :
        `Total: $${total} (${nights} nights) | 20% deposit: $${deposit}`;
    }
  } else {
    previewText.textContent = translations[lang]['booking.selectDatesForPrice'] || (lang === 'ru' ? 'Выберите даты для расчёта стоимости' : 'Select dates to calculate price');
  }
}

async function updateRegionStatusText() {
  const city = document.getElementById('city-select')?.value;
  const checkin = document.getElementById('checkin')?.value;
  const checkout = document.getElementById('checkout')?.value;
  const regionText = document.getElementById('region-status-text');
  if (!regionText) return;

  if (!city || !checkin || !checkout || !currentRoom.name) {
    regionText.textContent = translations[getCurrentLanguage()]['booking.selectRegionDates'] || 'Выберите город и даты, чтобы увидеть доступность номера.';
    window.currentRegionStatus = null;
    return;
  }

  try {
    const response = await window.api.getRegionStatus(city, checkin, checkout, currentRoom.name);
    const status = response.data || response;
    window.currentRegionStatus = status;
    regionText.classList.remove('text-red-400', 'text-amber-200', 'text-gray-400');
    if (status.overlappingCount >= status.regionLimit) {
      regionText.classList.add('text-red-400');
      regionText.textContent = `Достигнут лимит номеров типа "${currentRoom.name}" на выбранные даты (${status.regionLimit}). Выберите другие даты или номер.`;
    } else {
      regionText.classList.add('text-amber-200');
      regionText.textContent = `Доступно номеров: ${status.regionLimit - status.overlappingCount} из ${status.regionLimit}`;
    }
  } catch (error) {
    regionText.classList.remove('text-red-400', 'text-amber-200', 'text-gray-400');
    regionText.classList.add('text-red-400');
    regionText.textContent = translations[getCurrentLanguage()]['rooms.regionStatusError'] || 'Ошибка проверки статуса номера';
    window.currentRegionStatus = null;
  }
}

function getBookingInputMinDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

function refreshBookingDateInputs() {
  const checkinInput = document.getElementById('checkin');
  const checkoutInput = document.getElementById('checkout');
  const todayStr = getBookingInputMinDate();

  if (checkinInput) {
    checkinInput.min = todayStr;
    if (checkinInput.value && checkinInput.value < todayStr) {
      checkinInput.value = todayStr;
    }
  }

  if (checkoutInput) {
    checkoutInput.min = todayStr;
    if (checkoutInput.value && checkoutInput.value < todayStr) {
      checkoutInput.value = todayStr;
    }
  }

  if (checkinInput && checkoutInput && checkinInput.value) {
    const nextDate = new Date(checkinInput.value);
    nextDate.setDate(nextDate.getDate() + 1);
    checkoutInput.min = nextDate.toISOString().split('T')[0];
    if (checkoutInput.value && checkoutInput.value <= checkinInput.value) {
      checkoutInput.value = checkoutInput.min;
    }
  }
}

function renderBookingRanges(bookings) {
  const lang = getCurrentLanguage();
  const t = translations[lang];
  if (!bookings || bookings.length === 0) {
    return `<p class="text-sm text-emerald-200 mt-3">${t['rooms.noActiveBookings']}</p>`;
  }

  const visibleBookings = bookings.slice(0, 3);
  const moreCount = bookings.length - visibleBookings.length;
  const rangesHtml = visibleBookings.map(b => `
      <li class="text-sm text-gray-300 mt-1">${formatDate(b.checkIn)} — ${formatDate(b.checkOut)}</li>
    `).join('');

  return `
    <div class="mt-4 rounded-2xl border border-amber-500/20 bg-zinc-900 p-4">
      <p class="text-sm text-amber-200 font-semibold">${t['rooms.activeBookingsLabel']}</p>
      <ul class="list-disc list-inside mt-3 text-gray-300">${rangesHtml}</ul>
      ${moreCount > 0 ? `<p class="text-xs text-gray-500 mt-2">+${moreCount} ${t['rooms.moreBookings']}</p>` : ''}
    </div>`;
}

// ==================== ПЛАТЁЖНЫЕ ФУНКЦИИ ====================

async function proceedToPayment() {
  const checkin = document.getElementById('checkin')?.value;
  const checkout = document.getElementById('checkout')?.value;
  const city = document.getElementById('city-select')?.value;
  const lang = getCurrentLanguage();

  if (!checkin || !checkout) { showAlertModal('warning', 'booking.invalidDates'); return; }
  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(checkinDate.getTime()) || isNaN(checkoutDate.getTime())) {
    showAlertModal('warning', 'booking.invalidDates');
    return;
  }

  if (checkinDate < today || checkoutDate < today) {
    showAlertModal('warning', 'booking.pastDates');
    return;
  }

  if (checkinDate >= checkoutDate) {
    showAlertModal('warning', 'booking.checkoutAfterCheckin');
    return;
  }

  const nights = calculateNights(checkin, checkout);
  const totalPrice = currentRoom.price * nights;
  const deposit = Math.round(totalPrice * 0.2);
  const category = currentRoom.category || 'classic';

  // Disable proceed button and show reservation text to prevent double booking
  const proceedBtn = document.querySelector('button[onclick="proceedToPayment()"]');
  const originalText = proceedBtn ? proceedBtn.innerHTML : '';
  if (proceedBtn) {
    proceedBtn.innerHTML = '<span class="inline-block animate-spin">🔄</span> ' + (lang === 'ru' ? 'Бронирование...' : 'Reserving...');
    proceedBtn.disabled = true;
  }

  try {
    const response = await window.api.holdBooking({
      roomName: currentRoom.name,
      roomPrice: currentRoom.price,
      roomCategory: category,
      city,
      checkIn: checkin,
      checkOut: checkout,
      nights,
      totalPrice
    });
    
    pendingBooking = response.data || response;
  } catch (error) {
    if (proceedBtn) {
      proceedBtn.innerHTML = originalText;
      proceedBtn.disabled = false;
    }
    showAlertModal('error', error.message);
    return;
  }

  if (proceedBtn) {
    proceedBtn.innerHTML = originalText;
    proceedBtn.disabled = false;
  }

  document.getElementById('payment-total').textContent = `$${totalPrice}`;
  document.getElementById('payment-deposit').textContent = `$${deposit}`;
  document.getElementById('payment-remaining').textContent = `$${totalPrice - deposit}`;

  await loadSavedCards();

  document.getElementById('payment-processing').classList.add('hidden');
  document.getElementById('payment-success').classList.add('hidden');
  document.getElementById('payment-buttons').classList.remove('hidden');
  document.getElementById('card-number').value = '';
  document.getElementById('card-expiry').value = '';
  document.getElementById('card-cvc').value = '';

  closeBookingModal();
  const paymentModal = document.getElementById('payment-modal');
  if (paymentModal) paymentModal.classList.remove('hidden');
}

async function loadSavedCards() {
  const select = document.getElementById('saved-cards-select');
  if (!select) return;
  const lang = getCurrentLanguage();
  const t = translations[lang];
  select.innerHTML = `<option value="">${t['payment.chooseCardOption'] || (lang === 'ru' ? 'Выбрать карту...' : 'Select card...')}</option>`;
  let cards = [];
  try {
    const response = await window.api.getCards();
    cards = response.data || [];
  } catch (error) {
    cards = [];
  }
  cards.forEach((card, index) => {
    select.innerHTML += `<option value="${card._id || index}">${card.masked} (${card.brand})</option>`;
  });
}

async function closePaymentModal() {
  const modal = document.getElementById('payment-modal');
  if (modal) modal.classList.add('hidden');
  
  if (pendingBooking && pendingBooking._id) {
    try {
      console.log('Releasing booking hold:', pendingBooking._id);
      await window.api.cancelHold(pendingBooking._id);
    } catch (error) {
      console.error('Failed to release booking hold:', error);
    }
    pendingBooking = null;
  }
}

function openRoomBookingsModal(roomName) {
  const lang = getCurrentLanguage();
  const t = translations[lang];
  const bookings = window.roomStatusByName?.[roomName] || [];
  const title = document.getElementById('room-bookings-title');
  const content = document.getElementById('room-bookings-content');
  if (!title || !content) return;

  title.textContent = t['rooms.bookingModalTitle']?.replace('{room}', roomName) || `${roomName} ${t['rooms.activeBookingsTitle']}`;

  if (bookings.length === 0) {
    content.innerHTML = `<p class="text-sm text-emerald-200">${t['rooms.noActiveBookings']}</p>`;
  } else {
    const items = bookings.map(b => `<li class="text-sm text-gray-300">${formatDate(b.checkIn)} — ${formatDate(b.checkOut)}</li>`).join('');
    content.innerHTML = `
      <p class="text-sm text-gray-400 mb-4">${t['rooms.bookingModalSubtitle']}</p>
      <ul class="list-disc list-inside space-y-2">${items}</ul>
    `;
  }

  const modal = document.getElementById('room-bookings-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeRoomBookingsModal() {
  const modal = document.getElementById('room-bookings-modal');
  if (modal) modal.classList.add('hidden');
}

async function processPayment() {
  const lang = getCurrentLanguage();
  const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
  const cardExpiry = document.getElementById('card-expiry').value;
  const cardCvc = document.getElementById('card-cvc').value;
  const savedCardIndex = document.getElementById('saved-cards-select').value;

  // 🔥 Проверка: если не выбрана карта и поля пустые
  // НЕ скрываем payment-modal — alert покажется ПОВЕРХ (z-200 > z-150)
  if (savedCardIndex === '' && (!cardNumber || cardNumber.length < 1)) {
    showAlertModal('warning', 'payment.selectCard');
    return;
  }

  if (savedCardIndex === '') {
    if (cardNumber.length < 16) {
      showAlertModal('warning', 'payment.invalidCardNumber');
      return;
    }
    if (!cardExpiry || !cardCvc) {
      showAlertModal('warning', 'payment.fillCardFields');
      return;
    }
    const brand = cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card';
    await window.api.addCard({ cardNumber, expiry: cardExpiry, brand });
  }

  document.getElementById('payment-buttons').classList.add('hidden');
  document.getElementById('payment-processing').classList.remove('hidden');

  await new Promise(resolve => setTimeout(resolve, 2000));

  document.getElementById('payment-processing').classList.add('hidden');
  document.getElementById('payment-success').classList.remove('hidden');

  const savedBooking = await saveBookingToAPI();
  
  setTimeout(() => {
    closePaymentModal();
    if (savedBooking) {
      showSuccessModal(savedBooking);
    }
  }, 1500);
}

async function saveBookingToAPI() {
  const data = pendingBooking;
  if (!data) return null;

  if (window.api && window.api.isAuthenticated()) {
    try {
      const response = await window.api.confirmHold(data._id);
      console.log('✅ Подтверждено в MongoDB:', response);
      pendingBooking = null; // Clear so closePaymentModal won't release it
      return response.data || response;
    } catch (err) {
      console.error('❌ Ошибка подтверждения в MongoDB:', err.message);
      showCustomAlert('error', 'Ошибка подтверждения: ' + err.message);
      return null;
    }
  }
  return null;
}

function showSuccessModal(savedBooking) {
  const lang = getCurrentLanguage();
  const t = translations[lang];
  const data = savedBooking || pendingBooking;
  if (!data) return;
  
  const detailsHTML = `
    <p><strong>${t['booking.cityLabel'] || 'Город'}:</strong> ${data.city}</p>
    <p><strong>${t['booking.roomLabel'] || 'Номер'}:</strong> ${data.roomName}</p>
    <p><strong>${t['booking.checkinLabel'] || 'Заезд'}:</strong> ${formatDate(data.checkIn)}</p>
    <p><strong>${t['booking.checkoutLabel'] || 'Выезд'}:</strong> ${formatDate(data.checkOut)}</p>
    <p style="color: #9ca3af; margin-top: 8px;"><strong>${t['booking.nightsLabel'] || (lang === 'ru' ? 'Ночей' : 'Nights')}:</strong> ${data.nights}</p>
    <p style="color: #fbbf24; margin-top: 12px;"><strong>${t['booking.totalPrice'] || 'Общая стоимость'}:</strong> $${data.totalPrice}</p>
    <p style="color: #4ade80; margin-top: 4px;"><strong>${t['payment.paid'] || 'Оплачено (20%)'}:</strong> $${Math.round((data.totalPrice || 0) * 0.2)}</p>
  `;
  
  const successDetails = document.getElementById('success-details');
  if (successDetails) successDetails.innerHTML = detailsHTML;
  
  const successModal = document.getElementById('success-modal');
  if (successModal) successModal.classList.remove('hidden');
}

function closeSuccessModal() {
  const modal = document.getElementById('success-modal');
  if (modal) modal.classList.add('hidden');
}

function renderBookingRanges(bookings) {
  const lang = getCurrentLanguage();
  const t = translations[lang];
  if (!bookings || bookings.length === 0) {
    return `<p class="text-sm text-emerald-200 mt-3">${t['rooms.noActiveBookings']}</p>`;
  }

  const visibleBookings = bookings.slice(0, 3);
  const moreCount = bookings.length - visibleBookings.length;
  const rangesHtml = visibleBookings.map(b => `
      <li class="text-sm text-gray-300 mt-1">${formatDate(b.checkIn)} — ${formatDate(b.checkOut)}</li>
    `).join('');

  return `
    <div class="mt-4 rounded-2xl border border-amber-500/20 bg-zinc-900 p-4">
      <p class="text-sm text-amber-200 font-semibold">${t['rooms.activeBookingsLabel']}</p>
      <ul class="list-disc list-inside mt-3 text-gray-300">${rangesHtml}</ul>
      ${moreCount > 0 ? `<p class="text-xs text-gray-500 mt-2">+${moreCount} ${t['rooms.moreBookings']}</p>` : ''}
    </div>`;
}

async function renderRooms() {
  const lang = getCurrentLanguage();
  const bookText = translations[lang]['rooms.book'] || 'Забронировать';
  
  let roomsByCategory = { vip: [], classic: [], cheap: [] };
  
  let roomStatusByName = {};

  if (window.api) {
    try {
      const res = await window.api.getRooms();
      const dbRooms = res.data || [];
      if (dbRooms.length > 0) {
        const statusPromises = dbRooms.map(async (r) => {
          try {
            const result = await window.api.getRoomBookings(r.name);
            return { name: r.name, bookings: result.data?.bookings || [] };
          } catch (error) {
            return { name: r.name, bookings: [] };
          }
        });

        const statusResults = await Promise.all(statusPromises);
        roomStatusByName = Object.fromEntries(statusResults.map(item => [item.name, item.bookings]));

        dbRooms.forEach(r => {
          if (!roomsByCategory[r.category]) roomsByCategory[r.category] = [];
          roomsByCategory[r.category].push({
            name: r.name,
            price: r.price,
            size: r.size || '',
            img: r.imageUrl || r.image || '',
            description: r.description || '',
            category: r.category || 'classic'
          });
        });
      } else {
        roomsByCategory = roomsData; // Fallback
      }
    } catch (e) {
      console.error('Failed to fetch rooms', e);
      roomsByCategory = roomsData; // Fallback
    }
  } else {
    roomsByCategory = roomsData; // Fallback
  }

  ['vip', 'classic', 'cheap'].forEach(cat => {
    const container = document.getElementById(`${cat}-rooms`);
    if (!container || !roomsByCategory[cat]) return;
    
    if (roomsByCategory[cat].length === 0) {
      container.innerHTML = `<p class="text-gray-500">${translations[lang]['rooms.noRoomsAvailable'] || 'Нет доступных номеров в этой категории'}</p>`;
      return;
    }

    const t = translations[lang];
    const regionStatusHtml = window.currentRegionStatus ?
      `<p class="text-sm text-amber-200 mt-4">${translations[lang]['rooms.regionOccupied']
        .replace('{city}', window.currentRegionStatus.city)
        .replace('{count}', window.currentRegionStatus.overlappingCount)
        .replace('{limit}', window.currentRegionStatus.regionLimit)}</p>` :
      `<p class="text-sm text-gray-400 mt-4">${translations[lang]['rooms.noRegionData']}</p>`;

    container.innerHTML = roomsByCategory[cat].map(room => {
      const bookedRanges = roomStatusByName[room.name] || [];
      const bookingText = renderBookingRanges(bookedRanges);

      return `
      <div class="room-card bg-zinc-800 rounded-3xl overflow-hidden shadow-lg shadow-black/20">
        <div style="overflow: hidden;"><img src="${room.img || '/assets/images/VIProom1.png'}" class="w-full h-64 object-cover" alt="${room.name}" onerror="this.style.display='none'; this.parentElement.classList.add('h-64','bg-zinc-700');"></div>
        <div class="p-7">
          <h3 class="text-2xl font-semibold title-font">${room.name}</h3>
          <p class="text-amber-400 text-2xl font-medium mt-2">$${room.price} <span class="text-sm text-gray-400">${t['rooms.perNight']}</span></p>
          <p class="text-sm text-gray-400 mt-1">${room.size || ''}</p>
          <p class="text-sm text-gray-500 mt-2">${room.description || ''}</p>
          ${bookingText}
          ${regionStatusHtml}
          <button onclick="openBookingModal('${room.name}', ${room.price}, '${room.category || cat}')" class="book-btn mt-6 w-full py-4 border border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-black rounded-2xl transition font-medium">${bookText}</button>
        </div>
      </div>`;
    }).join('');
  });
}

document.addEventListener('input', (e) => {
  if (e.target.id === 'card-expiry') {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'checkin' || e.target.id === 'checkout') {
    updateBookingPricePreview();
    updateRegionStatusText();
  }
  if (e.target.id === 'city-select') {
    updateRegionStatusText();
  }
});

const originalSwitchLanguage = window.switchLanguage;
window.switchLanguage = function(lang) {
  if (originalSwitchLanguage) originalSwitchLanguage(lang);
  const roomsModal = document.getElementById('rooms-modal');
  if (roomsModal && !roomsModal.classList.contains('hidden')) renderRooms();
};
