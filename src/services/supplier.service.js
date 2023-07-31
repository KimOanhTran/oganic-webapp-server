const httpStatus = require('http-status');
const Category = require('../models/category.model');
const ApiError = require('../utils/ApiError');
const { Supplier } = require('../models');

const createCategory = async (categoryBody) => {
  return await Category.create(categoryBody);
};

/**
 * Delete category by name
 * @param {String} supplierId
 * @returns {Promise<Supplier>}
 */
const deleteSupplierById = async (supplierId) => {
  const supplier = await getSupplierById(supplierId);
  console.log(supplier);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
  }
  await supplier.remove();
  return 'deleted';
};
/**


/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getSupplierById = async (id) => {
  console.log(Supplier.findById(id));
  return Supplier.findById(id);
};

/**
 * Update supplier by id
 * @param {ObjectId} supplierId
 * @param {Object} updateBody
 * @returns {promise<Supplier}
 */
const updateSupplierById = async (supplierId, updateBody) => {
  const supplier = await getSupplierById(supplierId);
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Supplier not found');
  }
  if (updateSupplierById.name && (await Supplier.isNameTaken(updateBody.name, supplierId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Name already taken');
  }
  if (updateSupplierById.phone && (await Supplier.isPhoneTaken(updateBody.phone, supplierId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Phone already taken');
  }

  Object.assign(supplier, updateBody);
  await supplier.save();
  return supplier;
};

module.exports = {
  createCategory,
  deleteSupplierById,
  getSupplierById,
  updateSupplierById
};
