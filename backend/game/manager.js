const { GameController } = require("./gameImpl");
const crypto = require("crypto");

class GameInstance {
    constructor() {
        this._updaters = [];
        this.players = [];
        this.active = false;
        this.started = false;
        this._controller = new GameController(state => {
            for (const u of this._updaters) {
                u(state);
            }
        });
        this._shutdown = null;
    }
    
    getController() {
        return this._controller;
    }

    addUpdater(u) {
        this._updaters.push(u);
    }

    replaceUpdater(u) {
        this._updaters = [u];
    }

    removeUpdaters() {
        this._updaters = [];
    }
    
    onShutdown(f) {
        this._shutdown = f;
    }
    
    click(row, column, player) {
        this._controller.clickSquare(row, column, player);
    }

    shutdown() {
        if (this._shutdown != null) {
            this._shutdown();
        }
    }
}

class GameManager {
    constructor() {
        this._games = new Map();
    }

    createGame() {
        const id = crypto.randomBytes(16).base64urlSlice();
        this._games.set(id, new GameInstance());
        return id;
    }

    getGame(id) {
        return this._games.get(id);
    }
    
    deleteGame(id) {
        this._games.delete(id);
    }
}

module.exports = {
    GameManager
};