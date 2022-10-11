const db = require("../models");
const User = db.User;

exports.allAccess = (req, res) => {
  res.status(200).send("Public Content.");
};

exports.userBoard = (req, res) => {
  res.status(200).send("User Content.");
};

exports.adminBoard = (req, res) => {
  res.status(200).send("Admin Content.");
};

exports.userInfo = async (req, res) => {
  try {
    const udata = await User.find(req.params.user);
    if (udata != null) {
      res.status(200).send({ nick: udata.nick, elo: udata.elo });
    } else {
      res.status(404).send({ message: "User not found! "});
    }
  } catch (e) {
    res.status(500).send({ message: e.message });
  }
}
