const { app, session } = require('../app');
const { EMPTY, TARGET, NORMAL_RED, NORMAL_BLACK } = require('../game/gameImpl');
const request = require('supertest');
const sockserver = require('../sockets/server');
const sockio = require('socket.io-client');

let server;
const port = 57070;
const host = '127.0.2.250';
const servurl = `http://${host}:${port}`;

beforeAll(async () => {
    await app.setup();
    
    server = app.listen(port, host);

    sockserver.launch(server, session, app.database);
});

beforeEach(async () => {
    await app.database.dropAllTables();
    await app.database.init();
});

function makeUser(_app, username, password) {
    return request(_app)
        .post("/api/auth/signup")
        .set('connection', 'close')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
            username,
            password,
        }))
        .expect(201);
}

async function signIn(_app, username, password) {
    const res = await request(_app)
        .post("/api/auth/signin")
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
            username,
            password,
        }))
        .expect(200);
    return res.headers['set-cookie'][0].split(';')[0];
}

function makeIOEmpty() {
    return new sockio.Manager(servurl, {
        path: '/api/socketio/'
    });
}

function makeIOWithSession(sesscookie) {
    return new sockio.Manager(servurl, {
        path: '/api/socketio/',
        extraHeaders: {
            'cookie': sesscookie
        }
    });
}

test('Sockets require authentication', (done) => {
    let io = makeIOEmpty();
    let socket = io.socket('/', err => {
        done(err);
    });
    socket.on('connect_error', err => {
        expect(err.message).toBe('Unauthorized');
        socket.disconnect();
        done();
    });
    socket.on('connect', msg => {
        done('Connected'); // failure
    });
});

describe('Single-user tests', () => {
    const suser = 'AzureDiamond';
    const spass = 'hunter2';

    test('Get welcome event', (done) => {
        makeUser(app, suser, spass)
            .then(() => signIn(app, suser, spass))
            .then(sc => {
                let io = makeIOWithSession(sc);
                let socket = io.socket('/');
                socket.on('connect_error', err => {
                    done(err); // failure
                });
                socket.on('welcome', data => {
                    done(data.username !== suser); // failure on values evaluating to true
                });
            });
    });

    test('Create and close game', (done) => {
        makeUser(app, suser, spass)
            .then(() => signIn(app, suser, spass))
            .then(sc => {
                let io = makeIOWithSession(sc);
                let socket = io.socket('/');
                socket.on('connect_error', err => {
                    done(err); // failure
                });
                socket.emit('createGame', {}, response => {
                    socket.emit('depart', {}, res => {
                        if (res.state === 'error') done(res);
                    });
                });
                socket.on('endGame', data => {
                    socket.disconnect();
                    done();
                });
                socket.on('disconnect', res => {
                    done();
                });
            });
    });
});

