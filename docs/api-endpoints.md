# API и архитектура проекта

## Общая структура

Проект `hotel-website` состоит из двух отдельных приложений:

- `Client`: клиентская часть для гостей отеля, включая сайт и API.
- `admin`: административная панель для менеджеров отеля, включая свой сервер и API.
- `shared`: общие схемы, валидация и rate limiting для обеих частей.

Каждая часть запускается собственным Express-сервером:

- Клиентский сервер: `Client/server/server.js` на порту `3000`.
- Админский сервер: `admin/server/server.js` на порту `3001`.

## Как связаны фронтенд и API

### Клиент

- Статические файлы находятся в `Client/public`.
- Общий API-клиент находится в `Client/public/js/api.js`.
- В `api.js` базовый URL определяется по текущему хосту:
  - `http://localhost:3000/api` в локальной разработке.
  - `https://<текущий-хост>/api` в продакшене.
- Фронтенд вызывает серверные маршруты через `window.api`.

### Админка

- Статические файлы находятся в `admin/public`.
- Общий API-клиент находится в `admin/public/js/admin-api.js`.
- Админская страница регистрации/входа использует динамический URL из `getAdminApiBaseUrl()`.
- В локальной разработке базовый URL: `http://localhost:3001/api/admin`.
- В продакшене используется тот же хост, что и админ-панель.

## Основные client endpoint-ы

### Аутентификация

- `POST /api/auth/register`
  - Создает нового пользователя.
  - Тело запроса:
    - `firstName`, `lastName`, `email`, `phone`, `password`
  - Ответ:
    - `success`, `token`, `user`

- `POST /api/auth/login`
  - Вход пользователя.
  - Тело запроса:
    - `email`, `password`
  - Ответ:
    - `success`, `token`, `user`

- `GET /api/auth/profile`
  - Возвращает профиль текущего пользователя.
  - Требует заголовок `Authorization: Bearer <token>`.
  - Ответ: объект пользователя.

- `PUT /api/auth/profile`
  - Обновление профиля.
  - Тело запроса:
    - `firstName`, `lastName`, `phone`
  - Требует токен.

### Карты оплаты

- `GET /api/auth/cards`
  - Получить сохраненные карты пользователя.

- `POST /api/auth/cards`
  - Сохранить карту.
  - Тело запроса:
    - `cardNumber`, `expiry`, `brand`

- `DELETE /api/auth/cards/:cardId`
  - Удалить карту по ID.

### Номера

- `GET /api/rooms`
  - Получает список доступных номеров.

- `GET /api/rooms/:id`
  - Детали одного номера.

### Бронирования

- `POST /api/bookings`
  - Создает бронирование для авторизованного пользователя.
  - Тело запроса:
    - `roomName`, `roomPrice`, `roomCategory`, `city`, `checkIn`, `checkOut`, `nights`, `totalPrice`

- `GET /api/bookings/region-status?city=...&checkIn=...&checkOut=...`
  - Проверка доступности региона по датам.

- `GET /api/bookings/room-status?roomName=...&city=...`
  - Проверка занятости конкретной комнаты.

- `GET /api/bookings/my`
  - Список броней текущего пользователя.

- `GET /api/bookings/:id`
  - Детали конкретного бронирования пользователя.

- `PUT /api/bookings/:id/change-request`
  - Запрос на изменение бронирования.

- `PUT /api/bookings/:id/cancel-request`
  - Запрос на отмену бронирования.

- `GET /api/bookings/:id/notifications`
  - Получить уведомления по бронированию.

## Основные admin endpoint-ы

### Аутентификация

- `POST /api/admin/auth/register`
  - Регистрация администратора.
  - Тело запроса:
    - `firstName`, `lastName`, `email`, `phone`, `password`, `adminCode`
  - `adminCode` должен совпадать с `ADMIN_SECRET_CODE` из `admin/server/.env`.

- `POST /api/admin/auth/login`
  - Вход администратора.
  - Тело запроса:
    - `email`, `password`

- `GET /api/admin/auth/profile`
  - Возвращает профиль текущего администратора.
  - Требует заголовок `Authorization: Bearer <token>`.

### Управление бронированиями

- `GET /api/admin/bookings`
  - Получает все бронирования.
  - Возвращает данные пользователя (`user`) через `populate`.

- `GET /api/admin/bookings/:id`
  - Детали бронирования.

- `PUT /api/admin/bookings/:id/approve`
  - Одобрить изменение или отмену бронирования.

- `PUT /api/admin/bookings/:id/reject`
  - Отклонить запрос на изменение или отмену.

- `PUT /api/admin/bookings/:id/cancel-by-admin`
  - Отменить бронирование вручную из админки.

- `GET /api/admin/bookings/stats/summary`
  - Общая статистика бронирований для дашборда.

### Комнаты

- `GET /api/admin/rooms`
  - Получает все номера.

- `GET /api/admin/rooms/:id`
  - Детали номера.

- `POST /api/admin/rooms`
  - Создает новый номер.

- `PUT /api/admin/rooms/:id`
  - Обновляет номер.

- `DELETE /api/admin/rooms/:id`
  - Удаляет номер.

- `POST /api/admin/upload`
  - Загрузка изображения номера.
  - Возвращает URL: `/assets/images/<filename>`.

### Регионы

- `GET /api/admin/regions`
  - Получает лимиты бронирований по городам.

- `PUT /api/admin/regions/:city`
  - Обновляет лимит бронирований для города.
  - Тело запроса:
    - `maxBookings`

### Checkout и история

- `GET /api/admin/checkout/:bookingId`
  - Получает информацию по оплате для бронирования.

- `POST /api/admin/checkout/:bookingId`
  - Сохраняет данные по оплате и завершает бронирование.

- `GET /api/admin/history`
  - Получает историю завершённых или отменённых заказов.

## Особенности и точки внимания

- `Client` и `admin` используют одну MongoDB, поэтому все данные бронирований, пользователей и номеров синхронизированы между приложениями.
- Общие схемы лежат в `shared/schemas`, а валидация — в `shared/validation.js`.
- `admin/server/server.js` автоматически заполняет базу стандартными номерами и лимитами регионов при старте.
- Для всех защищенных запросов нужно передавать JWT-токен в заголовке `Authorization`.

## Быстрый пример вызова из браузера

### Клиент

```js
await window.api.login({ email: 'user@example.com', password: '123456' });
const profile = await window.api.getProfile();
const rooms = await window.api.getRooms();
```

### Админ

```js
const API_URL = 'http://localhost:3001/api/admin';
const token = localStorage.getItem('adminToken');
await fetch(`${API_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@example.com', password: '123456' })
});
```
