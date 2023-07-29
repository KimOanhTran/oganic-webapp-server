const express = require('express');
const router = express.Router();
const validate = require('../../middlewares/validate');
const supplierValidation = require('../../validations/supplier.validation');
const supplierController = require('./../../controllers/supplier.controller');
const { customSupplierQuery } = require('../../middlewares/query');
// router.route('/list').get(customSupplierQuery, supplierController.List);
router.route('/list').get(supplierController.List);
router.route('/getASupplier/:supplierId').get(supplierController.getASupplier);
router.route('/create').post(supplierController.createSupplier);
router.delete(
  '/delete/:supplierId',
  validate.validate(supplierValidation.deleteSupplier),
  supplierController.deleteSupplier
);
router.patch(
  '/edit/:supplierId',
  validate.validate(supplierValidation.updateSupplier),
  supplierController.updateSupplier
);
// router.route('/edit/:supplierId').patch(supplierController.updateSupplier);
router.route('/read').get(supplierController.getASupplier);
module.exports = router;
