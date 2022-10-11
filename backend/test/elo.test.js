// Basic Elo rank tests
const { app } = require('../app');
const _ = require('lodash');
let User;

beforeAll(async () => {
    await app.setup();
    await app.database.dropAllTables();
    await app.database.init();
    User = app.database.User;
});

async function dumpElo() {
    const base = await app.database.knex('Player')
        .select('elo');
    return base.map(e => e.elo);
}

async function setElo(name, elo) {
    return await app.database.knex('Player')
        .where('nick', name)
        .update('elo', elo);
}

test('Basic matches', async () => {
    await User.create('user1', 'not_bcrypt');
    await User.create('user2', 'also_not_bcrypt');

    const elo0 = await dumpElo();
    expect(elo0).toEqual([1000, 1000]);

    await User.endMatch('user1', 'user2', 1);
    let elo = await dumpElo();
    expect(elo).toEqual([984, 1016]);

    await User.endMatch('user1', 'user2', 2);
    elo = await dumpElo();
    expect(elo).toEqual([985, 1015]);

    await User.endMatch('user1', 'user2', 0);
    elo = await dumpElo();
    expect(elo).toEqual([1002, 998]);
});

test('Wikipedia scenario', async () => {
    // No tournament support, so results may be different
    await User.create('wu0', '$2a$12$fake');
    await setElo('wu0', 1613);
    const enemies = [
        {nick: 'wu1', elo: 1609, win: 1},
        {nick: 'wu2', elo: 1477, win: 2},
        {nick: 'wu3', elo: 1388, win: 0},
        {nick: 'wu4', elo: 1586, win: 0},
        {nick: 'wu5', elo: 1720, win: 1},
    ];
    await Promise.all(enemies.map(async e => {
        await User.create(e.nick, '$2a$16$still.fake');
        await setElo(e.nick, e.elo);
    }));
    
    for (let e of enemies) {
        await User.endMatch('wu0', e.nick, e.win);
    }

    const u0 = await User.find('wu0');
    expect(u0.elo).toEqual(1604); // not quite the Wikipedia scenario's score, but checks out
})