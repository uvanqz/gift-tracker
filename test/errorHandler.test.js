import request from 'supertest';
import express from 'express';
import errorHandler from '../middleware/errorHandler.js';  // Путь к вашему middleware

const app = express();

// Пример маршрутов, которые генерируют ошибки
app.get('/transaction-error', (req, res, next) => {
  const error = new Error('Ошибка транзакции');
  error.code = '100';  // Симулируем ошибку транзакции
  next(error);
});

app.get('/db-error', (req, res, next) => {
  const error = new Error('Ошибка подключения к базе данных');
  error.code = 'ECONNREFUSED';  // Симулируем ошибку подключения
  next(error);
});

app.get('/unknown-error', (req, res, next) => {
  const error = new Error('Неизвестная ошибка');
  error.code = 'UNKNOWN';  // Симулируем неизвестную ошибку
  next(error);
});

// Подключаем middleware для обработки ошибок
app.use(errorHandler);

describe('Error handler', () => {
  it('should handle transaction errors with code 100', async () => {
    const response = await request(app).get('/transaction-error');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Ошибка при выполнении транзакции. Пожалуйста, повторите попытку позже.');
  });

  it('should handle database connection errors with code ECONNREFUSED', async () => {
    const response = await request(app).get('/db-error');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Ошибка подключения к базе данных.');
  });

  it('should handle unknown errors', async () => {
    const response = await request(app).get('/unknown-error');
    
    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Произошла ошибка. Пожалуйста, попробуйте позже.');
  });
});
