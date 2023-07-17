const httpStatus = require('http-status');
const Category = require('../models/category.model')
const ApiError = require('../utils/ApiError');

const createCategory = async (categoryBody) => {
  return await Category.create(categoryBody);
};
/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCategory = async (filter, options) => {
  console.log(filter);
  const category = await Category.paginate(filter, options);
  return category;
};
/**
 * Get category by name
 * @param {String} name
 * @returns {Promise<Category>}
 */
const getCategoryBySlug = async (slug) => {
  return Category.findOne({ slug });
};
/**
 * Delete category by name
 * @param {String} name
 * @returns {Promise<Category>}
 */
const deleteCategoryBySlug = async (slug) => {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  await category.remove();
  return category;
};
/**
 * Update category by slug
 * @param {ObjectId} slug
 * @param {Object} updateBody
 * @returns {Promise<Category>}
 */
const updateCategoryBySlug = async (slug, updateBody) => {
  const category = await getCategoryBySlug(slug);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }
  Object.assign(category, updateBody);
  await category.save();
  return category;
};


module.exports = {
  queryCategory,
  createCategory,
  deleteCategoryBySlug,
  getCategoryBySlug,
  updateCategoryBySlug
  
};
