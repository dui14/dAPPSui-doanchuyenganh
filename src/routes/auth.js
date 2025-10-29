const router = require('express').Router();
const { authenticate } = require('../middleware/auth');

router.post('/verify-token', authenticate, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

module.exports = router;