# Документация по сценариям клиента и администратора

Дата проверки: 2026-05-26.

Проверенный стек: клиентский Express API на `http://localhost:3000/api`, админский Express API на `http://localhost:3001/api/admin`, MongoDB из локальных `.env`.

## Результат тестирования

Сквозной API-сценарий был проверен локально:

```text
client register: success=true, token=true
client login: success=true, token=true
rooms loaded: count=10, first=Single Room, category=cheap
save card: success=true, cards=1
booking hold: success=true, status=hold, id=6a15594ad0273bdfbaf7b793, expiresAt=true
payment confirm: success=true, status=active
client dashboard bookings: count=1, latestStatus=active
client modify request: success=true, status=pending_change, requestType=modification
admin auth: register=true, login=true
admin sees request: status=pending_change, type=modification
admin approve: success=true, status=active, approvalStatus=approved
client sees admin decision: status=active, approvalStatus=approved, approvedBy=Codex Admin
cancel request + admin reject: requestStatus=pending_cancellation, finalStatus=active, approvalStatus=rejected
```

Также проверено:

```text
GET /api/health -> {"status":"ok","service":"client",...}
GET /api/admin/health -> {"status":"ok","service":"admin"}
node --check по исходным *.js без node_modules -> ошибок синтаксиса нет
```

## 1. Клиент: регистрация

Клиент открывает `Client/public/register.html`, форма вызывает `handleRegister()` из `Client/public/js/auth.js`.

Фронтенд проверяет обязательные поля, длину пароля и формат телефона. После этого вызывает:

```js
await window.api.register({
  firstName: fields.firstName.value,
  lastName: fields.lastName.value,
  email: fields.email.value,
  phone: fullPhone,
  password: fields.password.value
});
```

API-клиент отправляет запрос в `POST /api/auth/register`:

```js
async register(userData) {
  const data = await this.post('/auth/register', userData);
  if (data.token) {
    this.setToken(data.token);
  }
  return data;
}
```

Серверный маршрут находится в `Client/server/routes/auth.js:14`. Он:

- валидирует данные через `validateRegistrationData()`;
- проверяет дубликаты `email` и `phone`;
- создает пользователя;
- выдает JWT на 30 дней;
- возвращает пользователя без пароля.

Ключевой код:

```js
const validation = validateRegistrationData(req.body);
if (!validation.valid) {
  return res.status(400).json({ success: false, error: validation.errors });
}

const user = await User.create({
  firstName,
  lastName,
  email: email.toLowerCase(),
  phone,
  password
});
const token = generateToken(user._id);
res.status(201).json({ success: true, token, user: user.toJSON() });
```

Пароль хешируется в схеме пользователя `shared/schemas/userSchema.js`:

```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

После успешной регистрации фронтенд перенаправляет клиента в `dashboard.html`.

## 2. Клиент: логин

Клиент открывает `Client/public/login.html`, форма вызывает `handleLogin()` из `Client/public/js/auth.js`.

Фронтенд вызывает:

```js
const result = await window.api.login({
  email: email.value,
  password: password.value
});
window.location.href = 'dashboard.html';
```

API-клиент отправляет `POST /api/auth/login`:

```js
async login(credentials) {
  const data = await this.post('/auth/login', credentials);
  if (data.token) {
    this.setToken(data.token);
  }
  return data;
}
```

Серверный маршрут находится в `Client/server/routes/auth.js:86`. Он:

- валидирует email и пароль через `validateLoginData()`;
- ищет пользователя по email;
- сравнивает пароль через `comparePassword()`;
- возвращает JWT.

```js
const user = await User.findOne({ email: email.toLowerCase() });
if (!user) {
  return res.status(401).json({ success: false, error: { email: '...' } });
}

const isMatch = await user.comparePassword(password);
if (!isMatch) {
  return res.status(401).json({ success: false, error: { password: '...' } });
}

const token = generateToken(user._id);
res.json({ success: true, token, user: user.toJSON() });
```

## 3. Доступ к клиентскому дашборду

`Client/public/js/dashboard.js` сначала проверяет JWT:

```js
function checkDashboardAuth() {
  if (!window.api || !window.api.isAuthenticated()) {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return false; }
  }
  return true;
}
```

Потом `loadDashboard()` загружает профиль и бронирования:

```js
const profileData = await window.api.getProfile();
currentUser = profileData.data || profileData;

