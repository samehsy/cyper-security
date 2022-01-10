var passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
const User = require('../models/user');
const secret = 'codeferns.com';

module.exports = {
    secret: secret,
    passport: passport
}

function passport(passport) {
    var jwtOptions = {}
    jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    jwtOptions.secretOrKey = 'codeferns.com';

    var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
        User.findById(jwt_payload.id).lean().exec(function (err, usr) {
            if (usr) {
                next(null, usr);
            } else {
                next(null, false);
            }
        });
    });
    passport.use(strategy);
}