const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const { responseSuccess } = require('../utils/responseType');
const config = require('../config/config');
const { Account } = require('../models');

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
//catchAsync: đây là một hàm sử lý trung gian được sử dụng để bắt lỗi trong hàm xử lý yêu cầu
//aysnc(req, res): hàm xử lý yêu cầu bất đồng bộ async nhận vào hai đối số req và res. Hàm xử lý y/c đăng ký tài khoản cá nhân nv
const registerEmployee = catchAsync(async (req, res) => {
  const user = await userService.createEmployeeAccount(req.body); // sử dụng dịch vụ userService để tạo tk nhân viên mới. Dữ liệu của y/c POST được truyền qua req.body
  const tokens = await tokenService.generateAuthTokens(user); //sau khi tạo tk thành công, dịch vụ toeknService được sử dụng để tạo các token xác thực cho người dùng
  //Hàm responseSuccess được sử dụng để gửi phản hồi thành công với dữ liệu trả về
  responseSuccess({
    res,
    statusCode: httpStatus.CREATED,
    message: 'Account created',
    data: { user, tokens }
  });
});
const login = catchAsync(async (req, res) => {
  console.log(req.body);
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
  const tokens = await authService.refreshAuth(req.body.token);
  responseSuccess({
    res,
    statusCode: httpStatus.OK,
    message: '',
    data: { ...tokens }
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  //tạo biến tam để lưu token reset và exprise
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: config.message.success,
    data: {}
  });
});

const resetPassword = catchAsync(async (req, res) => {
  console.log(req.query);
  await authService.resetPassword(req.query.token, req.body.password);
  responseSuccess({
    res,
    statusCode: httpStatus.NO_CONTENT,
    message: '',
    data: {}
  });
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  console.log('==+++++++++++++++++++++++++');
  // console.log(req);
  const user = await Account.find({ email: req.body.email });
  console.log('============================');
  console.log(user);
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
  registerEmployee,
  getProfile,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail
};
