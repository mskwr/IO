const dbconf = require("../config/db.config.js");

class User {
  constructor(knex) {
    this.knex = knex;
  }

  async init() {
    const exists = await this.knex.schema.hasTable('Player');
    if (!exists) {
      return this.knex.schema.createTable('Player', table => {
        table.string('nick', 32);
        table.primary('nick');
        table.string('password', 200);
        table.integer('elo');
        table.boolean('isAdmin');
      });
    }
    return this.knex('Player');
  }
  
  async create(name, rawPass) {
    return await this.knex('Player').insert({
      nick: name,
      password: rawPass,
      elo: 1000,
      isAdmin: false,
    });
  }

  async tryCreate(name, rawPass) {
    try {
      await this.create(name, rawPass);
      return true;
    } catch (e) {
      if (dbconf.env.special.isNonUnique(e)) {
        return false;
      } else {
        throw e;
      }
    }
  }
  
  async find(name) {
    return await this.knex('Player').where({nick: name}).first();
  }

  async remove(name) {
    return await this.knex('Player').where({nick: name}).del();
  }
  
  /**
   * Apply the ending of a match to Elo ranks.
   * `name1` and `name2` refer to the participants.
   * `victor` marks the winner:
   * - 0 for player 1 winning,
   * - 1 for player 2 winning,
   * - 2 for a draw.
   * @param {String} name1 first player name
   * @param {String} name2 second player name
   * @param {Number} victor
   */
  async endMatch(name1, name2, victor) {
    if (name1 === name2) {
      throw new Error("Tried to endMatch on one player");
    }
    if (name1 > name2) {
      // Deadlock prevention, possibly
      let name3 = name1;
      name1 = name2;
      name2 = name3;
    }

    return await this.knex.transaction(async tx => {
      const user1 = await tx('Player')
        .where('nick', name1)
        .forUpdate()
        .first();
      const user2 = await tx('Player')
        .where('nick', name2)
        .forUpdate()
        .first();
      if (user1 == null || user2 == null) {
        throw new Error("Tried to get nonexistent players");
      }
      
      let elo = [user1.elo, user2.elo];
      // Adjusted Elo: R = 10^(E/400)
      let eloR = elo.map(e => 10**(e/400));
      const eloRsum = eloR[0] + eloR[1];
      // Expected scores
      let eloES = eloR.map(r => r/eloRsum);
      // Winner modifier
      let eloW = [.5, .5];
      if (victor === 0)
        eloW = [1, 0];
      else if (victor === 1)
        eloW = [0, 1];
      
      // Max adjustment, constant for now
      const eloK = 32;
      // Final scores
      let eloFinal = [0, 1].map(i =>
        Math.round(elo[i] + eloK * (eloW[i] - eloES[i])));
      // Commit final scores
      await tx('Player')
        .where('nick', name1)
        .update('elo', eloFinal[0]);
      await tx('Player')
        .where('nick', name2)
        .update('elo', eloFinal[1]);
    });
  }

  async destroy() {
    return await this.knex.schema.dropTable('Player');
  }
}

module.exports = User;