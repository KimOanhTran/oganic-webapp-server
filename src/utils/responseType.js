const responseSuccess = ({ res, statusCode = 200, message = 'success', data = {} }) => {
  res.status(statusCode).send({
    error: false,
    statusCode,
    message,
    data
  });
};

const responseError = ({ res, statusCode = 500, message = 'failed', data = null }) => {
  res.status(statusCode).send({
    error: true,
    statusCode,
    message,
    data
  });
};

module.exports = {
  responseSuccess,
  responseError
};
