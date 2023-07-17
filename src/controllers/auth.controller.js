const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { responseSuccess } = require('../utils/responseType');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  responseSuccess({
    res,
    statusCode: httpStatus.CREATED,
    message: 'Account created',
    data: { user, tokens }
  });
});
const login = catchAsync(async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const code = req.body.code == '' ? undefined : req.body.code;

  const user = await authService.loginUserWithEmailAndPassword(username, password, code);
  if (!user) throw new Error('User not exists');
  const tokens = await tokenService.generateAuthTokens(user);
  responseSuccess({
    res,
    statusCode: httpStatus.OK,
    message: '',
    data: { user, tokens }
  });
});

const getProfile = catchAsync(async (req, res) => {
  responseSuccess({
    res,
    statusCode: httpStatus.OK,
    message: '',
    data: req.user
  });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: '',
    data: {}
  });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  responseSuccess({
    res,
    statusCode: httpStatus.OK,
    message: '',
    data: { ...tokens }
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: '',
    data: {}
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: '',
    data: {}
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  console.log(verifyEmailToken);
  console.log(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: '',
    data: {}
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: 'Verify email success!',
    data: {}
  });
});

module.exports = {
  register,
  getProfile,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
