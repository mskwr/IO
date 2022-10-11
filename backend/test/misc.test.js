const { app, session } = require('../app');
const request = require('supertest');

beforeAll(async () => {
    await app.setup();
});

beforeEach(async () => {
    await app.database.dropAllTables();
    await app.database.init();
});

test('Reject bad requests properly', async () => {
    request(app)
        .get('/api/users/%%30%30')
        .expect(400)
        .expect(res => res.body.message === 'Malformed URL');
});

test('Basic requests work', async () => {
    await request(app)
        .get('/api/test/all')
        .expect(200);
    await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);
})