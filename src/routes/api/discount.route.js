const express = require('express');
const router = express.Router();
const discountController = require('./../../controllers/discount.controller');
router.route('/list').get(discountController.List);
router.route('/create').post(discountController.Create);
router.route('/delete').post(discountController.Delete);
router.route('/edit').put(discountController.Update);
router.route('/read').get(discountController.List);
router.route('/getADiscount/:discountId').get(discountController.getADiscount);
router.route('/getHistoryDiscountProduct').get(discountController.getHistoryDiscountProduct);
router.route('/getHistoryDiscountAccount').get(discountController.getHistoryDiscountAccount);
router.route('/getHistory').post(discountController.getHistory);

module.exports = router;
