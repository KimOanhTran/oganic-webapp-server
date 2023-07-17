const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { responseSuccess, responseError } = require('../utils/responseType');
const { PROVINCE_JSON, DISTRICT_JSON, WARD_JSON } = require('../constants');

const getProvinces = catchAsync(async (req, res) => {
  responseSuccess({ res, data: Object.values(PROVINCE_JSON) });
});

const getProvinceId = catchAsync(async (req, res) => {
  const provinceCode = req.params.provinceCode;
  if (!provinceCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy tỉnh/tp' });
  responseSuccess({ res, data: PROVINCE_JSON[provinceCode] });
});

const getDistrict = catchAsync(async (req, res) => {
  const provinceCode = req.params.provinceCode;
  if (!provinceCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy tỉnh/tp' });
  responseSuccess({ res, data: Object.values(DISTRICT_JSON[provinceCode]) });
});

const getDistrictId = catchAsync(async (req, res) => {
  const provinceCode = req.params.provinceCode;
  const districtCode = req.params.districtCode;
  if (!provinceCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy tỉnh/tp' });
  if (!districtCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy quận/huyện' });
  responseSuccess({ res, data: DISTRICT_JSON[provinceCode][districtCode] });
});

const getWard = catchAsync(async (req, res) => {
  const districtCode = req.params.districtCode;
  if (!districtCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy quận/huyện' });
  responseSuccess({ res, data: Object.values(WARD_JSON[districtCode]) });
});

const getWardId = catchAsync(async (req, res) => {
  const districtCode = req.params.districtCode;
  const wardCode = req.params.wardCode;
  if (!districtCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy quận/huyện' });
  if (!wardCode) responseError({ res, statusCode: httpStatus.NOT_FOUND, message: 'Không tìm thấy xã/phường' });
  responseSuccess({ res, data: WARD_JSON[districtCode][wardCode] });
});

const getDetailLocation = catchAsync(async (req, res) => {
  const provinceCode = req.params.provinceCode;
  const districtCode = req.params.districtCode;
  const wardCode = req.params.wardCode;

  const detail = {};
  if (provinceCode) detail.province = PROVINCE_JSON[provinceCode];
  if (provinceCode && districtCode) detail.district = DISTRICT_JSON[provinceCode][districtCode];
  if (provinceCode && districtCode && wardCode) detail.ward = WARD_JSON[districtCode][wardCode];

  const list = Object.values(detail).map((e) => e.name_with_type);

  responseSuccess({ res, data: { ...detail, fullString: `${list.reverse().join(', ')}` } });
});

module.exports = {
  getProvinces,
  getProvinceId,
  getDistrict,
  getDistrictId,
  getWard,
  getWardId,
  getDetailLocation
};
