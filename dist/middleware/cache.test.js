"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const cache_1 = __importDefault(require("./cache"));
jest.mock('../cache');
jest.mock('../env', () => ({
    CACHE_ENABLED: true,
    CACHE_NAMESPACE: 'test',
    CACHE_STORE: 'memory',
    CACHE_TTL: '5s',
    CACHE_CONTROL_S_MAXAGE: true,
}));
const { cache } = jest.requireMock('../cache');
const env = jest.requireMock('../env');
const handler = jest.fn((req, res) => res.json({ data: 'Uncached value' }));
const setup = () => (0, express_1.default)().use(cache_1.default).all('/items/test', handler);
beforeEach(jest.clearAllMocks);
describe('cache middleware', () => {
    test('should return the cached response for a request', async () => {
        cache.get.mockResolvedValueOnce({ data: 'Cached value' });
        cache.get.mockResolvedValueOnce(new Date().getTime() + 1000 * 60);
        const res = await (0, supertest_1.default)(setup()).get('/items/test').send();
        expect(res.body.data).toBe('Cached value');
        expect(res.headers['vary']).toBe('Origin, Cache-Control');
        expect(res.headers['cache-control']).toMatch(/public, max-age=\d+, s-maxage=\d+/);
        expect(handler).not.toHaveBeenCalled();
    });
    test('should call the handler when there is no cached value', async () => {
        cache.get.mockResolvedValueOnce(undefined);
        const res = await (0, supertest_1.default)(setup()).get('/items/test').send();
        expect(res.body.data).toBe('Uncached value');
        expect(cache.get).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledTimes(1);
    });
    test('should not cache requests then the cache is disabled', async () => {
        env.CACHE_ENABLED = false;
        const res = await (0, supertest_1.default)(setup()).get('/items/test').send();
        expect(res.body.data).toBe('Uncached value');
        expect(cache.get).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalledTimes(1);
        env.CACHE_ENABLED = true;
    });
    test('should not use cache when the "Cache-Control" header is set to "no-store"', async () => {
        const res = await (0, supertest_1.default)(setup()).get('/items/test').set('Cache-Control', 'no-store').send();
        expect(res.body.data).toBe('Uncached value');
        expect(cache.get).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalledTimes(1);
    });
    test('should only cache get requests', async () => {
        const app = setup();
        await (0, supertest_1.default)(app).post('/items/test').send();
        await (0, supertest_1.default)(app).put('/items/test').send();
        await (0, supertest_1.default)(app).patch('/items/test').send();
        await (0, supertest_1.default)(app).delete('/items/test').send();
        expect(cache.get).not.toHaveBeenCalled();
        expect(handler).toHaveBeenCalledTimes(4);
    });
});
