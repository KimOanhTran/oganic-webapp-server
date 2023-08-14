const express = require('express');
const router = express.Router();
const billController = require('./../../controllers/bill.controller');
const getCurUser = require('../../middlewares/getUser');
const auth = require('../../middlewares/auth');
const productController = require('../../controllers/product.controller');
const accountController = require('../../controllers/account.controller');
const {} = require('./../../middlewares/query');

router
  .route('/calc')
  .post(getCurUser(), productController.ValidCart, accountController.TryUpdateCart, billController.SubBill);
router
  .route('/create')
  .post(
    getCurUser(),
    productController.ValidCart,
    accountController.TryUpdateCart,
    billController.Create,
    billController.VNPay
  );
router.route('/list').get(billController.List);
router.route('/update').post(auth(), billController.Update);
router.route('/vnpay_ipn').get(billController.CheckVNPay);
router.route('/verify').post(billController.Verity);
router.route('/refund').post(billController.Refund);
router.route('/read').post(getCurUser(), billController.Read);
router.route('/revenue').post(billController.Revenue);
// router.route('/calculateProfitLoss').post(billController.calculateProfitLoss);

module.exports = router;
