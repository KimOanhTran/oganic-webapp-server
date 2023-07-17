const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err) {
    return resolve();
  }
  if(user)  req.user = user;
  resolve();
};
const getCurUser =
  () =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject))(
        req,
        res,
        next
      );
    })
      .then(() => next())
      .catch((err) => next());
  };
module.exports = getCurUser;
