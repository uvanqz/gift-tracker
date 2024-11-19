import request from 'supertest';
import app from '../app.js';
import pool from '../models/db.js';
import bcrypt from 'bcryptjs';

describe('Admin User Routes', () => {
    let adminSession, userSession, createdUser, createdPerson, createdGift;

    beforeAll(async () => {
        // Создание администратора и пользователя
        await pool.query(`
            INSERT INTO users (username, password, role) 
            VALUES ('admin', $1, 'admin')`, 
            [await bcrypt.hash('adminpassword', 10)]
        );
        await pool.query(`
            INSERT INTO users (username, password, role) 
            VALUES ('user', $1, 'user')`, 
            [await bcrypt.hash('userpassword', 10)]
        );

        // Создаем сессии для администратора и пользователя
        adminSession = request.agent(app);
        await adminSession.post('/auth/login').send({ username: 'admin', password: 'adminpassword' });

        userSession = request.agent(app);
        await userSession.post('/auth/login').send({ username: 'user', password: 'userpassword' });
    });

    afterAll(async () => {
        // Удаляем тестовых пользователей и закрываем пул соединений
        await pool.query('DELETE FROM users WHERE username IN ($1, $2)', ['admin', 'user']);
        await pool.end();
    });

    describe('GET /admin/users', () => {
        it('should allow admin to fetch all users', async () => {
            const response = await adminSession.get('/admin/users');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
        it('should return 404 if user not found', async () => {
            const response = await adminSession.delete('/admin/users/9999');
            expect(response.status).toBe(404);
            expect(response.text).toBe('Пользователь с указанным ID не найден.');
        });
        
    });

    describe('POST /admin/users', () => {
        it('should allow admin to create a new user', async () => {
            const response = await adminSession.post('/admin/users').send({
                username: 'newUser',
                password: 'newUserPassword',
                role: 'user'
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            createdUser = response.body;
        });

        it('should not allow user creation without username or password', async () => {
            const response = await adminSession.post('/admin/users').send({ username: '', password: 'password' });
            expect(response.status).toBe(400);
        });

        it('should not allow creation of a user with an existing username', async () => {
            const response = await adminSession.post('/admin/users').send({
                username: 'newUser',
                password: 'newUserPassword',
                role: 'user'
            });
            expect(response.status).toBe(400);
        });
    });

    describe('DELETE /admin/users/:id', () => {
        it('should allow admin to delete a user', async () => {
            const response = await adminSession.delete(`/admin/users/${createdUser.id}`);
            expect(response.status).toBe(200);
        });

        it('should return 404 if user not found', async () => {
            const response = await adminSession.delete('/admin/users/9999');
            expect(response.status).toBe(404);
        });
    });

    describe('GET /admin/people', () => {
        it('should allow admin to fetch all people', async () => {
            const response = await adminSession.get('/admin/people');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
        });
    });

    describe('POST /admin/people', () => {
        it('should allow admin to create a new person', async () => {
            const response = await adminSession.post('/admin/people').send({
                userId: createdUser.id,
                name: 'John Doe'
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            createdPerson = response.body;
        });

        it('should not allow creation of person without name', async () => {
            const response = await adminSession.post('/admin/people').send({
                userId: createdUser.id,
                name: ''
            });
            expect(response.status).toBe(400);
        });

        it('should not allow creation of person with non-existent userId', async () => {
            const response = await adminSession.post('/admin/people').send({
                userId: 9999,
                name: 'Jane Doe'
            });
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /admin/people/:id', () => {
        it('should allow admin to delete a person', async () => {
            const response = await adminSession.delete(`/admin/people/${createdPerson.id}`);
            expect(response.status).toBe(200);
        });

        it('should return 404 if person not found', async () => {
            const response = await adminSession.delete('/admin/people/9999');
            expect(response.status).toBe(404);
        });
    });

    describe('POST /admin/gifts', () => {
        it('should allow admin to create a new gift', async () => {
            const response = await adminSession.post('/admin/gifts').send({
                personId: createdPerson.id,
                giftName: 'Gift 1',
                isCompleted: false
            });
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            createdGift = response.body;
        });

        it('should not allow creation of gift without personId or giftName', async () => {
            const response = await adminSession.post('/admin/gifts').send({
                personId: '',
                giftName: 'Gift 1'
            });
            expect(response.status).toBe(400);
        });

        it('should not allow creation of gift for non-existent personId', async () => {
            const response = await adminSession.post('/admin/gifts').send({
                personId: 9999,
                giftName: 'Gift 2'
            });
            expect(response.status).toBe(404);
        });
    });

    describe('PUT /admin/gifts/:id', () => {
        it('should allow admin to update the status of a gift', async () => {
            const response = await adminSession.put(`/admin/gifts/${createdGift.id}`).send({
                isCompleted: true
            });
            expect(response.status).toBe(200);
        });

        it('should return 404 if gift not found', async () => {
            const response = await adminSession.put('/admin/gifts/9999').send({
                isCompleted: true
            });
            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /admin/gifts/:id', () => {
        it('should allow admin to delete a gift', async () => {
            const response = await adminSession.delete(`/admin/gifts/${createdGift.id}`);
            expect(response.status).toBe(200);
        });

        it('should return 404 if gift not found', async () => {
            const response = await adminSession.delete('/admin/gifts/9999');
            expect(response.status).toBe(404);
        });
    });
    
    describe('Database Setup', () => {
        it('should have a users table', async () => {
            const result = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");
            expect(result.rows.length).toBeGreaterThan(0);
        });
    });
    
});
