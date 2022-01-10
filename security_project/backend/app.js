const https = require("https");
var config = require("./env.json")[process.env.NODE_ENV || "development"];
var express = require("express");
var crypto = require("crypto");
const morgan = require("morgan");
var path = require("path");
var rfs = require("rotating-file-stream"); // version 2.x
middlewares = require("./security-middleware");
KEY_PAIRS = middlewares.KEY_PAIRS_PEM;

const bodyparser = require("body-parser");
const mongoose = require("mongoose");
var passItemsRouter = require("./routers/pass-items");
var usersRouter = require("./routers/users");
mongoose.connect(config.MONGO_URI);

var app = express();

// create a rotating write stream
var accessLogStream = rfs.createStream("access.log", {
  interval: "1d", // rotate daily
  path: path.join(__dirname, "log"),
});

//set body barser MW
app.use(bodyparser.json());

// setup the logger
app.use(
  morgan(
    function (tokens, req, res) {
      return [
        tokens.method(req, res),
        tokens.url(req, res).split("?")[0],
        tokens.status(req, res),
        tokens["response-time"](req, res),
        "ms",
        "signature: " + req.query.signature,
      ].join(" ");
    },
    {
      stream: accessLogStream,
      skip: function (req, res) {
        return req.method == "OPTIONS";
      },
    }
  )
);

// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "https://localhost:4200");

  // Request methods you wish to allow
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );

  // Request headers you wish to allow
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);

  // Pass to next layer of middleware
  next();
});

app.get("/", function (req, res) {
  console.log('adasdasd');
  res.json({
    success: true,
    // publicKey: KEY_PAIRS.publicKey,
  });
});

app.use("/pass", passItemsRouter);
app.use("/users", usersRouter);

app.post("/handshake", function (req, res) {
  const decryptedData = crypto.privateDecrypt(
    {
      key: KEY_PAIRS.private,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    },
    Buffer.from(req.body.data, "base64")
  );

  res.json({
    success: true,
    text: "decryptedData",
  });
});

https
  .createServer(
    {
      key: middlewares.privateKey(),
      cert: middlewares.certificate(),
    },
    app
  )
  .listen(3000, function () {
    middlewares.initialize();
  console.log('here');
    //  to  get  virify  CRS from CA  one  time
    // middlewares.getCR();

    middlewares.sendPublicKey();
    console.log("Server  listening on port 3000!");
  });

  

module.exports = app;