const response = await window.api.getMyBookings();
bookings = Array.isArray(response) ? response : (response.data || []);
```

Серверный список броней клиента находится в `Client/server/routes/bookings.js:312`:

```js
router.get('/my', protect, async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(bookings);
});
```

Защита `protect` берет JWT из `Authorization: Bearer ...` и привязывает запрос к `req.user`.

## 4. Выбор номера и проверка доступности

Окно номеров открывается через `openRoomsModal()` и `renderRooms()` в `Client/public/js/modals.js:379`.

Фронтенд загружает номера:

```js
const res = await window.api.getRooms();
const dbRooms = res.data || [];
```

Серверный маршрут `GET /api/rooms` находится в `Client/server/routes/rooms.js`:

```js
const rooms = await Room.find({ isAvailable: true }).sort({ category: 1, price: 1 });
res.json({ success: true, data: rooms });
```

Для каждой комнаты фронтенд дополнительно получает активные даты бронирований через `getRoomBookings()`:

```js
const result = await window.api.getRoomBookings(r.name);
return { name: r.name, bookings: result.data?.bookings || [] };
```

На сервере это `GET /api/bookings/room-status`. Он ищет брони по `roomName`, исключая `cancelled`, `rejected`, `completed`, и не учитывает истекшие `hold`.

## 5. Бронирование: подробный процесс

### 5.1 Открытие формы бронирования

Когда клиент нажимает кнопку "Забронировать", вызывается `openBookingModal(name, price, category)` в `Client/public/js/modals.js:16`.

Если клиент не авторизован, открывается окно требования авторизации:

```js
if (!window.api || !window.api.isAuthenticated()) {
  closeRoomsModal();
  openAuthRequiredModal();
  return;
}
```

Если клиент авторизован, выбранный номер сохраняется в `currentRoom`, показывается модальное окно с городом, датами и расчетом цены.

### 5.2 Расчет цены

Цена считается на фронтенде в `updateBookingPricePreview()`:

```js
const nights = calculateNights(checkin, checkout);
const total = currentRoom.price * nights;
const deposit = Math.round(total * 0.2);
```

То есть клиент видит полную стоимость и предоплату 20%.

### 5.3 Создание временного hold

Когда клиент нажимает продолжение к оплате, вызывается `proceedToPayment()` в `Client/public/js/modals.js:134`.

Фронтенд проверяет даты:

```js
if (!checkin || !checkout) { showAlertModal('warning', 'booking.invalidDates'); return; }
if (new Date(checkin) >= new Date(checkout)) {
  showAlertModal('warning', 'booking.checkoutAfterCheckin');
  return;
}
```

Потом отправляет `POST /api/bookings/hold`:

```js
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
```

Серверный маршрут `Client/server/routes/bookings.js:136`:

```js
return await Booking.create({
  user: req.user._id,
  roomName,
  roomPrice,
  roomCategory: roomCategory || 'classic',
  city,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  status: 'hold',
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  notifications: [{ message: '...', type: 'info', createdAt: new Date() }]
});
```

Важно: это еще не финальная бронь. Это временная блокировка на 10 минут, чтобы два клиента не оплатили один и тот же лимит одновременно.

### 5.4 Проверка лимита региона

Перед созданием hold сервер проверяет количество пересекающихся броней в городе:

```js
const overlappingCount = await countOverlappingRegionBookings(city, checkIn, checkOut);
const regionLimit = await getRegionLimit(city);

if (overlappingCount >= regionLimit) {
  throw new Error('REGION_LIMIT');
}
```

`countOverlappingRegionBookings()` считает только активные, ожидающие и hold-брони, исключая отмененные, отклоненные, завершенные и истекшие:

```js
return Booking.countDocuments({
  city: normalizeCity(city),
  status: { $nin: ['cancelled', 'rejected', 'completed'] },
  $or: [
    { expiresAt: null },
    { expiresAt: { $gt: now } }
  ],
  checkIn: { $lt: end },
  checkOut: { $gt: start }
});
```

### 5.5 Симуляция оплаты

Оплата пока не интегрирована с платежной системой. Она симулируется на фронтенде в `processPayment()` из `Client/public/js/modals.js:266`.

Фронтенд требует выбрать сохраненную карту или ввести новую:

```js
if (savedCardIndex === '' && (!cardNumber || cardNumber.length < 1)) {
  showAlertModal('warning', 'payment.selectCard');
  return;
}
```

Если введена новая карта, она сохраняется:

```js
const brand = cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Card';
await window.api.addCard({ cardNumber, expiry: cardExpiry, brand });
```

Потом идет искусственная задержка 2 секунды:

```js
document.getElementById('payment-processing').classList.remove('hidden');
await new Promise(resolve => setTimeout(resolve, 2000));
document.getElementById('payment-success').classList.remove('hidden');
```

### 5.6 Подтверждение hold после оплаты

После симуляции оплаты вызывается `saveBookingToAPI()` в `Client/public/js/modals.js:311`:

```js
const response = await window.api.confirmHold(data._id);
pendingBooking = null;
return response.data || response;
```

API-клиент вызывает:

```js
async confirmHold(bookingId) {
  return this.post(`/bookings/hold/${bookingId}/confirm`);
}
```

Серверный маршрут `Client/server/routes/bookings.js:193`:

```js
const booking = await Booking.findOne({
  _id: req.params.id,
  user: req.user._id,
  status: 'hold',
  $or: [
    { expiresAt: null },
    { expiresAt: { $gt: new Date() } }
  ]
});

