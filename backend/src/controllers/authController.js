const authService = require('../services/authService');

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const result = await authService.login(username, password);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({ token: result.token, user: result.user });
};

const verify = (req, res) => {
  res.json({ valid: true, user: req.user });
};

module.exports = { login, verify };