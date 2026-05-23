# 🚀 Инструкция по деплою на Render + MongoDB Atlas

## 1️⃣ MongoDB Atlas (база данных)

### Шаг 1: Создание кластера

1. Перейдите на https://www.mongodb.com/cloud/atlas
2. Зарегистрируйтесь или войдите в аккаунт
3. Нажмите **Create** → **Create Deployment**
4. Выберите **M0 (FREE)** для бесплатного кластера
5. Выберите регион (например, `Ireland` или ближайший к вам)
6. Нажмите **Create Deployment**

### Шаг 2: Настройка доступа

1. Перейдите в **Security** → **Network Access**
2. Нажмите **Add IP Address**
3. Выберите **Allow access from anywhere** (для разработки)
4. Подтвердите

### Шаг 3: Создание пользователя БД

1. Перейдите в **Security** → **Database Access**
2. Нажмите **Add New Database User**
3. Создайте пользователя:
   - Username: `admin`
   - Password: сгенерируйте сложный пароль
   - Authentication Database: `admin`
4. Нажмите **Add User**

### Шаг 4: Получение строки подключения

1. Вернитесь на вкладку **Databases**
2. Нажмите на свой кластер **Connect**
3. Выберите **Drivers** → **Node.js** → версия `5.9 or later`
4. Скопируйте строку подключения, например:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Замените `<password>` на пароль, который вы создали

---

## 2️⃣ Render (хостинг)

### Шаг 1: Подключение GitHub-репозитория

1. Перейдите на https://render.com
2. Нажмите **New +** → **Web Service**
3. Выберите **Deploy an existing repository from GitHub**
4. Найдите репозиторий `Independent-Project` и нажмите **Connect**

### Шаг 2: Создание первого сервиса (Client)

На странице создания сервиса заполните:

- **Name**: `luxury-haven-client`
- **Environment**: `Node`
- **Region**: `Oregon` (или ближайший)
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Root Directory**: `Client/server`

### Шаг 3: Добавление переменных окружения

Нажмите **Advanced** и добавьте переменные:

```
MONGODB_URI = mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/luxury-haven?retryWrites=true&w=majority
JWT_SECRET = your-super-secret-jwt-key-2024
NODE_ENV = production
CORS_ORIGIN = https://luxury-haven-client.onrender.com,https://luxury-haven-admin.onrender.com
```

> **CORS_ORIGIN**: замените на реальные домены Render (будут такого формата: `https://service-name.onrender.com`)

### Шаг 4: Деплой

Нажмите **Create Web Service** и дождитесь завершения (обычно 2-3 минуты).

### Шаг 5: Создание второго сервиса (Admin)

Повторите шаги 1-4 для админского сервиса:

- **Name**: `luxury-haven-admin`
- **Root Directory**: `admin/server`

Переменные окружения:

```
MONGODB_URI = mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/luxury-haven?retryWrites=true&w=majority
JWT_SECRET = your-super-secret-jwt-key-2024
ADMIN_SECRET_CODE = HOTEL2024
NODE_ENV = production
CORS_ORIGIN = https://luxury-haven-client.onrender.com,https://luxury-haven-admin.onrender.com
```

---

## 3️⃣ Обновление CORS после развертывания

Когда Render выдаст вам URL-адреса сервисов (например, `https://luxury-haven-client.onrender.com`), обновите:

1. В `luxury-haven-client` переменную `CORS_ORIGIN`:
   ```
   https://luxury-haven-client.onrender.com,https://luxury-haven-admin.onrender.com
   ```

2. В `luxury-haven-admin` ту же переменную.

3. Нажмите **Redeploy** для каждого сервиса.

---

## 4️⃣ Первый запуск

### Клиентский сайт

```
https://luxury-haven-client.onrender.com
```

### Админ-панель

```
https://luxury-haven-admin.onrender.com
```

### Здоровье сервисов

- Клиент: https://luxury-haven-client.onrender.com/api/health
- Админ: https://luxury-haven-admin.onrender.com/api/admin/health

---

## 5️⃣ Регистрация

### Клиентский аккаунт

1. Перейдите на сайт клиента
2. Нажмите **Register**
3. Создайте аккаунт (email + пароль)

### Админский аккаунт

1. Перейдите в админ-панель
2. Нажмите **Register**
3. Используйте код: `HOTEL2024` (из `ADMIN_SECRET_CODE`)

---

## ❌ Часто встречающиеся ошибки

### "Cannot GET /"

**Причина**: CORS не настроен, или браузер блокирует запрос.

**Решение**:
1. Проверьте, что `CORS_ORIGIN` включает ваш домен
2. Очистите кеш браузера (Ctrl+Shift+Delete)
3. Нажмите **Redeploy** в Render

### "MongoDB connection refused"

**Причина**: Неправильная строка `MONGODB_URI` или IP не разрешен.

**Решение**:
1. Проверьте `MONGODB_URI` в Atlas
2. Убедитесь, что IP разрешен в **Network Access**
3. Перезагрузите сервис в Render

### "404 Not Found"

**Причина**: Фронтенд не обслуживается или неправильный path.

**Решение**:
1. Проверьте `Root Directory` (должен быть `Client/server` или `admin/server`)
2. Проверьте, что `npm install` успешно завершился

---

## 📝 Полезные ссылки

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Render Web Services](https://render.com/docs/web-services)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-web-app/)

## 💬 Нужна помощь?

Если что-то не работает, проверьте логи:

1. **Render**: нажмите на сервис → **Logs**
2. **MongoDB Atlas**: перейдите в **Project** → **Activity Feed**
