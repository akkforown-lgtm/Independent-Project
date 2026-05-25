# Документация для защиты диплома: `hotel-website`

Документ объясняет проект как инженерную систему: как она работает, где выполняется код, почему выбраны такие решения и какие преимущества это даёт. Формат рассчитан на устную защиту перед комиссией: сначала архитектура, затем сценарии работы, затем файл-за-файлом.

## 1. Назначение проекта

`hotel-website` - это веб-система для гостиницы Luxury Haven. Она решает две разные задачи:

1. Клиентская часть: пользователь смотрит номера, регистрируется, входит в кабинет, бронирует номер, оплачивает депозит, видит свои бронирования и отправляет запросы на изменение или отмену.
2. Административная часть: администратор управляет номерами, бронированиями, лимитами по регионам, закрывает заказы, ведёт историю и получает финансовую сводку.

Проект разделён на три слоя:

```text
hotel-website/
  Client/        клиентский сайт и клиентский API
  admin/         админ-панель и административный API
  shared/        общие схемы MongoDB, валидация, rate limit
```

Такое разделение принято потому, что пользовательский интерфейс и админ-панель имеют разные права доступа, разные сценарии и разные риски безопасности. Общие правила данных вынесены в `shared`, чтобы не дублировать схемы и проверки.

## 2. Где работает проект

Локально проект работает как два Node.js/Express сервера:

| Часть | Папка | Порт | Назначение |
|---|---|---:|---|
| Клиент | `Client/server` | `3000` | HTML/CSS/JS клиентского сайта и API `/api/...` |
| Админ | `admin/server` | `3001` | HTML/CSS/JS админ-панели и API `/api/admin/...` |
| База данных | Docker MongoDB | `27017` | Хранение пользователей, админов, номеров, броней |
| Метрики | `/metrics` | `3000`, `3001` | Prometheus-метрики серверов |
| Prometheus | Docker | `9090` | Сбор метрик |
| Grafana | Docker | `3030` | Просмотр метрик |

Пример из [package.json](../package.json):

```json
"scripts": {
  "start": "node start.js",
  "install:all": "npm install --prefix shared && npm install --prefix Client/server && npm install --prefix admin/server"
}
```

Команда `npm start` запускает [start.js](../start.js), а он поднимает оба сервера.

## 3. Общая архитектура

### 3.1 Поток данных

Пример бронирования:

1. Пользователь открывает `Client/public/index.html`.
2. `Client/public/js/modals.js` загружает список номеров через `window.api.getRooms()`.
3. `Client/public/js/api.js` отправляет `GET /api/rooms` на клиентский сервер.
4. `Client/server/routes/rooms.js` берёт номера из MongoDB через Mongoose-модель `Room`.
5. При бронировании `modals.js` отправляет `POST /api/bookings/hold`.
6. `Client/server/routes/bookings.js` проверяет JWT, валидирует данные, проверяет лимит региона и создаёт бронь со статусом `hold`.
7. После имитации оплаты клиент вызывает `POST /api/bookings/hold/:id/confirm`.
8. Сервер переводит бронь из `hold` в `active`.
9. Администратор видит бронь в `admin/public/dashboard.html` через `admin/public/js/admin-bookings.js`.
10. При выезде администратор закрывает заказ через `POST /api/admin/checkout/:bookingId`, и бронь становится `completed`.

### 3.2 Почему два сервера

В проекте есть два Express-приложения:

```js
// Client/server/server.js
const app = express();
```

```js
// admin/server/server.js
const app = express();
```

Это решение даёт:

- изоляцию пользовательских и административных маршрутов;
- разные URL и порты для клиента и админа;
- отдельную авторизацию пользователя и администратора;
- возможность деплоить клиент и админку как разные сервисы на Render;
- меньше риск случайно открыть административный функционал пользователю.

### 3.3 Почему MongoDB и Mongoose

MongoDB подходит для проекта, потому что бронирование содержит вложенные данные: уведомления, дополнительные услуги, чек-аут, запрос на изменение. Это удобно хранить документом.

Пример из [shared/schemas/bookingSchema.js](../shared/schemas/bookingSchema.js):

```js
notifications: [{
  message: String,
  type: { type: String, enum: ['info', 'success', 'warning', 'error'] },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}]
```

Плюс: уведомления хранятся прямо внутри бронирования, поэтому не нужна отдельная таблица для простого сценария.

### 3.4 Почему JWT

JWT используется для stateless-авторизации. После входа сервер создаёт токен:

```js
// Client/server/routes/auth.js
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
```

Клиент сохраняет токен:

```js
// Client/public/js/api.js
setToken(token) {
  this.token = token;
  localStorage.setItem('token', token);
}
```

Плюсы:

- серверу не нужно хранить сессии в памяти;
- токен автоматически прикрепляется к API-запросам;
- один механизм подходит и для клиента, и для админки.

## 4. Ключевые инженерные решения

### 4.1 Общий слой `shared`

Схемы и валидация вынесены в `shared`, потому что ими пользуются оба сервера.

Пример:

```js
// Client/server/server.js
const userSchema = require('../../shared/schemas/userSchema')(mongoose);
```

```js
// admin/server/server.js
const bookingSchema = require('../../shared/schemas/bookingSchema')(mongoose);
```

