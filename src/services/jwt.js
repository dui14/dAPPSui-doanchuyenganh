const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: 'https://app.dynamic.xyz/api/v0/sdk/7e2c57a4-316f-467f-b11a-cafc5df99993/.well-known/jwks',
  cache: true,
  rateLimit: true
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('JWKS error:', err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const verifyToken = (token) => {
  return new Promise((resolve, reject) => {
    console.log('Starting token verification...'); 
    
    jwt.verify(token, getKey, {
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('Token verification error:', err);
        return reject(err);
      }
      console.log('Token verified successfully');
      resolve(decoded);
    });
  });
};

module.exports = { verifyToken };