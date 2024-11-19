import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import path from 'path';
import authRoutes from './routes/auth.js';
import personRoutes from './routes/person.js';
import giftRoutes from './routes/gift.js';
import adminRoutes from './routes/admin.js';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 }
}));

app.use(express.static(path.join(process.cwd(), 'public')));

// Основные маршруты
app.use('/auth', authRoutes);
app.use('/person', personRoutes);
app.use('/gifts', giftRoutes);
app.use('/admin', adminRoutes);
app.use(errorHandler);

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Симуляция ошибки 100
app.get('/test-error', (req, res, next) => {
    const err = new Error('Ошибка транзакции');
    err.code = '100';
    next(err); // Передаем ошибку в обработчик ошибок
});


// // Запуск сервера
// // app.listen(PORT, () => {
// //     console.log(`Сервер запущен на http://localhost:${PORT}`);
// // });

const server = app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

export default server;