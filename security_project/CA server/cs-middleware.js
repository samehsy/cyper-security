var crypto = require("crypto");
var express = require("express");
var forge = require("node-forge");
var path = require("path");
var fs = require("fs");
var pki = forge.pki;

// generate a keypair or use one you have already
var KEY_PAIRS = null;
var KEY_PAIRS_PEM = null;

module.exports = {
  KEY_PAIRS_PEM: KEY_PAIRS_PEM,
  checkSignature: function (req, res, next) {
    console.log("asdasd");
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
  initialize: function initialize() {
    if (
      fs.existsSync(path.join(__dirname, "ssl/CA-private-key.pem")) &&
      fs.existsSync(path.join(__dirname, "ssl/CA-public-key.pem"))
    ) {
      KEY_PAIRS_PEM = {
        publicKey: fs
          .readFileSync(path.join(__dirname, "ssl/CA-public-key.pem"))
          .toString("utf-8"),
        privateKey: fs
          .readFileSync(path.join(__dirname, "ssl/CA-private-key.pem"))
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
        __dirname + "/ssl/CA-private-key.pem",
        KEY_PAIRS_PEM.privateKey
      );
      fs.writeFileSync(
        __dirname + "/ssl/CA-public-key.pem",
        KEY_PAIRS_PEM.publicKey
      );
    }
    genrateCSR("CA-certificate");
  },
  saveServerPublic: function saveServerPublic(publicKey) {
    fs.writeFileSync(__dirname + "/servers-publics/public-key.pem", publicKey);
  },
  verfiyServer: function verfiyServer(CSR) {
    // TODO create  DC  using  server  CSR   not public key 
    if (
      fs.existsSync(path.join(__dirname, "/servers-publics/public-key.pem")) &&
      fs.existsSync(path.join(__dirname, "/ssl/CA-certificate.crt"))
    ) {
      var ca = fs
        .readFileSync(path.join(__dirname, "/ssl/CA-certificate.crt"))
        .toString("utf-8");
      var serverCert = pki.certificateFromPem(CSR);
      var caCert = pki.certificateFromPem(ca);
      if (
        serverCert.subject.attributes.find((item) => item.name == "commonName")
          .value == "localhost.com"
      ) {
        return genrateCSR("localhost.com").toString("utf-8");
      }
    }
  },
};

// this  method  to  genrate  CSR cirtificate
function genrateCSR(commonName) {
  if (fs.existsSync(path.join(__dirname, "/ssl/" + commonName + ".crt"))) {
    var ca = fs.readFileSync(
      path.join(__dirname, "/ssl/" + commonName + ".crt")
    );
    return ca;
  }

  console.log(commonName);
  // create a new certificate
  var cert = pki.createCertificate();

  var serverPublic = fs
    .readFileSync(path.join(__dirname, "/servers-publics/public-key.pem"))
    .toString("utf-8");

  cert.publicKey = pki.publicKeyFromPem(serverPublic);
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  // use your own attributes here, or supply a csr (check the docs)
  var attrs = [
    {
      name: "commonName",
      value: commonName,
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

  console.log(pem);
  fs.writeFileSync(__dirname + "/ssl/" + commonName + ".crt", pem);
  return pem;
}
