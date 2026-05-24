async function loadAccounting() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `<div class="text-center py-20"><div class="text-4xl animate-bounce">🔄</div></div>`;

  try {
    const result = await api('/accounting/summary');
    const data = result.data;

    content.innerHTML = `
      <div class="animate-fade-in-down">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold title-font">💰 ${tr('accounting')}</h2>
          <button onclick="exportCSV()" class="px-6 py-3 border border-amber-400/50 text-amber-400 rounded-2xl font-semibold btn-hover">📥 ${tr('export')}</button>
        </div>

        <!-- Основная статистика -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5">
            <p class="text-gray-400 text-sm mb-2">💰 ${tr('revenue')}</p>
            <p class="text-4xl font-bold text-amber-400">$${data.totalRevenue.toLocaleString()}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5">
            <p class="text-gray-400 text-sm mb-2">📋 ${tr('totalBookings')}</p>
            <p class="text-4xl font-bold">${data.totalBookings}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5">
            <p class="text-gray-400 text-sm mb-2">✅ ${tr('completed')}</p>
            <p class="text-4xl font-bold text-green-400">${data.completedBookings || data.activeBookings || 0}</p>
          </div>
          <div class="stat-card bg-zinc-900 rounded-2xl p-6 border border-white/5">
            <p class="text-gray-400 text-sm mb-2">❌ ${tr('cancelled')}</p>
            <p class="text-4xl font-bold text-red-400">${data.cancelledBookings || 0}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <!-- По категориям номеров -->
          <div class="bg-zinc-900 rounded-2xl p-6">
            <h3 class="text-lg font-semibold mb-4">📊 ${tr('byCategory')}</h3>
            <div class="space-y-3">
              <div class="flex justify-between"><span>👑 ${tr('category.vip')}</span><span>${data.byCategory?.vip || 0}</span></div>
              <div class="w-full bg-zinc-800 rounded-full h-2"><div class="bg-amber-500 h-2 rounded-full" style="width:${(data.byCategory?.vip / (data.totalBookings || 1) * 100) || 0}%"></div></div>
              <div class="flex justify-between"><span>⭐ ${tr('category.classic')}</span><span>${data.byCategory?.classic || 0}</span></div>
              <div class="w-full bg-zinc-800 rounded-full h-2"><div class="bg-blue-500 h-2 rounded-full" style="width:${(data.byCategory?.classic / (data.totalBookings || 1) * 100) || 0}%"></div></div>
              <div class="flex justify-between"><span>🏠 ${tr('category.cheap')}</span><span>${data.byCategory?.cheap || 0}</span></div>
              <div class="w-full bg-zinc-800 rounded-full h-2"><div class="bg-gray-500 h-2 rounded-full" style="width:${(data.byCategory?.cheap / (data.totalBookings || 1) * 100) || 0}%"></div></div>
            </div>
          </div>

          <!-- По городам -->
          <div class="bg-zinc-900 rounded-2xl p-6">
            <h3 class="text-lg font-semibold mb-4">📍 ${tr('byCity')}</h3>
            ${Object.entries(data.byCity || {}).length > 0 ? 
              Object.entries(data.byCity).map(([c, n]) => `<div class="flex justify-between p-2 bg-zinc-800/50 rounded-lg"><span>${c}</span><span>${n}</span></div>`).join('') :
              `<p class="text-gray-500 text-center py-4">${tr('noData')}</p>`
            }
          </div>
        </div>

        <!-- 🔥 Доходы по услугам -->
        <div class="bg-zinc-900 rounded-2xl p-6">
          <h3 class="text-lg font-semibold mb-4">📦 ${tr('incomeByServices')}</h3>
          <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            ${[
              { icon: '🍽️', key: 'restaurant', label: tr('restaurant') },
              { icon: '🍸', key: 'bar', label: tr('bar') },
              { icon: '💆', key: 'spa', label: tr('spa') },
              { icon: '🚗', key: 'transfer', label: tr('transfer') },
              { icon: '🧺', key: 'laundry', label: tr('laundry') },
              { icon: '🏞️', key: 'excursion', label: tr('excursion') }
            ].map(s => `
              <div class="stat-card bg-zinc-800 rounded-2xl p-4 text-center border border-white/5">
                <p class="text-2xl mb-2">${s.icon}</p>
                <p class="text-xs text-gray-400 mb-1">${s.label}</p>
                <p class="text-lg font-bold text-amber-400">$${(data.serviceIncome?.[s.key] || 0).toLocaleString()}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-400 text-center py-20">❌ ${error.message}</p>`;
  }
}

function exportCSV() {
  (async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${API_URL}/accounting/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        let data;
        try { data = await res.json(); } catch(e) { }
        throw new Error((data && (data.error || data.message)) || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0,10);
      a.download = `bookings-export-${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      showAlert('error', error.message || 'Ошибка экспорта');
    }
  })();
}