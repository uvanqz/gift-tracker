import request from 'supertest';
import server from '../app.js';

describe('App Routes', () => {
    afterAll(() => {
        server.close();
    });

    it('should serve the index.html on GET /', async () => {
        const res = await request(server).get('/');
        expect(res.statusCode).toBe(200);
        expect(res.header['content-type']).toContain('text/html');
    });

    it('should handle 404 for unknown routes', async () => {
        const res = await request(server).get('/unknown-route');
        expect(res.statusCode).toBe(404);
    });

    it('should handle simulated error on /test-error', async () => {
        const res = await request(server).get('/test-error');
        expect(res.statusCode).toBe(500);
        expect(res.text).toContain('Ошибка транзакции');
    });
});
