var express = require("express");
var router = express.Router();
const User = require("../models/user.model");
middlewares = require("../security-middleware");

router.get("/get-all", function (req, res) {
  User.find()
    .then((data) => {
      res.json({ success: true, users: data });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, msg: "Data inserting Unsuccessfull..!" });
    });
});

router.post("/login", middlewares.checkSignature, function (req, res, next) {
  if (req.body.email && req.body.password) {
    var email = req.body.email;
    var publicKey = req.body.publicKey;

    User.getUserByEmail(email, (err, user) => {
      if (err)
        return res.json({ success: false, msg: "something happen wrong !" });
      if (!user) {
        return res.json({ success: false, msg: "user not found !" });
      }

      if (publicKey === user.publicKey) {
        var rep = {
          success: true,
          user: {
            status: "Login successful!",
            _id: user._id,
            username: user.username,
            name: user.name,
            email: user.email,
          },
        };
        res.json(rep);
      } else {
        return res.json({
          success: false,
          msg: "email or password not correct",
        });
      }

      // User.comparePassword(password, user.password, (err, isMatch) => {
      //   if (err) res.json({ success: false, msg: "password!" });
      //   if (isMatch) {
      //     var rep = {
      //       success: true,
      //       user: {
      //         error: "",
      //         status: "Login successful!",
      //         userId: user._id,
      //         username: user.username,
      //         name: user.name,
      //         email: user.email,
      //       },
      //     };
      //     res.json(rep);
      //   } else {
      //     return res.json({
      //       success: false,
      //       msg: "email or password not correct",
      //     });
      //   }
      // });
    });
  } else {
    res.status(401).json({ error: "Missing Credentials" });
  }
});

router.post("/register", function (req, res, next) {
  var newUser = {
    email: req.body.email.trim(),
    username: req.body.username,
    publicKey: req.body.publicKey,
    password: req.body.password.trim(),
  };
  User.getUserByEmail(newUser.email, (err, user) => {
    if (err) console.log(err);

    if (user) {
      res.json({ success: false, msg: "email allready used" });
    } else {
      let us = new User(newUser);

      User.addUser(us, (user) => {
        if (user) {
          //   var payload = { id: user._id, name: user.name };
          //   var token = jwt.sign(payload, jwtOptions.secretOrKey, {
          //     expiresIn: "3 days",
          //   });
          var rep = {
            success: true,
            user: {
              status: "Login successful!",

              userId: user._id,
              username: user.username,
              name: user.name,
              email: user.email,
            },
          };
          res.json(rep);
        } else {
          console.log(err);
          res.json({ success: false });
        }
      });
    }
  });
});

module.exports = router;
