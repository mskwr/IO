const db = require("../models");
const User = db.User;

requireLogin = (req, res, next) => {
  if (!req.session.loggedIn) {
    return res.status(403).send({
      message: "Login required!",
    });
  }

  next();
};

isAdmin = async (req, res, next) => {
  try {
    const user = await User.find(req.session.username);

    if (user != null && user.isAdmin) {
      next();
    } else {
      return res.status(403).send({
        message: "Admin privilege required to access this resource!"
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate user!",
    });
  }
};

const auth = {
  requireLogin,
  isAdmin,
};
module.exports = auth;