describe('Double-user tests', () => {
    const user = ['rando1', 'rando2'];
    const pass = ['stuff1', 'stuff2'];

    function makeConnections(_app, done) {
        return makeUser(_app, user[0], pass[0])
            .then(() => makeUser(_app, user[1], pass[1]))
            .then(() => signIn(_app, user[0], pass[0]))
            .then(async sc => {
                return [sc, await signIn(_app, user[1], pass[1])];
            })
            .then(sc => {
                let io = sc.map(c => makeIOWithSession(c));
                let sock = io.map(i => i.socket('/'));
                sock.forEach(s => s.on('connect_error', err => {
                    done(err); // failure
                }));
                return [0,1].map(i => ({
                    user: user[i],
                    io: io[i],
                    socket: sock[i],
                }));
            });
    }
    
    function emitPromise(socket, event, params) {
        return new Promise((resolve, reject) => {
            try {
                socket.emit(event, params, (res) => resolve(res));
            } catch (e) {
                reject(e);
            }
        });
    }
            
    function oncePromise(socket, event) {
        return new Promise((resolve, reject) => {
            try {
                socket.once(event, res => resolve(res));
            } catch (e) {
                reject(e);
            }
        });
    }
    
    test('Join two people at once', (done) => {
        makeConnections(app, done)
            .then(combo => {
                let welcomes = combo.map(l => new Promise(resolve => 
                    l.socket.once('welcome', data => {
                        resolve(data.username !== l.user); // failure on values evaluating to true
                    })
                ));
                return welcomes[0].then(async r0 => {
                    return r0 || await welcomes[1];
                }).then(rc => done(rc));
            })
            .catch(err => done(err));
    });
    
    test('Start a game', (done) => {
        makeConnections(app, done)
            .then(async conn => {
                const created = await emitPromise(conn[0].socket,
                    'createGame', {});
                expect(created.state).toBe('ok');
                // This fails if the listener is hooked before the emit, apparently
                const start = oncePromise(conn[0].socket, 'startGame');
                const end = oncePromise(conn[1].socket, 'endGame');
                const joined = await emitPromise(conn[1].socket,
                    'joinGame', {id: created.id});
                expect(joined.state).toBe('ok');
                expect(joined.id).toBe(created.id);

                const startRes = await start;
                expect(startRes.id).toBe(created.id);
                expect(startRes.players).toEqual(user);
                conn[0].socket.disconnect();
                const endRes = await end;
                expect(endRes.cause).toBe('timeout');
                conn[1].socket.disconnect();
                done();
            })
            .catch(err => done(err));
    });
    
    test('Interact with a game', (done) => {
        makeConnections(app, done)
            .then(async conn => {
                const created = await emitPromise(conn[0].socket,
                    'createGame', {});
                expect(created.state).toBe('ok');
                // This fails if the listener is hooked before the emit, apparently
                const start = oncePromise(conn[0].socket, 'startGame');
                let finishable = false;
                const end = oncePromise(conn[1].socket, 'endGame')
                    .then(res => {
                        conn[1].socket.disconnect();
                        done(!finishable);
                    });
                const joined = await emitPromise(conn[1].socket,
                    'joinGame', {id: created.id});
                expect(joined.state).toBe('ok');
                expect(joined.id).toBe(created.id);
                const id = created.id;

                const startRes = await start;
                expect(startRes.id).toBe(id);
                
                // Black player tries to click
                // First on a red player's piece
                expect(startRes.boardState.squareDisplay[2][3]).toBe(NORMAL_RED);
                expect(startRes.boardState.squareDisplay[3][2]).toBe(EMPTY);
                const click1 = await emitPromise(conn[1].socket,
                    'click', {id, row: 2, column: 3});
                expect(click1.state).toBe('ok');
                const state1 = await emitPromise(conn[1].socket,
                    'getState', {});
                expect(state1.id).toBe(id);
                expect(state1.state).toBe('ok');
                expect(JSON.stringify(state1.boardState))
                    .toBe(JSON.stringify(startRes.boardState));
                
                // Then on his own piece
                expect(state1.boardState.squareDisplay[5][4]).toBe(NORMAL_BLACK);
                expect(state1.boardState.squareDisplay[4][5]).toBe(EMPTY);
                const click2 = await emitPromise(conn[1].socket,
                    'click', {id, row: 5, column: 4});
                expect(click2.state).toBe('ok');
                const state2 = await emitPromise(conn[0].socket,
                    'getState', {});
                expect(state2.state).toBe('ok');
                expect(JSON.stringify(state2.boardState))
                    .toBe(JSON.stringify(startRes.boardState));

                // Now the red player clicks on a black piece
                const click3 = await emitPromise(conn[0].socket,
                    'click', {id, row: 5, column: 4});
                expect(click3.state).toBe('ok');
                const state3 = await emitPromise(conn[1].socket,
                    'getState', {});
                expect(state3.state).toBe('ok');
                expect(JSON.stringify(state3.boardState))
                    .toBe(JSON.stringify(startRes.boardState));
                
                // And now stuff is happening, because the red player is clicking his own piece
                let upd1 = new Promise(resolve => {
                    conn[1].socket.on('update', data => {
                        if (JSON.stringify(data.boardState.squareDisplay) !==
                                JSON.stringify(startRes.boardState.squareDisplay)) {
                            conn[1].socket.off('update');
                            resolve(data);
                        } else {
                            console.log('Dry update');
                        }
                    });
                });
                
                let upd2 = oncePromise(conn[0].socket, 'update');
                const click4 = await emitPromise(conn[0].socket,
                    'click', {id, row: 2, column: 3});
                expect(click4.state).toBe('ok');
                const updres1 = await upd1;
                const updres2 = await upd2;
                expect(updres1.boardState.squareDisplay[3][2]).toBe(TARGET);
                expect(updres1.boardState.squareDisplay[3][4]).toBe(TARGET);
                expect(JSON.stringify(updres1) === JSON.stringify(updres2));
                
                // Force quit
                finishable = true;
                await emitPromise(conn[0].socket, 'depart', {});
            })
            .catch(err => done(err));
    })
})

afterAll(() => {
    server.close();
})