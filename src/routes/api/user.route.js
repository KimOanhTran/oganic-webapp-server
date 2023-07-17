const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const accountController = require('../../controllers/account.controller');
const productController = require('../../controllers/product.controller');
const config = require('../../config/config')
const router = express.Router();

// router
//   .route('/')
//   .post(auth('manageUsers'), validate.validate(userValidation.createUser), accountController.createUser)
//   .get(auth('getUsers'), validate.validate(userValidation.getUsers), accountController.getUsers);

router
  .route('/:userId')
  .get(auth('getUsers'), validate.validate(userValidation.getUser), accountController.getUser)
  .patch(auth('manageUsers'), validate.validate(userValidation.updateUser), accountController.updateUser)
  .delete(auth('manageUsers'), validate.validate(userValidation.deleteUser), accountController.deleteUser);
router
  .route('/pushCart')
  .post(auth(),accountController.PushCart , productController.ValidCart , accountController.TryUpdateCart, (req, res) => { res.status(200).send({msg: config.message.success})})
router.route('/checkGHTK').post(accountController.CheckShip)
router.route('/mail').post(accountController.SendListEmails)
router.route('/list').post(accountController.List)
router.route('/enable').post(accountController.Enable)
router.route('/bills').post(auth(),accountController.ReadBills)
router.route('/update').post(auth(),accountController.UpdateInfo)
router.route('/change-phone').post(auth(),accountController.OTPCheck,accountController.UpdatePhone)

module.exports = router;
