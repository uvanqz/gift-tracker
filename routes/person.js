import express from 'express';
import pool from '../models/db.js';

const router = express.Router();

// Добавление нового человека
router.post('/', async (req, res) => {
    // Проверка на наличие сессии
    if (!req.session.user) {
        return res.status(401).json({ error: 'Необходима аутентификация' });
    }

    const userId = req.session.user.id;
    const { name } = req.body;

    // Проверка на пустое имя
    if (!name || name.trim() === '') {
        return res.status(400).json({ error: 'Имя человека не может быть пустым' });
    }

    try {
        const newPerson = await pool.query('INSERT INTO people (user_id, name) VALUES ($1, $2) RETURNING *', [userId, name]);
        res.status(201).json({ message: 'Человек успешно добавлен', person: newPerson.rows[0] });
    } catch (error) {
        console.error('Ошибка при добавлении человека:', error.message);
        res.status(500).json({ error: 'Ошибка при создании человека', details: error.message });
    }
});

// Получение списка людей для текущего пользователя
router.get('/', async (req, res) => {
    const userId = req.session.user.id;
    try {
        const result = await pool.query('SELECT * FROM people WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Список людей пуст' });
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка при получении списка людей:', error.message);
        res.status(500).json({ error: 'Ошибка при получении списка людей', details: error.message });
    }
});

// Удаление человека
router.delete('/:id', async (req, res) => {
    const personId = req.params.id;
    try {
        const result = await pool.query('DELETE FROM people WHERE id = $1 RETURNING *', [personId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Человек не найден' });
        }

        res.json({ message: 'Человек успешно удален', deletedPerson: result.rows[0] });
    } catch (error) {
        console.error('Ошибка при удалении человека:', error.message);
        res.status(500).json({ error: 'Ошибка при удалении человека', details: error.message });
    }
});

export default router;
