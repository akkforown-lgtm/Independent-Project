async function loadRooms() {
  const content = document.getElementById('tab-content');
  content.innerHTML = `<div class="text-center py-20"><div class="text-4xl animate-bounce">🔄</div></div>`;

  try {
    const result = await api('/rooms');
    const regionsResult = await getRegionLimits();
    const regionLimits = regionsResult.data || [];
    const rooms = result.data || [];

    const vipRooms = rooms.filter(r => r.category === 'vip');
    const classicRooms = rooms.filter(r => r.category === 'classic');
    const cheapRooms = rooms.filter(r => r.category === 'cheap');

    const getRoomImage = (room) => room.imageUrl || room.image || '';
    const renderRoomCard = (room) => `
      <div class="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 stat-card flex flex-col">
        <div class="aspect-[3/2] bg-zinc-800 overflow-hidden">
          <img src="${getRoomImage(room)}" class="w-full h-full object-cover" onerror="this.parentElement.textContent='🏨'">
        </div>
        <div class="p-5 flex-1 flex flex-col">
          <div class="flex justify-between items-start mb-2 gap-3">
            <h3 class="text-lg font-semibold truncate">${room.name}</h3>
            <span class="px-2 py-0.5 text-xs rounded-full ${room.category === 'vip' ? 'bg-amber-500/20 text-amber-400' : room.category === 'classic' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}">${tr(`category.${room.category}`)}</span>
          </div>
          <div class="mt-auto">
            <p class="text-amber-400 text-xl font-bold">$${room.price} <span class="text-sm text-gray-400">${tr('perNight')}</span></p>
            <p class="text-sm text-gray-400 mt-1">${room.size || ''}</p>
            <div class="flex flex-col sm:flex-row gap-2 mt-4">
              <button onclick="openRoomForm('${room._id}')" class="w-full sm:flex-1 py-2 border border-amber-400/50 text-amber-400 rounded-xl hover:bg-amber-400/10 transition text-sm">✏️ ${tr('edit')}</button>
              <button onclick="deleteRoom('${room._id}')" class="w-full sm:flex-1 py-2 border border-red-400/30 text-red-400 rounded-xl hover:bg-red-400/10 transition text-sm">🗑️ ${tr('delete')}</button>
            </div>
          </div>
        </div>
      </div>`;

    const regionSection = regionLimits.length > 0 ? `
      <div class="mb-10">
        <h3 class="text-2xl font-semibold mb-4 text-amber-400">${tr('regionLimitTitle')}</h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          ${regionLimits.map(region => `
            <div class="bg-zinc-900 rounded-2xl p-5 border border-white/10">
              <div class="text-sm text-gray-400 mb-2">${region.city}</div>
              <div class="text-3xl font-bold text-amber-400">${region.maxBookings}</div>
              <div class="text-xs text-gray-500 mt-2">${tr('maxConcurrentBookings')}</div>
              <button onclick="editRegionLimit('${region.city}', ${region.maxBookings})" class="mt-4 w-full py-2 border border-amber-400/30 text-amber-400 rounded-xl hover:bg-amber-400/10 transition text-sm">${tr('editRegion')}</button>
            </div>`).join('')}
        </div>
      </div>` : '';

    content.innerHTML = `
      <div class="animate-fade-in-down">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold title-font">🏨 ${tr('rooms')} (${rooms.length})</h2>
          <button onclick="openRoomForm()" class="px-6 py-3 bg-amber-500 text-black rounded-2xl font-semibold btn-hover">+ ${tr('add')}</button>
        </div>
        ${regionSection}
        <div class="mb-10">
          <h3 class="text-2xl font-semibold mb-4 text-amber-400">${tr('vipRoomsTitle', {count: vipRooms.length})}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${vipRooms.map(renderRoomCard).join('') || `<p class="text-gray-500">${tr('noRooms')}</p>`}
          </div>
        </div>

        <div class="mb-10">
          <h3 class="text-2xl font-semibold mb-4 text-blue-400">${tr('classicRoomsTitle', {count: classicRooms.length})}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${classicRooms.map(renderRoomCard).join('') || `<p class="text-gray-500">${tr('noRooms')}</p>`}
          </div>
        </div>

        <div class="mb-10">
          <h3 class="text-2xl font-semibold mb-4 text-gray-400">${tr('economyRoomsTitle', {count: cheapRooms.length})}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${cheapRooms.map(renderRoomCard).join('') || `<p class="text-gray-500">${tr('noRooms')}</p>`}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<p class="text-red-400 text-center py-20">❌ ${error.message}</p>`;
  }
}

