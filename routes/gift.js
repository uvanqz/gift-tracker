import express from 'express';
import pool from '../models/db.js';

const router = express.Router();

// // Добавление подарка для конкретного человека
// router.post('/', async (req, res) => {
//     const { personId, giftName } = req.body;
//     const userId = req.session.user.id;

//     try {
//         if (!giftName || giftName.trim() === '') {
//             return res.status(400).send('Название подарка не может быть пустым');
//         }

//         // Проверяем, принадлежит ли personId текущему пользователю
//         const personCheck = await pool.query('SELECT * FROM people WHERE id = $1 AND user_id = $2', [personId, userId]);
        
//         if (personCheck.rows.length === 0) {
//             return res.status(403).send('Вы не можете добавить подарок этому человеку');
//         }
        
//         // Если personId принадлежит пользователю, добавляем подарок
//         await pool.query('INSERT INTO gifts (person_id, gift_name) VALUES ($1, $2)', [personId, giftName]);
//         res.status(201).send('Подарок добавлен');
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Ошибка при добавлении подарка');
//     }
// });


// Добавление подарка для конкретного человека
router.post('/', async (req, res) => {
    const { personId, giftName } = req.body;
    const userId = req.session.user.id;

    if (!giftName || giftName.trim() === '') {
        return res.status(400).send('Название подарка не может быть пустым');
    }

    // Проверяем, принадлежит ли personId текущему пользователю
    const personCheck = await pool.query('SELECT * FROM people WHERE id = $1 AND user_id = $2', [personId, userId]);
    
    if (personCheck.rows.length === 0) {
        return res.status(403).send('Вы не можете добавить подарок этому человеку');
    }
    
    // Если personId принадлежит пользователю, добавляем подарок
    const result = await pool.query('INSERT INTO gifts (person_id, gift_name) VALUES ($1, $2) RETURNING *', [personId, giftName]);
    
    const newGift = result.rows[0];
    res.status(201).json({ message: 'Подарок добавлен', id: newGift.id });
});


// Получение списка подарков для конкретного человека
router.get('/:personId', async (req, res) => {
    const personId = req.params.personId;
    const result = await pool.query('SELECT * FROM gifts WHERE person_id = $1', [personId]);

    if (result.rows.length === 0) {
        return res.status(404).send('Нет подарков для этого человека');
    }

    res.json(result.rows);
});

// Обновление статуса подарка
router.put('/:id', async (req, res) => {
    const giftId = req.params.id;
    const isCompleted = req.body.isCompleted === true;

    const result = await pool.query('UPDATE gifts SET is_completed = $1 WHERE id = $2 RETURNING *', [isCompleted, giftId]);
    
    if (result.rowCount === 0) {
        return res.status(404).send('Подарок не найден или уже был удален');
    }

    res.send('Статус подарка обновлен');
});

// Удаление подарка
router.delete('/:id', async (req, res) => {
const giftId = req.params.id;
    const result = await pool.query('DELETE FROM gifts WHERE id = $1 RETURNING *', [giftId]);

    if (result.rowCount === 0) {
        return res.status(404).send('Подарок не найден или уже был удален');
    }

    res.send('Подарок удален');
});


export default router;
