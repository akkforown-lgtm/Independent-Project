# Hotel Website

Проект `hotel-website` - это сайт отеля Luxury Haven с двумя отдельными Express-серверами:

- `Client/server` - клиентский сайт и API для пользователей, порт `3000`.
- `admin/server` - админ-панель и API для администраторов, порт `3001`.
- `shared` - общие схемы MongoDB, валидация и rate limit.
- `Client/public` и `admin/public` - статические HTML/CSS/JS файлы интерфейса.
- `docker-compose.yml` - MongoDB, Prometheus и Grafana для локального запуска.

## Что нужно установить

1. Node.js `18` или новее.
2. npm, обычно устанавливается вместе с Node.js.
3. Docker Desktop, если MongoDB будет запускаться через `docker-compose`.

Проверка версий:

```bash
node -v
npm -v
docker --version
```

Если в Windows PowerShell команда `npm` выдает ошибку `running scripts is disabled`, используйте `npm.cmd`:

```powershell
npm.cmd -v
npm.cmd run install:all
npm.cmd start
```

Та же проблема обычно не возникает в CMD или Git Bash.

## Быстрый запуск с нуля

Откройте терминал в корне проекта:

```bash
cd C:\Users\sad\Desktop\hotel-website
```

Установите зависимости для `shared`, клиентского и админского серверов:

```bash
npm run install:all
```

Поднимите MongoDB:

```bash
docker compose up -d mongodb
```

Запустите проект:

```bash
npm start
```

После запуска откройте:

- клиентский сайт: `http://localhost:3000`
- админ-панель: `http://localhost:3001`
- клиентский health-check: `http://localhost:3000/api/health`
- админский health-check: `http://localhost:3001/api/admin/health`

Остановить проект можно через `Ctrl+C` в терминале, где запущен `npm start`.

## Как работает `npm start`

В корне проекта добавлен файл `start.js`. Команда:

```bash
npm start
```

запускает сразу два сервера:

- `node Client/server/server.js`
- `node admin/server/server.js`

Вывод каждого сервера помечается префиксом `[client]` или `[admin]`. Если один из серверов аварийно остановится, `start.js` завершит весь запуск, чтобы проект не оставался в частично рабочем состоянии.

Важно: `start.js` не запускает MongoDB сам. MongoDB должна уже работать до запуска серверов.

## Переменные окружения

В проекте уже есть локальные `.env` файлы:

- `Client/server/.env`
- `admin/server/.env`

Клиентский сервер использует:

```env
MONGODB_URI=mongodb://admin:hotelpass2024@localhost:27017/luxury-haven?authSource=admin
JWT_SECRET=hotel-jwt-secret-2024
PORT=3000
NODE_ENV=development
```

Админский сервер использует:

```env
MONGODB_URI=mongodb://admin:hotelpass2024@localhost:27017/luxury-haven?authSource=admin
JWT_SECRET=hotel-jwt-secret-2024
ADMIN_SECRET_CODE=HOTEL2024
PORT=3001
NODE_ENV=development
```

`ADMIN_SECRET_CODE` нужен при регистрации администратора. По текущей конфигурации код администратора:

```text
HOTEL2024
```

Для нового окружения можно взять пример из `.env.example` и перенести значения в `.env` файлы серверов.

## Запуск инфраструктуры

Запустить только MongoDB:

```bash
docker compose up -d mongodb
```

Запустить MongoDB, Prometheus и Grafana:

```bash
docker compose up -d
```

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить сохраненные данные MongoDB/Grafana/Prometheus:

```bash
docker compose down -v
```

## Отдельный запуск серверов

Если нужно запускать части проекта отдельно:

```bash
npm run start:client
npm run start:admin
```

То же самое напрямую из папок:

```bash
cd Client/server
npm start
```

```bash
cd admin/server
npm start
```

## Регистрация и вход

Пользовательский аккаунт создается на клиентском сайте:

```text
http://localhost:3000/register.html
```

Администратор создается на админ-панели:

```text
http://localhost:3001
```

При регистрации администратора используйте секретный код из `admin/server/.env`:

```text
HOTEL2024
```

## Данные при первом запуске

При старте админского сервера проект подключается к MongoDB и проверяет коллекцию комнат. Если комнат меньше 9, запускается `admin/server/seed-rooms.js` и добавляются стандартные номера. Также автоматически создаются лимиты бронирований по городам.

## Частые проблемы

Если появляется ошибка подключения к MongoDB, проверьте, что контейнер запущен:

```bash
docker ps
```

Если контейнера `hotel-mongodb` нет, запустите:

```bash
docker compose up -d mongodb
```

Если `npm start` пишет, что зависимости не установлены, выполните:

```bash
npm run install:all
```

Если порт `3000` или `3001` занят, остановите процесс, который использует порт, или поменяйте `PORT` в соответствующем `.env` файле.

Проверка занятых портов в Windows PowerShell:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

## Полезные адреса

- Клиентский сайт: `http://localhost:3000`
- Админ-панель: `http://localhost:3001`
- Метрики клиентского сервера: `http://localhost:3000/metrics`
- Метрики админского сервера: `http://localhost:3001/metrics`
- Prometheus, если запущен: `http://localhost:9090`
- Grafana, если запущена: `http://localhost:3030`

Логин Grafana из `docker-compose.yml`:

```text
admin
```

Пароль Grafana:

```text
hotelgraf2024
```

## Деплой на Render

В корне проекта добавлен файл `render.yaml` для двух веб-сервисов:

- `luxury-haven-client` — папка `Client/server`
- `luxury-haven-admin` — папка `admin/server`

Каждый сервис билдится командой `npm install` и стартует `npm start`.

### Что нужно настроить в Render

Для каждого сервиса добавьте переменные окружения:

- `MONGODB_URI` — строка подключения к MongoDB
- `JWT_SECRET` — секрет для JWT
- `CORS_ORIGIN` — допустимые адреса фронтенда, например `https://your-client-domain.com,https://your-admin-domain.com`

Дополнительно для админ-сервиса:

- `ADMIN_SECRET_CODE` — код для регистрации администратора

> На Render не задавайте `PORT` вручную. Платформа сама передает рабочий порт через `process.env.PORT`.

### Что важно

- Проект работает с MongoDB, поэтому для Render лучше использовать Managed MongoDB или MongoDB Atlas.
- Админский сервис загружает изображения в локальный каталог `/Client/assets/images`. На Render такие файлы не сохраняются между перезапусками. Для продакшена лучше подключить внешнее хранилище (Supabase Storage, S3 и т.п.).

## Supabase: что подходит, а что нет

На текущей архитектуре проект не может быть полностью перенесен на Supabase без переработки, потому что:

- текущий бэкенд использует MongoDB
- Supabase по умолчанию предоставляет PostgreSQL
- Node.js-сервисы пока не написаны под Supabase Functions

### Что можно использовать из Supabase

- Supabase Storage для хранения изображений вместо локальной папки
- Supabase Auth только после существенной переработки маршрутов

### Рекомендация

Оставьте MongoDB как основной рабочий бэкенд, а Supabase используйте только как внешнее файловое хранилище или как источник данных в будущем после миграции на PostgreSQL.

## Подробная документация API

В документации описаны клиентская и админская стороны, список основных endpoint-ов и формат запросов.

Смотрите `docs/api-endpoints.md` для полного разбора архитектуры и взаимодействия фронтенда с бэкендом.
#   I n d e p e n d e n t - P r o j e c t  
 