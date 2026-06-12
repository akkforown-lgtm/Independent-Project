async function loadBookings() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `<div class="text-center py-20"><div class="text-4xl animate-bounce">🔄</div></div>`;

  try {
    const result = await api('/bookings');
    const allBookings = result.data || [];
    
    // 🔥 Фильтруем: НЕ показываем cancelled, rejected и completed (они в History)
    const bookings = allBookings.filter(b => b.status !== 'cancelled' && b.status !== 'rejected' && b.status !== 'completed');

    content.innerHTML = `
      <div class="animate-fade-in-down">
        <h2 class="text-3xl font-bold title-font mb-8">📋 ${tr('bookings')} (${bookings.length})</h2>
        <div class="space-y-4">
          ${bookings.map(b => {
            const cr = b.changeRequest;
            const isPendingRequest = b.status === 'pending_change' || b.status === 'pending_cancellation';
            const showApproved = b.approvalStatus === 'approved' && b.status === 'active';
            const showRejected = b.approvalStatus === 'rejected' && b.status === 'active';
            
            return `
            <div class="bg-zinc-900 rounded-2xl p-6 border border-white/5" id="booking-card-${b._id}">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <p class="text-lg font-semibold">${b.roomName}</p>
                    <span class="px-2 py-0.5 text-xs rounded-full ${b.status === 'active' ? 'bg-green-500/20 text-green-400' : b.status === 'changed' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}">${b.status}</span>
                  </div>
                  <p class="text-sm text-gray-400">👤 ${b.user?.firstName || '—'} ${b.user?.lastName || ''} (${b.user?.email || ''})</p>
                  <p class="text-sm text-gray-400">📅 ${new Date(b.checkIn).toLocaleDateString()} → ${new Date(b.checkOut).toLocaleDateString()} | 📍 ${b.city}</p>
                  <p class="text-sm text-gray-400">💰 $${b.totalPrice} | ${tr('nights')}: ${b.nights}</p>
                  
                  <div id="request-area-${b._id}">
                    ${isPendingRequest ? `
                      <div class="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p class="text-amber-400 text-sm">🔄 ${tr('request')}: ${b.status === 'pending_cancellation' ? tr('cancelRequest') : tr('changeRequest')}</p>
                        <div class="flex gap-2 mt-2" id="action-buttons-${b._id}">
                          <button onclick="approveChange('${b._id}')" class="px-4 py-1.5 bg-green-500 text-black text-xs rounded-lg font-medium btn-hover">✅ ${tr('approve')}</button>
                          <button onclick="openRejectChange('${b._id}')" class="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg font-medium btn-hover">❌ ${tr('reject')}</button>
                        </div>
                      </div>
                    ` : ''}
                    ${showApproved ? `<div class="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl"><p class="text-green-400 text-sm">✅ ${tr('approvedBy')} ${b.approvedBy || 'Admin'}</p></div>` : ''}
                    ${showRejected ? `<div class="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"><p class="text-red-400 text-sm">❌ ${tr('rejectedBy')} ${b.approvedBy || 'Admin'}${b.approvalNotes ? ` - ${b.approvalNotes}` : ''}</p></div>` : ''}
                  </div>
                  
                  <div class="flex gap-2 mt-3">
                    <button onclick="openCheckout('${b._id}', ${b.totalPrice || 0})" class="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm btn-hover">🛎️ ${tr('checkout')}</button>
                    <button onclick="openCancelOrder('${b._id}')" class="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl text-sm btn-hover">🗑️ ${tr('cancelOrder')}</button>
                  </div>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-400 text-center py-20">❌ ${error.message}</p>`;
  }
}

// 🔥 После approve/reject — перезагружаем список из БД
async function approveChange(id) {
  try {
    await api(`/bookings/${id}/approve`, 'PUT');
    showAlert('success', tr('changesApproved'));
    loadBookings(); // 🔥 Перезагружаем ВЕСЬ список из БД
  } catch(e) { showAlert('error', e.message); }
}

