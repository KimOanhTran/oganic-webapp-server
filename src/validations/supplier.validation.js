const Joi = require('joi');
const { password, objectId } = require('./custom.validation');
const { PHONE_REGEX } = require('../constants');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin', 'Sale')
  })
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer()
  })
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId)
  })
};

const updateSupplier = {
  params: Joi.object().keys({
    supplierId: Joi.required().custom(objectId)
  }),
  body: Joi.object()
    .keys({
      desc: Joi.string(),
      name: Joi.string(),
      slug: Joi.string(),
      phone: Joi.string().length(10).pattern(PHONE_REGEX),
      address: Joi.object().keys({
        province: Joi.string(),
        district: Joi.string(),
        address: Joi.string()
      })
    })
    .min(1)
};

const deleteSupplier = {
  params: Joi.object().keys({
    supplierId: Joi.string().custom(objectId)
  })
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateSupplier,
  deleteSupplier
};
