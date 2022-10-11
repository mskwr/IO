const { auth, verifySignUp } = require("../middleware");
const controller = require("../controllers/auth.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);

  app.post("/api/auth/signout",
    [auth.requireLogin],
    controller.signout
  );

  app.post("/api/auth/delete",
    [auth.requireLogin],
    controller.deleteAccount
  );
  
  app.get("/api/auth/status",
    controller.status
  );
};