Плюс: если поле бронирования меняется, оно меняется в одном месте.

### 4.2 Защита паролей через bcrypt

В [shared/schemas/userSchema.js](../shared/schemas/userSchema.js) пароль хешируется до записи:

```js
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

Почему так:

- в базе не хранится открытый пароль;
- `bcrypt.hash(..., 12)` замедляет перебор паролей;
- middleware `pre('save')` гарантирует, что хеширование происходит автоматически.

Аналогично сделано для администраторов в [shared/schemas/adminSchema.js](../shared/schemas/adminSchema.js).

### 4.3 Middleware авторизации

Клиентские защищённые маршруты используют `protect`:

```js
// Client/server/middleware/auth.js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const User = mongoose.model('User');
req.user = await User.findById(decoded.id).select('-password');
```

Что происходит:

1. Сервер берёт `Authorization: Bearer <token>`.
2. Проверяет подпись JWT.
3. Находит пользователя в MongoDB.
4. Кладёт пользователя в `req.user`.
5. Следующий route handler уже знает, кто делает запрос.

Плюс: бизнес-логика маршрутов не дублирует проверку токена.

### 4.4 Временное удержание брони

В [Client/server/routes/bookings.js](../Client/server/routes/bookings.js) есть сценарий `hold`:

```js
status: 'hold',
expiresAt: new Date(Date.now() + 10 * 60 * 1000)
```

В схеме есть TTL-индекс:

```js
// shared/schemas/bookingSchema.js
bookingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

Почему так:

- пользователь получает время на оплату;
- номер не бронируется навсегда, если пользователь закрыл страницу;
- MongoDB автоматически удаляет просроченный `hold`.

### 4.5 Защита от одновременного превышения лимита

В [Client/server/routes/bookings.js](../Client/server/routes/bookings.js) используется in-process lock:

```js
const bookingLocks = new Map();
```

```js
async function withBookingLock(city, fn) {
  const normalizedCity = String(city).trim().toLowerCase();
  ...
  const resultPromise = currentLock.then(() => fn()).finally(() => {
    resolveLock();
  });
  return resultPromise;
}
```

Почему так:

- если два пользователя одновременно бронируют последний доступный слот в одном городе, операции выполняются последовательно;
- перед созданием брони сервер ещё раз считает активные пересекающиеся бронирования;
- это снижает риск переполнения лимита региона.

Ограничение: lock работает внутри одного Node.js процесса. Для горизонтального масштабирования лучше заменить его на Redis lock или MongoDB transaction.

### 4.6 Региональные лимиты

Схема лимитов:

```js
// shared/schemas/regionLimitSchema.js
city: { type: String, required: true, unique: true, trim: true },
maxBookings: { type: Number, required: true, default: 3, min: 1 }
```

Проверка занятости:

```js
// Client/server/routes/bookings.js
status: { $nin: ['cancelled', 'rejected', 'completed'] },
checkIn: { $lt: end },
checkOut: { $gt: start }
```

Смысл: считаются только активные или ожидающие брони, которые пересекаются по датам.

Плюсы:

- администратор может управлять вместимостью по городам;
- клиент видит, сколько мест занято;
- система не даёт создать бронь сверх лимита.

### 4.7 Rate limit

В [shared/rate-limit.js](../shared/rate-limit.js) реализована защита от слишком частых запросов:

```js
const authRateLimit = rateLimit(
  authMaxRequests,
  authWindowMs,
  (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'no-email';
    return `${req.ip}:${req.method}:${req.baseUrl}${req.path}:${email}`;
  }
);
```

Почему ключ включает IP, метод, путь и email:

- лимит работает точнее, чем просто по IP;
- разные endpoint-ы не мешают друг другу;
- пользователь не блокируется из-за обычных запросов профиля или карточек.

В серверах лимит подключён только к входу и регистрации:

```js
// Client/server/server.js
app.post('/api/auth/login', authRateLimit);
app.post('/api/auth/register', authRateLimit);
```

```js
// admin/server/server.js
app.post('/api/admin/auth/login', authRateLimit);
app.post('/api/admin/auth/register', authRateLimit);
```

## 5. Как работает клиентская часть

### 5.1 HTML-страницы

Клиентские страницы лежат в `Client/public`:

- `index.html` - главная страница, каталог номеров, модальные окна бронирования;
- `login.html` - вход пользователя;
- `register.html` - регистрация пользователя;
- `dashboard.html` - личный кабинет пользователя.

Express отдаёт эти файлы как static:

```js
// Client/server/server.js
app.use(express.static(path.join(__dirname, '../public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
```

### 5.2 API-клиент браузера

[Client/public/js/api.js](../Client/public/js/api.js) - единая точка общения браузера с сервером.

Пример:

```js
function getApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  return `${window.location.protocol}//${window.location.host}/api`;
}
```

Почему так:

- локально API всегда идёт на `localhost:3000`;
- в продакшене адрес строится от текущего домена;
- HTML не нужно менять при деплое.

Все методы собраны в классе:

```js
class ApiClient {
  async login(credentials) {
    const data = await this.post('/auth/login', credentials);
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }
}
```

Плюс: страницы вызывают `window.api.login(...)`, `window.api.getRooms(...)`, `window.api.holdBooking(...)`, не зная деталей `fetch`.

### 5.3 Регистрация и вход

[Client/public/js/auth.js](../Client/public/js/auth.js) отвечает за формы:

```js
async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('login-email');
  const password = document.getElementById('login-password');