function openRoomForm(id = null) {
  const isEdit = !!id;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 modal-overlay flex items-center justify-center z-[200]';
  modal.id = 'room-form-modal';
  modal.innerHTML = `
    <div class="bg-zinc-900 rounded-3xl max-w-lg w-full mx-4 p-8 animate-scale-in">
      <h3 class="text-2xl font-semibold mb-6">${isEdit ? '✏️ ' + tr('edit') : '➕ ' + tr('add')}</h3>
      <div class="space-y-4">
        <input id="room-name" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${tr('name')}">
        <select id="room-category" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition">
          <option value="vip">${tr('category.vip')}</option><option value="classic" selected>${tr('category.classic')}</option><option value="cheap">${tr('category.cheap')}</option>
        </select>
        <input id="room-price" type="number" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${tr('price')} ($)">
        <input id="room-size" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${tr('size')}">
        <div>
          <label class="block text-sm mb-2">${tr('image')}</label>
          <input type="file" id="room-image-file" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-amber-500 file:text-black file:font-medium hover:file:bg-amber-600 transition">
          <input type="hidden" id="room-image-url">
          <div id="image-preview" class="mt-2 hidden"><img src="" class="h-32 rounded-xl object-cover"></div>
        </div>
        <textarea id="room-desc" class="w-full px-4 py-3 bg-zinc-800 border border-white/20 rounded-2xl focus:border-amber-400 transition" placeholder="${tr('description')}" rows="2"></textarea>
        <div class="flex gap-3">
          <button onclick="document.getElementById('room-form-modal').remove()" class="flex-1 py-3 border border-white/30 rounded-2xl hover:bg-white/5 transition">${tr('cancel')}</button>
          <button onclick="saveRoom(${id ? `'${id}'` : 'null'})" class="flex-1 py-3 bg-amber-500 text-black rounded-2xl font-semibold btn-hover">${tr('save')}</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('room-image-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        document.getElementById('image-preview').classList.remove('hidden');
        document.getElementById('image-preview').querySelector('img').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  if (isEdit) {
    api('/rooms').then(res => {
      const room = res.data.find(r => r._id === id);
      if (room) {
        document.getElementById('room-name').value = room.name || '';
        document.getElementById('room-category').value = room.category || 'classic';
        document.getElementById('room-price').value = room.price || '';
        const imageUrl = room.imageUrl || room.image || '';
        document.getElementById('room-size').value = room.size || '';
        document.getElementById('room-image-url').value = imageUrl;
        document.getElementById('room-desc').value = room.description || '';
        if (imageUrl) {
          document.getElementById('image-preview').classList.remove('hidden');
          document.getElementById('image-preview').querySelector('img').src = imageUrl;
        }
      }
    });
  }
}

async function saveRoom(id) {
  const fileInput = document.getElementById('room-image-file');
  const file = fileInput?.files[0];
  let imageUrl = document.getElementById('room-image-url').value;

  if (file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) imageUrl = data.imageUrl;
    } catch (e) { console.error('Upload error:', e); }
  }

  const roomData = {
    name: document.getElementById('room-name').value,
    category: document.getElementById('room-category').value,
    price: Number(document.getElementById('room-price').value),
    size: Number(document.getElementById('room-size').value),
    imageUrl,
    description: document.getElementById('room-desc').value
  };

  if (!roomData.name || !roomData.price) { showAlert('warning', tr('roomNamePriceRequired')); return; }
  
  try {
    if (id) { await api(`/rooms/${id}`, 'PUT', roomData); }
    else { await api('/rooms', 'POST', roomData); }
    document.getElementById('room-form-modal')?.remove();
    showAlert('success', id ? tr('roomUpdated') : tr('roomAdded'));
    loadRooms();
  } catch (error) { showAlert('error', error.message); }
}

async function editRegionLimit(city, currentLimit) {
  const value = prompt(tr('setRegionLimit', { city }), currentLimit);
  if (value === null) return;
  const limit = Number(value);
  if (!limit || limit < 1) {
    showAlert('warning', tr('limitMustBePositive'));
    return;
  }
  try {
    await updateRegionLimit(city, { maxBookings: limit });
    showAlert('success', tr('regionLimitChanged', { city, limit }));
    loadRooms();
  } catch (error) {
    showAlert('error', error.message);
  }
}

async function deleteRoom(id) {
  if (!confirm(tr('confirmDeleteRoom'))) return;
  try { await api(`/rooms/${id}`, 'DELETE'); showAlert('success', tr('roomDeleted')); loadRooms(); }
  catch (error) { showAlert('error', error.message); }
}
