const express = require('express');
const router = express.Router();
const discountController = require('./../../controllers/discount.controller');
router.route('/list').get(discountController.List);
router.route('/create').post(discountController.Create);
router
  .route('/edit')
  .put(discountController.Update);
router.route('/read').get(discountController.List);
module.exports = router;