booking.status = 'active';
booking.expiresAt = undefined;
booking.notifications.push({ message: '...', type: 'success', createdAt: new Date() });
await booking.save();
```

После этого бронь становится активной и появляется в дашборде клиента.

### 5.7 Отмена hold при закрытии оплаты

Если клиент закрыл окно оплаты до успешного платежа, `closePaymentModal()` удаляет временный hold:

```js
if (pendingBooking && pendingBooking._id) {
  await window.api.cancelHold(pendingBooking._id);
  pendingBooking = null;
}
```

Сервер разрешает удалить только бронь со статусом `hold`.

## 6. Modify и cancel в клиентском дашборде

Карточка бронирования строится в `renderBookingCard()` из `Client/public/js/dashboard.js:207`.

Кнопки Modify и Cancel показываются только если:

- бронь `active`;
- время изменения еще не истекло;
- нет ожидающего запроса `changeRequest.status === 'pending'`.

```js
const canModify = new Date(booking.canModifyUntil) > new Date();

if (canModify && booking.status === 'active') {
  actionHTML = `
    <button class="btn-modify" data-booking-id="${bookingId}">...</button>
    <button class="btn-cancel" data-booking-id="${bookingId}">...</button>
  `;
}
```

Окно изменения вызывает `submitChangeRequest()` в `Client/public/js/dashboard.js:346`.

```js
await window.api.requestBookingChange(currentChangeBookingId, {
  newCity: city,
  newCheckIn: checkin,
  newCheckOut: checkout,
  newRoomName: selectedRoomName,
  newRoomPrice: selectedRoomPrice,
  newRoomCategory: selectedRoomCategory,
  newNights: nights,
  newTotalPrice: totalPrice
});
```

Серверный маршрут `Client/server/routes/bookings.js:335` создает `changeRequest` и переводит бронь в `pending_change`:

```js
booking.changeRequest = {
  newRoomName: newRoomName || booking.roomName,
  newRoomPrice: newRoomPrice || booking.roomPrice,
  newRoomCategory: newRoomCategory || booking.roomCategory,
  newCity: newCity || booking.city,
  newCheckIn: newCheckIn || booking.checkIn,
  newCheckOut: newCheckOut || booking.checkOut,
  requestType: 'modification',
  requestedAt: new Date(),
  status: 'pending'
};
booking.status = 'pending_change';
```

Отмена вызывается через `confirmCancelRequest()` в `Client/public/js/dashboard.js:364`:

```js
await window.api.requestBookingCancellation(currentCancelBookingId);
```

Серверный маршрут `Client/server/routes/bookings.js:380` создает запрос:

```js
booking.changeRequest = {
  newRoomName: booking.roomName,
  newRoomPrice: booking.roomPrice,
  newRoomCategory: booking.roomCategory,
  newCity: booking.city,
  newCheckIn: booking.checkIn,
  newCheckOut: booking.checkOut,
  requestType: 'cancellation',
  requestedAt: new Date(),
  status: 'pending'
};
booking.status = 'pending_cancellation';
```

Оба запроса должен решить администратор.

## 7. Администратор: авторизация

Админский логин и регистрация находятся в `admin/server/routes/admin-auth.js`.

Регистрация админа требует `ADMIN_SECRET_CODE`:

```js
if (!adminCode || adminCode !== process.env.ADMIN_SECRET_CODE) {
  return res.status(403).json({ success: false, error: { adminCode: '...' } });
}
```

Логин работает так же, как у клиента: валидирует email/password, ищет `Admin`, сравнивает пароль, возвращает JWT.

```js
const admin = await Admin().findOne({ email: email.toLowerCase() });
const isMatch = await admin.comparePassword(password);
const token = generateToken(admin._id);
res.json({ success: true, token, user: admin.toJSON() });
```

Фронтенд админа хранит токен в `localStorage.adminToken` и добавляет его в каждый запрос:

```js
const headers = { 'Authorization': `Bearer ${token}` };
```

## 8. Администратор: просмотр броней и запросов

Админская вкладка бронирований строится в `admin/public/js/admin-bookings.js:1`.

Фронтенд вызывает:

```js
const result = await api('/bookings');
const allBookings = result.data || [];
```

Серверный маршрут `admin/server/routes/bookings.js:16` возвращает все брони с данными клиента:

```js
const bookings = await Booking()
  .find()
  .populate('user', 'firstName lastName email phone')
  .sort({ createdAt: -1 });
