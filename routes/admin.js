import express from 'express';
import pool from '../models/db.js';
import bcrypt from 'bcryptjs';
import { checkAdminRole } from '../middleware/checkAdmin.js';

const router = express.Router();

// Получение списка всех пользователей
router.get('/users', checkAdminRole, async (req, res) => {
    try {
        const users = await pool.query('SELECT * FROM users');
        res.json(users.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Ошибка при получении списка пользователей. Пожалуйста, попробуйте позже.');
    }
});

// Создание нового пользователя
router.post('/users', checkAdminRole, async (req, res, next) => {
    const { username, password, role = 'user' } = req.body;
    if (!username || !password) {
        return res.status(400).send('Пожалуйста, укажите имя пользователя и пароль.');
    }

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).send('Пользователь с таким именем уже существует.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role]
        );

        const newUser = result.rows[0];
        res.status(201).json(newUser);
    } catch (error) {
        if (error.code === '100') {
            console.error('Ошибка транзакции при создании пользователя:', error.message);
            return res.status(500).send('Ошибка при создании пользователя. Повторите попытку позже.');
        }
        next(error);
    }
});


// Удаление пользователя
router.delete('/users/:id', checkAdminRole, async (req, res) => {
    const userId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).send('Пользователь с указанным ID не найден.');
        }
        res.send('Пользователь удален');
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('Ошибка при удалении пользователя. Пожалуйста, попробуйте позже.');
    }
});

// Получение всех записей людей
router.get('/people', checkAdminRole, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM people');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching people:', error);
        res.status(500).send('Ошибка при получении списка людей. Пожалуйста, попробуйте позже.');
    }
});

// Создание нового человека, привязанного к указанному пользователю
router.post('/people', checkAdminRole, async (req, res) => {
    const { userId, name } = req.body;

    if (!userId) {
        return res.status(400).send('Необходимо указать userId для привязки человека к пользователю.');
    }

    if (!name || name.trim() === '') {
        return res.status(400).send('Необходимо указать имя для человека.');
    }

    try {
        // Проверка, существует ли пользователь с таким userId
        const userExists = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
            return res.status(404).send('Пользователь с указанным ID не существует.');
        }

        const newPerson = await pool.query(
            'INSERT INTO people (user_id, name) VALUES ($1, $2) RETURNING *',
            [userId, name]
        );
        res.status(201).json(newPerson.rows[0]);
    } catch (error) {
        console.error('Error creating person:', error);
        res.status(500).send('Ошибка при создании человека. Пожалуйста, попробуйте позже.');
    }
});

// Удаление человека
router.delete('/people/:id', checkAdminRole, async (req, res) => {
    const personId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM people WHERE id = $1', [personId]);
        if (result.rowCount === 0) {
            return res.status(404).send('Человек с указанным ID не найден.');
        }
        res.send('Человек удален');
    } catch (error) {
        console.error('Error deleting person:', error);
        res.status(500).send('Ошибка при удалении человека. Пожалуйста, попробуйте позже.');
    }
});

// Получение всех подарков
router.get('/gifts', checkAdminRole, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gifts');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching gifts:', error);
        res.status(500).send('Ошибка при получении списка подарков. Пожалуйста, попробуйте позже.');
    }
});

// Создание нового подарка для конкретного человека
router.post('/gifts', checkAdminRole, async (req, res) => {
    const { personId, giftName, isCompleted = false } = req.body;
    if (!personId || !giftName) {
        return res.status(400).send('Необходимо указать personId и название подарка.');
    }

    try {
        // Проверка, существует ли человек с таким personId
        const personExists = await pool.query('SELECT * FROM people WHERE id = $1', [personId]);
        if (personExists.rows.length === 0) {
            return res.status(404).send('Человек с указанным ID не существует.');
        }

        const newGift = await pool.query(
            'INSERT INTO gifts (person_id, gift_name, is_completed) VALUES ($1, $2, $3) RETURNING *',
            [personId, giftName, isCompleted]
        );
        res.status(201).json(newGift.rows[0]);
    } catch (error) {
        console.error('Error creating gift:', error);
        res.status(500).send('Ошибка при создании подарка. Пожалуйста, попробуйте позже.');
    }
});
    
// Изменение статуса подарка
router.put('/gifts/:id', checkAdminRole, async (req, res) => {
    const giftId = req.params.id;
    const { isCompleted } = req.body;
    if (isCompleted === undefined) {
        return res.status(400).send('Необходимо указать новый статус подарка.');
    }

    try {
        const result = await pool.query('UPDATE gifts SET is_completed = $1 WHERE id = $2 RETURNING *', [isCompleted, giftId]);
        if (result.rowCount === 0) {
            return res.status(404).send('Подарок с указанным ID не найден.');
        }
        res.send('Статус подарка обновлен');
    } catch (error) {
        console.error('Error updating gift status:', error);
        res.status(500).send('Ошибка при обновлении статуса подарка. Пожалуйста, попробуйте позже.');
    }
});

// Удаление подарка
router.delete('/gifts/:id', checkAdminRole, async (req, res) => {
    const giftId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM gifts WHERE id = $1', [giftId]);
        if (result.rowCount === 0) {
            return res.status(404).send('Подарок с указанным ID не найден.');
        }
        res.send('Подарок удален');
    } catch (error) {
        console.error('Error deleting gift:', error);
        res.status(500).send('Ошибка при удалении подарка. Пожалуйста, попробуйте позже.');
    }
});

export default router;
