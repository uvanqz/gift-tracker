import request from 'supertest';
import app from '../app.js';
import pool from '../models/db.js';
import server from '../app.js';

describe('Gift Routes', () => {
    let testSession;
    let testPersonId;
    let testGiftId;

    beforeAll(async () => {
        const userResponse = await request(app)
            .post('/auth/register')
            .send({ username: 'testuser', password: 'password123' });

        testSession = request.agent(app);
        await testSession
            .post('/auth/login')
            .send({ username: 'testuser', password: 'password123' });

        const personResponse = await testSession
            .post('/person')
            .send({ name: 'John Doe' });

        testPersonId = personResponse.body.person?.id;
        expect(testPersonId).toBeDefined();  // Проверяем, что ID человека определен
    });

    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
        await pool.end();
        if (server.listening) {
            server.close();
        }
    });

    it('should add a new gift for a person', async () => {
        const response = await testSession
            .post('/gifts')
            .send({ personId: testPersonId, giftName: 'Laptop' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Подарок добавлен');
        expect(response.body).toHaveProperty('id');  // Проверяем, что id подарка возвращен
        testGiftId = response.body.id;  // Сохраняем id подарка для следующих тестов
    });

    it('should update the status of a gift', async () => {
        const response = await testSession
            .put(`/gifts/${testGiftId}`)
            .send({ isCompleted: true });

        expect(response.status).toBe(200);
        expect(response.text).toBe('Статус подарка обновлен');
    });

    it('should return 404 if gift not found during update', async () => {
        const response = await testSession
            .put('/gifts/999999')
            .send({ isCompleted: true });

        expect(response.status).toBe(404);
        expect(response.text).toBe('Подарок не найден или уже был удален');
    });

    it('should delete a gift', async () => {
        const response = await testSession.delete(`/gifts/${testGiftId}`);

        expect(response.status).toBe(200);
        expect(response.text).toBe('Подарок удален');
    });

    it('should return 404 if gift not found during deletion', async () => {
        const response = await testSession.delete('/gifts/999999');

        expect(response.status).toBe(404);
        expect(response.text).toBe('Подарок не найден или уже был удален');
    });

    it('should return 400 if gift name is missing when adding a gift', async () => {
        const response = await testSession
            .post('/gifts')
            .send({ personId: testPersonId, giftName: '' });

        expect(response.status).toBe(400);
        expect(response.text).toBe('Название подарка не может быть пустым');
    });

    it('should return 403 if trying to add a gift for a person not owned by the user', async () => {
        const secondUserResponse = await request(app)
            .post('/auth/register')
            .send({ username: 'seconduser', password: 'password123' });

        const secondUserSession = request.agent(app);
        await secondUserSession
            .post('/auth/login')
            .send({ username: 'seconduser', password: 'password123' });

        const response = await secondUserSession
            .post('/gifts')
            .send({ personId: testPersonId, giftName: 'Gift from second user' });

        expect(response.status).toBe(403);
        expect(response.text).toBe('Вы не можете добавить подарок этому человеку');
    });
    it('should return 400 if gift name is null', async () => {
        const response = await testSession
            .post('/gifts')
            .send({ personId: testPersonId, giftName: null });
    
        expect(response.status).toBe(400);
        expect(response.text).toBe('Название подарка не может быть пустым');
    });
    
    
}, 10000);
