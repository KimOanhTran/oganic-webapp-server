const express = require('express');
const router = express.Router();
const getCurUser = require('../../middlewares/getUser');
const productController = require('./../../controllers/product.controller');
const {} = require('./../../middlewares/query');
const auth = require('../../middlewares/auth');

router.route('/read').get(productController.getAProduct);
router.route('/create').post(auth(), productController.createProduct);
router.route('/list').get(productController.List);
router.route('/listColor').get(productController.ListColor);
router.route('/addColor').post(productController.AddColor);
router.route('/updateColor').post(auth(), productController.UpdateColor);
router.route('/import').post(auth(), getCurUser(), productController.Imports);
router.route('/top').get(productController.Top);
router.route('/sale').get(productController.Sale);
router.route('/comments').get(productController.ReadComments);
router.route('/rate').post(auth(), productController.Rate);
router.route('/update').post(productController.Update);
router.route('/hint').post(productController.Hint);
router.route('/listImport').post(auth(), productController.ListImports);
router.route('/listHistoryPrice').post(productController.ListHistoryPriceByIdProduct);

module.exports = router;
