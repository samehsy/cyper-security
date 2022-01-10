var config = require("./env.json")[process.env.NODE_ENV || "development"];
var express = require("express");
var crypto = require("crypto");

middlewares = require("./cs-middleware");
KEY_PAIRS = middlewares.KEY_PAIRS_PEM;

const bodyparser = require("body-parser");

var app = express();

//set body barser MW
app.use(bodyparser.json());

// Add headers before the routes are defined
app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");

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
  res.json({
    success: true,
  });
});

app.get("/server-public-key", function (req, res) {
  middlewares.saveServerPublic(req.body.publicKey);
  res.json({
    success: true,
  });
});

app.get("/get-certificate", function (req, res) {
  var verifiedCSR = middlewares.verfiyServer(req.body.CSR);
  res.json({
    success: true,
    verifiedCSR: verifiedCSR,
  });
});

app.listen(3500, function () {
  middlewares.initialize();
  console.log("CA Server  listening on port 3500!");
});

module.exports = app;