```

Функция:

1. отменяет стандартную отправку формы;
2. читает email и пароль;
3. проверяет пустые поля;
4. вызывает `window.api.login`;
5. при успехе переводит пользователя на `dashboard.html`;
6. при ошибке показывает ошибку рядом с нужным полем.

Почему проверка есть и на клиенте, и на сервере:

- клиентская проверка улучшает UX;
- серверная проверка защищает API от прямых неправильных запросов.

### 5.4 Бронирование и оплата

Основная логика находится в [Client/public/js/modals.js](../Client/public/js/modals.js).

Пример открытия бронирования:

```js
function openBookingModal(name, price, category = 'classic') {
  if (!window.api || !window.api.isAuthenticated()) {
    closeRoomsModal();
    openAuthRequiredModal();
    return;
  }
```

Почему так:

- бронирование доступно только авторизованному пользователю;
- неавторизованный пользователь не теряет контекст, а получает модальное окно с переходом к входу.

Перед оплатой создаётся hold:

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
```

После успешной оплаты hold подтверждается:

```js
const response = await window.api.confirmHold(data._id);
pendingBooking = null;
```

Плюс: пользователь не может оплатить бронь, которая не была зарезервирована на сервере.

### 5.5 Личный кабинет

[Client/public/js/dashboard.js](../Client/public/js/dashboard.js) проверяет авторизацию:

```js
function checkDashboardAuth() {
  if (!window.api || !window.api.isAuthenticated()) {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = 'login.html'; return false; }
  }
  return true;
}
```

В кабинете пользователь:

- видит профиль;
- видит свои бронирования;
- добавляет/удаляет сохранённые карты;
- отправляет запрос на изменение брони;
- отправляет запрос на отмену.

Пример запроса на изменение:

```js
await window.api.requestBookingChange(currentChangeBookingId, {
  newCity: city,
  newCheckIn: checkin,
  newCheckOut: checkout,
  newRoomName: selectedRoomName
});
```

## 6. Как работает сервер клиента

### 6.1 Инициализация сервера

[Client/server/server.js](../Client/server/server.js) выполняет:

```js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
```

Далее проверяются обязательные переменные:

```js
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
```

Почему так: приложение не должно стартовать без базы данных и секрета JWT, иначе авторизация и хранение данных будут некорректны.

### 6.2 Подключение моделей

```js
const userSchema = require('../../shared/schemas/userSchema')(mongoose);
const bookingSchema = require('../../shared/schemas/bookingSchema')(mongoose);
const roomSchema = require('../../shared/schemas/roomSchema')(mongoose);
const regionLimitSchema = require('../../shared/schemas/regionLimitSchema')(mongoose);
```

Это регистрирует Mongoose-модели на клиентском сервере.

### 6.3 Маршруты

```js
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/rooms', roomRoutes);
```

Распределение:

- `/api/auth` - регистрация, вход, профиль, карты;
- `/api/bookings` - создание и управление бронями пользователя;
- `/api/rooms` - публичный список номеров.

## 7. Как работает админ-панель

### 7.1 HTML и общий API-клиент

Админ-панель состоит из:

- `admin/public/index.html` - вход и регистрация администратора;
- `admin/public/dashboard.html` - рабочая панель;
- `admin/public/js/admin-api.js` - общий API-клиент, табы, переводы, logout;
- отдельных JS-файлов для разделов.

Админский API base URL:

```js
// admin/public/js/admin-api.js
function getAdminApiBaseUrl() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api/admin';
  }
  return `${window.location.protocol}//${window.location.host}/api/admin`;
}
```

### 7.2 Защита админки

Если токена нет, админский dashboard сразу возвращает на login:

```js
// admin/public/js/admin-api.js
if (!token) { window.location.href = '/index.html'; }
```

На сервере каждый административный route использует `protect`:

```js
// admin/server/routes/rooms.js
router.get('/', protect, async (req, res) => {
```

Плюс: даже если пользователь вручную вызовет API, без admin JWT он не получит данные.

### 7.3 Управление бронированиями

[admin/server/routes/bookings.js](../admin/server/routes/bookings.js) позволяет:

- получить все брони;
- получить статистику;
- одобрить изменение;
- отклонить изменение;
- отменить заказ администратором.

Пример одобрения изменения:

```js
booking.roomName = booking.changeRequest.newRoomName || booking.roomName;
booking.city = booking.changeRequest.newCity || booking.city;
booking.status = 'active';
booking.changeRequest = null;
booking.approvalStatus = 'approved';
```

Почему так:

- пользователь не меняет бронь напрямую;
- запрос сначала попадает в статус `pending_change`;
- администратор принимает решение;
- история решения остаётся в полях `approvedBy`, `approvedAt`, `approvalStatus`.

### 7.4 Закрытие заказа и бухгалтерия

[admin/server/routes/checkout.js](../admin/server/routes/checkout.js):

```js
const servicesTotal = services.reduce((sum, s) => {
  if (s.price && s.quantity) {
    return sum + (s.price * s.quantity);
  }
  return sum;
}, 0);
```

Затем считается итог:

```js
const roomTotal = booking.roomPrice * booking.nights;
const discountAmount = discount || 0;
const grandTotal = roomTotal + servicesTotal - discountAmount;
```

Плюсы:

- цена номера и доп. услуги учитываются отдельно;
- можно анализировать доход по категориям услуг;
- закрытый заказ переносится в историю.

Финансовая сводка в [admin/server/routes/accounting.js](../admin/server/routes/accounting.js):

```js
const totalRevenue = checkouts.reduce((sum, co) => sum + (co.grandTotal || co.roomTotal || 0), 0);
```

Важно: доход считается только по закрытым заказам `Checkout`, а не по всем броням. Это правильнее для бухгалтерии, потому что активная бронь ещё не является завершённой выручкой.

## 8. Файл-за-файлом: назначение каждого файла

### 8.1 Корень проекта

| Файл | Назначение | Почему нужен |
|---|---|---|
| `.env.example` | Шаблон переменных окружения | Показывает, какие секреты нужны для запуска |
| `.gitignore` | Исключения Git | Не даёт коммитить `node_modules`, `.env`, временные файлы |
| `package.json` | Главные npm-скрипты | Единая точка запуска и установки |
| `start.js` | Запускает client и admin серверы | Упрощает демонстрацию: одна команда поднимает весь проект |
| `docker-compose.yml` | MongoDB, Prometheus, Grafana | Локальная инфраструктура без ручной установки |
| `render.yaml` | Деплой на Render | Описывает два web service |
| `README.md` | Базовая инструкция запуска | Быстрый старт для разработчика |

Построчное объяснение `start.js`:

| Блок | Что делает |
|---|---|
| `const fs/path/spawn` | Подключает файловую систему, пути и запуск дочерних процессов |
| `services = [...]` | Описывает два сервиса: client и admin |
| `validateService` | Проверяет наличие `package.json`, `server.js`, `node_modules` |
| `prefixOutput` | Добавляет к логам префикс `[client]` или `[admin]` |
| `startService` | Запускает `node server.js` в нужной папке |
| `shutdown` | Останавливает оба сервера при `Ctrl+C` |
| `try { ... }` | Проверяет зависимости и запускает оба сервиса |

### 8.2 `shared`

| Файл | Назначение | Где используется |
|---|---|---|
| `shared/package.json` | Зависимости общего слоя | `bcryptjs`, общие npm metadata |
| `shared/package-lock.json` | Фиксация версий | Воспроизводимая установка |
| `shared/validation.js` | Email, phone, password, booking validation | `Client/server/routes/auth.js`, `admin/server/routes/admin-auth.js`, `Client/server/routes/bookings.js` |
| `shared/rate-limit.js` | Middleware ограничения запросов | `Client/server/server.js`, `admin/server/server.js` |
| `shared/translations.js` | Общие переводы | Резерв/общий словарь проекта |
| `shared/schemas/userSchema.js` | Пользователь | Клиентский сервер |
| `shared/schemas/adminSchema.js` | Администратор | Админский сервер |
| `shared/schemas/roomSchema.js` | Номер отеля | Оба сервера |
| `shared/schemas/bookingSchema.js` | Бронь | Оба сервера |
| `shared/schemas/regionLimitSchema.js` | Лимит региона | Оба сервера |

Построчное объяснение `userSchema.js`:

| Блок | Что делает |
|---|---|
| `const bcrypt = require('bcryptjs')` | Подключает хеширование паролей |
| `new mongoose.Schema({...})` | Описывает поля пользователя |
| `email unique lowercase` | Email уникален и хранится в нижнем регистре |
| `savedCards` | Хранит маску карты, бренд, последние 4 цифры |
| `pre('save')` | Перед сохранением хеширует пароль |
| `comparePassword` | Сравнивает введённый пароль с хешем |
| `toJSON` | Удаляет пароль и `__v` из ответа API |

Построчное объяснение `bookingSchema.js`:

| Блок | Что делает |
|---|---|
| `user: ObjectId ref User` | Связывает бронь с пользователем |
| `roomName/roomPrice/roomCategory` | Фиксирует выбранный номер и цену |
| `city/checkIn/checkOut/nights` | Хранит параметры проживания |
| `status enum` | Ограничивает возможные состояния брони |
| `expiresAt` | Используется для временных hold-броней |
| `changeRequest` | Хранит запрос на изменение/отмену |
| `checkout` | Хранит итоги закрытия заказа |
| `additionalServices` | Дополнительные услуги |
| `notifications` | История событий для пользователя |
| `canModifyUntil` | Окно, в течение которого можно запросить изменение |
| `TTL index` | Автоматическое удаление просроченных hold |
| `pre('save')` | Проверяет, что дата выезда позже даты заезда |

### 8.3 Клиентский сервер `Client/server`

| Файл | Назначение |
|---|---|
| `Client/server/.env` | Локальные секреты клиента |
| `Client/server/.env.example` | Шаблон env |
| `Client/server/package.json` | Зависимости Express/Mongoose/JWT |
| `Client/server/package-lock.json` | Фиксация версий |
| `Client/server/server.js` | Главный Express-сервер клиента |
| `Client/server/tailwind.config.js` | Конфигурация Tailwind |
| `Client/server/postcss.config.js` | PostCSS pipeline |
| `Client/server/middleware/auth.js` | JWT-защита пользовательских маршрутов |
| `Client/server/routes/auth.js` | Регистрация, вход, профиль, карты |
| `Client/server/routes/bookings.js` | Бронирования, hold, подтверждение, изменение, отмена |
| `Client/server/routes/rooms.js` | Публичная выдача номеров |

Построчное/блочное объяснение `Client/server/server.js`:

| Блок | Что делает |
|---|---|
| `require('dotenv').config()` | Загружает `.env` |
| `requiredEnvVars` | Не даёт стартовать без `MONGODB_URI`, `JWT_SECRET` |
| `app.get('/metrics')` | Отдаёт Prometheus-метрики |
| `corsOptions` | Разрешает запросы с локальных фронтендов |
| `express.json` | Позволяет читать JSON body |
| `express.static` | Отдаёт HTML/CSS/JS и assets |
| `app.post('/api/auth/login', authRateLimit)` | Защищает login от brute force |
| `mongoose.connect(MONGODB_URI)` | Подключается к MongoDB |
| `mongoose.model(...)` | Регистрирует модели |
| `app.use('/api/...')` | Подключает route modules |
| `app.get('*')` | Возвращает `index.html` для неизвестных путей |
| `app.listen(PORT)` | Запускает HTTP-сервер |

Построчное/блочное объяснение `Client/server/routes/bookings.js`:

| Блок | Что делает |
|---|---|
| `sanitizeDate` | Преобразует дату и отбрасывает некорректную |
| `datesOverlap` | Проверяет пересечение периодов; в текущем коде вспомогательная функция |
| `getRegionLimit` | Берёт лимит города из MongoDB или возвращает `3` |
| `countOverlappingRegionBookings` | Считает активные пересекающиеся брони |
| `isValidObjectId` | Защищает Mongoose-запросы от неправильного ID |
| `withBookingLock` | Последовательно выполняет создание брони по городу |
| `POST /` | Создаёт активную бронь |
| `POST /hold` | Создаёт временную бронь на 10 минут |
| `POST /hold/:id/confirm` | Подтверждает оплату и делает бронь активной |
| `DELETE /hold/:id` | Снимает временное удержание |
| `GET /region-status` | Возвращает занятость региона |
| `GET /room-status` | Возвращает занятые даты по номеру |
| `GET /my` | Возвращает брони текущего пользователя |
| `PUT /:id/change-request` | Отправляет запрос на изменение |
| `PUT /:id/cancel-request` | Отправляет запрос на отмену |
| `GET /:id/notifications` | Возвращает уведомления по брони |

### 8.4 Клиентский фронтенд `Client/public`

| Файл | Назначение |
|---|---|
| `Client/public/index.html` | Главная страница сайта, секции и модальные окна |
| `Client/public/login.html` | Страница входа |
| `Client/public/register.html` | Страница регистрации |
| `Client/public/dashboard.html` | Личный кабинет |
| `Client/public/css/style.css` | Основные стили, анимации, responsive |
| `Client/public/css/tailwind.css` | Tailwind directives |
| `Client/public/js/api.js` | Единый API-клиент |
| `Client/public/js/auth.js` | Логика входа/регистрации |
| `Client/public/js/config.js` | Конфигурация API URL |
| `Client/public/js/dashboard.js` | Личный кабинет |
| `Client/public/js/data.js` | Локальный fallback номеров и городов |
| `Client/public/js/helpers.js` | Alerts, даты, расчёт ночей, язык |
| `Client/public/js/main.js` | Навигация и главная страница |
| `Client/public/js/modals.js` | Модальные окна номеров, бронирования, оплаты |
| `Client/public/js/script.js` | Переводы RU/EN и смена языка |

Построчное/блочное объяснение `Client/public/js/api.js`:

| Блок | Что делает |
|---|---|
| `getApiBaseUrl` | Выбирает localhost или production URL |
| `constructor` | Сохраняет `baseURL` и token |
| `getHeaders` | Добавляет `Content-Type` и `Authorization` |
| `request` | Выполняет `fetch`, разбирает JSON, нормализует ошибки |
| `get/post/put/delete` | Упрощённые HTTP-методы |
| `register/login` | Получают token и сохраняют его |
| `getProfile/updateProfile` | Профиль пользователя |
| `getCards/addCard/deleteCard` | Карты пользователя |
| `getRooms` | Список номеров |
| `holdBooking/confirmHold/cancelHold` | Жизненный цикл временной брони |
| `getRegionStatus/getRoomBookings` | Доступность региона и номера |
| `isAuthenticated/checkAuth` | Проверка токена |
| `window.api = api` | Делает API доступным всем страницам |

Построчное/блочное объяснение `Client/public/js/modals.js`:

| Блок | Что делает |
|---|---|
| `currentRoom` | Хранит выбранный номер |
| `pendingBooking` | Хранит hold-бронь до оплаты |
| `openRoomsModal/renderRooms` | Открывает каталог и подгружает номера |
| `openBookingModal` | Проверяет авторизацию и открывает форму брони |
| `updateBookingPricePreview` | Считает стоимость и депозит |
| `updateRegionStatusText` | Показывает занятость региона |
| `proceedToPayment` | Создаёт hold перед оплатой |
| `loadSavedCards` | Загружает сохранённые карты |
| `closePaymentModal` | Если оплата отменена, удаляет hold |
| `processPayment` | Проверяет карту, имитирует оплату, подтверждает hold |
| `saveBookingToAPI` | Вызывает `confirmHold` |
| `showSuccessModal` | Показывает детали успешной брони |

### 8.5 Assets клиента

| Файл | Назначение |
|---|---|
| `Client/assets/images/logo.svg` | Логотип |
| `Client/assets/images/favicon.svg` | Иконка сайта |
| `Client/assets/images/VIProom1.png`, `VIProom2.png`, `VIProom3.png` | Изображения VIP-номеров |
| `Client/assets/images/CLASSICroom1.png`, `CLASSICroom2.png`, `CLASSICroom3.png` | Изображения classic-номеров |
| `Client/assets/images/CHEAProom1.png`, `CHEAProom2.png`, `CHEAProom3.png` | Изображения economy/cheap-номеров |
| `Client/assets/images/1778573651079-image.png`, `1778575388280-image.png` | Загруженные изображения номеров |

Изображения используются в seed-данных:

```js
// admin/server/seed-rooms.js
{ name: "Presidential Suite", price: 650, size: 120, imageUrl: "/assets/images/VIProom1.png" }
```

### 8.6 Админский сервер `admin/server`

| Файл | Назначение |
|---|---|
| `admin/server/.env` | Локальные секреты админки |
| `admin/server/.env.example` | Шаблон env |
| `admin/server/package.json` | Зависимости админ-сервера |
| `admin/server/package-lock.json` | Фиксация версий |
| `admin/server/server.js` | Главный Express-сервер админки |
| `admin/server/seed-rooms.js` | Первичное заполнение номеров |
| `admin/server/middleware/admin-auth.js` | JWT-защита админ-маршрутов |
| `admin/server/routes/admin-auth.js` | Регистрация и вход админа |
| `admin/server/routes/bookings.js` | Управление бронями |
| `admin/server/routes/rooms.js` | CRUD номеров |
| `admin/server/routes/regions.js` | Лимиты регионов |
| `admin/server/routes/checkout.js` | Закрытие заказа |
| `admin/server/routes/history.js` | История успешных/неуспешных заказов |
| `admin/server/routes/accounting.js` | Финансовая аналитика и CSV export |

Построчное/блочное объяснение `admin/server/server.js`:

| Блок | Что делает |
|---|---|
| `requiredEnvVars` | Проверяет `MONGODB_URI`, `JWT_SECRET`, `ADMIN_SECRET_CODE` |
| `collectDefaultMetrics` | Включает Prometheus-метрики |
| `corsOptions` | Разрешает локальные клиентские адреса |
| `multer.diskStorage` | Настраивает загрузку изображений номеров |
| `fileFilter` | Разрешает только изображения |
| `app.post('/api/admin/auth/login', authRateLimit)` | Защищает вход админа |
| `mongoose.model(...)` | Регистрирует Admin, Booking, User, Room, RegionLimit |
| `seed()` | Создаёт стандартные номера, если их меньше 9 |
| `RegionLimit.insertMany` | Создаёт лимиты для городов |
| `Checkout` schema | Создаёт модель закрытого заказа |
| `app.use('/api/admin/...')` | Подключает admin routes |
| `app.get('*')` | Отдаёт `index.html` админки |

Построчное/блочное объяснение `admin/server/routes/rooms.js`:

| Блок | Что делает |
|---|---|
| `GET /` | Получить все номера |
| `GET /:id` | Получить один номер |
| `POST /` | Создать номер |
| `PUT /:id` | Обновить номер |
| `DELETE /:id` | Удалить номер |
| `isValidObjectId` | Проверить корректность ID |
| Проверки `category`, `price`, `size` | Защита от некорректных данных |
| `createdBy/updatedBy` | Связь изменения с администратором |

Построчное/блочное объяснение `admin/server/routes/accounting.js`:

| Блок | Что делает |
|---|---|
| `GET /summary` | Возвращает финансы и статистику |
| `filter.createdAt` | Опциональная фильтрация по датам |
| `Booking().find(filter)` | Считает брони |
| `Checkout.find()` | Считает закрытые заказы |
| `serviceIncome` | Доход по типам услуг |
| `byCategory` | Распределение по категориям номеров |
| `byCity` | Распределение по городам |
| `byMonth` | Доход по месяцам |
| `GET /export` | Формирует CSV |
| `escapeCsv` | Безопасно экранирует значения CSV |
| `\uFEFF` | BOM для корректного открытия UTF-8 CSV в Excel |

### 8.7 Админский фронтенд `admin/public`

| Файл | Назначение |
|---|---|
| `admin/public/index.html` | Форма входа и регистрации админа |
| `admin/public/dashboard.html` | Основной dashboard админки |
| `admin/public/assets/images/favicon.svg` | Иконка админки |
| `admin/public/js/admin-api.js` | API-клиент, tabs, переводы, logout |
| `admin/public/js/admin-auth.js` | Вход/регистрация администратора |
| `admin/public/js/admin-dashboard.js` | Главная статистика |
| `admin/public/js/admin-bookings.js` | Список броней, approve/reject/cancel/checkout |
| `admin/public/js/admin-rooms.js` | Управление номерами и лимитами регионов |
| `admin/public/js/admin-accounting.js` | Финансовая аналитика и CSV |
| `admin/public/js/admin-history.js` | История заказов |
| `admin/public/js/admin-settings.js` | Раздел настроек |

Построчное/блочное объяснение `admin/public/js/admin-api.js`:

| Блок | Что делает |
|---|---|
| `getAdminApiBaseUrl` | Выбирает URL API админки |
| `token/user/currentTab` | Загружает состояние из localStorage |
| `if (!token)` | Не пускает в dashboard без входа |
| `api(...)` | Единая функция `fetch` для админки |
| `getRegionLimits/updateRegionLimit` | Методы регионов |
| `t` | Словарь RU/EN |
| `tr` | Получение перевода по ключу |
| `switchLang` | Смена языка и перерисовка таба |
| `showAlert` | Модальные сообщения |
| `logout` | Удаляет admin token |
| `.tab-btn addEventListener` | Переключение разделов |
| `loadCurrentTab` | Вызывает нужную функцию раздела |

### 8.8 Документация и мониторинг

| Файл | Назначение |
|---|---|
| `docs/api-endpoints.md` | Список API endpoints |
| `docs/deploy.md` | Деплой |
| `docs/RENDER_MONGODB_SETUP.md` | Инструкция MongoDB/Render |
| `docs/diploma-defense-documentation.md` | Данный документ для защиты |
| `monitoring/prometheus/prometheus.yml` | Настройка scrape targets |

Prometheus конфиг:

```yaml
scrape_configs:
  - job_name: 'client-api'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

Почему `host.docker.internal`: Prometheus работает в Docker-контейнере, а Node-серверы работают на хост-машине.

## 9. API: основные endpoints

### Клиент

| Method | URL | Назначение |
|---|---|---|
| `POST` | `/api/auth/register` | Регистрация пользователя |
| `POST` | `/api/auth/login` | Вход пользователя |
| `GET` | `/api/auth/profile` | Профиль |
| `PUT` | `/api/auth/profile` | Обновление профиля |
| `GET` | `/api/auth/cards` | Карты |
| `POST` | `/api/auth/cards` | Добавить карту |
| `DELETE` | `/api/auth/cards/:cardId` | Удалить карту |
| `GET` | `/api/rooms` | Список номеров |
| `GET` | `/api/bookings/region-status` | Занятость региона |
| `GET` | `/api/bookings/room-status` | Занятые даты номера |
| `POST` | `/api/bookings/hold` | Временное удержание |
| `POST` | `/api/bookings/hold/:id/confirm` | Подтверждение |
| `DELETE` | `/api/bookings/hold/:id` | Отмена hold |
| `GET` | `/api/bookings/my` | Мои брони |
| `PUT` | `/api/bookings/:id/change-request` | Запрос изменения |
| `PUT` | `/api/bookings/:id/cancel-request` | Запрос отмены |

### Админ

| Method | URL | Назначение |
|---|---|---|
| `POST` | `/api/admin/auth/register` | Регистрация админа по secret code |
| `POST` | `/api/admin/auth/login` | Вход админа |
| `GET` | `/api/admin/bookings` | Все брони |
| `GET` | `/api/admin/bookings/stats/summary` | Статистика броней |
| `PUT` | `/api/admin/bookings/:id/approve` | Одобрить запрос |
| `PUT` | `/api/admin/bookings/:id/reject` | Отклонить запрос |
| `PUT` | `/api/admin/bookings/:id/cancel-by-admin` | Отменить заказ |
| `GET` | `/api/admin/rooms` | Все номера |
| `POST` | `/api/admin/rooms` | Создать номер |
| `PUT` | `/api/admin/rooms/:id` | Обновить номер |
| `DELETE` | `/api/admin/rooms/:id` | Удалить номер |
| `GET` | `/api/admin/regions` | Лимиты регионов |
| `PUT` | `/api/admin/regions/:city` | Изменить лимит |
| `GET` | `/api/admin/checkout/:bookingId` | Данные закрытия |
| `POST` | `/api/admin/checkout/:bookingId` | Закрыть заказ |
| `GET` | `/api/admin/accounting/summary` | Финансовая сводка |
| `GET` | `/api/admin/accounting/export` | CSV export |
| `GET` | `/api/admin/history` | История |

## 10. Состояния бронирования

| Статус | Значение |
|---|---|
| `hold` | Бронь временно удерживается до оплаты |
| `active` | Активная подтверждённая бронь |
| `pending_change` | Пользователь запросил изменение |
| `pending_cancellation` | Пользователь запросил отмену |
| `changed` | Бронь была изменена |
| `cancelled` | Бронь отменена |
| `rejected` | Запрос отклонён |
| `completed` | Заказ закрыт после проживания |

Статусы ограничены на уровне Mongoose:

```js
status: {
  type: String,
  enum: ['hold', 'active', 'pending_change', 'pending_cancellation', 'changed', 'cancelled', 'rejected', 'completed'],
  default: 'active'
}
```

Плюс: в базе не появятся случайные статусы вроде `done`, `finished`, `cancel`.

## 11. Почему код написан именно так

### 11.1 Express вместо тяжёлого full-stack framework

Express выбран потому, что проекту нужны понятные REST endpoints, static files и middleware. Для дипломного проекта это даёт прозрачность: легко показать, где маршрут, где middleware, где модель.

### 11.2 Static frontend вместо React/Vue

Фронтенд сделан на HTML/CSS/vanilla JS. Это решение упрощает деплой и объяснение:

- нет build-пайплайна для интерфейса;
- HTML напрямую отдаётся Express;
- поведение страниц видно в отдельных JS-файлах.

Минус: при дальнейшем росте проекта лучше перейти на компонентный подход, потому что `script.js`, `modals.js`, `dashboard.js` уже крупные.

### 11.3 Отдельные JS-файлы по зонам ответственности

Например:

- `api.js` - только запросы;
- `auth.js` - только вход/регистрация;
- `modals.js` - только модальные окна и бронирование;
- `dashboard.js` - только личный кабинет.

Плюс: проще искать ошибку и объяснять комиссии, где находится конкретная функция.

### 11.4 Админ и пользователь имеют разные модели

Есть `User` и `Admin`:

```js
// shared/schemas/adminSchema.js
role: { type: String, default: 'admin' }
```

```js
// shared/schemas/userSchema.js
role: { type: String, enum: ['user', 'admin'], default: 'user' }
```

Смысл: администратор хранится в отдельной коллекции `admins`, и его вход защищён отдельным `ADMIN_SECRET_CODE`.

## 12. Плюсы проекта

1. Разделение client/admin повышает безопасность и понятность архитектуры.
2. `shared` снижает дублирование схем и валидации.
3. JWT позволяет строить stateless API.
4. bcrypt защищает пароли.
5. MongoDB хорошо подходит для вложенных данных бронирования.
6. Hold-бронирование защищает от оплаты без резерва.
7. TTL-индекс автоматически очищает просроченные временные брони.
8. Региональные лимиты реализуют реальное бизнес-правило.
9. Админ-панель покрывает полный цикл: номера, брони, изменения, отмены, checkout, история, финансы.
10. Prometheus/Grafana показывают, что проект учитывает эксплуатацию, а не только интерфейс.
11. Render config показывает готовность к деплою.
12. CSV export делает систему полезной для отчётности.

## 13. Что сказать комиссии кратко

Проект построен как двухсерверная система на Node.js и Express: пользовательский сайт работает на `Client/server`, административная панель - на `admin/server`. Оба сервера используют общие схемы и валидацию из `shared`, подключаются к одной MongoDB и работают с одними бизнес-сущностями: пользователи, администраторы, номера, бронирования, лимиты регионов и закрытые заказы.

Ключевой сценарий - бронирование номера. Пользователь выбирает номер, город и даты. Сервер проверяет корректность данных, наличие авторизации, пересечение дат и лимит региона. Перед оплатой создаётся временное удержание `hold` на 10 минут, которое автоматически очищается MongoDB через TTL-индекс, если пользователь не завершил оплату. После оплаты бронь становится `active`. Если пользователь хочет изменить или отменить бронь, он отправляет запрос, а администратор принимает решение через админ-панель. После проживания администратор закрывает заказ через checkout, где учитываются стоимость номера, дополнительные услуги, скидка и итоговая сумма.

Такая архитектура выбрана потому, что она разделяет публичный и административный контуры, повторно использует общий код, защищает данные через JWT и bcrypt, учитывает реальные бизнес-ограничения гостиницы и остаётся понятной для разработки, тестирования и демонстрации.

## 14. Замечания по качеству и возможные улучшения

1. В проекте есть mojibake-строки в некоторых русских сообщениях. Функционально это не ломает API, но перед финальной защитой лучше привести все файлы к UTF-8.
2. In-process lock для бронирований подходит для одного Node.js процесса. Для production с несколькими инстансами лучше Redis lock или MongoDB transaction.
3. Сохранённые карты сейчас хранятся как маска и metadata, это лучше, чем полный номер, но для реальной оплаты нужен платёжный провайдер.
4. Загруженные изображения на Render могут пропадать после перезапуска, потому что файловая система ephemeral. Для production лучше S3/Supabase Storage.
5. Большие frontend-файлы можно в будущем разбить на компоненты или перейти на React/Vue.

## 15. Как быстро показать работу на защите

1. Запустить MongoDB:

```bash
docker compose up -d mongodb
```

2. Запустить проект:

```bash
npm start
```

3. Открыть клиент:

```text
http://localhost:3000
```

4. Открыть админку:

```text
http://localhost:3001
```

5. Сценарий демонстрации:

- зарегистрировать пользователя;
- выбрать номер и город;
- показать занятость региона;
- забронировать номер;
- зайти в личный кабинет;
- отправить запрос на изменение/отмену;
- зайти в админку;
- одобрить/отклонить запрос;
- закрыть заказ через checkout;
- открыть бухгалтерию и историю.

