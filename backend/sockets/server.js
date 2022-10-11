const sockio = require("socket.io");
const { RED_PLAYER, BLACK_PLAYER, BOARD_SIZE } = require("../game/gameImpl");
const { GameManager } = require("../game/manager");
const User = require("../models/user.model");
const manager = new GameManager();

module.exports = {
  launch: function(http, session, db) {
    const io = sockio(http, {
      path: "/api/socketio/"
    });
    
    io.use((socket, next) => session(socket.request, {}, next));
    
    io.use((socket, next) => {
      const session = socket.request.session;
      if (session == null || session.loggedIn !== true) {
        next(new Error("Unauthorized"));
      }
      next();
    });

    io.on('connection', socket => {
      const session = socket.request.session;
      socket.emit('welcome', {username: session.username});
      
      socket.use((_, next) => {
        session.reload(err => {
          if (err) socket.disconnect();
          else next();
        });
      });

      socket.on('createGame', (params, callback) => {
        if (params == null || typeof params !== 'object') {
          callback({state: 'error', message: 'Parameters not an object'});
          return;
        }
        
        const id = manager.createGame();
        const game = manager.getGame(id);
        game.players[RED_PLAYER] = session.username;
        if (params.type === 'private') {
          const name = params.username;
          if (name == null || typeof name !== 'string') {
            manager.deleteGame(id);
            callback({state: 'error', message: 'Username invalid or not provided for private game'});
            return;
          }
          game.players[BLACK_PLAYER] = name;
        }

        session.gameID = id;
        session.save();
        socket.join(id);
        game.onShutdown(() => {
          socket.disconnect();
        })
        callback({
          state: 'ok',
          id,
        });
      });

      socket.on('joinGame', (params, callback) => {
        if (params == null || typeof params !== 'object') {
          callback({state: 'error', message: 'Parameters not an object'});
          return;
        }
        
        const id = params.id;
        const game = manager.getGame(id);
        if (game == null) {
          callback({state: 'error', message: 'Game does not exist'});
          return;
        }
        if (session.username === game.players[RED_PLAYER]) {
          // joinGame is for player 2. Player 1 creates the game.
          callback({state: 'error', message: 'You created this game'});
          return;
        }
        if (typeof game.players[BLACK_PLAYER] === 'string') {
          // Game is private, or already tried to join.
          if (session.username !== game.players[BLACK_PLAYER]) {
            callback({state: 'error', message: 'Game already claimed'});
            return;
          }
        } else {
          game.players[BLACK_PLAYER] = session.username;
        }
        session.gameID = id;
        session.save();
        socket.join(id);
        if (!game.started) {
          // Activate game.
          game.started = true;
          game.active = true;
          game.replaceUpdater(state => {
            io.to(id).emit('update', {boardState: state});
            if (state.victor >= 0) {
              // Victor announced!
              io.to(id).emit('endGame', {cause: 'victory', id});
              game.shutdown();
              db.User.endMatch(game.players[0], game.players[1], state.victor)
                .then(() => manager.deleteGame(id));
            }
          });
          io.to(id).emit('startGame', {
            boardState: game.getController().state,
            id,
            players: game.players
          });
        }
        callback({
          state: 'ok',
          id,
        });
      });

      socket.on('click', (params, callback) => {
        if (params == null || typeof params !== 'object') {
          callback({state: 'error', message: 'Parameters not an object'});
          return;
        }
        
        const id = params.id;
        if (session.gameID !== id) {
          callback({state: 'error', message: 'You are not part of this game'});
          return;
        }
        const game = manager.getGame(id);
        if (game == null) {
          callback({state: 'error', message: 'Game does not exist'});
          return;
        }

        if (!Number.isInteger(params.row) || !Number.isInteger(params.column)) {
          callback({state: 'error', message: 'Row or column invalid'});
          return;
        }
        
        for (let p of [RED_PLAYER, BLACK_PLAYER]) {
          if (session.username === game.players[p]) {
            game.click(params.row, params.column, p);
            callback({state: 'ok'});
            return;
          }
        }
        callback({state: 'error', message: 'Player is in game but not in player list. Probably our fault.'});
      });

      socket.on('getState', (params, callback) => {
        if (params == null || typeof params !== 'object') {
          callback({state: 'error', message: 'Parameters not an object'});
          return;
        }
        
        const id = session.gameID;
        if (id == null) {
          callback({state: 'error', message: 'You are not part of a game'});
          return;
        }
        const game = manager.getGame(id);
        if (game == null) {
          callback({state: 'error', message: 'Your game does not exist anymore'});
          return;
        }

        callback({state: 'ok', boardState: game.getController().state, id});
      });
      
      socket.on('depart', (params, callback) => {
        if (params == null || typeof params !== 'object') {
          callback({state: 'error', message: 'Parameters not an object'});
          return;
        }
        
        const id = session.gameID;
        if (session.gameID == null) {
          callback({state: 'error', message: 'You are not in a game'});
          return;
        }
        const game = manager.getGame(id);
        
        callback({state: 'ok'});
        socket.to(id).emit('endGame', {cause: 'depart', id});
        socket.leave(id);
        game.shutdown();
        manager.deleteGame(id);
      });
      
      socket.on('disconnect', () => {
        if (session.gameID != null) {
          // No proper reconnection handling yet
          // This should be done on a setTimeout with a status check if that's implemented
          const id = session.gameID;
          delete session.gameID;
          socket.leave(id);
          session.save();
          if (manager.getGame(id) != null) {
            socket.to(id).emit('endGame', {cause: 'timeout'});
            manager.getGame(id).shutdown();
            manager.deleteGame(id);
          }
        }
      })
    });
  }
};