function openRejectChange(bookingId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 modal-overlay flex items-center justify-center z-[200]';
  modal.id = 'reject-change-modal';
  modal.innerHTML = `
    <div class="bg-zinc-900 rounded-3xl max-w-md w-full mx-4 p-8 text-center animate-scale-in">
      <div class="text-5xl mb-4">❌</div>
      <h3 class="text-2xl font-semibold mb-3">${tr('reject')}</h3>
      <textarea id="reject-reason" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition mb-4" placeholder="${tr('reason')}" rows="3"></textarea>
      <div class="flex gap-3">
        <button onclick="document.getElementById('reject-change-modal').remove()" class="flex-1 py-3 border border-white/30 rounded-2xl hover:bg-white/5 transition">${tr('cancel')}</button>
        <button onclick="confirmRejectChange('${bookingId}')" class="flex-1 py-3 bg-red-500 text-white rounded-2xl font-semibold btn-hover">${tr('reject')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmRejectChange(id) {
  const reason = document.getElementById('reject-reason')?.value || tr('defaultReason');
  try {
    await api(`/bookings/${id}/reject`, 'PUT', { reason });
    document.getElementById('reject-change-modal')?.remove();
    showAlert('success', tr('requestRejected'));
    loadBookings();
  } catch(e) { showAlert('error', e.message); }
}

// 🔥 ОТМЕНА ЗАКАЗА АДМИНОМ
function openCancelOrder(bookingId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 modal-overlay flex items-center justify-center z-[200]';
  modal.id = 'cancel-order-modal';
  modal.innerHTML = `
    <div class="bg-zinc-900 rounded-3xl max-w-md w-full mx-4 p-8 text-center animate-scale-in">
      <div class="text-5xl mb-4">🗑️</div>
      <h3 class="text-2xl font-semibold mb-3">${tr('cancelOrder')}</h3>
      <p class="text-gray-400 mb-4 text-sm">${tr('actionCannotBeUndone')}</p>
      <textarea id="cancel-reason" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition mb-4" placeholder="${tr('cancelReason')}" rows="3"></textarea>
      <div class="flex gap-3">
        <button onclick="document.getElementById('cancel-order-modal').remove()" class="flex-1 py-3 border border-white/30 rounded-2xl hover:bg-white/5 transition">${tr('cancel')}</button>
        <button onclick="confirmCancelOrder('${bookingId}')" class="flex-1 py-3 bg-red-500 text-white rounded-2xl font-semibold btn-hover">${tr('cancelOrder')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function confirmCancelOrder(bookingId) {
  const reason = document.getElementById('cancel-reason')?.value || '';
  try {
    await api(`/bookings/${bookingId}/cancel-by-admin`, 'PUT', { reason });
    document.getElementById('cancel-order-modal')?.remove();
    showAlert('success', tr('orderCancelled'));
    loadBookings();
  } catch(e) { showAlert('error', e.message); }
}

// 🔥 CHECKOUT
function openCheckout(bookingId, roomTotal) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 modal-overlay flex items-center justify-center z-[200]';
  modal.id = 'checkout-modal';
  modal.innerHTML = `
    <div class="bg-zinc-900 rounded-3xl max-w-2xl w-full mx-4 p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-semibold">🛎️ ${tr('checkout')}</h3>
        <button onclick="document.getElementById('checkout-modal').remove()" class="text-3xl text-gray-400 hover:text-white transition">×</button>
      </div>
      <div id="checkout-content"><p class="text-center text-gray-400 py-8">${tr('loading')}</p></div>
      <div class="flex gap-3 mt-6" id="checkout-buttons">
        <button onclick="document.getElementById('checkout-modal').remove()" class="flex-1 py-3 border border-white/30 rounded-2xl hover:bg-white/5 transition">${tr('cancel')}</button>
        <button onclick="submitCheckout('${bookingId}')" class="flex-1 py-3 bg-amber-500 text-black rounded-2xl font-semibold btn-hover">${tr('save')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  api(`/checkout/${bookingId}`).then(res => {
    const data = res.data;
    const booking = data.booking;
    const checkout = data.checkout;
    
    document.getElementById('checkout-content').innerHTML = `
      <div class="space-y-5">
        <div class="bg-zinc-800 rounded-2xl p-5">
          <p class="text-xl font-semibold">${booking.roomName}</p>
          <p class="text-sm text-gray-400 mt-1">👤 ${booking.user?.firstName || ''} ${booking.user?.lastName || ''}</p>
          <p class="text-sm text-gray-400">📅 ${new Date(booking.checkIn).toLocaleDateString()} → ${new Date(booking.checkOut).toLocaleDateString()}</p>
          <p class="text-amber-400 text-xl font-bold mt-2">${tr('roomCost')}: $${checkout.roomTotal || booking.totalPrice}</p>
          <input type="hidden" id="room-total-value" value="${checkout.roomTotal || booking.totalPrice}">
        </div>
        <div>
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-lg font-semibold">📦 ${tr('services')}</h4>
            <button onclick="addServiceRow()" class="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-xl text-sm hover:bg-amber-500/30 transition">+ ${tr('addService')}</button>
          </div>
          
          <div class="flex gap-2 text-xs text-gray-400 mb-2 px-3">
             <div class="w-24">${tr('categoryLabel')}</div>
             <div class="flex-1">${tr('name')}</div>
             <div class="w-24 text-right">${tr('price')}</div>
             <div class="w-3"></div>
             <div class="w-14 text-center">${tr('quantity')}</div>
             <div class="w-4"></div>
          </div>
          
          <div id="services-list" class="space-y-3">
            ${(checkout.services || []).map((s, i) => `
              <div class="flex gap-2 items-center bg-zinc-800 rounded-xl p-3 service-row">
                <select class="service-cat w-24 px-2 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm" title="${tr('categoryLabel')}">
                  ${['restaurant','bar','spa','transfer','laundry','excursion','other'].map(cat => `
                    <option value="${cat}" ${s.category === cat ? 'selected' : ''}>${cat === 'restaurant' ? '🍽️' : cat === 'bar' ? '🍸' : cat === 'spa' ? '💆' : cat === 'transfer' ? '🚗' : cat === 'laundry' ? '🧺' : cat === 'excursion' ? '🏞️' : '📦'} ${tr(cat)}</option>
                  `).join('')}
                </select>
                <input class="service-name flex-1 px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm" placeholder="${tr('name')}" value="${s.name || ''}" title="${tr('name')}">
                <input class="service-price w-24 px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm text-right" type="number" placeholder="${tr('price')}" value="${s.price || ''}" onchange="updateCheckoutTotal()" title="${tr('price')}">
                <span class="text-xs text-gray-400 w-3 text-center">×</span>
                <input class="service-qty w-14 px-2 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm text-center" type="number" placeholder="${tr('quantity')}" value="${s.quantity || 1}" min="1" onchange="updateCheckoutTotal()" title="${tr('quantity')}">
                <button onclick="this.parentElement.remove(); updateCheckoutTotal()" class="text-red-400 hover:text-red-300 text-lg w-4">×</button>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="bg-zinc-800 rounded-2xl p-4 flex justify-between items-center">
          <span class="text-sm">🏷️ ${tr('discount')}</span>
          <input id="checkout-discount" type="number" class="w-28 px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm text-right" value="${checkout.discount || 0}" onchange="updateCheckoutTotal()">
        </div>
        <div class="bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-5">
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">${tr('total')}</span>
            <span class="text-2xl font-bold text-amber-400" id="checkout-total">$${checkout.grandTotal || booking.totalPrice}</span>
          </div>
        </div>
      </div>
    `;
  });
}

function addServiceRow() {
  const list = document.getElementById('services-list');
  const row = document.createElement('div');
  row.className = 'flex gap-2 items-center bg-zinc-800 rounded-xl p-3 service-row animate-fade-in-up';
  row.innerHTML = `
    <select class="service-cat w-24 px-2 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm" title="${tr('categoryLabel')}">
      <option value="restaurant" selected>🍽️ ${tr('restaurant')}</option>
      <option value="bar">🍸 ${tr('bar')}</option>
      <option value="spa">💆 ${tr('spa')}</option>
      <option value="transfer">🚗 ${tr('transfer')}</option>
      <option value="laundry">🧺 ${tr('laundry')}</option>
      <option value="excursion">🏞️ ${tr('excursion')}</option>
      <option value="other">📦 ${tr('other')}</option>
    </select>
    <input class="service-name flex-1 px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm" placeholder="${tr('name')}" title="${tr('name')}">
    <input class="service-price w-24 px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm text-right" type="number" placeholder="${tr('price')}" value="0" onchange="updateCheckoutTotal()" title="${tr('price')}">
    <span class="text-xs text-gray-400 w-3 text-center">×</span>
    <input class="service-qty w-14 px-2 py-2 bg-zinc-700 border border-white/10 rounded-lg text-sm text-center" type="number" value="1" min="1" onchange="updateCheckoutTotal()" title="${tr('quantity')}">
    <button onclick="this.parentElement.remove(); updateCheckoutTotal()" class="text-red-400 hover:text-red-300 text-lg w-4">×</button>
  `;
  list.appendChild(row);
}

function updateCheckoutTotal() {
  let servicesTotal = 0;
  document.querySelectorAll('#services-list > .service-row').forEach(row => {
    const price = Number(row.querySelector('.service-price')?.value || 0);
    const qty = Number(row.querySelector('.service-qty')?.value || 1);
    servicesTotal += price * qty;
  });
  const discount = Number(document.getElementById('checkout-discount')?.value || 0);
  const roomTotal = Number(document.getElementById('room-total-value')?.value || 0);
  const grandTotal = roomTotal + servicesTotal - discount;
  const totalEl = document.getElementById('checkout-total');
  if (totalEl) totalEl.textContent = '$' + (grandTotal > 0 ? grandTotal : 0);
}

async function submitCheckout(bookingId) {
  const services = [];
  document.querySelectorAll('#services-list > .service-row').forEach(row => {
    const cat = row.querySelector('.service-cat')?.value || 'other';
    const name = row.querySelector('.service-name')?.value || '';
    const price = Number(row.querySelector('.service-price')?.value || 0);
    const quantity = Number(row.querySelector('.service-qty')?.value || 1);
    if (name && price > 0) services.push({ category: cat, name, price, quantity });
  });
  
  const discount = Number(document.getElementById('checkout-discount')?.value || 0);

  try {
    const res = await api(`/checkout/${bookingId}`, 'POST', { services, discount, paymentMethod: 'card' });
    document.getElementById('checkout-modal')?.remove();
    showAlert('success', '✅ ' + tr('completed') + '! ' + tr('total') + ': $' + (res.data.checkout?.grandTotal || 0));
    loadBookings();
  } catch (error) {
    showAlert('error', error.message);
  }
}
