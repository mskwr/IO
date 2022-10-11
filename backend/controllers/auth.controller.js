const db = require("../models");
const User = db.User;

const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  // Save User to Database
  try {
    if (!req.body.username || typeof req.body.username !== 'string') {
      return res.status(400).send({ message: "Invalid username!" });
    }
    if (!req.body.password || typeof req.body.password !== 'string') {
      return res.status(400).send({ message: "Invalid password!" });
    }
    
    if (await User.tryCreate(
      req.body.username,
      bcrypt.hashSync(req.body.password, 8),
    )) {
      res.status(201).send({ message: "User registered successfully!" });
    } else {
      res.status(400).send({ message: "User already exists!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.signin = async (req, res) => {
  try {
    if (!req.body.username || typeof req.body.username !== 'string') {
      return res.status(400).send({ message: "Invalid username!" });
    }
    if (!req.body.password || typeof req.body.password !== 'string') {
      return res.status(400).send({ message: "Invalid password!" });
    }
    const user = await User.find(req.body.username);

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Incorrect password!",
      });
    }

    req.session.loggedIn = true;
    req.session.username = user.nick;
    return res.status(200).send({
      nick: user.nick,
      elo: user.elo,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    return res.status(500).send({ message: error.message });
  }
};

exports.signout = async (req, res) => {
  try {
    req.session.destroy();
    return res.status(200).send({
      message: "You've been signed out!"
    });
  } catch (err) {
    return res.status(500).send({
      message: "Signout failure!"
    });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.remove(req.session.username);
    req.session.destroy();
    return res.status(200).send({
      message: "Your account has been deleted!"
    });
  } catch (err) {
    return res.status(500).send({
      message: "Account deletion failure!"
    });
  }
}

exports.status = async (req, res) => {
  try {
    if (req.session == null || !req.session.loggedIn) {
      return res.status(200).send({ loggedIn: false });
    }

    const user = await User.find(req.session.username);
    if (user == null) {
      // Username invalid or user has been removed since login.
      req.session.destroy();
      return res.status(200).send({
        loggedIn: false,
        message: "Session user invalidated"
      });
    }

    return res.status(200).send({
      loggedIn: true,
      nick: user.nick, elo: user.elo, isAdmin: user.isAdmin
    });
  } catch (err) {
    return res.status(500).send({
      message: "Login status report failure!"
    });
  }
}