res.json({ success: true, data: bookings, count: bookings.length });
```

Если у брони статус `pending_change` или `pending_cancellation`, админ видит кнопки Approve и Reject:

```js
const isPendingRequest = b.status === 'pending_change' || b.status === 'pending_cancellation';
```

## 9. Администратор: approve изменения или отмены

Кнопка approve вызывает `approveChange(id)` в `admin/public/js/admin-bookings.js:65`:

```js
await api(`/bookings/${id}/approve`, 'PUT');
```

Серверный маршрут `admin/server/routes/bookings.js:71` определяет тип запроса:

```js
const isModification = booking.status === 'pending_change';
const isCancellation = booking.status === 'pending_cancellation';
```

Если это изменение, сервер переносит данные из `changeRequest` в основную бронь:

```js
booking.roomName = booking.changeRequest.newRoomName || booking.roomName;
booking.roomPrice = booking.changeRequest.newRoomPrice || booking.roomPrice;
booking.roomCategory = booking.changeRequest.newRoomCategory || booking.roomCategory;
booking.city = booking.changeRequest.newCity || booking.city;
booking.checkIn = booking.changeRequest.newCheckIn || booking.checkIn;
booking.checkOut = booking.changeRequest.newCheckOut || booking.checkOut;

booking.status = 'active';
booking.changeRequest = null;
booking.approvalStatus = 'approved';
booking.approvedBy = adminName;
```

Если это отмена, сервер ставит статус `cancelled`:

```js
booking.status = 'cancelled';
booking.changeRequest = null;
booking.approvalStatus = 'approved';
booking.cancelledByName = adminName;
booking.cancelledAt = new Date();
```

После этого клиент видит решение в своем дашборде через поля `approvalStatus`, `approvedBy` и уведомления.

## 10. Администратор: reject запроса

Reject открывает модальное окно причины и вызывает `confirmRejectChange(id)` в `admin/public/js/admin-bookings.js:91`.

```js
await api(`/bookings/${id}/reject`, 'PUT', { reason });
```

Серверный маршрут `admin/server/routes/bookings.js:141`:

```js
booking.status = 'active';
booking.changeRequest = null;
booking.approvalStatus = 'rejected';
booking.approvedBy = adminName;
booking.approvedAt = new Date();
booking.approvalNotes = reason;
```

То есть при reject бронь возвращается в `active`, а причина отказа сохраняется в `approvalNotes`.

## 11. Администратор: самостоятельная отмена заказа

Администратор может отменить заказ без клиентского запроса через `cancel-by-admin`.

Фронтенд: `confirmCancelOrder()` в `admin/public/js/admin-bookings.js:121`.

```js
await api(`/bookings/${bookingId}/cancel-by-admin`, 'PUT', { reason });
```

Сервер: `admin/server/routes/bookings.js:183`.

```js
booking.status = 'cancelled';
booking.cancelReason = reason;
booking.cancelledByName = adminName;
booking.cancelledAt = new Date();
```

## 12. Модель бронирования и статусы

Схема бронирования находится в `shared/schemas/bookingSchema.js`.

Основные поля:

```js
status: {
  type: String,
  enum: ['hold', 'active', 'pending_change', 'pending_cancellation', 'changed', 'cancelled', 'rejected', 'completed'],
  default: 'active'
},
expiresAt: { type: Date, default: null },
changeRequest: { type: mongoose.Schema.Types.Mixed, default: null },
approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
canModifyUntil: { type: Date, default: () => new Date(Date.now() + 12 * 60 * 60 * 1000) }
```

Жизненный цикл:

```text
hold -> active -> pending_change -> active approved/rejected
hold -> active -> pending_cancellation -> cancelled approved
hold -> active -> pending_cancellation -> active rejected
active -> cancelled by admin
active -> completed by checkout
```

TTL-индекс удаляет истекшие hold:

```js
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

## 13. Вывод

Сценарий клиента работает так:

1. Регистрация или логин выдают JWT.
2. JWT дает доступ к `dashboard.html` и защищенным API.
3. Клиент выбирает номер и даты.
4. Сервер проверяет валидность данных и лимит региона.
5. Создается временный `hold` на 10 минут.
6. Фронтенд симулирует оплату 20%.
7. После успешной симуляции `hold` подтверждается и становится `active`.
8. В дашборде клиент может отправить `modify` или `cancel` запрос.
9. Админ видит запрос и делает `approve` или `reject`.
10. Клиент видит итоговое решение в дашборде.

Сценарий администратора работает так:

1. Админ регистрируется с секретным кодом или логинится.
2. Админский JWT открывает доступ к `/api/admin/*`.
3. Админ видит все брони и pending-запросы.
4. Approve изменения применяет новые данные к брони.
5. Approve отмены переводит бронь в `cancelled`.
6. Reject возвращает бронь в `active` и сохраняет причину отказа.
7. Админ также может самостоятельно отменить заказ или закрыть его через checkout.
