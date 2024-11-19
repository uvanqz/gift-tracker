import { checkAdminRole } from '../middleware/checkAdmin.js';
import { jest } from '@jest/globals';


describe('checkAdminRole Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        // Инициализация объектов для каждого теста
        req = { session: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    it('should call next() if user is admin', () => {
        req.session.user = { role: 'admin' };  // Устанавливаем роль как admin

        checkAdminRole(req, res, next);

        expect(next).toHaveBeenCalled();  // Ожидаем вызов next()
        expect(res.status).not.toHaveBeenCalled();  // Ошибка не должна быть вызвана
        expect(res.send).not.toHaveBeenCalled();    // send не должен быть вызван
    });

    it('should return 403 if user is not in session', () => {
        // Не задаем пользователя в сессии, проверим, что возвращается ошибка
        checkAdminRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);  // Ожидаем ошибку 403
        expect(res.send).toHaveBeenCalledWith('Доступ запрещен');  // Сообщение об ошибке
        expect(next).not.toHaveBeenCalled();  // next не должен быть вызван
    });

    it('should return 403 if user is not admin', () => {
        req.session.user = { role: 'user' };  // Устанавливаем роль как user

        checkAdminRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);  // Ожидаем ошибку 403
        expect(res.send).toHaveBeenCalledWith('Доступ запрещен');  // Сообщение об ошибке
        expect(next).not.toHaveBeenCalled();  // next не должен быть вызван
    });

    it('should return 403 if session user role is undefined', () => {
        req.session.user = { role: undefined };  // Устанавливаем неопределенную роль

        checkAdminRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);  // Ожидаем ошибку 403
        expect(res.send).toHaveBeenCalledWith('Доступ запрещен');  // Сообщение об ошибке
        expect(next).not.toHaveBeenCalled();  // next не должен быть вызван
    });

    it('should return 403 if session is undefined', () => {
        req.session = undefined;  // Устанавливаем session как undefined

        checkAdminRole(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);  // Ожидаем ошибку 403
        expect(res.send).toHaveBeenCalledWith('Доступ запрещен');  // Сообщение об ошибке
        expect(next).not.toHaveBeenCalled();  // next не должен быть вызван
    });
});
