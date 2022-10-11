const express = require("express");
const cors = require("cors");
const session = require("express-session");
const knexSession = require("connect-session-knex")(session);

const app = express();

// The default error message for invalid URI encoding is quite revealing,
// so we intercept invalid encodings in this here middleware
app.use((req, res, next) => {
  try {
    const dcu = decodeURI(req.path);
    next();
  } catch (e) {
    res.status(400).json({message: 'Malformed URL'});
  }
});

app.use(cors());

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// database
const db = require("./models");
app.database = db;

const knexstore = new knexSession({
  knex: db.knex,
  clearInterval: 30000,
});

let appsession = session({
  secret: process.env.EXPRESS_SESSION_SECRET, // should be set from a secret config or environment variable
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'strict',
  },
  store: knexstore
});

app.use(appsession);

app.setup = async function() {
  await db.init();
  
  // simple route
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to Gambit Group checkers." });
  });
  
  // routes
  require("./routes/auth.routes")(app);
  require("./routes/user.routes")(app);
}

module.exports = {
  app,
  session: appsession
};