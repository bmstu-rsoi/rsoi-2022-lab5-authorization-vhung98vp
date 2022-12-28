const JsonWebToken = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
var client = jwksClient({
  jwksUri: 'https://dev-kcel8p8ubov758p0.us.auth0.com/.well-known/jwks.json'
});
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    var signingKey = key.getPublicKey();
    callback(err, signingKey);
  });
}

const authorize = function(req, res, next){
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7, authHeader.length);
        JsonWebToken.verify(token, getKey, { algorithms: ['RS256'] }, function(error, decoded){
            if(error){
                console.log(error);
                res.status(401).send({message: 'Unauthorized'});
            } else {
                req.headers['x-user-name'] = decoded.username;
                next();
            }
        })
    } else {
        res.status(401).send({message: 'Unauthorized'});
    }
}

module.exports = authorize;