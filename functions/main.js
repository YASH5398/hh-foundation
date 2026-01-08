const { onRequest } = require('firebase-functions/v2/https');

exports.healthCheck = onRequest((req, res) => {
  res.status(200).send('ok');
});
