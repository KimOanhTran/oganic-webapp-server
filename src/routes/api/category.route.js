const express = require('express');
const router = express.Router();
const categoryController = require('./../../controllers/category.controller');
const { customCategoryQuery } = require('../../middlewares/query');
router.route('/list').get(customCategoryQuery, categoryController.List);
router.route('/create').post(categoryController.createCategory);
router.route('/delete').post(categoryController.Delete);
router
  .route('/edit')
  .delete(categoryController.deleteCategory)
  .put(categoryController.updateCategory);
router.route('/read').get(categoryController.getACategory);
module.exports = router;
