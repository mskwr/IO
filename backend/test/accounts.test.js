const { app } = require('../app');
const request = require('supertest');

beforeAll(async () => {
    await app.setup();
});

beforeEach(async () => {
    await app.database.dropAllTables();
    await app.database.init();
});

function makeUser(_app, un, pw) {
    return request(_app)
        .post("/api/auth/signup")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
            username: un,
            password: pw
        }))
        .expect('Content-Type', /json/);
}

function signIn(_app, un, pw) {
    return request(app)
        .post("/api/auth/signin")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
            username: un,
            password: pw,
        }))
        .expect('Content-Type', /json/);
}

describe('Basic account system tests', () => {
    test('Prevent duplicate signups', async () => {
        const res1 = await makeUser(app, 'user1', 'pass2')
            .expect(201);
        const res2 = await makeUser(app, 'user1', 'pass2')
            .expect(400);
    });
    
    test('Reject invalid usernames and passwords on signup', async () => {
        await makeUser(app)
            .expect(400);
        await makeUser(app, false, 'password')
            .expect(400)
            .expect(res => res.body.message === 'Invalid username!');
        await makeUser(app, 'username', 1.3e-1)
            .expect(400)
            .expect(res => res.body.message === 'Invalid password!');
    });

    test('Login and logout', async () => {
        await makeUser(app, "userX", "passX")
            .expect(201);
        const sesscookie = await signIn(app, "userX", "passX")
            .expect(200)
            .then(res => res.headers['set-cookie']);
        await request(app)
            .get("/api/test/user")
            .set('Cookie', sesscookie)
            .expect(200);
        await request(app)
            .post("/api/auth/signout")
            .set('Cookie', sesscookie)
            .expect(200);
        await request(app)
            .get("/api/test/user")
            .set('Cookie', sesscookie)
            .expect(403);
    });
    
    test('Reject invalid usernames and passwords on signin', async () => {
        await makeUser(app, 'moot', 'a bad word')
            .expect(201);
        await signIn(app, 'moot', 'frick')
            .expect(401)
            .expect(res => res.message === 'Incorrect password!');
        await signIn(app, 'moot', true)
            .expect(400)
            .expect(res => res.message === 'Invalid password!');
        await signIn(app, null, 'a bad word')
            .expect(400)
            .expect(res => res.message === 'Invalid username!');
        await signIn(app, 'moob', 'a bad word')
            .expect(404)
            .expect(res => res.message === 'User not found.');
    })
    
    test('User info queries', async () => {
        await makeUser(app,
                "person uno/dos", "a password")
            .expect(201);
        await request(app)
            .get("/api/user/person%20uno%2Fdos")
            .expect("Content-Type", /json/)
            .expect(200)
            .expect(res => {
                return res.body.nick === "person uno/dos" && res.body.elo === 1000;
            });
        const resf = await request(app)
            .get("/api/user/person%20uno%2Ftres")
            .expect(404)
            .expect(res => res.message === "User not found!");
    });
    
    test('Account deletion', async () => {
        await makeUser(app, "mayfly", "coming home")
            .expect(201);
        
        await request(app)
            .get("/api/user/mayfly")
            .expect(200)
            .expect(res => {
                return res.body.nick === "mayfly" && res.body.elo === 1000;
            });
            
        const sesscookie = await signIn(app, "mayfly", "coming home")
            .expect(200)
            .then(res => res.headers['set-cookie']);
        await request(app)
            .post("/api/auth/delete")
            .set('Cookie', sesscookie)
            .expect(200);
        
        await request(app)
            .get("/api/user/mayfly")
            .expect(404);
    });
    
    test('Login status reports', async () => {
        await makeUser(app, "hello", "there")
            .expect(201);
        
        await request(app)
            .get("/api/auth/status")
            .expect(res => res.body.loggedIn === false)
            .expect(200);
        
        const res1 = await signIn(app, "hello", "there")
            .expect(200);
        const sesscookie = (res1.headers['set-cookie']);

        await request(app)
            .get("/api/auth/status")
            .expect(res => res.body.loggedIn === true &&
                res.body.nick === "hello")
            .expect(200);
    });
});