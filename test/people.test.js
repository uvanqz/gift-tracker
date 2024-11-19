import request from 'supertest';
import app from '../app.js';
import pool from '../models/db.js';
import server from '../app.js';

describe('People Routes', () => {
    let testSession;
    let testPersonId;

    beforeAll(async () => {
        const userResponse = await request(app)
            .post('/auth/register')
            .send({ username: 'testuser', password: 'password123' });

        testSession = request.agent(app);
        await testSession
            .post('/auth/login')
            .send({ username: 'testuser', password: 'password123' });
    });

    afterAll(async () => {
        await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
        await pool.end();
        server.close();  // Завершаем сервер
    });

    it('should add a new person', async () => {
        const response = await testSession
            .post('/person')
            .send({ name: 'John Doe' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Человек успешно добавлен');
        expect(response.body.person).toHaveProperty('id');
        expect(response.body.person.name).toBe('John Doe');
        testPersonId = response.body.person.id;
    });

    it('should return a list of people for the user', async () => {
        const response = await testSession.get('/person');

        expect(response.status).toBe(200);
        expect(response.body).toBeInstanceOf(Array);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('name', 'John Doe');
    });

    it('should delete a person', async () => {
        const response = await testSession.delete(`/person/${testPersonId}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Человек успешно удален');
        expect(response.body.deletedPerson.id).toBe(testPersonId);
    });

    it('should return 404 if person not found during deletion', async () => {
        const response = await testSession.delete('/person/999999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Человек не найден');
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .post('/person')
            .send({ name: 'Jane Doe' });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Необходима аутентификация');
    });

    it('should return 400 if name is missing when adding a person', async () => {
        const response = await testSession.post('/person').send({ name: '' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Имя человека не может быть пустым');
    });

    it('should return 400 if name is just spaces', async () => {
        const response = await testSession.post('/person').send({ name: '   ' });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Имя человека не может быть пустым');
    });

    // Мокаем ошибку базы данных вручную
    it('should handle server error during person creation', async () => {
        // Здесь мы просто передаем ошибку при запросе к базе данных вручную
        const originalQuery = pool.query;
        pool.query = async () => {
            throw new Error('Database error');
        };

        const response = await testSession
            .post('/person')
            .send({ name: 'Server Error Person' });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Ошибка при создании человека');
        expect(response.body.details).toBe('Database error');

        // Восстановление оригинальной функции
        pool.query = originalQuery;
    });

    // Мокаем ошибку базы данных вручную для получения списка людей
    it('should handle server error during person retrieval', async () => {
        const originalQuery = pool.query;
        pool.query = async () => {
            throw new Error('Database error');
        };

        const response = await testSession.get('/person');

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Ошибка при получении списка людей');
        expect(response.body.details).toBe('Database error');

        pool.query = originalQuery;
    });

    // Мокаем ошибку базы данных вручную для удаления человека
    it('should handle server error during person deletion', async () => {
        const originalQuery = pool.query;
        pool.query = async () => {
            throw new Error('Database error');
        };

        const response = await testSession.delete(`/person/${testPersonId}`);

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Ошибка при удалении человека');
        expect(response.body.details).toBe('Database error');

        pool.query = originalQuery;
    });
});
