var crypto = require("crypto");
var express = require("express");
var router = express.Router();
var forge = require("node-forge");
var keypair = require("keypair");
var request = require("request");
var path = require("path");

var fs = require("fs");
var pki = forge.pki;

// generate a keypair or use one you have already
var KEY_PAIRS = null;
var KEY_PAIRS_PEM = null;

module.exports = {
  KEY_PAIRS_PEM: KEY_PAIRS_PEM,
  checkSignature: function (req, res, next) {
    let data = req.body.password;
    let signature = req.query.signature;
    let ver = crypto.createVerify("RSA-SHA256");
    ver.update(data);
    isVerifid = ver.verify(req.body.publicKey, signature, "base64");
    if (isVerifid) {
      next();
    } else {
      res.status(401).json({
        success: false,
        error: "data integrity Error",
        msg: "check Signature fail",
      });
    }
  },
  getCR: function getCR() {
    // to call  CA server and  get new  Cirtifecate
    if (fs.existsSync(path.join(__dirname, "ssl/certificate.crt"))) {
      var CSR = fs
        .readFileSync(path.join(__dirname, "ssl/certificate.crt"))
        .toString("utf-8");
      request(
        {
          uri: "http://localhost:3500/get-certificate",
          json: true,
          body: {
            CSR: CSR,
          },
        },
        (err, res, body) => {
          if (res) {
            console.log(res.body.verifiedCSR);
            fs.writeFileSync(
              __dirname + "/ssl/verified-certificate.crt",
              res.body.verifiedCSR
            );
          }

          if (err) {
            return console.log(err);
          }
        }
      );
    }
  },
  sendPublicKey: function sendPublicKey() {
    // to call  CA server and  get new  Cirtifecate
    if (fs.existsSync(path.join(__dirname, "ssl/public-key.pem"))) {
      var publicKey = fs
        .readFileSync(path.join(__dirname, "ssl/public-key.pem"))
        .toString("utf-8");
      request(
        {
          uri: "http://localhost:3500/server-public-key",
          json: true,
          body: {
            publicKey: publicKey,
          },
        },
        (err, res, body) => {
          if (err) {
            return console.log(err);
          }
        }
      );
    }
  },
  initialize: function initialize() {
    if (
      fs.existsSync(path.join(__dirname, "ssl/private-key.pem")) &&
      fs.existsSync(path.join(__dirname, "ssl/public-key.pem"))
    ) {
      KEY_PAIRS_PEM = {
        publicKey: fs
          .readFileSync(path.join(__dirname, "ssl/public-key.pem"))
          .toString("utf-8"),
        privateKey: fs
          .readFileSync(path.join(__dirname, "ssl/private-key.pem"))
          .toString("utf-8"),
      };

      KEY_PAIRS = {
        publicKey: pki.publicKeyFromPem(KEY_PAIRS_PEM.publicKey),
        privateKey: pki.privateKeyFromPem(KEY_PAIRS_PEM.privateKey),
      };
    } else {
      KEY_PAIRS = pki.rsa.generateKeyPair(2048);
      KEY_PAIRS_PEM = {
        publicKey: pki.publicKeyToPem(KEY_PAIRS.publicKey),
        privateKey: pki.privateKeyToPem(KEY_PAIRS.privateKey),
      };
      fs.writeFileSync(
        __dirname + "/ssl/private-key.pem",
        KEY_PAIRS_PEM.privateKey
      );
      fs.writeFileSync(
        __dirname + "/ssl/public-key.pem",
        KEY_PAIRS_PEM.publicKey
      );
      genrateCSR();
      sendPublicKey();
    }
  },
  // to get the  verified-certificate
  certificate: function certificate() {
    if (fs.existsSync(path.join(__dirname, "ssl/verified-certificate.crt"))) {
      var cert = fs.readFileSync(
        path.join(__dirname, "ssl/verified-certificate.crt")
      );

      return cert;
    }
  },
  // to get the  private-key
  privateKey: function privateKey() {
    if (fs.existsSync(path.join(__dirname, "ssl/private-key.pem"))) {
      var privateKey = fs.readFileSync(
        path.join(__dirname, "ssl/private-key.pem")
      );
      return privateKey;
    }
  },
};

// this  method  to  genrate  CSR cirtificate
function genrateCSR() {
  // create a new certificate
  var cert = pki.createCertificate();
  cert.publicKey = KEY_PAIRS.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  // use your own attributes here, or supply a csr (check the docs)
  var attrs = [
    {
      name: "commonName",
      value: "localhost.com",
    },
    {
      name: "countryName",
      value: "SY",
    },
    {
      name: "organizationName",
      value: "Test",
    },
  ];

  // here we set subject and issuer as the same one
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // the actual certificate signing
  cert.sign(KEY_PAIRS.privateKey);

  // now convert the Forge certificate to PEM format
  var pem = pki.certificateToPem(cert);

  // console.log(pem);
  fs.writeFileSync(__dirname + "/ssl/certificate.crt", pem);
}
