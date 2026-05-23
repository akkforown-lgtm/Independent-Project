const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const User = mongoose.model('User');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Пользователь не найден.' });
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, error: 'Недействительный токен' });
      if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, error: 'Срок действия токена истёк' });
      return res.status(401).json({ success: false, error: 'Ошибка авторизации' });
    }
  }

  if (!token) return res.status(401).json({ success: false, error: 'Нет доступа.' });
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else return res.status(403).json({ success: false, error: 'Доступ запрещён.' });
};

module.exports = { protect, admin };