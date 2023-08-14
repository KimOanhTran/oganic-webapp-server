const Joi = require('joi'); //dung thu vien joi de xac thuc va kiem tra du lieu dau vao
const { password } = require('./custom.validation');
const { PHONE_REGEX } = require('../constants/index');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    phone: Joi.string().length(10).pattern(PHONE_REGEX).required(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required().min(5).max(30)
  })
};

const registerEmployee = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    phone: Joi.string().length(10).pattern(PHONE_REGEX).required(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required().min(5).max(30),
    role: Joi.string().required().min(0).max(30)
  })
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required()
  })
};

const refreshTokens = {
  body: Joi.object().keys({
    token: Joi.string().required()
  })
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required()
  })
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required()
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password)
  })
};

const verifyEmail = {
  query: Joi.object().keys({
    token: Joi.string().required()
  })
};

module.exports = {
  register,
  registerEmployee,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  verifyEmail
};
