function loadSettings() {
  document.getElementById('tab-content').innerHTML = `
    <div class="animate-fade-in-down max-w-2xl">
      <h2 class="text-3xl font-bold title-font mb-8">⚙️ ${tr('settings')}</h2>
      <div class="bg-zinc-900 rounded-2xl p-6 border border-white/5">
        <h3 class="text-lg font-semibold mb-4">ℹ️ ${tr('systemInfo')}</h3>
        <div class="space-y-2 text-sm">
          <p class="text-gray-400">${tr('version')}: <span class="text-white">1.0.0</span></p>
          <p class="text-gray-400">${tr('apiEndpoint')}: <span class="text-white">http://localhost:3001/api/admin</span></p>
          <p class="text-gray-400">${tr('mongoDb')}: <span class="text-white">luxury-haven</span></p>
        </div>
      </div>
    </div>
  `;
}