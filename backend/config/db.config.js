const dbtypes = require('./db.types');

if (process.env.NODE_ENV == null) {
  throw new Error('NODE_ENV unset');
}

const conf = {
  // In development
  development: {
    knexparam: {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3',
      },
      useNullAsDefault: true,
    },
    special: dbtypes.sqlite3,
  },

  // For testing, to make a short-lasting database
  // Modified name to prevent conflicts with Jest in autocomplete
  _testing: {
    knexparam: {
      client: 'sqlite3',
      connection: {
        filename: './test.sqlite3',
      },
      useNullAsDefault: true,
    },
    special: dbtypes.sqlite3,
  },

  // In production
  production: {
    knexparam: {
      client: 'oracledb',
      connection: {
        host: process.env.ORACLE_HOST || 'labora.mimuw.edu.pl',
        user: process.env.ORACLE_USER,
        password: process.env.ORACLE_PASS,
        database: process.env.ORACLE_DBNAME || 'LABS',
      }
    },
    special: dbtypes.oracledb,
  },
};
if (process.env.NODE_ENV === 'test') {
  conf.env = conf._testing;
} else {
  conf.env = conf[process.env.NODE_ENV];
}
module.exports = conf;