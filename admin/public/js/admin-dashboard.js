async function loadDashboard() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `<div class="text-center py-20"><div class="text-4xl animate-bounce">🔄</div></div>`;

  try {
    // Получаем все бронирования
    const bookingsResult = await api('/bookings');
    const bookings = bookingsResult.data || [];
    
    // Получаем статистику из accounting (revenue только от закрытых)
    let accountingData = { totalRevenue: 0, cancelledBookings: 0 };
    try {
      const accResult = await api('/accounting/summary');
      accountingData = accResult.data || accountingData;
    } catch(e) { /* используем запасные значения */ }
    
    const total = bookings.length;
    const active = bookings.filter(b => b.status === 'active').length;
    const pending = bookings.filter(b => 
      (b.status === 'pending_change' || b.status === 'pending_cancellation' || b.approvalStatus === 'pending') && 
      !['cancelled', 'completed', 'rejected'].includes(b.status)
    ).length;
    const cancelled = accountingData.cancelledBookings || bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length;
    const revenue = accountingData.totalRevenue || 0;

    content.innerHTML = `
      <div class="animate-fade-in-down">
        <h2 class="text-3xl font-bold title-font mb-2">📊 ${tr('dashboard')}</h2>
        <p class="text-gray-400 mb-8">${new Date().toLocaleDateString(getLang() === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 mb-10 responsive-stats">
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5 min-h-[140px]">
            <p class="text-gray-400 text-sm mb-3">📋 ${tr('totalBookings')}</p>
            <p class="text-4xl font-bold">${total}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5 min-h-[140px]">
            <p class="text-gray-400 text-sm mb-3">✅ ${tr('activeBookings')}</p>
            <p class="text-4xl font-bold text-green-400">${active}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5 animate-pulse-glow min-h-[140px]">
            <p class="text-gray-400 text-sm mb-3">⏳ ${tr('pendingRequests')}</p>
            <p class="text-4xl font-bold text-amber-400">${pending}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5 min-h-[140px]">
            <p class="text-gray-400 text-sm mb-3">❌ ${tr('cancelled')}</p>
            <p class="text-4xl font-bold text-red-400">${cancelled}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5">
            <p class="text-gray-400 text-sm mb-2">💰 ${tr('revenue')}</p>
            <p class="text-4xl font-bold text-amber-400">$${revenue.toLocaleString()}</p>
          </div>
        </div>

        <!-- Последние бронирования -->
        <div class="bg-zinc-900 rounded-2xl p-6">
          <h3 class="text-lg font-semibold mb-4">📋 ${tr('recentBookings')}</h3>
          <div class="space-y-2">
            ${bookings.slice(0, 5).map(b => `
              <div class="booking-row flex flex-col justify-between p-4 rounded-2xl bg-zinc-800/60 border border-white/5">
                <div class="flex flex-col gap-2">
                  <p class="font-semibold text-lg">${b.roomName || '—'}</p>
                  <p class="text-sm text-gray-400">${b.user?.firstName || ''} ${b.user?.lastName || ''}</p>
                  <p class="text-sm text-gray-400">${b.city || ''} • ${new Date(b.checkIn).toLocaleDateString()}</p>
                </div>
                <div class="mt-4 flex flex-col gap-2 sm:items-end">
                  <span class="inline-flex px-3 py-1 text-xs rounded-full ${b.status === 'active' ? 'bg-green-500/20 text-green-400' : b.status === 'cancelled' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}">${t[getLang()]?.status?.[b.status] || b.status}</span>
                  <p class="text-sm font-semibold">$${b.totalPrice || 0}</p>
                </div>
              </div>
            `).join('')}
            ${bookings.length === 0 ? `<p class="text-gray-500 text-center py-4">${tr('noData')}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-400 text-center py-20">❌ ${error.message}</p>`;
  }
}