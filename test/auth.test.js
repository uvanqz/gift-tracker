import request from 'supertest';
import app from '../app.js';
import pool from '../models/db.js';
import server from '../app.js';
import jest from 'jest';


describe('Authentication Routes', () => {
  beforeAll(async () => {
    // Удаляем testuser перед тестами, чтобы избежать конфликтов
    await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
  });

  afterAll(async () => {
    // Удаляем testuser после тестов и закрываем пул соединений
    await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
    await pool.end();
  });

  it('should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Пользователь зарегистрирован');
  });

  it('should login a user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Вход выполнен успешно');
  });

  it('should return 400 for invalid login credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'wronguser', password: 'wrongpassword' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Неверные имя пользователя или пароль');
  });

  it('should return 400 if username is missing during registration', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Имя пользователя и пароль обязательны');
  });

  it('should return 400 if password is missing during registration', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Имя пользователя и пароль обязательны');
  });

  it('should return 400 if user already exists during registration', async () => {
    // Регистрация пользователя
    await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    const response = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Пользователь уже существует.');
  });

  it('should login successfully after registration', async () => {
    // Регистрация пользователя
    await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });

    // Логин того же пользователя
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Вход выполнен успешно');
  });

  it('should return 400 if username is incorrect during login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'wronguser', password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Неверные имя пользователя или пароль');
  });

  it('should return 400 if password is incorrect during login', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpassword' });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Неверные имя пользователя или пароль');
  });

  it('should logout successfully', async () => {
    // Сначала выполняем логин
    await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password123' });

    const response = await request(app)
      .post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Вы вышли из системы');
  });
});
