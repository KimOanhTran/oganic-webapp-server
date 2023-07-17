const express = require('express');
const router = express.Router();
const { locationController } = require('./../../controllers');
const {} = require('./../../middlewares/query');
router.route('/province').get(locationController.getProvinces);
router.route('/province/:provinceCode').get(locationController.getProvinceId);
router.route('/district/:provinceCode').get(locationController.getDistrict);
router.route('/district/:provinceCode/:districtCode').get(locationController.getDistrictId);
router.route('/ward/:districtCode').get(locationController.getWard);
router.route('/ward/:districtCode/:wardCode').get(locationController.getWardId);
router.route('/ward/:districtCode/:wardCode').get(locationController.getWardId);
router.route('/location/:provinceCode/:districtCode/:wardCode').get(locationController.getDetailLocation);

module.exports = router;
