# Деплой проекта Luxury Haven

## Render

Этот репозиторий уже содержит `render.yaml` с двумя сервисами:

- `luxury-haven-client` — папка `Client/server`
- `luxury-haven-admin` — папка `admin/server`

Каждый сервис использует Node.js и запускается командой `npm start`.

### Шаги

1. Зарегистрируйтесь в Render и подключите репозиторий.
2. Разрешите Render читать ветку `main`.
3. Для каждого сервиса выберите соответствующую папку:
   - `Client/server`
   - `admin/server`
4. В Render задайте переменные окружения для каждого сервиса.

### Переменные окружения

Для клиентского сервиса:

- `MONGODB_URI`
- `JWT_SECRET`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://<client-domain>,https://<admin-domain>`

Для админского сервиса:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_SECRET_CODE`
- `NODE_ENV=production`
- `CORS_ORIGIN=https://<client-domain>,https://<admin-domain>`

> На Render не задавайте `PORT` вручную. Платформа сама передает рабочий порт через переменную среды `PORT`.

### Пример строки Atlas

`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority`

### Важно

- Проект рассчитан на MongoDB. Render сам не предоставляет MongoDB бесплатно, поэтому используйте Render Managed Database, MongoDB Atlas или другой провайдер MongoDB.
- Локальные файлы, загружаемые админом, хранятся в `Client/assets/images`. Это временно и не будет сохраняться между деплоем/перезапуском в Render.

## Supabase

### Текущее ограничение

Проект не готов к прямому деплою на Supabase как полноценный backend, потому что:

- серверная часть написана под MongoDB
- Supabase использует PostgreSQL
- нет готовой миграции данных и схем на PostgreSQL

### Что можно использовать

- Supabase Storage для хранения загруженных изображений
- Supabase как статический хост, если отделить фронтенд от сервера

### Рекомендация

1. Разверните backend на Render или MongoDB Atlas.
2. Используйте Supabase только как дополнительное хранилище файлов или систему аутентификации после рефакторинга.

## Примеры файлов `.env`

- `Client/server/.env.example`
- `admin/server/.env.example`

Скопируйте соответствующий файл в `.env` и заполните реальные значения.
