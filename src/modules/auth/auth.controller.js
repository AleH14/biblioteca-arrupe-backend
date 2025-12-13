// src/modules/auth/auth.controller.js
const AuthService = require("./auth.service");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const {json, cookies, refreshToken} = await AuthService.login(email, password, ip, userAgent);
    res.cookie("refreshToken", refreshToken, cookies);
    res.json({
      success: true,
      data: json,
      mensaje: "Inicio de sesión exitoso"
    });
  } catch (err) {
    next(err);
  }
};


exports.refreshToken = async (req, res, next) => {
  try{
    const token = req.cookies.refreshToken; 
    const ip = req.ip;
    const userAgent = req.headers["user-agent"];
    const {json, cookies, refreshToken} = await AuthService.refreshToken(token, ip, userAgent);
    res.cookie("refreshToken", refreshToken, cookies);
    res.json({
      success: true,
      data: json,
      mensaje: "Token refrescado"
    });
  }
  catch(err){
    next(err);
  }
};


exports.logout = async (req, res, next) => {
  try {
    const usuarioId = req.user.sub;
    const result = await AuthService.logout(usuarioId);
    res.clearCookie("refreshToken", {path: "/api/auth/refreshToken"});
    res.json({
      success: true,
      data: result,
      mensaje: "Cierre de sesión exitoso"
    })
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};