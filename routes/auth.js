import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../models/db.js';
import errorHandler from '../middleware/errorHandler.js';

const router = express.Router();

const validateUserData = (req, res, next) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });
    }
    next();
};

// Маршрут регистрации
router.post('/register', validateUserData, async (req, res, next) => {
    const { username, password, role = 'user' } = req.body;
    try {
        const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Пользователь уже существует.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [username, hashedPassword, role]);
        res.status(201).json({ message: 'Пользователь зарегистрирован' });
    } catch (error) {
        next(new Error('Ошибка при регистрации. Попробуйте снова.'));
    }
});

// Маршрут входа
router.post('/login', validateUserData, async (req, res, next) => {
    const { username, password } = req.body;
    try {
        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Неверные имя пользователя или пароль' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Неверные имя пользователя или пароль' });
        }

        req.session.user = { id: user.rows[0].id, role: user.rows[0].role };
        res.json({ message: 'Вход выполнен успешно', role: user.rows[0].role });
    } catch (error) {
        next(new Error('Ошибка при входе. Попробуйте снова.'));
    }
});

// Маршрут выхода
router.post('/logout', (req, res, next) => {
    req.session.destroy(err => {
        // if (err) {
        //     return next(new Error('Ошибка при выходе.'));
        // }
        res.json({ message: 'Вы вышли из системы' });
    });
});

router.use(errorHandler);

export default router;
