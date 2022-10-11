const config = require("../config/db.config");
const knex = require("knex");

const knexdb = knex(config.env.knexparam);
const userModel = require('./user.model');

const db = {
  knex: knexdb,
  
  init: async function() {
    this.User = new userModel(this.knex);
    await this.User.init();
  },
  
  dropAllTables: async function() {
    await this.User.destroy();
  },
};

module.exports = db;