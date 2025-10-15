// src/modules/auth/auth.controller.js
const AuthService = require("./auth.service");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
