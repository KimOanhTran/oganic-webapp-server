const httpStatus = require('http-status');
const logger = require('../config/logger');
const { responseError } = require('./responseType');

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    logger.error(err.message);
    responseError({
      res,
      statusCode: httpStatus.INTERNAL_SERVER_ERROR,
      message: err.message
    });
    next(err);
  });
};

module.exports = catchAsync;
