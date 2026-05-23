async function loadHistory() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `<div class="text-center py-20"><div class="text-4xl animate-bounce">🔄</div></div>`;

  try {
    const result = await api('/history');
    const successful = result.data?.successful || [];
    const unsuccessful = result.data?.unsuccessful || [];

    content.innerHTML = `
      <div class="animate-fade-in-down">
        <h2 class="text-3xl font-bold title-font mb-8">📜 ${tr('history')}</h2>
        
        <!-- ✅ Успешные заказы -->
        <div class="mb-10">
          <h3 class="text-xl font-semibold mb-4 text-green-400">✅ ${tr('successful')} (${successful.length})</h3>
          <div class="space-y-4">
            ${successful.length === 0 ? `<p class="text-gray-500 text-center py-8">${tr('noData')}</p>` : 
              successful.map(item => {
                const b = item.booking || item;
                const co = item.checkout || {};
                return `
                <div class="bg-zinc-900 rounded-2xl p-6 border border-white/5">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <p class="text-lg font-semibold">${b.roomName || '—'}</p>
                        <span class="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">✅ ${tr('completed')}</span>
                      </div>
                      <p class="text-sm text-gray-400">👤 ${b.user?.firstName || '—'} ${b.user?.lastName || ''} (${b.user?.email || ''})</p>
                      <p class="text-sm text-gray-400">📅 ${new Date(b.checkIn).toLocaleDateString()} → ${new Date(b.checkOut).toLocaleDateString()} | 📍 ${b.city || ''}</p>
                      <p class="text-sm text-gray-400 mt-2">💰 ${tr('roomCost')}: $${co.roomTotal || b.totalPrice || 0}</p>
                      ${co.services && co.services.length > 0 ? `
                        <div class="mt-2">
                          <p class="text-xs text-gray-500 mb-1">📦 ${tr('services')}:</p>
                          ${co.services.map(s => `<p class="text-xs text-gray-400">• ${s.name}: $${s.price} ×${s.quantity || 1}</p>`).join('')}
                        </div>
                      ` : ''}
                      <p class="text-sm font-semibold text-amber-400 mt-2">💵 ${tr('total')}: $${co.grandTotal || b.totalPrice || 0}</p>
                      <p class="text-xs text-gray-500 mt-2">${tr('closedBy')} ${co.closedByName || item.closedByName || 'Admin'} • ${new Date(co.closedAt || item.closedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              `}).join('')
            }
          </div>
        </div>

        <!-- ❌ Неуспешные заказы -->
        <div>
          <h3 class="text-xl font-semibold mb-4 text-red-400">❌ ${tr('unsuccessful')} (${unsuccessful.length})</h3>
          <div class="space-y-4">
            ${unsuccessful.length === 0 ? `<p class="text-gray-500 text-center py-8">${tr('noData')}</p>` : 
              unsuccessful.map(b => `
                <div class="bg-zinc-900 rounded-2xl p-6 border border-white/5">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <p class="text-lg font-semibold">${b.roomName || '—'}</p>
                        <span class="px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">❌ ${tr('cancelled')}</span>
                      </div>
                      <p class="text-sm text-gray-400">👤 ${b.user?.firstName || '—'} ${b.user?.lastName || ''} (${b.user?.email || ''})</p>
                      <p class="text-sm text-gray-400">📅 ${new Date(b.checkIn).toLocaleDateString()} → ${new Date(b.checkOut).toLocaleDateString()} | 📍 ${b.city || ''}</p>
                      <p class="text-sm text-gray-400 mt-2">💰 $${b.totalPrice || 0}</p>
                      ${b.cancelReason ? `<p class="text-sm text-red-400 mt-2">📝 ${tr('reason')}: ${b.cancelReason}</p>` : ''}
                      <p class="text-xs text-gray-500 mt-2">${tr('cancelledBy')} ${b.cancelledByName || 'Admin'} • ${new Date(b.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-400 text-center py-20">❌ ${error.message}</p>`;
  }
}